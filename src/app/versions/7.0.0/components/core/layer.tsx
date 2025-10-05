import React, { useMemo } from "react";
import { Sequence } from "remotion";
import { LayerContent } from "./layer-content";
import { Overlay, ClipOverlay } from "../../types";

/**
 * Props for the Layer component
 * @interface LayerProps
 * @property {Overlay} overlay - The overlay object containing position, dimensions, and content information
 * @property {number | null} selectedOverlayId - ID of the currently selected overlay, used for interaction states
 * @property {string | undefined} baseUrl - The base URL for the video
 */
export const Layer: React.FC<{
  overlay: Overlay;
  selectedOverlayId: number | null;
  selectedOverlayIds?: number[];  // ADD THIS LINE
  baseUrl?: string;
  allOverlays?: Overlay[];
  currentFrame?: number;
  premountFrames?: number;
  maxPremountedVideos?: number;
}> = ({ overlay, selectedOverlayId, selectedOverlayIds = [], baseUrl, allOverlays = [], currentFrame = 0, premountFrames = 100, maxPremountedVideos = 3 }) => {
  /**
   * Memoized style calculations for the layer
   * Handles positioning, dimensions, rotation, and z-index based on:
   * - Overlay position (left, top)
   * - Dimensions (width, height)
   * - Rotation
   * - Row position for z-index stacking
   * - Selection state for pointer events
   *
   * @returns {React.CSSProperties} Computed styles for the layer
   */
const style: React.CSSProperties = useMemo(() => {
    // Higher row numbers should be at the bottom
    // e.g. row 4 = z-index 60, row 0 = z-index 100
    // Ensure z-index never goes negative by using Math.max with 1
    const zIndex = Math.max(1, 100 - (overlay.row || 0) * 10);
    const isSelected = overlay.id === selectedOverlayId || selectedOverlayIds.includes(overlay.id);

    return {
      position: "absolute",
      left: overlay.left,
      top: overlay.top,
      width: overlay.width,
      height: overlay.height,
      transform: `rotate(${overlay.rotation || 0}deg)`,
      transformOrigin: "center center",
      zIndex,
      pointerEvents: isSelected ? "all" : "none",
      // Add visual highlight for multi-selection
      outline: selectedOverlayIds.length > 1 && selectedOverlayIds.includes(overlay.id) 
        ? '3px solid rgba(59, 130, 246, 0.8)' 
        : isSelected 
        ? '2px solid rgba(59, 130, 246, 0.6)' 
        : 'none',
      outlineOffset: '2px',
    };
  }, [
    overlay.height,
    overlay.left,
    overlay.top,
    overlay.width,
    overlay.rotation,
    overlay.row,
    overlay.id,
    selectedOverlayId,
    selectedOverlayIds,  // ADD THIS LINE
  ]);

  /**
   * Calculate extended duration for video and audio to fill gaps
   */
  const getExtendedDuration = useMemo(() => {
    // Always extend video and audio by 1 frame to prevent gaps
    if (overlay.type === "video" || overlay.type === "sound") {
      return overlay.durationInFrames + 1;
    }
    
    return overlay.durationInFrames;
  }, [overlay.type, overlay.durationInFrames]);

  /**
   * Calculate premount settings for video overlays
   */
  const premountSettings = useMemo(() => {
    if (overlay.type !== "video" || !currentFrame) {
      return { shouldPremount: false, premountFor: 0 };
    }

    // Get all video overlays from allOverlays
    const videoOverlays = allOverlays.filter(o => o.type === "video") as ClipOverlay[];
    
    // Find videos that should be premounted (starting soon)
    const upcomingVideos = videoOverlays
      .filter(video => {
        const framesUntilStart = video.from - currentFrame;
        return framesUntilStart > 0 && framesUntilStart <= premountFrames;
      })
      .sort((a, b) => a.from - b.from) // Sort by start time
      .slice(0, maxPremountedVideos); // Limit to max premounted videos

    // Check if current overlay should be premounted
    const shouldPremount = upcomingVideos.some(video => video.id === overlay.id);
    
    return {
      shouldPremount,
      premountFor: shouldPremount ? premountFrames : 0
    };
  }, [overlay, currentFrame, premountFrames, maxPremountedVideos, allOverlays]);

  /**
   * Special handling for sound overlays
   * Sound overlays don't need positioning or visual representation,
   * they just need to be sequenced correctly
   */
  if (overlay.type === "sound") {
    return (
      <Sequence
        key={overlay.id}
        from={overlay.from}
        durationInFrames={getExtendedDuration}
      >
        <LayerContent overlay={overlay} baseUrl={baseUrl} />
      </Sequence>
    );
  }

  /**
   * Standard layer rendering for visual elements
   * Wraps the content in a Sequence for timing control and
   * a positioned div for layout management
   */
  
  return (
    <Sequence
      key={overlay.id}
      from={overlay.from}
      durationInFrames={overlay.type === "video" ? getExtendedDuration : overlay.durationInFrames}
      layout="none"
      {...(premountSettings.shouldPremount && { premountFor: premountSettings.premountFor })}
    >
      <div style={style}>
        <LayerContent overlay={overlay} baseUrl={baseUrl} />
      </div>
    </Sequence>
  );
};
