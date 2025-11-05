import React, { memo, useCallback, useRef, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEditorContext } from "../../../contexts/editor-context";
import { Overlay, OverlayType, StickerCategory, StickerOverlay } from "../../../types";
import { StickerDetails } from "./sticker-details";
import { SelectStickerOverlay } from "./select-sticker-overlay";
import {
  templatesByCategory,
  getStickerCategories,
} from "../../../templates/sticker-templates/sticker-helpers";
import { useTimelinePositioning } from "../../../hooks/use-timeline-positioning";
import { useTimeline } from "../../../contexts/timeline-context";
import { Player } from "@remotion/player";
import { Sequence } from "remotion";
import { useIsMobile } from "@/hooks/use-mobile";

// Wrapper component for sticker preview with static frame
const StickerPreview = memo(
  ({ template, onClick }: { template: any; onClick: () => void }) => {
    const playerRef = useRef<any>(null);
    const { Component } = template;

    const stickerDuration =
      template.config.defaultProps?.durationInFrames || 100;

    const previewProps = {
      overlay: {
        id: -1,
        type: OverlayType.STICKER,
        content: template.config.id,
        category: template.config.category as StickerCategory,
        durationInFrames: stickerDuration,
        from: 0,
        height: 100,
        width: 200,
        left: 0,
        top: 0,
        row: 0,
        isDragging: false,
        rotation: 0,
        styles: {
          opacity: 1,
          ...template.config.defaultProps?.styles,
        },
      },
      isSelected: false,
      ...template.config.defaultProps,
    };

    const MemoizedComponent = memo(Component);

    const PreviewComponent = () => (
      <Sequence from={0} durationInFrames={stickerDuration}>
        <MemoizedComponent {...previewProps} />
      </Sequence>
    );

    const handleMouseEnter = useCallback(() => {
      if (playerRef.current) {
        playerRef.current.seekTo(0);
        playerRef.current.play();
      }
    }, []);

    const handleMouseLeave = useCallback(() => {
      if (playerRef.current) {
        playerRef.current.pause();
        playerRef.current.seekTo(15);
      }
    }, []);

    return (
      <button
        onClick={onClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`
          group relative w-full h-full
          rounded-lg bg-gray-100/40 dark:bg-gray-800/40
          border border-gray-800/10 dark:border-gray-700/10
          hover:border-blue-500/20 dark:hover:border-blue-500/20
          hover:bg-blue-500/5 dark:hover:bg-blue-500/5
          transition-all duration-200 overflow-hidden
          ${template.config.isPro ? "relative" : ""}
        `}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <Player
            ref={playerRef}
            component={PreviewComponent}
            durationInFrames={stickerDuration}
            compositionWidth={template.config.layout === "double" ? 280 : 140}
            compositionHeight={140}
            fps={30}
            initialFrame={15}
            autoPlay={false}
            loop
            controls={false}
            style={{
              width: template.config.layout === "double" ? "100%" : "140px",
              height: "140px",
            }}
          />
        </div>
      </button>
    );
  },
  (prevProps, nextProps) =>
    prevProps.template.config.id === nextProps.template.config.id
);

StickerPreview.displayName = "StickerPreview";

