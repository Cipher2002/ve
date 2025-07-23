import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEditorContext } from "../../../contexts/editor-context";
import { useTimelinePositioning } from "../../../hooks/use-timeline-positioning";

import { usePexelsVideos } from "../../../hooks/use-pexels-video";
import { useAspectRatio } from "../../../hooks/use-aspect-ratio";
import { useTimeline } from "../../../contexts/timeline-context";
import { useRenderedVideos } from "../../../hooks/use-rendered-videos";
import { ClipOverlay, Overlay, OverlayType } from "../../../types";
import { VideoDetails } from "./video-details";
import { Trash2, Video } from "lucide-react";

interface PexelsVideoFile {
  quality: string;
  link: string;
}

interface PexelsVideo {
  id: number | string;
  image: string;
  video_files: PexelsVideoFile[];
}

/**
 * VideoOverlayPanel is a component that provides video search and management functionality.
 * It allows users to:
 * - Add videos to the timeline as overlays
 * - Manage video properties when a video overlay is selected
 *
 * The component has two main states:
 * 1. Search/Browse mode: Shows a search input and grid of video thumbnails
 * 2. Edit mode: Shows video details panel when a video overlay is selected
 *
 * @component
 * @example
 * ```tsx
 * <VideoOverlayPanel />
 * ```
 */
