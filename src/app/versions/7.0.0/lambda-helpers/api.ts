import { z } from "zod";
import type { RenderMediaOnLambdaOutput } from "@remotion/lambda/client";

import {
  RenderRequest,
  ProgressRequest,
  ProgressResponse,
} from "@/app/versions/7.0.0/types";
import { CompositionProps } from "@/app/versions/7.0.0/types";

type ApiResponse<T> = {
  type: "success" | "error";
  data?: T;
  message?: string;
};

//SETTING THE API BASE URL
const apiBaseUrl = 'https://zanopy.ai/vedit/api/latest';


const makeRequest = async <Res>(
  endpoint: string,
  body: unknown
): Promise<Res> => {
  const result = await fetch(endpoint, {
    method: "post",
    body: JSON.stringify(body),
    headers: {
      "content-type": "application/json",
    },
  });
  const json = (await result.json()) as ApiResponse<Res>;
  if (json.type === "error") {
    console.error(`Error in response from ${endpoint}:`, json.message);
    throw new Error(json.message);
  }

  if (!json.data) {
    throw new Error(`No data received from ${endpoint}`);
  }

  return json.data;
};

export const renderVideo = async ({
  id,
  inputProps,
  format = "mp4",
  codec = "h264", 
  mediaType = "video",
}: {
  id: string;
  inputProps: z.infer<typeof CompositionProps>;
  format?: string;
  codec?: string;
  mediaType?: "video" | "audio";
}) => {
  const body: z.infer<typeof RenderRequest> = {
    id,
    inputProps,
    format,
    codec,
    mediaType,
  };

  const response = await makeRequest<RenderMediaOnLambdaOutput>(
    `${apiBaseUrl}/lambda/render`,
    body
  );
  return response;
};

export const getProgress = async ({
  id,
  bucketName,
}: {
  id: string;
  bucketName: string;
}) => {
  const body: z.infer<typeof ProgressRequest> = {
    id,
    bucketName,
  };

  const response = await makeRequest<ProgressResponse>(
    `${apiBaseUrl}/lambda/progress`,
    body
  );
  return response;
};

export const renderAudio = async ({
  id,
  inputProps,
  format = "wav",
  codec = "wav",
}: {
  id: string;
  inputProps: z.infer<typeof CompositionProps>;
  format?: string;
  codec?: string;
}) => {
  return renderVideo({
    id,
    inputProps,
    format,
    codec,
    mediaType: "audio",
  });
};