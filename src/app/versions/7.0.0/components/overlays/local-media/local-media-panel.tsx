"use client";

import { useEditorContext } from "../../../contexts/editor-context";
import { useTimelinePositioning } from "../../../hooks/use-timeline-positioning";
import { useAspectRatio } from "../../../hooks/use-aspect-ratio";
import { useTimeline } from "../../../contexts/timeline-context";
import { Overlay, OverlayType } from "../../../types";
import { LocalMediaGallery } from "../../local-media/local-media-gallery";
import { useCallback, useState } from "react";
import { useLocalMedia } from "../../../contexts/local-media-context";
import { useVideoCache } from "../../../hooks/use-video-cache";
import { useSidebar } from "../../../contexts/sidebar-context";

/**
 * LocalMediaPanel Component
 *
 * A panel that allows users to:
 * 1. Upload their own media files (videos, images, audio)
 * 2. View and manage uploaded media files
 * 3. Add uploaded media to the timeline
 */
const LocalMediaPanel: React.FC = () => {
  const { addOverlay, overlays, durationInFrames, currentFrame, setOverlays } = useEditorContext();
  const { setIsOpen, setActivePanel } = useSidebar();
  const { findNextAvailablePosition, addAtPlayhead } = useTimelinePositioning();
  const { getAspectRatioDimensions } = useAspectRatio();
  const { visibleRows } = useTimeline();
  // const [isLoadingMore, setIsLoadingMore] = useState(false);
  // const { } = useLocalMedia();
  const { downloadVideo } = useVideoCache();

  const getVideoDurationInFrames = (videoUrl: string): Promise<number> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        const durationInSeconds = video.duration;
        const durationInFrames = Math.round(durationInSeconds * 30);
        resolve(durationInFrames);
      };
      
      video.onerror = () => {
        resolve(300); // Fallback to 300 frames (10 seconds)
      };
      
      video.src = videoUrl;
    });
  };

  const getVideoNaturalDimensions = (videoUrl: string): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        resolve({
          width: video.videoWidth,
          height: video.videoHeight
        });
      };
      
      video.onerror = () => {
        resolve(getAspectRatioDimensions());
      };
      
      video.src = videoUrl;
    });
  };

  /**
   * Add a media file to the timeline
   */
  const handleAddToTimeline = async (file: any) => {
    const { width, height } = getAspectRatioDimensions();
    const { from, row, updatedOverlays } = addAtPlayhead(
      currentFrame,
      overlays,
      'top'
    );

    let newOverlay: Overlay;

    if (file.type === "video") {
      // For external URLs, download first like video-overlay-panel does
      if (file.path && file.path.startsWith("http")) {
        try {
          const cachedVideoUrl = await downloadVideo(file.path);
          if (cachedVideoUrl) {
            const videoDuration = await getVideoDurationInFrames(cachedVideoUrl);
            const { width: videoWidth, height: videoHeight } = await getVideoNaturalDimensions(cachedVideoUrl);
            
            newOverlay = {
              left: 0,
              top: 0,
              width: videoWidth,
              height: videoHeight,
              durationInFrames: videoDuration,
              from,
              id: Date.now(),
              rotation: 0,
              row,
              isDragging: false,
              type: OverlayType.VIDEO,
              content: file.path, // Keep original URL for Remotion
              src: cachedVideoUrl, // Use cached URL (now guaranteed to be string)
              originalUrl: file.path, // Add this new field
              videoStartTime: 0,
              styles: {
                opacity: 1,
                zIndex: 100,
                transform: "none",
                objectFit: "cover",
              },
            };
          } else {
            console.error('Failed to download video: cachedVideoUrl is null');
            return; // Don't add overlay if download fails
          }
        } catch (error) {
          console.error('Failed to download video:', error);
          return; // Don't add overlay if download fails
        }
      } else {
        // For local files, use existing logic
        newOverlay = {
          left: 0,
          top: 0,
          width,
          height,
          durationInFrames: file.duration ? Math.round(file.duration * 30) : 200,
          from,
          id: Date.now(),
          rotation: 0,
          row,
          isDragging: false,
          type: OverlayType.VIDEO,
          content: file.thumbnail || "",
          src: file.path ? (file.path.startsWith("http") ? file.path : `${window.location.origin}${file.path}`) : "",
          videoStartTime: 0,
          styles: {
            opacity: 1,
            zIndex: 100,
            transform: "none",
            objectFit: "cover",
          },
        };
      }
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
        src: file.path && file.path.startsWith("http") ? file.path : `${window.location.origin}${file.path}`,
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
      const audioSrc = file.path && file.path.startsWith("http") ? file.path : `${window.location.origin}${file.path}`;
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
        src: file.cachedPath || audioSrc,
        originalUrl: audioSrc,
        styles: {
          volume: 1,
        },
      };
    } else {
      return; // Unsupported file type
    }

    // Create final overlays array with shifted overlays + new overlay
    const finalOverlays = [...updatedOverlays, newOverlay];
    setOverlays(finalOverlays);
    
    // Request timeline to adjust rows
    window.dispatchEvent(new CustomEvent('adjustTimelineRows', {
      detail: { requiredRows: Math.max(...finalOverlays.map(o => o.row)) + 1 }
    }));

    // Close sidebar and reset active panel after successfully adding to timeline
    setActivePanel(OverlayType.NONE);
    setIsOpen(false);
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-white dark:bg-gray-900/50 h-full">
      <div className="flex-1 overflow-hidden">
        <LocalMediaGallery onSelectMedia={handleAddToTimeline} autoAddToTimeline={false} />
      </div>
    </div>
  );
};

export default LocalMediaPanel;
