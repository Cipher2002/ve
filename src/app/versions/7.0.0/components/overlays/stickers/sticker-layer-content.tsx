import React, { memo } from "react";
import { StickerOverlay } from "../../../types";
import { templateMap } from "../../../templates/sticker-templates/sticker-helpers";
import { useCurrentFrame } from "remotion";
import { animationTemplates } from "../../../templates/animation-templates";

interface StickerLayerContentProps {
  overlay: StickerOverlay;
  isSelected: boolean;
  onUpdate?: (updates: Partial<StickerOverlay>) => void;
}

export const StickerLayerContent: React.FC<StickerLayerContentProps> = memo(
  ({ overlay, isSelected, onUpdate }) => {
    const frame = useCurrentFrame();
    const template = templateMap[overlay.content];

    if (!template) {
      console.warn(`No sticker template found for id: ${overlay.content}`);
      return null;
    }

    // Calculate if we're in the exit phase (last 30 frames)
    const isExitPhase = frame >= overlay.durationInFrames - 30;

    const enterAnimation =
      !isExitPhase && overlay.styles?.animation?.enter
        ? animationTemplates[overlay.styles.animation.enter]?.enter(
            frame,
            overlay.durationInFrames,
            overlay.styles.animation.enterDirection,
            overlay.styles.animation.speed || 1
          )
        : {};

    const exitAnimation =
      isExitPhase && overlay.styles?.animation?.exit
        ? animationTemplates[overlay.styles.animation.exit]?.exit(
            frame,
            overlay.durationInFrames,
            overlay.styles.animation.exitDirection,
            overlay.styles.animation.speed || 1
          )
        : {};

    const { Component } = template;
    const MemoizedComponent = memo(Component);
    const props = {
      ...template.config.defaultProps,
      ...overlay, // Pass through shape properties like fillColor, strokeColor, etc.
      overlay,
      isSelected,
      onUpdate,
    };

    // Wrap the component with animation styles
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          ...(isExitPhase ? exitAnimation : enterAnimation),
        }}
      >
        <MemoizedComponent {...props} />
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Only re-render if these props change
    return (
      prevProps.overlay.content === nextProps.overlay.content &&
      prevProps.isSelected === nextProps.isSelected &&
      prevProps.overlay.styles?.opacity === nextProps.overlay.styles?.opacity &&
      prevProps.overlay.rotation === nextProps.overlay.rotation &&
      prevProps.overlay.width === nextProps.overlay.width &&
      prevProps.overlay.height === nextProps.overlay.height &&
      // Add shape-specific properties to the comparison
      prevProps.overlay.fillColor === nextProps.overlay.fillColor &&
      prevProps.overlay.strokeColor === nextProps.overlay.strokeColor &&
      prevProps.overlay.strokeWidth === nextProps.overlay.strokeWidth &&
      prevProps.overlay.strokeStyle === nextProps.overlay.strokeStyle &&
      prevProps.overlay.shadowColor === nextProps.overlay.shadowColor &&
      prevProps.overlay.shadowBlur === nextProps.overlay.shadowBlur &&
      prevProps.overlay.shadowOffsetX === nextProps.overlay.shadowOffsetX &&
      prevProps.overlay.shadowOffsetY === nextProps.overlay.shadowOffsetY
    );
  }
);

StickerLayerContent.displayName = "StickerLayerContent";
