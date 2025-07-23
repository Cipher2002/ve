import React, { useMemo } from "react";
import { useEditorContext } from "../../../contexts/editor-context";
import { useTimelinePositioning } from "../../../hooks/use-timeline-positioning";
import { OverlayType, TextOverlay } from "../../../types";
import { useTimeline } from "../../../contexts/timeline-context";
import { textOverlayTemplates } from "../../../templates/text-overlay-templates";

/**
 * Interface for the SelectTextOverlay component props
 */
interface SelectTextOverlayProps {
  /** Callback function to set the local text overlay state */
  setLocalOverlay: (overlay: TextOverlay) => void;
}

/**
 * SelectTextOverlay Component
 *
 * This component renders a grid of text overlay templates that users can select from.
 * When a template is selected, it creates a new text overlay with predefined styles
 * and positions it at the next available spot in the timeline.
 *
 * Features:
 * - Displays a grid of text overlay templates with preview and information
 * - Automatically positions new overlays in the timeline
 * - Applies template styles while maintaining consistent base properties
 * - Supports dark/light mode with appropriate styling
 *
 * @component
 */
export const SelectTextOverlay: React.FC<SelectTextOverlayProps> = () => {
  const { addOverlay, overlays, durationInFrames } = useEditorContext();
  const { findNextAvailablePosition } = useTimelinePositioning();
  const { visibleRows } = useTimeline();

  /**
   * Creates and adds a new text overlay to the editor
   * @param option - The selected template option from textOverlayTemplates
   */
  const handleAddOverlay = (option: (typeof textOverlayTemplates)[0]) => {
    const { from, row } = findNextAvailablePosition(
      overlays,
      visibleRows,
      durationInFrames
    );

    const newOverlay: TextOverlay = {
      left: 100,
      top: 100,
      width: 300,
      height: 50,
      durationInFrames: 90,
      from,
      id: Date.now(),
      row,
      rotation: 0,
      isDragging: false,
      type: OverlayType.TEXT,
      content: option.content ?? "Testing",
      templateType: option.type,
      styles: {
        ...option.styles,
        fontSize: "3rem",
        opacity: 1,
        zIndex: 1,
        transform: "none",
        textAlign: option.styles.textAlign as "left" | "center" | "right",
      },
    };

    addOverlay(newOverlay);
  };

  return useMemo(
    () => (
      <div className="grid grid-cols-1 gap-3 p-2">
        {Object.entries(textOverlayTemplates).map(([key, option]) => (
          <div
            key={key}
            onClick={() => handleAddOverlay(option)}
            className="group relative overflow-hidden border-2  bg-gray-200  dark:bg-gray-900/40  rounded-md border-white/10 transition-all duration-200 dark:hover:border-white/20 hover:border-blue-500/80 cursor-pointer"
          >
            {/* Preview Container */}
              <div className="flex-1 w-full flex items-center justify-center p-4">
                <div
                  className={`text-base transform-gpu transition-transform duration-200 group-hover:scale-102 dark:text-white text-gray-900/90 ${option.styles.cssClass || ''}`}
                  style={{
                    ...option.styles,
                    fontSize: "1.25rem",
                    padding: option.styles.padding || undefined,
                    fontFamily: undefined,
                    // Keep original color logic AND add effect color support
                    color: option.styles.effect?.params?.color || option.styles.color || undefined,
                    // Add basic effect preview while keeping original textShadow
                    textShadow: option.styles.effect?.type === 'striped-shadow' ? '2px 2px 0px rgba(255,85,85,0.3)' :
                                option.styles.effect?.type === 'script-layered' ? '2px 2px 0px #FFB3BA' :
                                option.styles.effect?.type === 'pink-outline' ? '2px 2px 0px #AD1457' :
                                option.styles.effect?.type === 'red-pink-outline' ? '2px 2px 0px #FFB6C1' :
                                option.styles.effect?.type === 'hero-outline' ? '2px 2px 0px #228B22' :
                                option.styles.effect?.type === 'ripple-contour' ? '2px 2px 0px #FFB3B3' :
                                option.styles.effect?.type === 'brush-paint' ? '1px 1px 0px rgba(0,0,0,0.2)' :
                                option.styles.effect?.type === 'neon-outline' ? '0 0 5px #FFFF00' :
                                option.styles.effect?.type === 'soft-script-shadow' ? '2px 2px 0px rgba(165,168,255,0.3)' :
                                option.styles.textShadow || undefined
                  }}
                >
                  {option.type === "multi-element" && typeof option.content === 'object' ? (
                    option.content.elements?.map((element: any, index: any) => (
                      <span key={element.id || index} style={{ marginRight: '4px' }}>
                        {element.text}
                      </span>
                    ))
                  ) : (
                    typeof option.content === 'string' ? option.content : 'Preview'
                  )}
                </div>
              </div>

              {/* Label - Now at bottom without absolute positioning */}
              <div className="dark:bg-black/40 bg-white/40 backdrop-blur-[2px] px-3 py-2 border-t border-white/10">
              <div className="font-medium dark:text-white/95 text-black/95 text-[11px]">
                {option.name}
              </div>
              <div className="text-black/70 dark:text-white/70 text-[9px] leading-tight">
                {option.preview}
              </div>
            </div>
          </div>
        ))}
      </div>
    ),
    []
  );
};
