import React from 'react';
import { Overlay, OverlayType } from '../../../../types';
import { TimelineTrack } from '../../../advanced-timeline/types';
import { FPS } from '../../../../../../constants';
import { useTimelineTransforms } from './use-timeline-transforms';

interface UseTimelineHandlersProps {
  overlays: Overlay[];
  playerRef: React.RefObject<any>;
  setSelectedOverlayId: (id: number | null) => void;
  setSelectedOverlayIds: (ids: number[]) => void;
  deleteOverlay: (id: number) => void;
  duplicateOverlay: (id: number) => void;
  splitOverlay: (id: number, splitFrame: number) => void;
  handleOverlayChange: (overlay: Overlay) => void;
  setOverlays: (overlays: Overlay[]) => void;
  setActivePanel: (panel: OverlayType) => void;
  setIsOpen: (open: boolean) => void;
}

/**
 * Hook to handle timeline event handlers and state management
 */
export const useTimelineHandlers = ({
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
}: UseTimelineHandlersProps) => {
  const { transformTracksToOverlays } = useTimelineTransforms();
  
  /** Ref to prevent circular updates between overlays and tracks */
  const isUpdatingFromTimelineRef = React.useRef(false);

  // Handler for when timeline tracks change
  const handleTracksChange = React.useCallback((newTracks: TimelineTrack[]) => {
    // Set flag to prevent circular updates
    isUpdatingFromTimelineRef.current = true;
    
    const newOverlays = transformTracksToOverlays(newTracks);
    setOverlays(newOverlays);
    
    // Reset flag after a longer delay to prevent race conditions with debounced text panel updates
    setTimeout(() => {
      isUpdatingFromTimelineRef.current = false;
    }, 500); // Increased from 0 to 500ms to account for debounced updates
  }, [setOverlays, transformTracksToOverlays]);

  // Handler for frame changes from timeline
  const handleTimelineFrameChange = React.useCallback((frame: number) => {
    if (playerRef.current) {
      playerRef.current.seekTo(frame);
    }
  }, [playerRef]);

  // Helper function to set sidebar panel based on overlay type
  const setSidebarForOverlay = React.useCallback((overlayId: number) => {
    const overlay = overlays.find(o => o.id === overlayId);
    if (overlay) {
      // Set the appropriate sidebar panel based on overlay type
      switch (overlay.type) {
        case OverlayType.TEXT:
          setActivePanel(OverlayType.TEXT);
          break;
        case OverlayType.VIDEO:
          setActivePanel(OverlayType.VIDEO);
          break;
        case OverlayType.SOUND:
          setActivePanel(OverlayType.SOUND);
          break;
        case OverlayType.STICKER:
          setActivePanel(OverlayType.STICKER);
          break;
        case OverlayType.IMAGE:
          setActivePanel(OverlayType.IMAGE);
          break;
        case OverlayType.CAPTION:
          setActivePanel(OverlayType.CAPTION);
          break;
        case OverlayType.SHAPE:
          // For shapes, we might want to show the image panel or create a dedicated shapes panel
          // For now, let's use the image panel as it's the closest match
          setActivePanel(OverlayType.IMAGE);
          break;
      }
    }
  }, [overlays, setActivePanel, setIsOpen]);

  // Handler for item selection (single item - for backward compatibility)
  const handleItemSelect = React.useCallback((itemId: string) => {
    const overlayId = parseInt(itemId, 10);
    setSelectedOverlayId(overlayId);
    setSidebarForOverlay(overlayId);
  }, [setSelectedOverlayId, setSidebarForOverlay]);

  // Handler for multiselect changes
  const handleSelectedItemsChange = React.useCallback((itemIds: string[]) => {
    const overlayIds = itemIds.map(id => parseInt(id, 10));
    setSelectedOverlayIds(overlayIds);
    
    // Set sidebar panel for the first selected item
    if (overlayIds.length > 0) {
      setSidebarForOverlay(overlayIds[0]);
    }
  }, [setSelectedOverlayIds, setSidebarForOverlay]);

  // Handler for item deletion
  const handleDeleteItems = React.useCallback((itemIds: string[]) => {
    itemIds.forEach(itemId => {
      const overlayId = parseInt(itemId, 10);
      deleteOverlay(overlayId);
    });
  }, [deleteOverlay]);

  // Handler for item duplication
  const handleDuplicateItems = React.useCallback((itemIds: string[]) => {
    itemIds.forEach(itemId => {
      const overlayId = parseInt(itemId, 10);
      duplicateOverlay(overlayId);
    });
  }, [duplicateOverlay]);

  // Handler for item splitting
  const handleSplitItems = React.useCallback((itemId: string, splitTime: number) => {
    const overlayId = parseInt(itemId, 10);
    const splitFrame = Math.round(splitTime * FPS);
    splitOverlay(overlayId, splitFrame);
  }, [splitOverlay]);

  // Handler for item move
  const handleItemMove = React.useCallback((itemId: string, newStart: number, newEnd: number, newTrackId: string) => {
    const overlayId = parseInt(itemId, 10);
    const overlay = overlays.find(o => o.id === overlayId);
    if (overlay) {
      const newRow = parseInt(newTrackId.replace('track-', ''), 10);
      const updatedOverlay: Overlay = {
        ...overlay,
        from: Math.round(newStart * FPS),
        durationInFrames: Math.round((newEnd - newStart) * FPS),
        row: newRow,
      };
      handleOverlayChange(updatedOverlay);
    }
  }, [overlays, handleOverlayChange]);

  // Handler for item resize
  const handleItemResize = React.useCallback((itemId: string, newStart: number, newEnd: number) => {
    const overlayId = parseInt(itemId, 10);
    const overlay = overlays.find(o => o.id === overlayId);
    if (overlay) {
      const updatedOverlay: Overlay = {
        ...overlay,
        from: Math.round(newStart * FPS),
        durationInFrames: Math.round((newEnd - newStart) * FPS),
      };
      handleOverlayChange(updatedOverlay);
    }
  }, [overlays, handleOverlayChange]);

  return {
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
  };
}; 