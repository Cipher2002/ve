import { z } from "zod";
import { useCallback, useMemo, useState } from "react";
import { CompositionProps } from "../types";
import {
  getProgress as ssrGetProgress,
  renderVideo as ssrRenderVideo,
  renderAudio as ssrRenderAudio,
} from "../ssr-helpers/api";
import {
  getProgress as lambdaGetProgress,
  renderVideo as lambdaRenderVideo,
} from "../lambda-helpers/api";

// Define possible states for the rendering process
export type State =
  | { status: "init" } // Initial state
  | { status: "invoking" } // API call is being made
  | {
      // Video is being rendered
      renderId: string;
      progress: number;
      status: "rendering";
      bucketName?: string; // Make bucketName optional
    }
  | {
      // Error occurred during rendering
      renderId: string | null;
      status: "error";
      error: Error;
    }
  | {
      // Rendering completed successfully
      url: string;
      size: number;
      status: "done";
    };

// Utility function to create a delay
const wait = async (milliSeconds: number) => {
  await new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve();
    }, milliSeconds);
  });
};

type RenderType = "ssr" | "lambda";

// Custom hook to manage video rendering process
export const useRendering = (
  id: string,
  inputProps: z.infer<typeof CompositionProps>,
  renderType: RenderType = "ssr" // Default to SSR rendering
) => {
  // Maintain current state of the rendering process
  const [state, setState] = useState<State>({
    status: "init",
  });

  // Main function to handle the rendering process
  const renderMedia = useCallback(async (format?: string, codec?: string) => {
    setState({
      status: "invoking",
    });
    try {
      const renderVideo =
        renderType === "ssr" ? ssrRenderVideo : lambdaRenderVideo;
      const getProgress =
        renderType === "ssr" ? ssrGetProgress : lambdaGetProgress;

      const response = await renderVideo({ id, inputProps, format, codec });
      const renderId = response.renderId;
      const bucketName =
        "bucketName" in response ? response.bucketName : undefined;

      if (renderType === "ssr") {
        // Add a small delay for SSR rendering to ensure initialization
        await wait(3000);
      }

      setState({
        status: "rendering",
        progress: 0,
        renderId,
        bucketName: typeof bucketName === "string" ? bucketName : undefined,
      });

      let pending = true;

      while (pending) {
        const result = await getProgress({
          id: renderId,
          bucketName: typeof bucketName === "string" ? bucketName : "",
        });
        switch (result.type) {
          case "error": {
            console.error(`Render error: ${result.message}`);
            setState({
              status: "error",
              renderId: renderId,
              error: new Error(result.message),
            });
            pending = false;
            break;
          }
          case "done": {
            setState({
              size: result.size,
              url: result.url,
              status: "done",
            });
            pending = false;
            break;
          }
          case "progress": {
            setState({
              status: "rendering",
              progress: result.progress,
              renderId: renderId,
            });
            await wait(1000);
          }
        }
      }
    } catch (err) {
      console.error("Unexpected error during rendering:", err);
      setState({
        status: "error",
        error: err as Error,
        renderId: null,
      });
    }
  }, [id, inputProps, renderType]);

  // Reset the rendering state back to initial
  const undo = useCallback(() => {
    setState({ status: "init" });
  }, []);

  // Main function to handle the audio rendering process
  const renderAudio = useCallback(async (format?: string, codec?: string) => {
    setState({
      status: "invoking",
    });
    try {
      const response = await ssrRenderAudio({ id, inputProps, format, codec });
      const renderId = response.renderId;

      // Add a small delay for SSR rendering to ensure initialization
      await wait(3000);

      setState({
        status: "rendering",
        progress: 0,
        renderId,
      });

      let pending = true;

      while (pending) {
        const result = await ssrGetProgress({
          id: renderId,
          bucketName: "",
        });
        switch (result.type) {
          case "error": {
            console.error(`Audio render error: ${result.message}`);
            setState({
              status: "error",
              renderId: renderId,
              error: new Error(result.message),
            });
            pending = false;
            break;
          }
          case "done": {
            setState({
              size: result.size,
              url: result.url,
              status: "done",
            });
            pending = false;
            break;
          }
          case "progress": {
            setState({
              status: "rendering",
              progress: result.progress,
              renderId: renderId,
            });
            await wait(1000);
          }
        }
      }
    } catch (err) {
      console.error("Unexpected error during audio rendering:", err);
      setState({
        status: "error",
        error: err as Error,
        renderId: null,
      });
    }
  }, [id, inputProps]);

  return useMemo(
  () => ({
    renderMedia, // Function to start rendering
    renderAudio, // Function to start audio rendering
    state, // Current state of the render
    undo, // Function to reset the state
  }),
  [renderMedia, renderAudio, state, undo]
);
};
