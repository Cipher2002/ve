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

        {/* Padding Transparency/Opacity Control */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-gray-600 dark:text-gray-400">
              Padding Transparency
            </label>
            <span className="text-xs text-gray-600 dark:text-gray-400 min-w-[40px] text-right">
              {paddingBackgroundColor === "transparent" ? "100%" : 
              `${Math.round((1 - (paddingBackgroundColor.includes("rgba") ? 
                parseFloat(paddingBackgroundColor.split(',')[3]?.replace(')', '') || "1") : 1)) * 100)}%`}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={paddingBackgroundColor === "transparent" ? 100 : 
              Math.round((1 - (paddingBackgroundColor.includes("rgba") ? 
                parseFloat(paddingBackgroundColor.split(',')[3]?.replace(')', '') || "1") : 1)) * 100)}
            onChange={(e) => {
              const transparency = parseInt(e.target.value);
              const opacity = (100 - transparency) / 100;
              
              if (transparency === 100) {
                handleStyleChange({ paddingBackgroundColor: "transparent" });
              } else {
                const currentColor = paddingBackgroundColor === "transparent" ? "#ffffff" : paddingBackgroundColor;
                
                if (currentColor.startsWith("#")) {
                  const hex = currentColor;
                  const rgb = hex.match(/^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
                  if (rgb) {
                    const r = parseInt(rgb[1], 16);
                    const g = parseInt(rgb[2], 16);
                    const b = parseInt(rgb[3], 16);
                    handleStyleChange({ 
                      paddingBackgroundColor: `rgba(${r}, ${g}, ${b}, ${opacity})` 
                    });
                  }
                } else if (currentColor.includes("rgb")) {
                  const rgbMatch = currentColor.match(/rgba?\(([^)]+)\)/);
                  if (rgbMatch) {
                    const values = rgbMatch[1].split(',');
                    const r = parseInt(values[0].trim());
                    const g = parseInt(values[1].trim());
                    const b = parseInt(values[2].trim());
                    handleStyleChange({ 
                      paddingBackgroundColor: `rgba(${r}, ${g}, ${b}, ${opacity})` 
                    });
                  }
                }
              }
            }}
            className="w-full accent-blue-500 h-1.5 rounded-full bg-gray-300 dark:bg-gray-700"
          />
        </div>
      </div>

      {/* Padding Background Color */}
      <div className="space-y-2">
        <label className="text-xs text-gray-600 dark:text-gray-400">
          Padding Background
        </label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={
              paddingBackgroundColor === "transparent"
                ? "#ffffff"
                : paddingBackgroundColor.replace(/rgba?\([^)]+\)/, "#ffffff")
            }
            onChange={(e) => {
              const opacity = paddingBackgroundColor.includes("rgba") ? 
                parseFloat(paddingBackgroundColor.split(',')[3]?.replace(')', '') || "1") : 1;
              const hex = e.target.value;
              const rgb = hex.match(/^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
              if (rgb) {
                const r = parseInt(rgb[1], 16);
                const g = parseInt(rgb[2], 16);
                const b = parseInt(rgb[3], 16);
                handleStyleChange({ 
                  paddingBackgroundColor: `rgba(${r}, ${g}, ${b}, ${opacity})` 
                });
              }
            }}
            className="w-8 h-8 border border-gray-200 dark:border-gray-700 rounded-md p-0.5 cursor-pointer"
          />
          <input
            type="text"
            value={paddingBackgroundColor}
            onChange={(e) =>
              handleStyleChange({ paddingBackgroundColor: e.target.value })
            }
            placeholder="transparent"
            className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md text-xs p-2 hover:border-gray-300 dark:hover:border-gray-600 transition-colors text-gray-900 dark:text-gray-100"
          />
        </div>
      </div>
    </div>
  );
};
