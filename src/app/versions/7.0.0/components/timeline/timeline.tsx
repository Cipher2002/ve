/**
 * Timeline Component
 *
 * A complex timeline interface that allows users to manage video overlays through
 * drag-and-drop interactions, splitting, duplicating, and deletion operations.
 * The timeline visualizes overlay positions and durations across video frames.
 */

"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useTimeline } from "../../contexts/timeline-context";
import { useTimelineDragAndDrop } from "../../hooks/use-timeline-drag-and-drop";
import { useTimelineEventHandlers } from "../../hooks/use-timeline-event-handlers";
import { useTimelineState } from "../../hooks/use-timeline-state";
import { Overlay, OverlayType } from "../../types";
import GhostMarker from "./ghost-marker";
import TimelineGrid from "./timeline-grid";
import TimelineMarker from "./timeline-marker";
import TimeMarkers from "./timeline-markers";
import { Grip, Loader2 } from "lucide-react";
import { useFFmpeg } from "../../hooks/use-ffmpeg";
import { useVideoCache } from "../../hooks/use-video-cache";
import {
  ROW_HEIGHT,
  SHOW_LOADING_PROJECT_ALERT,
  SNAPPING_CONFIG,
} from "../../constants";
import { useAssetLoading } from "../../contexts/asset-loading-context";
import { MobileNavBar } from "../mobile/mobile-nav-bar";
import { useTimelineSnapping } from "../../hooks/use-timeline-snapping";

interface TimelineProps {
  /** Array of overlay objects to be displayed on the timeline */
  overlays: Overlay[];
  /** Total duration of the video in frames */
  durationInFrames: number;
  /** ID of the currently selected overlay */
  selectedOverlayId: number | null;
  /** Callback to update the selected overlay */
  setSelectedOverlayId: (id: number | null) => void;
  /** Current playhead position in frames */
  currentFrame: number;
  /** Callback when an overlay is modified */
  onOverlayChange: (updatedOverlay: Overlay) => void;
  /** Callback to update the current frame position */
  setCurrentFrame: (frame: number) => void;
  /** Callback for timeline click events */
  onTimelineClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  /** Callback to delete an overlay */
  onOverlayDelete: (id: number) => void;
  /** Callback to duplicate an overlay */
  onOverlayDuplicate: (id: number) => void;
  /** Callback to split an overlay at a specific position */
  onSplitOverlay: (id: number, splitPosition: number) => void;
  /** Callback to set the overlays state */
  setOverlays: (overlays: Overlay[]) => void;
  onDetachAudio: (id: number) => void;
  isExtractingAudio?: boolean;
}

