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
import ffmpeg from 'fluent-ffmpeg';


// Ensure the videos directory exists
// Helper function to get user-specific directory
const getUserVideoDir = (uid?: string, projectName?: string) => {
  console.log('getUserVideoDir called with:', { uid, projectName });
  
  if (!uid || uid.trim() === '') {
    throw new Error('UID is required for video rendering. Received: ' + JSON.stringify(uid));
  }
  
  if (!projectName || projectName.trim() === '') {
    throw new Error('Project name is required for video rendering. Received: ' + JSON.stringify(projectName));
  }
  
  const userProjectDir = path.join(process.cwd(), "users", uid.trim(), projectName.trim());
  console.log('Creating video directory:', userProjectDir);
  
  if (!fs.existsSync(userProjectDir)) {
    fs.mkdirSync(userProjectDir, { recursive: true });
    console.log('Created directory:', userProjectDir);
  }
  
  return userProjectDir;
};

const getUserAudioDir = (uid?: string, projectName?: string) => {
  console.log('getUserAudioDir called with:', { uid, projectName });
  
  if (!uid || uid.trim() === '') {
    throw new Error('UID is required for audio rendering. Received: ' + JSON.stringify(uid));
  }
  
  if (!projectName || projectName.trim() === '') {
    throw new Error('Project name is required for audio rendering. Received: ' + JSON.stringify(projectName));
  }
  
  const userProjectDir = path.join(process.cwd(), "users", uid.trim(), projectName.trim());
  console.log('Creating audio directory:', userProjectDir);
  
  if (!fs.existsSync(userProjectDir)) {
    fs.mkdirSync(userProjectDir, { recursive: true });
    console.log('Created directory:', userProjectDir);
  }
  
  return userProjectDir;
};

// Function to convert video using GPU
async function convertToGPUEncoded(inputPath: string, outputPath: string, codec: string): Promise<void> {
  return new Promise((resolve, reject) => {
    let ffmpegCommand = ffmpeg(inputPath);

    // Choose GPU encoder based on codec
    if (codec === 'h264') {
      // Try NVIDIA first, fallback to Intel, then software
      ffmpegCommand = ffmpegCommand
        .videoCodec('h264_nvenc') // NVIDIA GPU encoding
        .outputOptions([
          '-preset', 'fast',
          '-cq', '18',
          '-pix_fmt', 'yuv420p'
        ]);
    }

    ffmpegCommand
      .output(outputPath)
      .on('end', () => {
        console.log('GPU encoding completed');
        resolve();
      })
      .on('error', (err: any) => {
        console.log('GPU encoding failed, trying software encoding:', err.message);
        // Fallback to software encoding if GPU fails
        ffmpeg(inputPath)
          .videoCodec('libx264')
          .output(outputPath)
          .on('end', resolve)
          .on('error', reject)
          .run();
      })
      .run();
  });
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
  inputProps: Record<string, unknown>,
  format: string = 'mp4',
  codec: string = 'h264'
) {
  console.log('startRendering called with inputProps:', JSON.stringify(inputProps, null, 2));
  
  // Validate required inputs
  if (!inputProps.uid) {
    throw new Error('inputProps.uid is required for rendering. Current inputProps: ' + JSON.stringify(inputProps));
  }
  
  if (!inputProps.projectName) {
    throw new Error('inputProps.projectName is required for rendering. Current inputProps: ' + JSON.stringify(inputProps));
  }
  
  console.log('Video rendering with format:', format, 'codec:', codec);
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

      // Map user-friendly codec names to Remotion codec names
      const codecMap: Record<string, string> = {
        'h264': 'h264',
        'vp8': 'vp8',
        'gif': 'gif'
      };
      const outputDir = getUserVideoDir(inputProps.uid as string, inputProps.projectName as string);
      const tempOutputPath = path.join(outputDir, `${renderId}_temp.${format}`);
      const finalOutputPath = path.join(outputDir, `${renderId}.${format}`);

      const remotionCodec = codecMap[codec] || codec;
      console.log('Video mapped codec:', codec, 'to:', remotionCodec); // Add logging
      console.log('Rendering video with codec:', remotionCodec, 'to file:', tempOutputPath); // Add logging

      const baseRenderOptions = {
        codec: remotionCodec as any,
        composition: {
          ...composition,
          durationInFrames: actualDurationInFrames,
        },
        serveUrl: bundleLocation,
        outputLocation: tempOutputPath, // CHANGE THIS from outputPath to tempOutputPath
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
      };

      // Add codec-specific options
      const renderOptions = codec === 'gif' 
        ? {
            ...baseRenderOptions,
            // GIF-specific options (no crf, x264Preset, etc.)
          }
        : {
            ...baseRenderOptions,
            // H.264 and other codec options
            crf: 1,
            imageFormat: "png" as const,
            colorSpace: "bt709" as const,
            x264Preset: "veryslow" as const,
            jpegQuality: 100,
          };

      // Render the video using chromium
      await renderMedia(renderOptions);

      // ADD GPU encoding step
      console.log('Starting GPU encoding...');
      try {
        await convertToGPUEncoded(tempOutputPath, finalOutputPath, codec);
        
        // Clean up temp file
        fs.unlinkSync(tempOutputPath);
        
        console.log('GPU encoding completed successfully');
      } catch (error) {
        console.error('GPU encoding failed:', error);
        // If GPU encoding fails, use the temp file as final
        fs.renameSync(tempOutputPath, finalOutputPath);
      }

      // Get file size from the actual output location
      const stats = fs.statSync(finalOutputPath);

      const uid = inputProps.uid as string;
      const projectName = inputProps.projectName as string;
      const servingPath = `/api/latest/user-files/${uid}/${projectName}/${renderId}.${format}`;

      console.log('Video saved to:', finalOutputPath);
      console.log('Will be served from:', servingPath);
      
      // Save metadata to project index
      await saveRenderToUserFolder(
        uid,
        projectName,
        renderId,
        format,
        stats.size,
        servingPath,
        'video',
        baseUrl 
      );
      
      completeRender(renderId, servingPath, stats.size);
    } catch (error: any) {
      failRender(renderId, error.message);
      console.error(`Render ${renderId} failed:`, error);
    }
  })();

  return renderId;
}

