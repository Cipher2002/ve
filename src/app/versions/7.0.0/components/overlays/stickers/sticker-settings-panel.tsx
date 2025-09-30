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
    <div className="space-y-6">
      {/* Animation Speed Control
      <div className="space-y-2 rounded-md bg-gray-100/50 dark:bg-gray-800/50 p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Animation Speed
          </h3>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {(localOverlay.styles as any)?.animation?.speed || 1}x
          </span>
        </div>
        <input
          type="range"
          min="0.25"
          max="3"
          step="0.25"
          value={(localOverlay.styles as any)?.animation?.speed || 1}
          onChange={(e) => {
            const speed = parseFloat(e.target.value);
            handleStyleChange("animation", {
              ...((localOverlay.styles as any)?.animation || {}),
              speed,
            });
          }}
          className="w-full accent-blue-500 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700"
        />
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>Slower</span>
          <span>Normal</span>
          <span>Faster</span>
        </div>
      </div>- */}

      <AnimationSettings
        animations={animationTemplates}
        selectedEnterAnimation={(localOverlay.styles as any)?.animation?.enter}
        selectedExitAnimation={(localOverlay.styles as any)?.animation?.exit}
        selectedEnterDirection={(localOverlay.styles as any)?.animation?.enterDirection}
        selectedExitDirection={(localOverlay.styles as any)?.animation?.exitDirection}
        enterSpeed={(localOverlay.styles as any)?.animation?.enterSpeed || 1}
        exitSpeed={(localOverlay.styles as any)?.animation?.exitSpeed || 1}
        onEnterAnimationSelect={handleEnterAnimationSelect}
        onExitAnimationSelect={handleExitAnimationSelect}
        onEnterSpeedChange={(speed) => {
          handleStyleChange("animation", {
            ...((localOverlay.styles as any)?.animation || {}),
            enterSpeed: speed,
          });
        }}
        onExitSpeedChange={(speed) => {
          handleStyleChange("animation", {
            ...((localOverlay.styles as any)?.animation || {}),
            exitSpeed: speed,
          });
        }}
      />
    </div>
  );
};