const Timeline: React.FC<TimelineProps> = ({
  overlays,
  durationInFrames,
  selectedOverlayId,
  setSelectedOverlayId,
  currentFrame,
  onOverlayChange,
  setCurrentFrame,
  onTimelineClick,
  onOverlayDelete,
  onOverlayDuplicate,
  onSplitOverlay,
  setOverlays,
  onDetachAudio,
  isExtractingAudio, // Add this

}) => {
  // State for tracking hover position during split operations
  const [lastKnownHoverInfo, setLastKnownHoverInfo] = useState<{
    itemId: number;
    position: number;
  } | null>(null);

  const { visibleRows, timelineRef, zoomScale, handleWheelZoom, addRow } = useTimeline();

  // State for context menu visibility
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);

  // Custom hooks for timeline functionality
  const {
    isDragging,
    draggedItem,
    ghostElement, // Raw ghost from hook
    ghostMarkerPosition,
    livePushOffsets,
    dragInfo,
    handleDragStart: timelineStateHandleDragStart,
    updateGhostElement,
    resetDragState,
    setGhostMarkerPosition,
  } = useTimelineState(durationInFrames, visibleRows, timelineRef);

  // FFmpeg hook for audio extraction
  const { extractAudio, isLoading: isFFmpegProcessing } = useFFmpeg();
  // Video cache hook
  const { downloadVideo, removeCachedVideo, shouldDeleteOnRemove } = useVideoCache();

  const { handleDragStart, handleDrag, handleDragEnd } = useTimelineDragAndDrop(
    {
      overlays,
      durationInFrames,
      onOverlayChange,
      updateGhostElement,
      resetDragState,
      timelineRef,
      dragInfo,
      maxRows: visibleRows,
    }
  );

  const { handleMouseMove, handleTouchMove, handleTimelineMouseLeave } =
    useTimelineEventHandlers({
      handleDrag,
      handleDragEnd,
      isDragging,
      timelineRef,
      setGhostMarkerPosition,
    });
  
  const handleDetachAudio = useCallback(
    async (id: number) => {
      const videoOverlay = overlays.find(overlay => overlay.id === id);
      if (!videoOverlay || videoOverlay.type !== OverlayType.VIDEO) return;
      
      console.log('Starting audio extraction for overlay:', videoOverlay.src);
      
      const targetRow = videoOverlay.row + 1;
      
      // Create a loading placeholder sound overlay immediately
      const loadingSoundOverlay = {
        id: Date.now(),
        type: OverlayType.SOUND,
        row: targetRow,
        from: videoOverlay.from,
        durationInFrames: videoOverlay.durationInFrames,
        src: '', // Empty src to indicate loading
        content: 'Extracting Audio...',
        startFromSound: 0,
        height: 100,
        left: 0,
        top: 0,
        width: 100,
        isDragging: false,
        rotation: 0,
        isLoading: true, // Add this flag
        styles: {
          opacity: 0.6, // Make it semi-transparent
          volume: 0,
        },
      };

      // Shift down all overlays that are at or below the target row
      const updatedOverlays = overlays.map(overlay => {
        if (overlay.row >= targetRow) {
          return { ...overlay, row: overlay.row + 1 };
        }
        return overlay;
      });

      // Update the original video overlay to mark audio as detached
      const updatedVideoOverlay = {
        ...videoOverlay,
        audioDetached: true,
      };

      // Update the video overlay in the overlays array
      const updatedOverlaysWithDetachedVideo = updatedOverlays.map(overlay => {
        if (overlay.id === videoOverlay.id) {
          return updatedVideoOverlay;
        }
        return overlay;
      });

      // Add the loading overlay immediately
      const overlaysWithLoader = [...updatedOverlaysWithDetachedVideo, loadingSoundOverlay as any];
      setOverlays(overlaysWithLoader);
      addRow();
      
      try {
        let videoFile: File;
        
        // Check if src is a blob URL or regular URL
        if (videoOverlay.src.startsWith('blob:')) {
          console.log('Processing blob URL...');
          const response = await fetch(videoOverlay.src);
          if (!response.ok) {
            throw new Error(`Failed to fetch blob: ${response.status}`);
          }
          const blob = await response.blob();
          console.log('Blob fetched successfully, size:', blob.size);
          videoFile = new File([blob], 'video.mp4', { type: 'video/mp4' });
        } else {
          console.log('Processing regular URL...');
          const response = await fetch(videoOverlay.src);
          if (!response.ok) {
            throw new Error(`Failed to fetch video: ${response.status}`);
          }
          videoFile = new File([await response.blob()], 'video.mp4', { type: 'video/mp4' });
        }
        
        console.log('Video file created, attempting extraction...');
        
        // Extract audio using FFmpeg
        const extractedAudioUrl = await extractAudio(videoFile);
        
        console.log('Audio extraction successful!');
        
        // Replace the loading overlay with the actual audio overlay
        const finalSoundOverlay = {
          ...loadingSoundOverlay,
          src: extractedAudioUrl,
          content: 'Extracted Audio',
          isLoading: false,
          styles: {
            opacity: 1,
            volume: 1,
          },
        };
        
        // Update overlays by replacing the loading one
        const finalOverlays = overlaysWithLoader.map(overlay => 
          overlay.id === loadingSoundOverlay.id ? finalSoundOverlay : overlay
        );
        
        setOverlays(finalOverlays);
        
      } catch (error) {
        console.error('Failed to extract audio:', error);
        
        // Fallback: replace loading overlay with random sound
        console.log('Using fallback random sound...');
        const randomSounds = ['Take Care Of Yourself Full Version.mp3', '138_upbeat_corporate.mp3'];
        const randomSound = randomSounds[Math.floor(Math.random() * randomSounds.length)];
        
        const fallbackSoundOverlay = {
          ...loadingSoundOverlay,
          src: `/sounds/${randomSound}`,
          content: randomSound,
          isLoading: false,
          styles: {
            opacity: 1,
            volume: 1,
          },
        };
        
        // Update overlays by replacing the loading one
        const finalOverlays = overlaysWithLoader.map(overlay => 
          overlay.id === loadingSoundOverlay.id ? fallbackSoundOverlay : overlay
        );
        
        setOverlays(finalOverlays);
      }
    },
    [overlays, setOverlays, addRow, extractAudio]
  );

  const handleVideoAddedToTimeline = useCallback(async (videoOverlay: Overlay) => {
    if (videoOverlay.type === OverlayType.VIDEO && videoOverlay.src) {
      // Download video when added to timeline
      console.log('Video added to timeline, starting download:', videoOverlay.src);
      await downloadVideo(videoOverlay.src);
    }
  }, [downloadVideo]);

  const handleVideoRemovedFromTimeline = useCallback(async (videoOverlay: Overlay) => {
    if (videoOverlay.type === OverlayType.VIDEO && videoOverlay.src) {
      // Check if we should delete this video from cache
      const shouldDelete = await shouldDeleteOnRemove(videoOverlay.src);
      if (shouldDelete) {
        console.log('Removing video from cache after timeline removal:', videoOverlay.src);
        await removeCachedVideo(videoOverlay.src);
      }
    }
  }, [shouldDeleteOnRemove, removeCachedVideo]);
  
  
  const { alignmentLines, snappedGhostElement } = useTimelineSnapping({
    isDragging,
    ghostElement,
    draggedItem,
    dragInfo,
    overlays,
    durationInFrames,
    visibleRows,
    snapThreshold: SNAPPING_CONFIG.thresholdFrames,
  });

  // Event Handlers
  const combinedHandleDragStart = useCallback(
    (
      overlay: Overlay,
      clientX: number,
      clientY: number,
      action: "move" | "resize-start" | "resize-end"
    ) => {
      timelineStateHandleDragStart(overlay, clientX, clientY, action);
      handleDragStart(overlay, clientX, clientY, action);
    },
    [timelineStateHandleDragStart, handleDragStart]
  );

  const handleDeleteItem = useCallback(
    (id: number) => onOverlayDelete(id),
    [onOverlayDelete]
  );

  const handleDuplicateItem = useCallback(
    (id: number) => onOverlayDuplicate(id),
    [onOverlayDuplicate]
  );

  const handleItemHover = useCallback(
    (itemId: number, hoverPosition: number) => {
      setLastKnownHoverInfo({
        itemId,
        position: Math.round(hoverPosition),
      });
    },
    []
  );

  const handleSplitItem = useCallback(
    (id: number) => {
      if (lastKnownHoverInfo?.itemId === id) {
        onSplitOverlay(id, lastKnownHoverInfo.position);
      }
    },
    [lastKnownHoverInfo, onSplitOverlay]
  );

  const handleContextMenuChange = useCallback(
    (isOpen: boolean) => setIsContextMenuOpen(isOpen),
    []
  );

  const handleRemoveGap = useCallback(
    (rowIndex: number, gapStart: number, gapEnd: number) => {
      const overlaysToShift = overlays
        .filter((overlay) => overlay.row === rowIndex && overlay.from >= gapEnd)
        .sort((a, b) => a.from - b.from);

      if (overlaysToShift.length === 0) return;

      const firstOverlayAfterGap = overlaysToShift[0];
      const gapSize = firstOverlayAfterGap.from - gapStart;

      if (gapSize <= 0) return;

      const updates = overlaysToShift.map((overlay) => ({
        ...overlay,
        from: overlay.from - gapSize,
      }));

      updates.forEach((update) => onOverlayChange(update));
    },
    [overlays, onOverlayChange]
  );

  const handleReorderRows = (fromIndex: number, toIndex: number) => {
    const updatedOverlays = overlays.map((overlay) => {
      if (overlay.row === fromIndex) {
        return { ...overlay, row: toIndex };
      }
      if (overlay.row === toIndex) {
        return { ...overlay, row: fromIndex };
      }
      return overlay;
    });

    // Update your overlays state here
    setOverlays(updatedOverlays);
  };

  // Add state for row dragging
  const [draggedRowIndex, setDraggedRowIndex] = useState<number | null>(null);
  const [dragOverRowIndex, setDragOverRowIndex] = useState<number | null>(null);

  // Add visual feedback state
  const [isDraggingRow, setIsDraggingRow] = useState(false);

  const handleRowDragStart = (e: React.DragEvent, rowIndex: number) => {
    setDraggedRowIndex(rowIndex);
    setIsDraggingRow(true);
    // Set a transparent drag image to hide the default ghost
  };

  const handleRowDragOver = (e: React.DragEvent, rowIndex: number) => {
    e.preventDefault();
    if (draggedRowIndex === null) return;
    setDragOverRowIndex(rowIndex);
  };

  const handleRowDrop = (targetIndex: number) => {
    if (draggedRowIndex === null) return;
    handleReorderRows(draggedRowIndex, targetIndex);
    setDraggedRowIndex(null);
    setDragOverRowIndex(null);
    setIsDraggingRow(false);
  };

  const handleRowDragEnd = () => {
    setDraggedRowIndex(null);
    setDragOverRowIndex(null);
    setIsDraggingRow(false);
  };

  useEffect(() => {
    const element = timelineRef.current;
    if (!element) return;

    element.addEventListener("wheel", handleWheelZoom, { passive: false });
    return () => element.removeEventListener("wheel", handleWheelZoom);
  }, [handleWheelZoom]);

  // Replace the loading state management with context
  const {
    isLoadingAssets,
    isInitialLoad,
    handleAssetLoadingChange,
    setInitialLoadComplete,
  } = useAssetLoading();

  // Effect to handle initial load completion
  const [shouldShowInitialLoader, setShouldShowInitialLoader] = useState(false);

  useEffect(() => {
    const hasVideoOverlay = overlays.some(
      (overlay) => overlay.type === OverlayType.VIDEO
    );

    if (!shouldShowInitialLoader && hasVideoOverlay && isInitialLoad) {
      setShouldShowInitialLoader(true);
    }

    if (overlays.length > 0 && !isLoadingAssets) {
      setInitialLoadComplete();
    }
  }, [
    overlays,
    isInitialLoad,
    isLoadingAssets,
    shouldShowInitialLoader,
    setInitialLoadComplete,
  ]);

  // Render
  return (
    <div className="flex flex-col">
      <div className="flex ">
        {/* Row Drag Handles Column */}
        <div className="hidden md:block w-7 flex-shrink-0 border-l border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
          {/* Match TimeMarkers height */}
          <div className="h-[1.3rem] bg-gray-100 dark:bg-gray-800/50" />

          {/* Match the grid layout exactly */}
          <div
            className="flex flex-col gap-2 pt-2 pb-2"
            style={{ height: `${visibleRows * ROW_HEIGHT}px` }}
          >
            {Array.from({ length: visibleRows }).map((_, rowIndex) => (
              <div
                key={`drag-${rowIndex}`}
                className={`flex-1 flex items-center justify-center transition-all duration-200 
                  ${
                    dragOverRowIndex === rowIndex
                      ? "bg-blue-50 dark:bg-blue-900/20 border-2 border-dashed border-blue-300 dark:border-blue-500"
                      : ""
                  }
                  ${
                    draggedRowIndex === rowIndex
                      ? "opacity-50 bg-gray-100/50 dark:bg-gray-800/50"
                      : ""
                  }
                  ${
                    isDraggingRow
                      ? "cursor-grabbing"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800/30"
                  }`}
                onDragOver={(e) => handleRowDragOver(e, rowIndex)}
                onDrop={() => handleRowDrop(rowIndex)}
              >
                <div
                  className={`w-5 h-5 flex items-center justify-center rounded-md 
                    transition-all duration-150 
                    hover:bg-gray-200 dark:hover:bg-gray-700
                    active:scale-95
                    ${isDraggingRow ? "cursor-grabbing" : "cursor-grab"} 
                    active:cursor-grabbing
                    group`}
                  draggable
                  onDragStart={(e) => handleRowDragStart(e, rowIndex)}
                  onDragEnd={handleRowDragEnd}
                >
                  <Grip
                    className="w-3 h-3 text-gray-400 dark:text-gray-500 
                    group-hover:text-gray-600 dark:group-hover:text-gray-300
                    transition-colors duration-150"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline Content */}
        <div
          className="relative overflow-x-auto scrollbar-hide flex-1 md:pl-0 pl-2"
          style={{
            scrollbarWidth: "none" /* Firefox */,
            msOverflowStyle: "none" /* IE and Edge */,
          }}
        >
          <div
            ref={timelineRef}
            className="pr-2 pb-2 relative bg-white dark:bg-gray-900"
            style={{
              width: `${100 * zoomScale}%`,
              minWidth: "100%",
              willChange: "width, transform",
              transform: `translateZ(0)`,
            }}
            onMouseMove={handleMouseMove}
            onTouchMove={handleTouchMove}
            onMouseUp={handleDragEnd}
            onTouchEnd={handleDragEnd}
            onMouseLeave={handleTimelineMouseLeave}
            onClick={onTimelineClick}
          >
            <div className="relative h-full">
              {/* Timeline header with frame markers */}
              <div className="h-[1.3rem]">
                <TimeMarkers
                  durationInFrames={durationInFrames}
                  handleTimelineClick={setCurrentFrame}
                  zoomScale={zoomScale}
                />
              </div>

              {/* Current frame indicator */}
              <TimelineMarker
                currentFrame={currentFrame}
                totalDuration={durationInFrames}
              />

              {/* Drag operation visual feedback */}
              <GhostMarker
                position={ghostMarkerPosition}
                isDragging={isDragging}
                isContextMenuOpen={isContextMenuOpen}
              />

              {/* Main timeline grid with overlays */}
              <TimelineGrid
                overlays={overlays}
                currentFrame={currentFrame}
                isDragging={isDragging}
                draggedItem={draggedItem}
                selectedOverlayId={selectedOverlayId}
                setSelectedOverlayId={setSelectedOverlayId}
                handleDragStart={combinedHandleDragStart}
                totalDuration={durationInFrames}
                ghostElement={snappedGhostElement}
                livePushOffsets={livePushOffsets}
                onDeleteItem={handleDeleteItem}
                onDuplicateItem={handleDuplicateItem}
                onSplitItem={handleSplitItem}
                onHover={handleItemHover}
                onContextMenuChange={handleContextMenuChange}
                onRemoveGap={handleRemoveGap}
                zoomScale={zoomScale}
                draggedRowIndex={draggedRowIndex}
                dragOverRowIndex={dragOverRowIndex}
                onAssetLoadingChange={handleAssetLoadingChange}
                alignmentLines={alignmentLines}
                onDetachAudio={handleDetachAudio}
                isExtractingAudio={isExtractingAudio} // Add this

              />

              {/* Loading Indicator - Only shows during initial project load */}
              {SHOW_LOADING_PROJECT_ALERT &&
                isLoadingAssets &&
                isInitialLoad &&
                shouldShowInitialLoader && (
                  <div
                    className="absolute inset-0 bg-white/60 dark:bg-gray-900/60 backdrop-blur-[1px] flex items-center justify-center z-50"
                    style={{ willChange: "opacity" }}
                  >
                    <div className="flex items-center gap-2 px-3 py-2 bg-white/90 dark:bg-gray-800/90 rounded-lg shadow-sm ring-1 ring-black/5 dark:ring-white/10">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-600 dark:text-gray-300" />
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                        Loading project...
                      </span>
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>

      <MobileNavBar />
    </div>
  );
};

export default Timeline;
