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
  const handleEnterAnimationSelect = (animationKey: string) => {
    handleStyleChange("animation", {
      ...((localOverlay.styles as any)?.animation || {}),
      enter: animationKey,
    });
  };

  const handleExitAnimationSelect = (animationKey: string) => {
    handleStyleChange("animation", {
      ...((localOverlay.styles as any)?.animation || {}),
      exit: animationKey,
    });
  };

  return (
    <AnimationSettings
      animations={animationTemplates}
      selectedEnterAnimation={(localOverlay.styles as any)?.animation?.enter}
      selectedExitAnimation={(localOverlay.styles as any)?.animation?.exit}
      onEnterAnimationSelect={handleEnterAnimationSelect}
      onExitAnimationSelect={handleExitAnimationSelect}
    />
  );
};