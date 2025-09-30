/**
 * Timeline Component
 *
 * A complex timeline interface that allows users to manage video overlays through
 * drag-and-drop interactions, splitting, duplicating, and deletion operations.
 * The timeline visualizes overlay positions and durations across video frames.
 */

"use client";

import React, { useState, useCallback, useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
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
import { useEditorContext } from "../../contexts/editor-context";
import { MobileNavBar } from "../mobile/mobile-nav-bar";
import { useTimelineSnapping } from "../../hooks/use-timeline-snapping";
import { useTimelineDurationWarning } from "../../hooks/use-timeline-duration-warning";
import { TIMELINE_DURATION_LIMIT_FRAMES, FPS } from "../../constants";

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
  onMuteVideo: (id: number) => void;
  onMuteAudio: (id: number) => void;
  isExtractingAudio?: boolean;

  selectedRows?: Set<number>;
  setSelectedRows?: Dispatch<SetStateAction<Set<number>>>;
  
}

const TIMELINE_GAP = 16; // Gap between drag handles and timeline content (in px)

// Helper functions for timeline duration management
const calculateActualDuration = (overlays: Overlay[]): number => {
  if (overlays.length === 0) return 0;
  return Math.max(...overlays.map(overlay => overlay.from + overlay.durationInFrames));
};

