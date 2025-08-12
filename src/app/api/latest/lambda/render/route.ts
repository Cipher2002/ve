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
  FRAMES_PER_LAMBDA: 100,
  MAX_RETRIES: 2,
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
      
      // Estimate render cost
      const durationInMs = (body.inputProps.durationInFrames / body.inputProps.fps) * 1000;
      const estimatedCost = estimatePrice({
        region: REGION as AwsRegion,
        durationInMilliseconds: durationInMs,
        memorySizeInMb: 2048,
        diskSizeInMb: 2048,
        lambdasInvoked: Math.ceil(body.inputProps.durationInFrames / LAMBDA_CONFIG.FRAMES_PER_LAMBDA),
      });
      
      console.log(`Estimated ${isAudio ? 'audio' : 'video'} render cost: $${estimatedCost.toFixed(5)} for ${body.inputProps.durationInFrames} frames`);
      
      // Base render options
      const renderOptions = {
        codec: remotionCodec,
        functionName: LAMBDA_CONFIG.FUNCTION_NAME,
        region: REGION as AwsRegion,
        serveUrl: SITE_NAME,
        composition: body.id,
        inputProps: body.inputProps,
        framesPerLambda: LAMBDA_CONFIG.FRAMES_PER_LAMBDA,
        downloadBehavior: {
          type: "download" as const,
          fileName: isAudio ? `audio.${body.format}` : `video.${body.format}`,
        },
        maxRetries: LAMBDA_CONFIG.MAX_RETRIES,
        everyNthFrame: 1,
      };

      // Add codec-specific options for video
      const finalRenderOptions = isAudio || body.codec === 'gif' 
        ? renderOptions
        : {
            ...renderOptions,
            crf: 1,
            imageFormat: "png" as const,
            colorSpace: "bt709" as const,
            x264Preset: "veryslow" as const,
            jpegQuality: 100,
          };

      const result = await renderMediaOnLambda(finalRenderOptions);

      console.log(`${isAudio ? 'Audio' : 'Video'} render result:`, JSON.stringify(result, null, 2));
      
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