import { bundle } from "@remotion/bundler";
import {
  renderMedia,
  selectComposition,
  RenderMediaOnProgress,
} from "@remotion/renderer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { getBaseUrl } from "../utils/url-helper";
import {
  saveRenderState,
  updateRenderProgress,
  completeRender,
  failRender,
} from "./render-state";

// Ensure the videos directory exists
const VIDEOS_DIR = path.join(process.cwd(), "public", "rendered-videos");
if (!fs.existsSync(VIDEOS_DIR)) {
  fs.mkdirSync(VIDEOS_DIR, { recursive: true });
}

// Track rendering progress
export const renderProgress = new Map<string, number>();
export const renderStatus = new Map<string, "rendering" | "done" | "error">();
export const renderErrors = new Map<string, string>();
export const renderUrls = new Map<string, string>();
export const renderSizes = new Map<string, number>();

/**
 * Custom renderer that uses browser-based rendering to avoid platform-specific dependencies
 */
export async function startRendering(
  compositionId: string,
  inputProps: Record<string, unknown>
) {
  const renderId = uuidv4();

  // Initialize render state
  saveRenderState(renderId, {
    status: "rendering",
    progress: 0,
    timestamp: Date.now(),
  });

  // Start rendering asynchronously
  (async () => {
    try {
      // Update progress as rendering proceeds
      updateRenderProgress(renderId, 0);

      // Get the base URL for serving media files
      const baseUrl = getBaseUrl();

      const bundleLocation = await bundle(
        path.join(
          process.cwd(),
          "src",
          "app",
          "versions",
          "7.0.0",
          "remotion",
          "index.ts"
        ),
        undefined,
        {
          enableCaching: false,
          publicDir: "public",
          webpackOverride: (config) => {
            return {
              ...config,
              resolve: {
                ...config.resolve,
                alias: {
                  ...config.resolve?.alias,
                  '@': path.resolve(process.cwd(), 'src'),
                },
              },
            };
          },
        }
      );

      // Select the composition
      const composition = await selectComposition({
        serveUrl: bundleLocation,
        id: compositionId,
        inputProps: {
          ...inputProps,
          // Pass the base URL to the composition for media file access
          baseUrl,
        },
      });
      if (!composition) {
        throw new Error(`Composition "${compositionId}" not found`);
      }

      // Get the actual duration from inputProps or use composition's duration
      const actualDurationInFrames =
        (inputProps.durationInFrames as number) || composition.durationInFrames;

      // Render the video using chromium
      await renderMedia({
        codec: "h264",
        composition: {
          ...composition,
          // Override the duration to use the actual duration from inputProps
          durationInFrames: actualDurationInFrames,
        },
        serveUrl: bundleLocation,
        outputLocation: path.join(VIDEOS_DIR, `${renderId}.mp4`),
        inputProps: {
          ...inputProps,
          baseUrl,
        },
        // Enhanced quality settings for maximum quality output
        // chromiumOptions: {
        //   headless: true,
        //   disableWebSecurity: false,
        //   ignoreCertificateErrors: false,
        // },
        chromiumOptions: {
          headless: true,
        },
        timeoutInMilliseconds: 300000, // 5 minutes
        onProgress: ((progress) => {
          // Extract just the progress percentage from the detailed progress object
          updateRenderProgress(renderId, progress.progress);
        }) as RenderMediaOnProgress,
        // Highest quality video settings
        crf: 1, // Lowest CRF for near-lossless quality (range 1-51, where 1 is highest quality)
        imageFormat: "png", // Use PNG for highest quality frame captures
        colorSpace: "bt709", // Better color accuracy
        x264Preset: "veryslow", // Highest quality compression
        jpegQuality: 100, // Maximum JPEG quality for any JPEG operations
      });

      // Get file size
      const stats = fs.statSync(path.join(VIDEOS_DIR, `${renderId}.mp4`));
      const outputPath = `/rendered-videos/${renderId}.mp4`;
      completeRender(renderId, outputPath, stats.size);
    } catch (error: any) {
      failRender(renderId, error.message);
      console.error(`Render ${renderId} failed:`, error);
    }
  })();

  return renderId;
}

export async function startAudioRendering(
  compositionId: string,
  inputProps: Record<string, unknown>
) {
  const renderId = uuidv4();

  // Ensure the audio directory exists
  const AUDIO_DIR = path.join(process.cwd(), "public", "rendered-audio");
  if (!fs.existsSync(AUDIO_DIR)) {
    fs.mkdirSync(AUDIO_DIR, { recursive: true });
  }

  // Initialize render state
  saveRenderState(renderId, {
    status: "rendering",
    progress: 0,
    timestamp: Date.now(),
  });

  // Start rendering asynchronously
  (async () => {
    try {
      updateRenderProgress(renderId, 0);
      const baseUrl = getBaseUrl();

      const bundleLocation = await bundle(
        path.join(
          process.cwd(),
          "src",
          "app",
          "versions",
          "7.0.0",
          "remotion",
          "index.ts"
        ),
        undefined,
        {
          enableCaching: false,
          publicDir: "public",
          webpackOverride: (config) => {
            return {
              ...config,
              resolve: {
                ...config.resolve,
                alias: {
                  ...config.resolve?.alias,
                  '@': path.resolve(process.cwd(), 'src'),
                },
              },
            };
          },
        }
      );

      const composition = await selectComposition({
        serveUrl: bundleLocation,
        id: compositionId,
        inputProps: {
          ...inputProps,
          baseUrl,
        },
      });
      if (!composition) {
        throw new Error(`Composition "${compositionId}" not found`);
      }

      const actualDurationInFrames =
        (inputProps.durationInFrames as number) || composition.durationInFrames;

      // Render audio only
      await renderMedia({
        codec: "wav",
        composition: {
          ...composition,
          durationInFrames: actualDurationInFrames,
        },
        serveUrl: bundleLocation,
        outputLocation: path.join(AUDIO_DIR, `${renderId}.wav`),
        inputProps: {
          ...inputProps,
          baseUrl,
        },
        chromiumOptions: {
          headless: true,
        },
        timeoutInMilliseconds: 300000,
        onProgress: ((progress) => {
          updateRenderProgress(renderId, progress.progress);
        }) as RenderMediaOnProgress,
      });

      const stats = fs.statSync(path.join(AUDIO_DIR, `${renderId}.wav`));
      const outputPath = `/rendered-audio/${renderId}.wav`;
      completeRender(renderId, outputPath, stats.size);
    } catch (error: any) {
      failRender(renderId, error.message);
      console.error(`Audio render ${renderId} failed:`, error);
    }
  })();

  return renderId;
}

/**
 * Get the current progress of a render
 */
export function getRenderProgress(renderId: string) {
  // Add logging to debug missing renders

  const progress = renderProgress.get(renderId) || 0;
  const status = renderStatus.get(renderId) || "rendering";
  const error = renderErrors.get(renderId);
  const url = renderUrls.get(renderId);
  const size = renderSizes.get(renderId);

  if (!renderStatus.has(renderId)) {
    throw new Error(`No render found with ID: ${renderId}`);
  }

  return {
    renderId,
    progress,
    status,
    error,
    url,
    size,
  };
}
