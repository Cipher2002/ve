import React, { useMemo } from "react";
import { useEditorContext } from "../../../contexts/editor-context";
import { useTimelinePositioning } from "../../../hooks/use-timeline-positioning";
import { OverlayType, TextOverlay } from "../../../types";
import { textOverlayTemplates } from "../../../templates/text-overlay-templates";
import { useTextEffects } from "./text-effects";

/**
 * Interface for the SelectTextOverlay component props
 */
interface SelectTextOverlayProps {
  // No props needed - component manages its own overlay creation
}

/**
 * SelectTextOverlay Component
 *
 * This component renders a grid of text overlay templates that users can select from.
 * When a template is selected, it creates a new text overlay with predefined styles
 * and positions it at the next available spot in the timeline.
 *
 * Features:
 * - Displays a 2-column grid of text overlay templates with preview and information
 * - Automatically positions new overlays in the timeline
 * - Applies template styles while maintaining consistent base properties
 * - Matches the design aesthetic with proper spacing and colors
 *
 * @component
 */
export const SelectTextOverlay: React.FC<SelectTextOverlayProps> = () => {
  const { overlays, currentFrame, setOverlays, setSelectedOverlayId } = useEditorContext();
  const { addAtPlayhead } = useTimelinePositioning();

  /**
   * Creates and adds a new text overlay to the editor
   * @param option - The selected template option from textOverlayTemplates
   */
  const handleAddOverlay = (option: (typeof textOverlayTemplates)[0]) => {
    const { from, row, updatedOverlays } = addAtPlayhead(
      currentFrame,
      overlays,
      'bottom'
    );

    const newOverlay: Omit<TextOverlay, "id"> = {
      left: 100,
      top: 100,
      width: 500,
      height: 180,
      durationInFrames: 90,
      from,
      row,
      rotation: 0,
      isDragging: false,
      type: OverlayType.TEXT,
      content: option.content ?? "Testing",
      styles: {
        ...option.styles,
        opacity: 1,
        zIndex: 1,
        transform: "none",
        textAlign: option.styles.textAlign as "left" | "center" | "right",
        fontSizeScale: 1,
      },
    };

    const newId = updatedOverlays.length > 0 ? Math.max(...updatedOverlays.map((o) => o.id)) + 1 : 0;
    const overlayWithId = { ...newOverlay, id: newId } as TextOverlay;
    const finalOverlays = [...updatedOverlays, overlayWithId];
    
    setOverlays(finalOverlays);
    setSelectedOverlayId(newId);
    
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('adjustTimelineRows', {
        detail: { requiredRows: row + 1 }
      }));
    }, 0);
  };

  return (
    <section className="flex flex-col bg-[rgb(244,242,250)] h-full font-['Poppins',Helvetica,Arial,serif]">
      <div className="flex flex-col items-center gap-y-2 mt-2 mr-2.5 mb-2 ml-2.75">
        {/* Title with decorative line */}
        <div className="flex flex-col items-center gap-y-2 flex-shrink-0">
          <hr className="bg-[rgb(65,77,92)] rounded-[1px] w-[2.625rem] h-[2px] border-0" />
          <p className="flex items-center font-bold text-sm leading-tight text-[rgb(47,46,46)]">
            Text
          </p>
        </div>

        {/* Grid with scroll */}
        <div className="w-full flex gap-x-px flex-1 min-h-0">
          <div 
            className="grid grid-cols-2 content-start gap-y-2 gap-x-2 w-full overflow-y-auto pr-1"
            style={{ maxHeight: 'calc(100vh - 120px)' }}
          >
            {Object.entries(textOverlayTemplates).map(([key, option]) => (
              <button
                key={key}
                onClick={() => handleAddOverlay(option)}
                className="bg-white rounded pl-2 pt-2 pr-2 pb-2 flex flex-col gap-y-1.5 cursor-pointer hover:shadow-md transition-shadow duration-200"
              >
                {/* Preview Image Container */}
                <div className="rounded w-full aspect-video bg-[#e8e5f0] flex items-center justify-center overflow-hidden">
                  <img
                    className="w-full h-full object-contain p-2"
                    src={`/assets/Text/${option.name.toLowerCase().replace(/\s+/g, '_')}.svg`}
                    alt={option.name}
                    onError={(e) => {
                      // Fallback to PNG if SVG not found
                      const target = e.target as HTMLImageElement;
                      target.src = `text_effects_preview/${option.name}.png`;
                      target.onerror = () => {
                        // If PNG also fails, use a placeholder
                        target.src = '/assets/Text/initials_aa.svg';
                      };
                    }}
                  />
                </div>

                {/* Text Info */}
                <div className="flex flex-col gap-y-1 text-left">
                  <p className="font-semibold text-xs leading-tight text-[rgb(47,46,46)] tracking-tight">
                    {option.name}
                  </p>
                  <p className="text-xs leading-tight text-[rgb(65,77,92)] tracking-tight">
                    {option.preview}
                  </p>
                </div>
              </button>
            ))}
          </div>

          {/* Scrollbar indicator - visual only */}
          {/* <div className="bg-[rgb(135,133,133)] rounded-[1px] w-0.5 min-h-full flex-shrink-0" /> */}
        </div>
      </div>
    </section>
  );
};