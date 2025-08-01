"use client";

import { useEditorContext } from "../../../contexts/editor-context";
import { useTimelinePositioning } from "../../../hooks/use-timeline-positioning";
import { useAspectRatio } from "../../../hooks/use-aspect-ratio";
import { useTimeline } from "../../../contexts/timeline-context";
import { Overlay, OverlayType } from "../../../types";
import { LocalMediaGallery } from "../../local-media/local-media-gallery";
import { useCallback, useState } from "react";
import { useLocalMedia } from "../../../contexts/local-media-context";

/**
 * LocalMediaPanel Component
 *
 * A panel that allows users to:
 * 1. Upload their own media files (videos, images, audio)
 * 2. View and manage uploaded media files
 * 3. Add uploaded media to the timeline
 */
export const LocalMediaPanel: React.FC = () => {
  const { addOverlay, overlays, durationInFrames } = useEditorContext();
  const { findNextAvailablePosition } = useTimelinePositioning();
  const { getAspectRatioDimensions } = useAspectRatio();
  const { visibleRows } = useTimeline();
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const { hasMore, isLoading, loadMoreMedia } = useLocalMedia();  

  /**
   * Add a media file to the timeline
   */
  const handleAddToTimeline = (file: any) => {
    const { width, height } = getAspectRatioDimensions();
    const { from, row } = findNextAvailablePosition(
      overlays,
      visibleRows,
      durationInFrames
      /**
       * Pass the current playhead position.
       * This way, we can place the new overlay next to the playhead
       * instead of always placing it at the start of the timeline
       * and having to drag it to the playhead.
       */
    );

    let newOverlay: Overlay;

    if (file.type === "video") {
      newOverlay = {
        left: 0,
        top: 0,
        width,
        height,
        durationInFrames: file.duration ? Math.round(file.duration * 30) : 200, // Convert seconds to frames (assuming 30fps)
        from,
        id: Date.now(),
        rotation: 0,
        row,
        isDragging: false,
        type: OverlayType.VIDEO,
        content: file.thumbnail || "",
        src: file.path.startsWith("http") ? file.path : `${window.location.origin}${file.path}`,
        videoStartTime: 0,
        styles: {
          opacity: 1,
          zIndex: 100,
          transform: "none",
          objectFit: "cover",
        },
      };
    } else if (file.type === "image") {
      newOverlay = {
        left: 0,
        top: 0,
        width,
        height,
        durationInFrames: 200,
        from,
        id: Date.now(),
        rotation: 0,
        row,
        isDragging: false,
        type: OverlayType.IMAGE,
        src: file.path.startsWith("http") ? file.path : `${window.location.origin}${file.path}`,
        content: file.path,
        styles: {
          objectFit: "cover",
          animation: {
            enter: "fadeIn",
            exit: "fadeOut",
          },
        },
      };
    } else if (file.type === "audio") {
      newOverlay = {
        left: 0,
        top: 0,
        width: 0,
        height: 0,
        durationInFrames: file.duration ? Math.round(file.duration * 30) : 200,
        from,
        id: Date.now(),
        rotation: 0,
        row,
        isDragging: false,
        type: OverlayType.SOUND,
        content: file.name,
        src: file.path.startsWith("http") ? file.path : `${window.location.origin}${file.path}`,
        styles: {
          volume: 1,
        },
      };
    } else {
      return; // Unsupported file type
    }

    addOverlay(newOverlay);
  };

  // Handle infinite scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 100) {
      if (hasMore && !isLoadingMore && !isLoading) {
        setIsLoadingMore(true);
        loadMoreMedia().finally(() => setIsLoadingMore(false));
      }
    }
  }, [hasMore, isLoadingMore, isLoading, loadMoreMedia]);

  return (
    <div className="flex flex-col gap-4 p-4 bg-white dark:bg-gray-900/50 h-full">
      <div className="flex-1 overflow-y-auto" onScroll={handleScroll}>
        <LocalMediaGallery onSelectMedia={handleAddToTimeline} isLoadingMore={isLoadingMore} />
      </div>
    </div>
  );
};

export default LocalMediaPanel;
