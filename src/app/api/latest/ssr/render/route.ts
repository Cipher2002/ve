import { RenderRequest } from "@/app/versions/7.0.0/types";
import { executeApi } from "@/app/versions/7.0.0/ssr-helpers/api-response";
import { startRendering } from "@/app/versions/7.0.0/ssr-helpers/custom-renderer";

/**
 * POST endpoint handler for rendering media using Remotion SSR
 */
export const POST = executeApi(RenderRequest, async (req, body) => {

  try {
    // Start the rendering process using our custom renderer
    const renderId = await startRendering(body.id, body.inputProps, body.format, body.codec);

    return { renderId };
  } catch (error) {
    console.error("Error in renderMedia:", error);
    throw error;
  }
});