export const VideoOverlayPanel: React.FC = () => {
  // const [searchQuery, setSearchQuery] = useState("");
  const { videos, isLoading, fetchVideos } = usePexelsVideos();
  const {
    addOverlay,
    overlays,
    durationInFrames,
    selectedOverlayId,
    changeOverlay,
  } = useEditorContext();
  const { findNextAvailablePosition } = useTimelinePositioning();
  const { getAspectRatioDimensions } = useAspectRatio();
  const { visibleRows } = useTimeline();
  const [localOverlay, setLocalOverlay] = useState<Overlay | null>(null);
  const [activeTab, setActiveTab] = useState('T2V');
  const { videos: renderedVideos, isLoading: renderedLoading, refetch: refetchRendered, deleteVideo } = useRenderedVideos();

  useEffect(() => {
    if (selectedOverlayId === null) {
      setLocalOverlay(null);
      return;
    }

    const selectedOverlay = overlays.find(
      (overlay) => overlay.id === selectedOverlayId
    );

    if (selectedOverlay?.type === OverlayType.VIDEO) {
      setLocalOverlay(selectedOverlay);
    }
  }, [selectedOverlayId, overlays]);

  const handleAddClip = (video: PexelsVideo) => {
    const { width, height } = getAspectRatioDimensions();

    const { from, row } = findNextAvailablePosition(
      overlays,
      visibleRows,
      durationInFrames
    );

    // Find the best quality video file (prioritize UHD > HD > SD)
    const videoFile =
      video.video_files.find(
        (file: PexelsVideoFile) => file.quality === "uhd"
      ) ||
      video.video_files.find(
        (file: PexelsVideoFile) => file.quality === "hd"
      ) ||
      video.video_files.find(
        (file: PexelsVideoFile) => file.quality === "sd"
      ) ||
      video.video_files[0]; // Fallback to first file if no matches

    const newOverlay: Overlay = {
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
      type: OverlayType.VIDEO,
      content: video.image,
      src: videoFile?.link ?? "",
      videoStartTime: 0,
      styles: {
        opacity: 1,
        zIndex: 100,
        transform: "none",
        objectFit: "cover",
      },
    };

    addOverlay(newOverlay);
  };

  const handleUpdateOverlay = (updatedOverlay: Overlay) => {
    setLocalOverlay(updatedOverlay);
    changeOverlay(updatedOverlay.id, updatedOverlay);
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-gray-100/40 dark:bg-gray-900/40 h-full">
      {!localOverlay ? (
        <>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="w-full grid grid-cols-3 bg-gray-100/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-sm border border-gray-200 dark:border-gray-700 gap-1">
              <TabsTrigger
                value="T2V"
                className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white 
                rounded-sm transition-all duration-200 text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-200 hover:bg-gray-200/50 dark:hover:bg-gray-700/50"
              >
                <span className="flex items-center gap-2 text-xs">T2V</span>
              </TabsTrigger>
              <TabsTrigger
                value="I2V"
                className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white 
                rounded-sm transition-all duration-200 text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-200 hover:bg-gray-200/50 dark:hover:bg-gray-700/50"
              >
                <span className="flex items-center gap-2 text-xs">I2V</span>
              </TabsTrigger>
              <TabsTrigger
                value="Rendered Video"
                className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white 
                rounded-sm transition-all duration-200 text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-200 hover:bg-gray-200/50 dark:hover:bg-gray-700/50"
              >
                <span className="flex items-center gap-2 text-xs">Rendered Video</span>
              </TabsTrigger>
            </TabsList>


          <TabsContent value="T2V" className="flex-1 overflow-y-auto p-0">
            <div className="text-center text-gray-500 py-8">T2V Files</div>
          </TabsContent>
          <TabsContent value="I2V" className="flex-1 overflow-y-auto p-0">
            <div className="text-center text-gray-500 py-8">I2V Files</div>
          </TabsContent>
          <TabsContent value="Rendered Video" className="flex-1 overflow-y-auto p-0">
            {renderedLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 p-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={`skeleton-${index}`}
                    className="aspect-video bg-gray-200 dark:bg-gray-800 animate-pulse rounded-md"
                  />
                ))}
              </div>
            ) : renderedVideos.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 p-2">
                {renderedVideos.map((video) => (
                  <div
                    key={video.id}
                    className="relative group/item border dark:border-gray-700 border-gray-200 rounded-md overflow-hidden cursor-pointer 
                      hover:border-blue-500 dark:hover:border-blue-400 transition-all 
                      bg-white dark:bg-gray-800/80 shadow-sm hover:shadow-md"
                    onClick={() => {
                      // Add rendered video to timeline
                      const { width, height } = getAspectRatioDimensions();
                      const { from, row } = findNextAvailablePosition(
                        overlays,
                        visibleRows,
                        durationInFrames
                      );

                      const newOverlay: Overlay = {
                        left: 0,
                        top: 0,
                        width,
                        height,
                        durationInFrames: 300, // Default duration, user can adjust
                        from,
                        id: Date.now(),
                        rotation: 0,
                        row,
                        isDragging: false,
                        type: OverlayType.VIDEO,
                        content: video.url,
                        src: video.url,
                        videoStartTime: 0,
                        styles: {
                          opacity: 1,
                          zIndex: 100,
                          transform: "none",
                          objectFit: "cover",
                        },
                      };

                      addOverlay(newOverlay);
                    }}
                  >
                    {/* Video thumbnail */}
                    <div className="aspect-video relative bg-gray-50 dark:bg-gray-900">
                      <video
                        src={video.url}
                        className="w-full h-full object-cover"
                        muted
                        preload="metadata"
                        onLoadedData={(e) => {
                          e.currentTarget.currentTime = 1;
                        }}
                      />
                      <div className="absolute bottom-1.5 right-1.5 bg-black/75 dark:bg-black/90 text-white text-xs px-1.5 py-0.5 rounded-md">
                        MP4
                      </div>
                    </div>

                    {/* Video info */}
                    <div className="p-2.5">
                      <p className="text-sm font-medium truncate text-gray-900 dark:text-gray-100">
                        {video.filename}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {(video.size / (1024 * 1024)).toFixed(1)} MB • {new Date(video.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Delete button */}
                    <button
                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 
                        text-white p-1.5 rounded-full opacity-0 group-hover/item:opacity-100 transition-all duration-200 
                        shadow-sm hover:shadow-md transform hover:scale-105"
                      onClick={async (e) => {
                        e.stopPropagation();
                        deleteVideo(video.id);
                      }}
                      title="Delete video"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-3 p-4">
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <Video className="w-4 h-4 text-gray-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">No rendered videos</p>
                  <p className="text-xs text-gray-500">
                    Rendered videos will appear here after you render videos
                  </p>
                </div>
              </div>
            )}
          </TabsContent>
          </Tabs>
        </>
      ) : (
        <VideoDetails
          localOverlay={localOverlay as ClipOverlay}
          setLocalOverlay={handleUpdateOverlay}
        />
      )}
    </div>
  );
};
