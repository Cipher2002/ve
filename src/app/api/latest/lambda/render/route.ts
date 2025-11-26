import { AwsRegion, RenderMediaOnLambdaOutput, estimatePrice } from "@remotion/lambda/client";
import { renderMediaOnLambda } from "@remotion/lambda/client";
import { RenderRequest } from "@/app/versions/7.0.0/types";
import { executeApi } from "@/app/versions/7.0.0/lambda-helpers/api-response";

import {
  LAMBDA_FUNCTION_NAME,
  REGION,
  SITE_NAME,
} from "@/app/versions/7.0.0/constants";

/**
 * Configuration for the Lambda render function
 */
const LAMBDA_CONFIG = {
  FUNCTION_NAME: LAMBDA_FUNCTION_NAME,
  FRAMES_PER_LAMBDA: 50,
  MAX_RETRIES: 2,
  TIMEOUT_IN_SECONDS: 900, // 15 minutes (maximum allowed)
  MEMORY_SIZE_MB: 3008, // Increased from 2048 for better performance
} as const;

// Codec mapping for different media types
const VIDEO_CODEC_MAP: Record<string, any> = {
  'h264': 'h264',
  'vp8': 'vp8', 
  'gif': 'gif'
};

const AUDIO_CODEC_MAP: Record<string, any> = {
  'mp3': 'mp3',
  'wav': 'wav',
  'aac': 'aac'
};

/**
 * Validates AWS credentials are present in environment variables
 * @throws {TypeError} If AWS credentials are missing
 */
const validateAwsCredentials = () => {
  if (
    !process.env.AWS_ACCESS_KEY_ID &&
    !process.env.REMOTION_AWS_ACCESS_KEY_ID
  ) {
    throw new TypeError(
      "Set up Remotion Lambda to render videos. See the README.md for how to do so."
    );
  }
  if (
    !process.env.AWS_SECRET_ACCESS_KEY &&
    !process.env.REMOTION_AWS_SECRET_ACCESS_KEY
  ) {
    throw new TypeError(
      "The environment variable REMOTION_AWS_SECRET_ACCESS_KEY is missing. Add it to your .env file."
    );
  }
};

/**
 * POST endpoint handler for rendering media using Remotion Lambda
 * @description Handles video rendering requests by delegating to AWS Lambda
 * @throws {Error} If rendering fails or AWS credentials are invalid
 */
export const POST = executeApi<RenderMediaOnLambdaOutput, typeof RenderRequest>(
  RenderRequest,
  async (req, body) => {
    // Validate AWS credentials
    validateAwsCredentials();

    try {
      // Determine codec based on media type
      const isAudio = body.mediaType === "audio";
      const codecMap = isAudio ? AUDIO_CODEC_MAP : VIDEO_CODEC_MAP;
      const remotionCodec = codecMap[body.codec] || body.codec;
      
      // Estimate render cost with updated memory size
      const durationInMs = (body.inputProps.durationInFrames / body.inputProps.fps) * 1000;
      const estimatedCost = estimatePrice({
        region: REGION as AwsRegion,
        durationInMilliseconds: durationInMs,
        memorySizeInMb: LAMBDA_CONFIG.MEMORY_SIZE_MB,
        diskSizeInMb: 2048,
        lambdasInvoked: Math.ceil(body.inputProps.durationInFrames / LAMBDA_CONFIG.FRAMES_PER_LAMBDA),
      });
            
      // Base render options
      const renderOptions = {
        codec: remotionCodec,
        functionName: LAMBDA_CONFIG.FUNCTION_NAME,
        region: REGION as AwsRegion,
        serveUrl: SITE_NAME,
        composition: body.id,
        inputProps: body.inputProps,
        framesPerLambda: LAMBDA_CONFIG.FRAMES_PER_LAMBDA,
        timeoutInMilliseconds: LAMBDA_CONFIG.TIMEOUT_IN_SECONDS * 1000, // Convert to milliseconds
        downloadBehavior: {
          type: "download" as const,
          fileName: isAudio ? `audio.${body.format}` : `video.${body.format}`,
        },
        maxRetries: LAMBDA_CONFIG.MAX_RETRIES,
        everyNthFrame: 1,
      };

      // Add codec-specific options for video
      let finalRenderOptions: any = renderOptions;
      
      if (!isAudio && body.codec !== 'gif') {
        if (body.codec === 'vp8') {
          finalRenderOptions = {
            ...renderOptions,
            crf: 4, // VP8 minimum CRF value
            imageFormat: "png" as const,
            colorSpace: "bt709" as const,
            jpegQuality: 100,
          };
        } else {
          // H.264 and other codecs
          finalRenderOptions = {
            ...renderOptions,
            crf: 1,
            imageFormat: "png" as const,
            colorSpace: "bt709" as const,
            x264Preset: "veryslow" as const,
            jpegQuality: 100,
          };
        }
      }

      const result = await renderMediaOnLambda(finalRenderOptions);
      
      return {
        ...result,
        estimatedCost: estimatedCost.toFixed(5),
        costInfo: {
          cost: `$${estimatedCost.toFixed(5)}`,
          frames: body.inputProps.durationInFrames,
          duration: `${(body.inputProps.durationInFrames / body.inputProps.fps).toFixed(2)}s`,
          mediaType: body.mediaType,
          codec: body.codec,
          format: body.format
        }
      };
    } catch (error) {
      console.error(`Error in render${body.mediaType === "audio" ? "Audio" : "Media"}OnLambda:`, error);
      throw error;
    }
  }
);