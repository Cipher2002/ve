import { z } from "zod";
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

export interface RenderResponse {
  renderId: string;
}

//SETTING THE API BASE URL
const apiBaseUrl = 'https://zanopy.ai/vedit/api/latest';

export const renderVideo = async ({
  id,
  inputProps,
  format = 'mp4',
  codec = 'h264',
}: {
  id: string;
  inputProps: z.infer<typeof CompositionProps>;
  format?: string;
  codec?: string;
}) => {
  const getUidFromUrl = () => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('uid') || 'default-user';
    }
    return 'default-user';
  };

  // Transform overlays to use original URLs for rendering
  const transformedOverlays = inputProps.overlays?.map((overlay: any) => {
    
    if (overlay.type === 'video' && overlay.originalUrl) {
      return {
        ...overlay,
        src: overlay.originalUrl,
      };
    }
    return overlay;
  }) || [];


  const body: z.infer<typeof RenderRequest> = {
    id,
    inputProps: {
      ...inputProps,
      overlays: transformedOverlays, // Use transformed overlays
      // Only add uid if not already present
      uid: inputProps.uid || getUidFromUrl(),
      // Only add projectName if not already present  
      projectName: inputProps.projectName || 'Untitled Project',
    },
    format,
    codec,
  };

  const response = await makeRequest<RenderResponse>(
    `${apiBaseUrl}/ssr/render`,
    body
  );
  return response;
};

export const renderAudio = async ({
  id,
  inputProps,
  format = 'wav',
  codec = 'wav',
}: {
  id: string;
  inputProps: z.infer<typeof CompositionProps>;
  format?: string;
  codec?: string;
}) => {
  const getUidFromUrl = () => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('uid') || 'default-user';
    }
    return 'default-user';
  };

  const transformedOverlays = inputProps.overlays?.map((overlay: any) => {

    
    if (overlay.type === 'video' && overlay.originalUrl) {
      return {
        ...overlay,
        src: overlay.originalUrl, // Use original URL for Remotion
      };
    }
    return overlay;
  }) || [];


  const body: z.infer<typeof RenderRequest> = {
    id,
    inputProps: {
      ...inputProps,
      overlays: transformedOverlays, // Use transformed overlays
      // Only add uid if not already present
      uid: inputProps.uid || getUidFromUrl(),
      // Only add projectName if not already present  
      projectName: inputProps.projectName || 'Untitled Project',
    },
    format,
    codec,
  };

  const response = await makeRequest<RenderResponse>(
    `${apiBaseUrl}/ssr/render-audio`,
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
    `${apiBaseUrl}/ssr/progress`,
    body
  );
  return response;
};
