import React from "react";
import { StickerOverlay } from "../../../types";
import { AnimationSettings } from "../../shared/animation-preview";
import { animationTemplates } from "../../../templates/animation-templates";

interface StickerSettingsPanelProps {
  localOverlay: StickerOverlay;
  handleStyleChange: (field: string, value: any) => void;
}

export const StickerSettingsPanel: React.FC<StickerSettingsPanelProps> = ({
  localOverlay,
  handleStyleChange,
}) => {
  // Handlers for animation selection
  const handleEnterAnimationSelect = (animationKey: string, direction?: string) => {
    handleStyleChange("animation", {
      ...((localOverlay.styles as any)?.animation || {}),
      enter: animationKey,
      enterDirection: direction,
    });
  };

  const handleExitAnimationSelect = (animationKey: string, direction?: string) => {
    handleStyleChange("animation", {
      ...((localOverlay.styles as any)?.animation || {}),
      exit: animationKey,
      exitDirection: direction,
    });
  };

  return (
    <AnimationSettings
      animations={animationTemplates}
      selectedEnterAnimation={(localOverlay.styles as any)?.animation?.enter}
      selectedExitAnimation={(localOverlay.styles as any)?.animation?.exit}
      selectedEnterDirection={(localOverlay.styles as any)?.animation?.enterDirection}
      selectedExitDirection={(localOverlay.styles as any)?.animation?.exitDirection}
      onEnterAnimationSelect={handleEnterAnimationSelect}
      onExitAnimationSelect={handleExitAnimationSelect}
    />
  );
};