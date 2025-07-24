import { RenderRequest } from "@/app/versions/7.0.0/types";
import { executeApi } from "@/app/versions/7.0.0/ssr-helpers/api-response";
import { startAudioRendering } from "@/app/versions/7.0.0/ssr-helpers/custom-renderer";

/**
 * POST endpoint handler for rendering audio using Remotion SSR
 */
export const POST = executeApi(RenderRequest, async (req, body) => {

  try {
    // Start the audio rendering process using our custom audio renderer
    const renderId = await startAudioRendering(body.id, body.inputProps);

    return { renderId };
  } catch (error) {
    console.error("Error in renderAudio:", error);
    throw error;
  }
});