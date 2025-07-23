import React from "react";
import { Audio, useCurrentFrame, interpolate } from "remotion";
import { SoundOverlay } from "../../../types";
import { toAbsoluteUrl } from "../../../utils/url-helper";

interface SoundLayerContentProps {
  overlay: SoundOverlay;
  baseUrl?: string;
}

export const SoundLayerContent: React.FC<SoundLayerContentProps> = ({
  overlay,
  baseUrl,
}) => {
  const frame = useCurrentFrame();
  
  // Don't render if loading or no source
  if (!overlay.src || overlay.isLoading) {
    return null;
  }

  // Determine the audio source URL
  let audioSrc = overlay.src;

  // If it's a relative URL and baseUrl is provided, use baseUrl
  if (overlay.src.startsWith("/") && baseUrl) {
    audioSrc = `${baseUrl}${overlay.src}`;
  }
  // Otherwise use the toAbsoluteUrl helper for relative URLs
  else if (overlay.src.startsWith("/")) {
    audioSrc = toAbsoluteUrl(overlay.src);
  }

  // Calculate fade effects (convert seconds to frames at 30fps)
  const fadeInFrames = (overlay.styles?.fadeIn ?? 0) * 30;
  const fadeOutFrames = (overlay.styles?.fadeOut ?? 0) * 30;
  const totalFrames = overlay.durationInFrames;

  let volume = overlay.styles?.volume ?? 1;

  // Apply fade in effect
  if (fadeInFrames > 0 && frame < fadeInFrames) {
    const fadeInMultiplier = interpolate(frame, [0, fadeInFrames], [0, 1], {
      extrapolateRight: "clamp",
    });
    volume *= fadeInMultiplier;
  }

  // Apply fade out effect
  if (fadeOutFrames > 0 && frame > (totalFrames - fadeOutFrames)) {
    const fadeOutMultiplier = interpolate(
      frame,
      [totalFrames - fadeOutFrames, totalFrames],
      [1, 0],
      { extrapolateLeft: "clamp" }
    );
    volume *= fadeOutMultiplier;
  }

  return (
    <Audio
      src={audioSrc}
      startFrom={overlay.startFromSound || 0}
      volume={Math.max(0, Math.min(1, volume))}
      playbackRate={overlay.speed ?? 1}
    />
  );
};