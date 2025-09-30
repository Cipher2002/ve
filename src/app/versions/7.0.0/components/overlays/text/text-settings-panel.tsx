import React from "react";
import { TextOverlay } from "../../../types";
import { AnimationSettings } from "../../shared/animation-preview";
import { animationTemplates } from "../../../templates/animation-templates";

/**
 * Props for the TextSettingsPanel component
 * @interface TextSettingsPanelProps
 * @property {TextOverlay} localOverlay - The current text overlay object containing styles and animation settings
 * @property {Function} handleStyleChange - Callback function to handle style changes for the text overlay
 */
interface TextSettingsPanelProps {
  localOverlay: TextOverlay;
  handleStyleChange: (updates: Partial<TextOverlay["styles"]>) => void;
}

/**
 * Panel component for managing text overlay animation settings
 * Allows users to select enter and exit animations for text overlays
 *
 * @component
 * @param {TextSettingsPanelProps} props - Component props
 * @returns {JSX.Element} A panel with animation selection options
 */
export const TextSettingsPanel: React.FC<TextSettingsPanelProps> = ({
  localOverlay,
  handleStyleChange,
}) => {
  // Handlers for animation selection
  const handleEnterAnimationSelect = (animationKey: string, direction?: string) => {
    handleStyleChange({
      animation: {
        ...localOverlay.styles.animation,
        enter: animationKey === "none" ? undefined : animationKey,
        enterDirection: animationKey === "none" ? undefined : direction,
      },
    });
  };

  const handleExitAnimationSelect = (animationKey: string, direction?: string) => {
    handleStyleChange({
      animation: {
        ...localOverlay.styles.animation,
        exit: animationKey === "none" ? undefined : animationKey,
        exitDirection: animationKey === "none" ? undefined : direction,
      },
    });
  };

  return (
    <div className="px-2">
      <AnimationSettings
        animations={animationTemplates}
        selectedEnterAnimation={localOverlay.styles.animation?.enter}
        selectedExitAnimation={localOverlay.styles.animation?.exit}
        selectedEnterDirection={localOverlay.styles.animation?.enterDirection}
        selectedExitDirection={localOverlay.styles.animation?.exitDirection}
        enterSpeed={localOverlay.styles.animation?.enterSpeed || 1}
        exitSpeed={localOverlay.styles.animation?.exitSpeed || 1}
        onEnterAnimationSelect={handleEnterAnimationSelect}
        onExitAnimationSelect={handleExitAnimationSelect}
        onEnterSpeedChange={(speed) => {
          handleStyleChange({
            animation: {
              ...localOverlay.styles.animation,
              enterSpeed: speed,
            },
          });
        }}
        onExitSpeedChange={(speed) => {
          handleStyleChange({
            animation: {
              ...localOverlay.styles.animation,
              exitSpeed: speed,
            },
          });
        }}
      />
    </div>
  );
};
