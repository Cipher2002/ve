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
 * Preview component that renders text with effects
 */
const TextPreview: React.FC<{ option: (typeof textOverlayTemplates)[0] }> = ({ option }) => {
  const { createEffect } = useTextEffects(0); // frame 0 for static preview
  
  const baseStyle: React.CSSProperties = {
    fontSize: "1.25rem",
    padding: option.styles.padding || undefined,
    fontFamily: option.styles.fontFamily,
    fontWeight: option.styles.fontWeight,
    fontStyle: option.styles.fontStyle,
    textDecoration: option.styles.textDecoration,
    lineHeight: option.styles.lineHeight || "1.2",
    letterSpacing: option.styles.letterSpacing || "0px",
    textAlign: option.styles.textAlign as "left" | "center" | "right",
    color: option.styles.color,
    backgroundColor: option.styles.backgroundColor,
    textShadow: option.styles.textShadow,
    textTransform: option.styles.textTransform as any,
    border: option.styles.border,
    borderRadius: option.styles.borderRadius,
    boxShadow: option.styles.boxShadow,
    backdropFilter: option.styles.backdropFilter,
    transform: option.styles.transform,
    filter: option.styles.filter,
    background: option.styles.background,
    WebkitBackgroundClip: option.styles.WebkitBackgroundClip as any,
    WebkitTextFillColor: option.styles.WebkitTextFillColor,
    whiteSpace: 'pre-wrap',
    wordWrap: 'break-word',
    width: 'fit-content',
    margin: 'auto',
  };

  // Check if this template has an effect
  if (option.styles.effect) {
    const effect = createEffect(option.styles.effect, baseStyle, option.content);
    
    if (effect && effect.container) {
      return (
        <div style={{ 
          ...effect.container as React.CSSProperties, 
          fontSize: "1.25rem", 
          maxWidth: "100%",
          transform: 'scale(0.8)',
          transformOrigin: 'center'
        }}>
          {effect.layers.map((layer, index) => (
            <div key={index} style={{ ...layer.style, fontSize: "1.25rem" }}>
              {layer.content}
            </div>
          ))}
        </div>
      );
    } else if (effect) {
      return (
        <div style={{ 
          position: 'relative', 
          width: 'fit-content', 
          margin: 'auto',
          transform: 'scale(0.8)',
          transformOrigin: 'center'
        }}>
          {effect.layers.map((layer, index) => (
            <div key={index} style={{ ...layer.style, fontSize: "1.25rem" }}>
              {layer.content}
            </div>
          ))}
        </div>
      );
    }
  }

  // No effect - render normally
  return (
    <div style={baseStyle}>
      {option.content}
    </div>
  );
};

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
      'bottom'  // Add text overlays at the bottom instead of shifting everything
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
        // Remove hardcoded fontSize to let dynamic calculation work
        opacity: 1,
        zIndex: 1,
        transform: "none",
        textAlign: option.styles.textAlign as "left" | "center" | "right",
        fontSizeScale: 1, // Default scale factor
      },
    };

    // Update overlays with both the shifted overlays and the new overlay in a single operation
    const newId = updatedOverlays.length > 0 ? Math.max(...updatedOverlays.map((o) => o.id)) + 1 : 0;
    const overlayWithId = { ...newOverlay, id: newId } as TextOverlay;
    const finalOverlays = [...updatedOverlays, overlayWithId];
    
    setOverlays(finalOverlays);
    setSelectedOverlayId(newId);
    
    // Dispatch event to request timeline row adjustment after state update
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('adjustTimelineRows', {
        detail: { requiredRows: row + 1 }
      }));
    }, 0);
  };

  return useMemo(
    () => (
      <div className="grid grid-cols-1 gap-3 p-2">
        {Object.entries(textOverlayTemplates).map(([key, option]) => (
          <div
            key={key}
            onClick={() => handleAddOverlay(option)}
            className="group relative overflow-hidden border-2 rounded-md transition-all duration-200 
                      hover:border-secondary hover:bg-accent/30 cursor-pointer bg-gray-200"
          >
            {/* Preview Container */}
            <div className="aspect-[16/6] w-full flex items-center justify-center p-2 pb-12 overflow-hidden">
              <div className="text-base transform-gpu transition-transform duration-200 group-hover:scale-102 text-foreground max-w-full">
                <TextPreview option={option} />
              </div>
            </div>

            {/* Label */}
            <div className="absolute bottom-0 left-0 right-0 backdrop-blur-[2px] px-3 py-1.5">
              <div className="font-light text-foreground text-[11px]">
                {option.name}
              </div>
              <div className="text-muted-foreground text-[9px] leading-tight">
                {option.preview}
              </div>
            </div>
          </div>
        ))}
      </div>
    ),
    [currentFrame, overlays, handleAddOverlay]
  );
};