export function StickersPanel() {
  const { addOverlay, overlays, durationInFrames, selectedOverlayId, currentFrame, setOverlays } = useEditorContext();
  const { findNextAvailablePosition, addAtPlayhead } = useTimelinePositioning();
  const { visibleRows } = useTimeline();
  const stickerCategories = getStickerCategories();
  const isMobile = useIsMobile();
  const [localOverlay, setLocalOverlay] = useState<StickerOverlay | null>(null);
  const [activeCategory, setActiveCategory] = useState(stickerCategories[0]);

  // Update local overlay when selected overlay changes or when overlays change
  React.useEffect(() => {
    if (selectedOverlayId === null) {
      setLocalOverlay(null);
      return;
    }

    const selectedOverlay = overlays.find(
      (overlay) => overlay.id === selectedOverlayId
    );

    if (selectedOverlay?.type === OverlayType.STICKER) {
      setLocalOverlay(selectedOverlay as StickerOverlay);
    } else {
      setLocalOverlay(null);
    }
  }, [selectedOverlayId, overlays]);

  const handleSetLocalOverlay = (overlay: StickerOverlay) => {
    setLocalOverlay(overlay);
  };

  const isValidStickerOverlay = localOverlay && selectedOverlayId !== null;

  const handleStickerClick = useCallback(
    (templateId: string) => {
      const template = Object.values(templatesByCategory)
        .flat()
        .find((t) => t.config.id === templateId);

      if (!template) return;

      const { from, row, updatedOverlays } = addAtPlayhead(
        currentFrame,
        overlays,
        'top'
      );

      const newOverlay: Overlay = {
        id: Date.now(),
        type: OverlayType.STICKER,
        content: template.config.id,
        category: template.config.category as StickerCategory,
        durationInFrames: 50,
        from,
        height: 150,
        width: 150,
        left: 0,
        top: 0,
        row,
        isDragging: false,
        rotation: 0,
        styles: {
          opacity: 1,
          zIndex: 1,
          ...template.config.defaultProps?.styles,
        },
        // Add shape-specific default properties if it's a shape sticker
        ...(template.config.category === "Shapes" ? {
          fillColor: template.config.defaultProps?.fillColor || "#3B82F6",
          strokeColor: template.config.defaultProps?.strokeColor || "#1E40AF",
          strokeWidth: template.config.defaultProps?.strokeWidth || 0,
          strokeStyle: template.config.defaultProps?.strokeStyle || "solid",
          shadowColor: template.config.defaultProps?.shadowColor || "rgba(0,0,0,0.2)",
          shadowBlur: template.config.defaultProps?.shadowBlur || 0,
          shadowOffsetX: template.config.defaultProps?.shadowOffsetX || 0,
          shadowOffsetY: template.config.defaultProps?.shadowOffsetY || 0,
        } : {}),
      };

      // Create final overlays array
      const finalOverlays = [...updatedOverlays, newOverlay];
      setOverlays(finalOverlays);
      
      // Request timeline to adjust rows
      window.dispatchEvent(new CustomEvent('adjustTimelineRows', {
        detail: { requiredRows: Math.max(...finalOverlays.map(o => o.row)) + 1 }
      }));
    },
    [
      overlays,
      visibleRows,
      durationInFrames,
      currentFrame,
      setOverlays,
      addAtPlayhead,
    ]
  );

  const renderStickerContent = (category: string) => (
    <div className="grid grid-cols-2 gap-3 pt-3 pb-3">
      {templatesByCategory[category]?.map((template) => (
        <div
          key={template.config.id}
          className={`
            h-[140px]
            ${template.config.layout === "double" ? "col-span-2" : ""}
          `}
        >
          <StickerPreview
            template={template}
            onClick={() => handleStickerClick(template.config.id)}
          />
        </div>
      ))}
    </div>
  );

return (
    <section className="flex flex-col bg-[rgb(244,242,250)] h-full overflow-hidden">
      {!isValidStickerOverlay ? (
        <>
          {/* Header
          <div className="w-full flex flex-col items-center" style={{ gap: '8px', margin: '0 auto' }}>
            <div className="bg-[rgb(65,77,92)] rounded-[1px]" style={{ width: '42px', height: '2px', minHeight: '2px' }} />
            <p className="flex items-center font-bold text-[rgb(47,46,46)]" style={{ fontSize: '14px', lineHeight: '1.14', fontFamily: "'Poppins',Helvetica,Arial,serif" }}>
              Stickers
            </p>
          </div> */}
          {/* Title with decorative line */}
          <div className="w-full flex flex-col items-center gap-y-2 flex-shrink-0" style={{ gap: '8px', marginTop: '8px' }}>
            <div className="flex flex-col gap-y-2 items-center">
              <hr className="bg-[rgb(65,77,92)] rounded w-[2.625rem] h-[2px] border-0" />
              <h1 className="flex items-center font-bold text-3.5 leading-1.14 font-['Poppins',Helvetica,Arial,serif] text-[rgb(47,46,46)] w-full">
                Stickers
              </h1>
            </div>
          </div>
          

          {/* Tab Navigation */}
          <div className="flex items-center" style={{ gap: '8px', marginTop: '8px', marginRight: '10px', marginBottom: '8px', marginLeft: '12px' }}>
            {stickerCategories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className="flex justify-center items-center font-bold text-center transition-colors"
                style={{ 
                  fontSize: '12px', 
                  lineHeight: '1', 
                  fontFamily: "'Poppins',Helvetica,Arial,serif",
                  letterSpacing: '-0.06px',
                  paddingTop: '8px',
                  paddingBottom: '8px',
                  flex: '1',
                  borderBottom: activeCategory === category ? '1px solid rgb(73,9,114)' : '1px solid transparent',
                  color: activeCategory === category ? 'rgb(73,9,114)' : 'rgb(135,133,133)',
                  boxShadow: activeCategory === category ? 'inset 10px 10px 50px 0px rgba(57, 25, 148, 0.15)' : 'none',
                  cursor: 'pointer'
                }}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Content with Independent Scroll */}
          <div className="flex gap-x-px" style={{ flex: '1', minHeight: '0',  marginTop: '8px', marginRight: '10px', marginBottom: '8px', marginLeft: '12px' }}>
            <div className="flex-1 overflow-y-auto" style={{ paddingRight: '4px' }}>
              <div className="h-full">
                <div className="grid grid-cols-3" style={{ gap: '8px', padding: '8px 0' }}>
                  {templatesByCategory[activeCategory]?.map((template) => (
                    <div
                      key={template.config.id}
                      style={{ height: '65px' }}
                    >
                      <button
                        onClick={() => handleStickerClick(template.config.id)}
                        className="group relative w-full h-full rounded bg-white hover:bg-gray-50 transition-colors border border-gray-200"
                        style={{ overflow: 'hidden' }}
                      >
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div style={{ 
                            width: '57px',
                            height: '57px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden'
                          }}>
                            <Player
                              component={() => (
                                <Sequence from={0} durationInFrames={template.config.defaultProps?.durationInFrames || 100}>
                                  {React.createElement(memo(template.Component), {
                                    overlay: {
                                      id: -1,
                                      type: OverlayType.STICKER,
                                      content: template.config.id,
                                      category: template.config.category as StickerCategory,
                                      durationInFrames: template.config.defaultProps?.durationInFrames || 100,
                                      from: 0,
                                      height: 57,
                                      width: 57,
                                      left: 0,
                                      top: 0,
                                      row: 0,
                                      isDragging: false,
                                      rotation: 0,
                                      styles: {
                                        opacity: 1,
                                        ...template.config.defaultProps?.styles,
                                      },
                                    },
                                    isSelected: false,
                                    ...template.config.defaultProps,
                                  })}
                                </Sequence>
                              )}
                              durationInFrames={template.config.defaultProps?.durationInFrames || 100}
                              compositionWidth={57}
                              compositionHeight={57}
                              fps={30}
                              initialFrame={15}
                              autoPlay={false}
                              loop
                              controls={false}
                              style={{
                                width: "57px",
                                height: "57px",
                                maxWidth: "57px",
                                maxHeight: "57px"
                              }}
                            />
                          </div>
                        </div>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <StickerDetails
          localOverlay={localOverlay}
          setLocalOverlay={handleSetLocalOverlay}
        />
      )}
    </section>
  );
}