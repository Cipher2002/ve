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
  CODEC: "h264" as const,
} as const;

/**
 * Validates AWS credentials are present in environment variables
 * @throws {TypeError} If AWS credentials are missing
 */
const validateAwsCredentials = () => {
  console.log("Validating AWS credentials....");
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
    // Debug logging
    console.log("Received body:", JSON.stringify(body, null, 2));
    console.log("inputProps:", JSON.stringify(body.inputProps, null, 2));

    // Validate AWS credentials
    validateAwsCredentials();

    try {
      // Estimate render cost
      const durationInMs = (body.inputProps.durationInFrames / body.inputProps.fps) * 1000;
      const estimatedCost = estimatePrice({
        region: REGION as AwsRegion,
        durationInMilliseconds: durationInMs,
        memorySizeInMb: 2048,
        diskSizeInMb: 2048,
        lambdasInvoked: Math.ceil(body.inputProps.durationInFrames / LAMBDA_CONFIG.FRAMES_PER_LAMBDA),
      });
      
      console.log(`Estimated render cost: $${estimatedCost.toFixed(5)} for ${body.inputProps.durationInFrames} frames`);
      
      console.log("Rendering media on Lambda....");
      const result = await renderMediaOnLambda({
        codec: LAMBDA_CONFIG.CODEC,
        functionName: LAMBDA_CONFIG.FUNCTION_NAME,
        region: REGION as AwsRegion,
        serveUrl: SITE_NAME,
        composition: body.id,
        inputProps: body.inputProps,
        framesPerLambda: LAMBDA_CONFIG.FRAMES_PER_LAMBDA,
        downloadBehavior: {
          type: "download",
          fileName: "video.mp4",
        },
        maxRetries: LAMBDA_CONFIG.MAX_RETRIES,
        everyNthFrame: 1,
      });

      console.log("Render result:", JSON.stringify(result, null, 2));
      // Add cost information to the response
      return {
        ...result,
        estimatedCost: estimatedCost.toFixed(5),
        costInfo: {
          cost: `$${estimatedCost.toFixed(5)}`,
          frames: body.inputProps.durationInFrames,
          duration: `${(body.inputProps.durationInFrames / body.inputProps.fps).toFixed(2)}s`
        }
      };
    } catch (error) {
      console.error("Error in renderMediaOnLambda:", error);
      throw error;
    }
  }
);
