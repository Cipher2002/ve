import {
  Video,
  useCurrentFrame,
} from "remotion";
import { ClipOverlay } from "../../../types";
import { animationTemplates } from "../../../templates/animation-templates";
import { toAbsoluteUrl } from "../../../utils/url-helper";
import { useVideoCache } from "../../../hooks/use-video-cache";
import { preloadVideo } from "@remotion/preload";
import { FPS } from "../../../constants";
import { useEffect, useState } from "react";

/**
 * Interface defining the props for the VideoLayerContent component
 */
interface VideoLayerContentProps {
  /** The overlay configuration object containing video properties and styles */
  overlay: ClipOverlay;
  /** The base URL for the video */
  baseUrl?: string;
}

/**
 * VideoLayerContent component renders a video layer with animations and styling
 *
 * This component handles:
 * - Video playback using Remotion's OffthreadVideo
 * - Enter/exit animations based on the current frame
 * - Styling including transform, opacity, border radius, etc.
 * - Video timing and volume controls
 *
 * @param props.overlay - Configuration object for the video overlay including:
 *   - src: Video source URL
 *   - videoStartTime: Start time offset for the video
 *   - durationInFrames: Total duration of the overlay
 *   - styles: Object containing visual styling properties and animations
 */
export const VideoLayerContent: React.FC<VideoLayerContentProps> = ({
  overlay,
  baseUrl,
}) => {
  const frame = useCurrentFrame();

  // Preload video effect
  // useEffect(() => {
  //   let processedVideoSrc = overlay.src;
  //   if (overlay.src.startsWith("/") && baseUrl) {
  //     processedVideoSrc = `${baseUrl}${overlay.src}`;
  //   } else if (overlay.src.startsWith("/")) {
  //     processedVideoSrc = toAbsoluteUrl(overlay.src);
  //   }
    
  //   const cleanup = preloadVideo(processedVideoSrc);
    
  //   return cleanup; // preloadVideo returns the cleanup function directly
  // }, [overlay.src, baseUrl]);
  const { getCachedVideoUrl } = useVideoCache();
  const [cachedSrc, setCachedSrc] = useState<string | null>(null);

  // Preload and cache the video
  useEffect(() => {
    const loadVideo = async () => {
      let processedVideoSrc = overlay.src;
      if (overlay.src.startsWith("/") && baseUrl) {
        processedVideoSrc = `${baseUrl}${overlay.src}`;
      } else if (overlay.src.startsWith("/")) {
        processedVideoSrc = toAbsoluteUrl(overlay.src);
      }
      
      const cached = await getCachedVideoUrl(processedVideoSrc);
      if (cached) {
        setCachedSrc(cached);
      } else {
        setCachedSrc(processedVideoSrc);
      }
    };
    
    loadVideo();
  }, [overlay.src, baseUrl, getCachedVideoUrl]);

  // Calculate if we're in the exit phase (last 30 frames)
  const isExitPhase = frame >= overlay.durationInFrames - 30;

  // Apply enter animation only during entry phase
  const enterAnimation =
    !isExitPhase && overlay.styles.animation?.enter
      ? animationTemplates[overlay.styles.animation.enter]?.enter(
          frame,
          overlay.durationInFrames,
          overlay.styles.animation.enterDirection
        )
      : {};

  // Apply exit animation only during exit phase
  const exitAnimation =
    isExitPhase && overlay.styles.animation?.exit
      ? animationTemplates[overlay.styles.animation.exit]?.exit(
          frame,
          overlay.durationInFrames,
          overlay.styles.animation.exitDirection
        )
      : {};

  const videoStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: overlay.styles.objectFit || "cover",
    opacity: overlay.styles.videoOpacity ?? 1,
    transform: overlay.styles.transform || "none",
    borderRadius: overlay.styles.borderRadius || "0px",
    filter: overlay.styles.filter || "none",
    boxShadow: overlay.styles.boxShadow || "none",
    border: overlay.styles.border || "none",
    ...(isExitPhase ? exitAnimation : enterAnimation),
  };

  // Create a container style with padding and background that inherits video opacity
  const containerStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    padding: overlay.styles.padding || "0px",
    backgroundColor: overlay.styles.paddingBackgroundColor || "transparent",
    opacity: overlay.styles.videoOpacity ?? 1,
    boxSizing: "border-box",
  };

  // // Apply crop if crop settings exist (regardless of enabled flag)
  // // The enabled flag only controls whether the crop overlay UI is shown
  // if (overlay.styles.crop && overlay.styles.crop.width > 0 && overlay.styles.crop.height > 0) {
  //   const { x, y, width, height } = overlay.styles.crop;
  //   // Use clip-path to crop the video content
  //   containerStyle.clipPath = `inset(${y}px ${overlay.width - x - width}px ${overlay.height - y - height}px ${x}px)`;
  //   containerStyle.overflow = "hidden";
  // }

  // Apply crop if crop settings exist (regardless of enabled flag)
  // The enabled flag only controls whether the crop overlay UI is shown
  if (overlay.styles.crop && overlay.styles.crop.width > 0 && overlay.styles.crop.height > 0) {
    const { x, y, width, height } = overlay.styles.crop;
    // Convert percentages to pixels for clip-path
    const xPx = x * overlay.width;
    const yPx = y * overlay.height;
    const widthPx = width * overlay.width;
    const heightPx = height * overlay.height;
    // Use clip-path to crop the video content
    containerStyle.clipPath = `inset(${yPx}px ${overlay.width - xPx - widthPx}px ${overlay.height - yPx - heightPx}px ${xPx}px)`;
    containerStyle.overflow = "hidden";
  }

  // Use cached video source if available
  const videoSrc = cachedSrc || overlay.src;
  
  // Don't render until we have a video source
  if (!videoSrc) {
    return <div style={containerStyle} />;
  }

  return (
    <div style={containerStyle}>
      <Video
        src={videoSrc}
        startFrom={overlay.videoStartTime || 0}
        style={videoStyle}
        volume={overlay.styles.volume ?? 1}
        playbackRate={overlay.speed ?? 1}
        // pauseWhenBuffering={true}
      />
    </div>
  );
};