const calculateVisualDuration = (overlays: Overlay[]): number => {
  const actualDuration = calculateActualDuration(overlays);
  return actualDuration + (3 * FPS); // Add 3 seconds of visual space
};


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
  onMuteVideo,
  onMuteAudio,
  isExtractingAudio,
  selectedRows: selectedRowsProp,
  setSelectedRows: setSelectedRowsProp,
}) => {

  // Calculate different duration types
  const actualContentDuration = calculateActualDuration(overlays);
  const visualTimelineDuration = calculateVisualDuration(overlays);
  
  // Use visual duration for timeline display, but limit playback to actual content
  const effectiveCurrentFrame = Math.min(currentFrame, actualContentDuration);

  const { playerRef } = useEditorContext();
  // State for tracking hover position during split operations
  const [lastKnownHoverInfo, setLastKnownHoverInfo] = useState<{
    itemId: number;
    position: number;
  } | null>(null);

  const { visibleRows, timelineRef, zoomScale, handleWheelZoom, addRow, setVisibleRows } = useTimeline();

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
  } = useTimelineState(visualTimelineDuration, visibleRows, timelineRef);

  // FFmpeg hook for audio extraction
  const { extractAudio, isLoading: isFFmpegProcessing } = useFFmpeg();
  // Video cache hook
  const { downloadVideo, removeCachedVideo, shouldDeleteOnRemove } = useVideoCache();

  const { handleDragStart: hookHandleDragStart, handleDrag, handleDragEnd } = useTimelineDragAndDrop(
    {
      overlays,
      durationInFrames: visualTimelineDuration, // Use visual duration for UI consistency
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
            
      const targetRow = videoOverlay.row + 1;
      
      // Create a loading placeholder sound overlay immediately with a temporary audio file
      const loadingSoundOverlay = {
        id: Date.now(),
        type: OverlayType.SOUND,
        row: targetRow,
        from: videoOverlay.from,
        durationInFrames: videoOverlay.durationInFrames,
        src: '/sounds/Take Care Of Yourself Full Version.mp3', // Use a valid audio file as placeholder
        content: 'Extracting Audio...',
        startFromSound: 0,
        height: 100,
        left: 0,
        top: 0,
        width: 100,
        isDragging: false,
        rotation: 0,
        isLoading: true, // Keep this flag
        styles: {
          opacity: 0.6, // Make it semi-transparent
          volume: 0, // Muted during loading
        },
      };

      // Shift down all overlays that are at or below the target row
      const updatedOverlays = overlays.map(overlay => {
        if (overlay.row >= targetRow) {
          return { ...overlay, row: overlay.row + 1 };
        }
        return overlay;
      });

      // Update the original video overlay to mark audio as detached and mute it
      const updatedVideoOverlay = {
        ...videoOverlay,
        audioDetached: true,
        styles: {
          ...videoOverlay.styles,
          volume: 0, // Actually mute the video
        },
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
      
      // Request timeline to adjust rows to accommodate all overlays
      window.dispatchEvent(new CustomEvent('adjustTimelineRows', {
        detail: { requiredRows: Math.max(...overlaysWithLoader.map(o => o.row)) + 1 }
      }));
      
      try {
        let videoFile: File;
        
        // Check if src is a blob URL or regular URL
        if (videoOverlay.src.startsWith('blob:')) {
          const response = await fetch(videoOverlay.src);
          if (!response.ok) {
            throw new Error(`Failed to fetch blob: ${response.status}`);
          }
          const blob = await response.blob();
          videoFile = new File([blob], 'video.mp4', { type: 'video/mp4' });
        } else {
          const response = await fetch(videoOverlay.src);
          if (!response.ok) {
            throw new Error(`Failed to fetch video: ${response.status}`);
          }
          videoFile = new File([await response.blob()], 'video.mp4', { type: 'video/mp4' });
        }
        // Extract audio using FFmpeg
        const extractedAudioUrl = await extractAudio(videoFile);
                
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

  const handleMuteVideo = useCallback(
    (id: number) => {
      const videoOverlay = overlays.find(overlay => overlay.id === id);
      if (!videoOverlay || videoOverlay.type !== OverlayType.VIDEO) return;
      
      // Toggle mute state - if currently muted (volume 0), unmute to 1, otherwise mute to 0
      const newVolume = (videoOverlay.styles?.volume ?? 1) === 0 ? 1 : 0;
      
      const updatedOverlay = {
        ...videoOverlay,
        styles: {
          ...videoOverlay.styles,
          volume: newVolume,
        },
      };
      
      onOverlayChange(updatedOverlay);
    },
    [overlays, onOverlayChange]
  );

  const handleMuteAudio = useCallback(
    (id: number) => {
      const audioOverlay = overlays.find(overlay => overlay.id === id);
      if (!audioOverlay || audioOverlay.type !== OverlayType.SOUND) return;
      
      // Toggle mute state - if currently muted (volume 0), unmute to 1, otherwise mute to 0
      const newVolume = (audioOverlay.styles?.volume ?? 1) === 0 ? 1 : 0;
      
      const updatedOverlay = {
        ...audioOverlay,
        styles: {
          ...audioOverlay.styles,
          volume: newVolume,
        },
      };
      
      onOverlayChange(updatedOverlay);
    },
    [overlays, onOverlayChange]
  );

  const handleVideoAddedToTimeline = useCallback(async (videoOverlay: Overlay) => {
    if (videoOverlay.type === OverlayType.VIDEO && videoOverlay.src) {
      // Download video when added to timeline
      await downloadVideo(videoOverlay.src);
    }
  }, [downloadVideo]);

  const handleVideoRemovedFromTimeline = useCallback(async (videoOverlay: Overlay) => {
    if (videoOverlay.type === OverlayType.VIDEO && videoOverlay.src) {
      // Check if we should delete this video from cache
      const shouldDelete = await shouldDeleteOnRemove(videoOverlay.src);
      if (shouldDelete) {
        await removeCachedVideo(videoOverlay.src);
      }
    }
  }, [shouldDeleteOnRemove, removeCachedVideo]);

  // Duration warning hook
  const { showWarning: showDurationWarning, isOverLimit, currentDuration, triggerWarningIfNeeded } = useTimelineDurationWarning(overlays);

  // Watch for overlay changes and trigger warning
  useEffect(() => {
    triggerWarningIfNeeded();
  }, [overlays, triggerWarningIfNeeded]);
  
  
  const { alignmentLines, snappedGhostElement } = useTimelineSnapping({
    isDragging,
    ghostElement,
    draggedItem,
    dragInfo,
    overlays,
    durationInFrames: visualTimelineDuration,
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
      hookHandleDragStart(overlay, clientX, clientY, action);
    },
    [timelineStateHandleDragStart, hookHandleDragStart]
  );

  // Enhanced drag end handler that checks duration limit
  const combinedHandleDragEnd = useCallback(
    () => {
      handleDragEnd();
      // Trigger warning check after drag operation completes
      setTimeout(() => {
        triggerWarningIfNeeded();
      }, 100);
    },
    [handleDragEnd, triggerWarningIfNeeded]
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

  // Use prop state or fallback to local state
  const [localSelectedRows, setLocalSelectedRows] = useState<Set<number>>(new Set());
  const selectedRows = selectedRowsProp || localSelectedRows;
  const setSelectedRows = setSelectedRowsProp || setLocalSelectedRows;

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

  // Handle row checkbox selection
  const handleRowCheckboxChange = (rowIndex: number, checked: boolean) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(rowIndex);
      } else {
        newSet.delete(rowIndex);
      }
      return newSet;
    });
  };

  // Handle delete row
  const handleDeleteRow = useCallback(
    (rowIndex: number) => {
      if (visibleRows <= 1) return; // Prevent deleting if only 1 row
      
      // Delete all overlays in this row
      const overlaysToDelete = overlays.filter(overlay => overlay.row === rowIndex);
      overlaysToDelete.forEach(overlay => onOverlayDelete(overlay.id));
      
      // Shift all rows below up by one
      const updatedOverlays = overlays
        .filter(overlay => overlay.row !== rowIndex)
        .map(overlay => {
          if (overlay.row > rowIndex) {
            return { ...overlay, row: overlay.row - 1 };
          }
          return overlay;
        });
      
      setOverlays(updatedOverlays);
      
      // Decrease visible rows count
      setVisibleRows(visibleRows - 1);
    },
    [visibleRows, overlays, onOverlayDelete, setOverlays, setVisibleRows]
  );

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

  // Handle add/remove row events and shift overlays accordingly
useEffect(() => {
  const handleAddRow = () => {
    console.log('Handling add row event, current overlays:', overlays.length);
    // Shift all overlays down by one row to create empty row 0
    const updatedOverlays = overlays.map(overlay => ({
      ...overlay,
      row: overlay.row + 1,
    }));
    console.log('Updated overlays after shift:', updatedOverlays.map(o => `id:${o.id} row:${o.row}`));
    setOverlays(updatedOverlays);
  };

  const handleRemoveRow = () => {
    console.log('Handling remove row event');
    // Shift all overlays up by one row after removing row 0
    const updatedOverlays = overlays.map(overlay => ({
      ...overlay,
      row: Math.max(0, overlay.row - 1),
    }));
    setOverlays(updatedOverlays);
  };

  window.addEventListener('addRowRequested', handleAddRow);
  window.addEventListener('removeRowRequested', handleRemoveRow);

  return () => {
    window.removeEventListener('addRowRequested', handleAddRow);
    window.removeEventListener('removeRowRequested', handleRemoveRow);
  };
}, [overlays, setOverlays]);

  // Render
  return (
    <div className="flex flex-col">
      <div className="flex ">
        {/* Row Drag Handles Column */}
        <div className="hidden md:block w-14 flex-shrink-0 border-l border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
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
                className={`flex-1 flex items-center justify-between px-1 gap-1 transition-all duration-200 
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
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={selectedRows.has(rowIndex)}
                  onChange={(e) => handleRowCheckboxChange(rowIndex, e.target.checked)}
                  className="w-3 h-3 rounded border-gray-300 dark:border-gray-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                />

                {/* Drag Handle */}
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

                {/* Delete Button */}
                <button
                  onClick={() => handleDeleteRow(rowIndex)}
                  disabled={visibleRows <= 1}
                  className="w-5 h-5 flex items-center justify-center rounded-md 
                    hover:bg-red-100 dark:hover:bg-red-900/30 
                    disabled:opacity-30 disabled:cursor-not-allowed
                    transition-all duration-150 group"
                  title={visibleRows <= 1 ? "Cannot delete last row" : "Delete row"}
                >
                  <svg 
                    className="w-3 h-3 text-gray-400 dark:text-gray-500 
                      group-hover:text-red-600 dark:group-hover:text-red-400
                      transition-colors duration-150"
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Gap between drag handles and timeline content */}
        <div 
          className="hidden md:block flex-shrink-0 bg-white dark:bg-gray-900"
          style={{ width: `${TIMELINE_GAP}px` }}
        >
          {/* Match TimeMarkers height */}
          <div className="h-[1.3rem]" />
          {/* Match timeline rows height */}
          <div style={{ height: `${visibleRows * ROW_HEIGHT}px` }} />
        </div>

        {/* Timeline Content */}
        <div
          className="relative overflow-x-auto flex-1 md:pl-0 pl-2"
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
            onMouseUp={combinedHandleDragEnd}
            onTouchEnd={combinedHandleDragEnd}
            onMouseLeave={handleTimelineMouseLeave}
            onClick={(e) => {
              // Check if the click came from a context menu action that shouldn't move timeline
              const target = e.target as HTMLElement;
              if (target.closest('[data-no-timeline-seek="true"]')) {
                return; // Don't handle timeline click for these actions
              }
              
              // Calculate click position and convert to frame, limiting to actual content
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const clickPercentage = clickX / rect.width;
              const targetFrame = Math.round(clickPercentage * visualTimelineDuration);
              const limitedFrame = Math.min(targetFrame, actualContentDuration);
              
              setCurrentFrame(limitedFrame);
              if (playerRef.current) {
                playerRef.current.seekTo(limitedFrame);
              }
            }}          >
            <div className="relative h-full">
              {/* Timeline header with frame markers */}
              <div className="h-[1.3rem]">
                <TimeMarkers
                  durationInFrames={visualTimelineDuration}
                  handleTimelineClick={(frame) => {
                    // Limit seeking to actual content duration
                    const limitedFrame = Math.min(frame, actualContentDuration);
                    setCurrentFrame(limitedFrame);
                  }}
                  zoomScale={zoomScale}
                />
              </div>

              {/* Current frame indicator */}
              <TimelineMarker
                currentFrame={effectiveCurrentFrame}
                totalDuration={visualTimelineDuration}
                onSeek={(frame) => {
                  // Limit seeking to actual content duration
                  const limitedFrame = Math.min(frame, actualContentDuration);
                  setCurrentFrame(limitedFrame);
                  if (playerRef.current) {
                    playerRef.current.seekTo(limitedFrame);
                  }
                }}
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
                currentFrame={effectiveCurrentFrame}
                isDragging={isDragging}
                draggedItem={draggedItem}
                selectedOverlayId={selectedOverlayId}
                setSelectedOverlayId={setSelectedOverlayId}
                handleDragStart={combinedHandleDragStart}
                totalDuration={visualTimelineDuration}
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
                onMuteVideo={handleMuteVideo} // Add this line
                onMuteAudio={handleMuteAudio} // Add this line

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

                {/* Duration Limit Warning Overlay */}
                {showDurationWarning && (
                  <div
                    className="absolute inset-0 bg-red-50/80 dark:bg-red-900/80 backdrop-blur-[1px] flex items-center justify-center z-50"
                    style={{ willChange: "opacity" }}
                  >
                    <div className="flex flex-col items-center gap-3 px-6 py-4 bg-white/95 dark:bg-gray-800/95 rounded-lg shadow-lg ring-1 ring-red-200 dark:ring-red-700 max-w-md mx-4">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">!</span>
                        </div>
                        <span className="text-sm font-semibold text-red-700 dark:text-red-300">
                          Content exceeds 5-minute render limit
                        </span>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-700 dark:text-gray-300 mb-1">
                          Your timeline is <strong>{Math.ceil((currentDuration - TIMELINE_DURATION_LIMIT_FRAMES) / FPS)}s</strong> over the 5-minute limit.
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Please trim, split, or remove content to fit within 5 minutes for optimal rendering.
                        </p>
                      </div>
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
