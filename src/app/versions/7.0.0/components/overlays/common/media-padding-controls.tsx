import React from "react";
import { ClipOverlay, ImageOverlay } from "../../../types";

/**
 * Props for the MediaPaddingControls component
 * @interface MediaPaddingControlsProps
 * @property {ClipOverlay | ImageOverlay} localOverlay - The current overlay object containing styles
 * @property {Function} handleStyleChange - Callback function to update overlay styles
 */
interface MediaPaddingControlsProps {
  localOverlay: ClipOverlay | ImageOverlay;
  handleStyleChange: (
    updates: Partial<ClipOverlay["styles"] | ImageOverlay["styles"]>
  ) => void;
}

/**
 * MediaPaddingControls Component
 *
 * A reusable component for controlling padding and padding background color
 * for both video and image overlays.
 *
 * @component
 * @param {MediaPaddingControlsProps} props - Component props
 * @returns {JSX.Element} UI controls for padding and padding background
 */
export const MediaPaddingControls: React.FC<MediaPaddingControlsProps> = ({
  localOverlay,
  handleStyleChange,
}) => {
  // Extract current padding value or set default
  const paddingValue = localOverlay?.styles?.padding || "0px";
  const paddingMatch = paddingValue.match(/^(\d+)px$/);
  const numericPadding = paddingMatch ? parseInt(paddingMatch[1], 10) : 0;

  // Extract current padding background color or set default
  const paddingBackgroundColor =
    localOverlay?.styles?.paddingBackgroundColor || "transparent";

  return (
    <div className="space-y-4">
      {/* Padding Control */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs text-gray-600 dark:text-gray-400">
            Padding
          </label>
          <span className="text-xs text-gray-600 dark:text-gray-400 min-w-[40px] text-right">
            {paddingValue}
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          step="5"
          value={numericPadding}
          onChange={(e) =>
            handleStyleChange({ padding: `${e.target.value}px` })
          }
          className="w-full accent-blue-500 h-1.5 rounded-full bg-gray-300 dark:bg-gray-700"
        />

        </div>
    </div>
  );
};
