import React from 'react';
import Timeline from '../../advanced-timeline/timeline';
import { TimelineTrack } from '../../advanced-timeline/types';

import { useEditorContext } from '../../../contexts/editor-context';


import { useTimelineTransforms } from './hooks/use-timeline-transforms';
import { useTimelineHandlers } from './hooks/use-timeline-handlers';
import { Overlay, TextOverlay, CaptionOverlay, OverlayType } from '../../../types';
import { FPS } from '../../../constants';
import { useSidebar } from '../../../contexts/sidebar-context';

interface TimelineSectionProps {
  className?: string;
}

/**
 * TimelineSection Component
 * 
 * Encapsulates all timeline-related logic including:
 * - Data transformation between overlays and timeline tracks
 * - Event handlers for timeline interactions
 * - State management for timeline synchronization
 */
export const TimelineSection: React.FC<TimelineSectionProps> = () => {
  /** State for timeline tracks derived from overlays */
  const [timelineTracks, setTimelineTracks] = React.useState<TimelineTrack[]>([]);

  
  /** Get editor context values */
  const {
    overlays,
    currentFrame,
    isPlaying,
    playerRef,
    togglePlayPause,
    durationInFrames,
    setSelectedOverlayId,
    selectedOverlayIds,
    setSelectedOverlayIds,
    deleteOverlay,
    duplicateOverlay,
    splitOverlay,
    handleOverlayChange,
    setOverlays,
    // Add playback controls
    playbackRate,
    setPlaybackRate,
    // Add aspect ratio controls
    aspectRatio,
    setAspectRatio,
  } = useEditorContext();

  /** Ref to track last processed overlays to prevent unnecessary re-renders */
  const lastProcessedOverlaysRef = React.useRef<Overlay[]>([]);

  // Handle add/remove row events from timeline-context
  React.useEffect(() => {
    const handleAddRow = () => {
      console.log('Timeline section: Handling add row event, current overlays:', overlays.length);
      // Shift all overlays down by one row to create empty row 0
      const updatedOverlays = overlays.map(overlay => ({
        ...overlay,
        row: overlay.row + 1,
      }));
      console.log('Timeline section: Updated overlays after shift:', updatedOverlays.map(o => `id:${o.id} row:${o.row}`));
      setOverlays(updatedOverlays);
    };

    const handleRemoveRow = () => {
      console.log('Timeline section: Handling remove row event');
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

  // Get sidebar context for setting active panel
  const { setActivePanel, setIsOpen } = useSidebar();

  // Get transformation functions
  const { transformOverlaysToTracks } = useTimelineTransforms();

  // Get timeline handlers
  const {
    isUpdatingFromTimelineRef,
    handleTracksChange,
    handleTimelineFrameChange,
    handleItemSelect,
    handleSelectedItemsChange,
    handleDeleteItems,
    handleDuplicateItems,
    handleSplitItems,
    handleItemMove,
    handleItemResize,
  } = useTimelineHandlers({
    overlays,
    playerRef,
    setSelectedOverlayId,
    setSelectedOverlayIds,
    deleteOverlay,
    duplicateOverlay,
    splitOverlay,
    handleOverlayChange,
    setOverlays,
    setActivePanel,
    setIsOpen,
  });

  // // Handle add/remove row events
  // React.useEffect(() => {
  //   const handleAddRow = () => {
  //     console.log('New timeline: Handling add row event, current overlays:', overlays.length);
  //     // Shift all overlays down by one row to create empty row 0
  //     const updatedOverlays = overlays.map(overlay => ({
  //       ...overlay,
  //       row: overlay.row + 1,
  //     }));
  //     console.log('New timeline: Updated overlays after shift:', updatedOverlays.map(o => `id:${o.id} row:${o.row}`));
  //     setOverlays(updatedOverlays);
  //   };

  //   const handleRemoveRow = () => {
  //     console.log('New timeline: Handling remove row event');
  //     // Shift all overlays up by one row after removing row 0
  //     const updatedOverlays = overlays.map(overlay => ({
  //       ...overlay,
  //       row: Math.max(0, overlay.row - 1),
  //     }));
  //     setOverlays(updatedOverlays);
  //   };

  //   window.addEventListener('addRowRequested', handleAddRow);
  //   window.addEventListener('removeRowRequested', handleRemoveRow);

  //   return () => {
  //     window.removeEventListener('addRowRequested', handleAddRow);
  //     window.removeEventListener('removeRowRequested', handleRemoveRow);
  //   };
  // }, [overlays, setOverlays]);

  // Update timeline tracks when overlays change (but not during timeline updates)
  React.useEffect(() => {
    if (!isUpdatingFromTimelineRef.current) {
      // Only update if overlays have actually changed (deep comparison of key properties)
      const hasChanged = overlays.length !== lastProcessedOverlaysRef.current.length ||
        overlays.some((overlay, index) => {
          const lastOverlay = lastProcessedOverlaysRef.current[index];
          if (!lastOverlay) return true;
          
          // Check basic properties
          if (overlay.id !== lastOverlay.id ||
              overlay.from !== lastOverlay.from ||
              overlay.durationInFrames !== lastOverlay.durationInFrames ||
              overlay.row !== lastOverlay.row ||
              overlay.type !== lastOverlay.type ||
              overlay.width !== lastOverlay.width ||
              overlay.height !== lastOverlay.height ||
              overlay.left !== lastOverlay.left ||
              overlay.top !== lastOverlay.top ||
              overlay.isDragging !== lastOverlay.isDragging) {
            return true;
          }
          
          // Check text overlay specific properties
          if (overlay.type === OverlayType.TEXT) {
            const textOverlay = overlay as TextOverlay;
            const lastTextOverlay = lastOverlay as TextOverlay;
            if (textOverlay.content !== lastTextOverlay.content ||
                JSON.stringify(textOverlay.styles || {}) !== JSON.stringify(lastTextOverlay.styles || {})) {
              return true;
            }
          }
          
          // Check caption overlay specific properties
          if (overlay.type === OverlayType.CAPTION) {
            const captionOverlay = overlay as CaptionOverlay;
            const lastCaptionOverlay = lastOverlay as CaptionOverlay;
            if (JSON.stringify(captionOverlay.styles || {}) !== JSON.stringify(lastCaptionOverlay.styles || {}) ||
                JSON.stringify(captionOverlay.captions || []) !== JSON.stringify(lastCaptionOverlay.captions || [])) {
              return true;
            }
          }
          
          return false;
        });
      
      if (hasChanged) {
        lastProcessedOverlaysRef.current = [...overlays];
        setTimelineTracks(transformOverlaysToTracks(overlays));
      }
    }
  }, [overlays, transformOverlaysToTracks]);

  // Playback control handlers
  const handlePlay = React.useCallback(() => {
    if (!isPlaying) {
      togglePlayPause();
    }
  }, [isPlaying, togglePlayPause]);

  const handlePause = React.useCallback(() => {
    if (isPlaying) {
      togglePlayPause();
    }
  }, [isPlaying, togglePlayPause]);

  return (
      <Timeline
        tracks={timelineTracks}
        totalDuration={durationInFrames / FPS} // Convert frames to seconds
        currentFrame={currentFrame}
        fps={FPS}
        onFrameChange={handleTimelineFrameChange}
        onItemMove={handleItemMove}
        onItemResize={handleItemResize}
        onItemSelect={handleItemSelect}
        onSelectedItemsChange={handleSelectedItemsChange}
        onDeleteItems={handleDeleteItems}
        onDuplicateItems={handleDuplicateItems}
        onSplitItems={handleSplitItems}
        selectedItemIds={selectedOverlayIds.filter((id: any): id is number => typeof id === 'number' && !isNaN(id)).map((id: number) => id.toString())}
        onTracksChange={handleTracksChange}
        showZoomControls={true}
        showTimelineGuidelines={true}
        enableTrackDrag={true}
        enableMagneticTrack={true}
        enableTrackDelete={true}
        showPlaybackControls={true}
        isPlaying={isPlaying}
        hideItemsOnDrag={true}
        onPlay={handlePlay}
        onPause={handlePause}
        playbackRate={playbackRate}
        setPlaybackRate={setPlaybackRate}
        showUndoRedoControls={true}
        aspectRatio={aspectRatio}
        onAspectRatioChange={setAspectRatio}
        showAspectRatioControls={true}
        overlays={overlays}
      />
  );
}; 