export async function startAudioRendering(
  compositionId: string,
  inputProps: Record<string, unknown>,
  format: string = 'wav',
  codec: string = 'wav'
) {
  console.log('startAudioRendering called with inputProps:', JSON.stringify(inputProps, null, 2));
  
  // Validate required inputs
  if (!inputProps.uid) {
    throw new Error('inputProps.uid is required for rendering. Current inputProps: ' + JSON.stringify(inputProps));
  }
  
  if (!inputProps.projectName) {
    throw new Error('inputProps.projectName is required for rendering. Current inputProps: ' + JSON.stringify(inputProps));
  }
  
  console.log('Audio rendering with format:', format, 'codec:', codec);
  const renderId = uuidv4();

  // Ensure the audio directory exists
  const outputDir = getUserAudioDir(inputProps.uid as string, inputProps.projectName as string);

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
// Render audio only
      const outputPath = path.join(outputDir, `${renderId}.${format}`);
      console.log('Rendering with codec:', codec, 'to file:', outputPath);
      const codecMap: Record<string, string> = {
        'mp3': 'mp3',
        'wav': 'wav', 
        'aac': 'aac',
      };
      const remotionCodec = codecMap[codec] || codec;
      console.log('Mapped codec:', codec, 'to:', remotionCodec);
      await renderMedia({
        codec: remotionCodec as any,
        composition: {
          ...composition,
          durationInFrames: actualDurationInFrames,
        },
        serveUrl: bundleLocation,
        outputLocation: outputPath, // Render directly to user folder
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

      const stats = fs.statSync(outputPath);
      
      const uid = inputProps.uid as string;
      const projectName = inputProps.projectName as string;
      const servingPath = `/api/latest/user-files/${uid}/${projectName}/${renderId}.${format}`;
      
      console.log('Audio saved to:', outputPath);
      console.log('Will be served from:', servingPath);
      
      // Save metadata to project index
      await saveRenderToUserFolder(
        uid,
        projectName,
        renderId,
        format,
        stats.size,
        servingPath,
        'audio',
        baseUrl 
      );
      
      completeRender(renderId, servingPath, stats.size);
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

// Helper function to save render metadata to user folder
async function saveRenderToUserFolder(
  uid: string, 
  projectName: string, 
  renderId: string, 
  format: string, 
  fileSize: number, 
  outputPath: string,
  mediaType: 'video' | 'audio' = 'video',
  baseUrl: string
) {
  try {
    const renderData = {
      status: 'success',
      url: outputPath,
      fileSize,
      renderId,
      format,
      mediaType
    };

    const response = await fetch(`${baseUrl}/api/latest/save-to-user/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uid,
        projectName,
        type: 'render',
        data: renderData,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      console.error('Failed to update project index via API');
    } else {
      console.log('Successfully updated project index');
    }
  } catch (error) {
    console.error('Error saving render metadata to user folder:', error);
  }
}