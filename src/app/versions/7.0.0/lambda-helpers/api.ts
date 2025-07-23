import { z } from "zod";
import type { RenderMediaOnLambdaOutput } from "@remotion/lambda/client";

import {
  RenderRequest,
  ProgressRequest,
  ProgressResponse,
} from "../types";
import { CompositionProps } from "../types";

type ApiResponse<T> = {
  type: "success" | "error";
  data?: T;
  message?: string;
};

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
}: {
  id: string;
  inputProps: z.infer<typeof CompositionProps>;
}) => {
  const body: z.infer<typeof RenderRequest> = {
    id,
    inputProps,
  };

  const response = await makeRequest<RenderMediaOnLambdaOutput>(
    "/api/latest/lambda/render",
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
    "/api/latest/lambda/progress",
    body
  );
  return response;
};
