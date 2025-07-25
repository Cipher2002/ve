import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEditorContext } from "../../../contexts/editor-context";
import { useTimelinePositioning } from "../../../hooks/use-timeline-positioning";

import { useAspectRatio } from "../../../hooks/use-aspect-ratio";
import { useTimeline } from "../../../contexts/timeline-context";
import { useRenderedVideos } from "../../../hooks/use-rendered-videos";
import { ClipOverlay, Overlay, OverlayType } from "../../../types";
import { VideoDetails } from "./video-details";
import { Trash2, Video } from "lucide-react";
import { useVideoCache } from "../../../hooks/use-video-cache";

interface VideoProject {
  id: string;
  title?: string;
  thumbnail?: string;
  video_url?: string;
  created_at?: string;
  status?: string;
  type?: string;
  ratio?: string;
  category?: string;
  output?: string;
  user_prompt?: string;
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
  
  // Extract URL parameters
  const getUrlParams = () => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      return {
        uid: urlParams.get('uid') || '',
        sid: urlParams.get('sid') || '',
        user_ref: urlParams.get('user_ref') || ''
      };
    }
    return { uid: '', sid: '', user_ref: '' };
  };

  const [activeTab, setActiveTab] = useState('generated-zanopy');
  const [selectedProjectType, setSelectedProjectType] = useState('T2V');
  const [projects, setProjects] = useState<VideoProject[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [downloadingCards, setDownloadingCards] = useState<Set<string>>(new Set());
  const [downloadProgress, setDownloadProgress] = useState<Map<string, number>>(new Map());

  const projectTypeOptions = [
    { label: 'T2V', value: 'text-to-video', apiAction: 'GET_TEXT_TO_VIDEO_PROJECT', imageStatus: '1' },
    { label: 'I2V', value: 'image-to-video', apiAction: 'GET_IMAGE_TO_VIDEO_PROJECT', imageStatus: '' },
    { label: 'Video Effects', value: 'video-effects', apiAction: 'GET_PANOUT_VIDEO_PROJECT', imageStatus: '1' },
    { label: 'Talking Video', value: 'talking-video', apiAction: 'GET_TALKING_IMAGE_PROJECT', imageStatus: '1' }
  ];
  
  const { videos: renderedVideos, isLoading: renderedLoading, refetch: refetchRendered, deleteVideo } = useRenderedVideos();
  const { downloadVideo } = useVideoCache();

  const fetchProjects = async (projectType: string) => {
    setIsLoadingProjects(true);
    try {
      const { uid } = getUrlParams();
      const projectOption = projectTypeOptions.find(option => option.value === projectType);
      if (!projectOption) return;
      
      const response = await fetch(`/api/latest/video/receive?user_id=${uid}&do_action=${projectOption.apiAction}&imageStatus=${projectOption.imageStatus}`);
      const data = await response.json();
      setProjects(data.projects || []);
    } catch (error) {
      console.error(`Failed to fetch ${projectType} projects:`, error);
    } finally {
      setIsLoadingProjects(false);
    }
  };

  const handleProjectTypeChange = (newType: string) => {
    setSelectedProjectType(newType);
    const projectOption = projectTypeOptions.find(option => option.label === newType);
    if (projectOption) {
      setProjects([]);
      fetchProjects(projectOption.value);
    }
  };

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

  useEffect(() => {
    const { uid } = getUrlParams();
    if (!uid) return;

    if (activeTab === 'generated-zanopy') {
      const projectOption = projectTypeOptions.find(option => option.label === selectedProjectType);
      if (projectOption) {
        fetchProjects(projectOption.value);
      }
    }
  }, [activeTab, selectedProjectType]);

  const handleUpdateOverlay = (updatedOverlay: Overlay) => {
    setLocalOverlay(updatedOverlay);
    changeOverlay(updatedOverlay.id, updatedOverlay);
  };

  const handleGeneratedVideoClick = async (project: VideoProject) => {
    if (project.video_url && !downloadingCards.has(project.id)) {
      // Start download progress tracking
      setDownloadingCards(prev => new Set(prev).add(project.id));
      setDownloadProgress(prev => new Map(prev).set(project.id, 0));

      try {
        // Download video first with progress tracking
        console.log('Starting video download:', project.video_url);
        const cachedVideoUrl = await downloadVideo(project.video_url, (progress) => {
          setDownloadProgress(prev => new Map(prev).set(project.id, progress));
        });

        if (cachedVideoUrl) {
          // Only add to timeline after successful download
          const { width, height } = getAspectRatioDimensions();
          const { from, row } = findNextAvailablePosition(
            overlays,
            visibleRows,
            durationInFrames
          );

          const videoOverlay: Overlay = {
            left: 0,
            top: 0,
            width,
            height,
            durationInFrames: 300,
            from,
            id: Date.now(),
            rotation: 0,
            row,
            isDragging: false,
            type: OverlayType.VIDEO,
            content: project.video_url,
            src: cachedVideoUrl,
            videoStartTime: 0,
            styles: {
              opacity: 1,
              zIndex: 100,
              transform: "none",
              objectFit: "cover",
            },
          };

          addOverlay(videoOverlay);
          console.log('Video added to timeline successfully');
        } else {
          console.error('Failed to download video');
        }
      } catch (error) {
        console.error('Failed to download video:', error);
      } finally {
        // Clean up progress tracking
        setDownloadingCards(prev => {
          const newSet = new Set(prev);
          newSet.delete(project.id);
          return newSet;
        });
        setDownloadProgress(prev => {
          const newMap = new Map(prev);
          newMap.delete(project.id);
          return newMap;
        });
      }
    }
  };

  const handleRenderedVideoClick = async (video: any) => {
    if (!downloadingCards.has(video.id)) {
      // Start download progress tracking
      setDownloadingCards(prev => new Set(prev).add(video.id));
      setDownloadProgress(prev => new Map(prev).set(video.id, 0));

      try {
        // Download video first with progress tracking
        console.log('Starting rendered video download:', video.url);
        const cachedVideoUrl = await downloadVideo(video.url, (progress) => {
          setDownloadProgress(prev => new Map(prev).set(video.id, progress));
        });

        if (cachedVideoUrl) {
          // Only add to timeline after successful download
          const { width, height } = getAspectRatioDimensions();
          const { from, row } = findNextAvailablePosition(
            overlays,
            visibleRows,
            durationInFrames
          );

          const videoOverlay: Overlay = {
            left: 0,
            top: 0,
            width,
            height,
            durationInFrames: 300,
            from,
            id: Date.now(),
            rotation: 0,
            row,
            isDragging: false,
            type: OverlayType.VIDEO,
            content: video.url,
            src: cachedVideoUrl,
            videoStartTime: 0,
            styles: {
              opacity: 1,
              zIndex: 100,
              transform: "none",
              objectFit: "cover",
            },
          };

          addOverlay(videoOverlay);
          console.log('Rendered video added to timeline successfully');
        } else {
          console.error('Failed to download rendered video');
        }
      } catch (error) {
        console.error('Failed to download rendered video:', error);
      } finally {
        // Clean up progress tracking
        setDownloadingCards(prev => {
          const newSet = new Set(prev);
          newSet.delete(video.id);
          return newSet;
        });
        setDownloadProgress(prev => {
          const newMap = new Map(prev);
          newMap.delete(video.id);
          return newMap;
        });
      }
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-gray-100/40 dark:bg-gray-900/40 h-full">
      {!localOverlay ? (
        <>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="w-full grid grid-cols-2 bg-gray-100/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-sm border border-gray-200 dark:border-gray-700 gap-1 mb-2 flex-shrink-0">
              <TabsTrigger
                value="generated-zanopy"
                className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white 
                rounded-sm transition-all duration-200 text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-200 hover:bg-gray-200/50 dark:hover:bg-gray-700/50"
              >
                <span className="flex items-center gap-2 text-xs">Generated in Zanopy</span>
              </TabsTrigger>
              <TabsTrigger
                value="rendered-video"
                className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white 
                rounded-sm transition-all duration-200 text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-200 hover:bg-gray-200/50 dark:hover:bg-gray-700/50"
              >
                <span className="flex items-center gap-2 text-xs">Rendered Video</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="generated-zanopy" className="flex-1 min-h-0 flex flex-col space-y-4">
              <div className="flex gap-2 flex-shrink-0">
                <select
                  value={selectedProjectType}
                  onChange={(e) => handleProjectTypeChange(e.target.value)}
                  className="bg-background border border-border text-foreground rounded-md px-3 py-2 text-sm"
                  disabled={isLoadingProjects}
                >
                  {projectTypeOptions.map((option) => (
                    <option key={option.label} value={option.label}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1 overflow-y-auto">
                {isLoadingProjects ? (
                  <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 p-2">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <div
                        key={`skeleton-${index}`}
                        className="aspect-video bg-gray-200 dark:bg-gray-800 animate-pulse rounded-md"
                      />
                    ))}
                  </div>
                ) : projects.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 p-2">
                    {projects.map((project) => (
                      <div
                        key={project.id}
                        data-project-card
                        className={`relative group border rounded-md overflow-hidden cursor-pointer transition-all ${
                          downloadingCards.has(project.id) 
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                            : 'border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 bg-white dark:bg-gray-800/80 shadow-sm hover:shadow-md'
                        }`}
                        onClick={() => handleGeneratedVideoClick(project)}
                      >
                      {downloadingCards.has(project.id) ? (
                        <div className="h-full flex flex-col items-center justify-center p-4">
                          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mb-3"></div>
                          <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Downloading...</p>
                          <p className="text-xs text-blue-500 dark:text-blue-300">{downloadProgress.get(project.id) || 0}%</p>
                          <div className="w-24 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mt-2 overflow-hidden">
                            <div 
                              className="h-full bg-blue-500 transition-all duration-300"
                              style={{ width: `${downloadProgress.get(project.id) || 0}%` }}
                            ></div>
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* Video thumbnail/first frame */}
                          <div className="aspect-video relative bg-gray-50 dark:bg-gray-900">
                            {project.thumbnail && project.thumbnail.startsWith('http') ? (
                              <img
                                src={project.thumbnail}
                                alt={project.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  // Fallback to video first frame instead of hiding
                                  const img = e.target as HTMLImageElement;
                                  img.style.display = 'none';
                                  const videoContainer = img.parentElement;
                                  if (videoContainer && project.video_url) {
                                    const video = document.createElement('video');
                                    video.src = project.video_url;
                                    video.className = "w-full h-full object-cover";
                                    video.muted = true;
                                    video.preload = "metadata";
                                    video.onloadeddata = () => {
                                      video.currentTime = 0.1;
                                    };
                                    video.onerror = () => {
                                      // Hide the entire card if both thumbnail and video fail
                                      const card = videoContainer.closest('[data-project-card]');
                                      if (card) {
                                        (card as HTMLElement).style.display = 'none';
                                      }
                                    };
                                    videoContainer.appendChild(video);
                                  }
                                }}
                              />
                            ) : (
                              <video
                                src={project.video_url}
                                className="w-full h-full object-cover"
                                muted
                                preload="metadata"
                                onLoadedData={(e) => {
                                  e.currentTarget.currentTime = 0.1;
                                }}
                                onError={(e) => {
                                  // Hide the entire project card if video fails to load
                                  const card = (e.target as HTMLVideoElement).closest('[data-project-card]');
                                  if (card) {
                                    (card as HTMLElement).style.display = 'none';
                                  }
                                }}
                              />
                            )}

                            <div className="absolute bottom-1.5 right-1.5 bg-black/75 dark:bg-black/90 text-white text-xs px-1.5 py-0.5 rounded-md">
                              {selectedProjectType}
                            </div>
                          </div>

                          {/* Video info */}
                          <div className="p-2.5">
                            <p className="text-sm font-medium truncate text-gray-900 dark:text-gray-100">
                              {project.title}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              {project.ratio || 'Unknown'} • {project.created_at ? new Date(project.created_at).toLocaleDateString() : 'Unknown date'}
                            </p>
                          </div>
                        </>
                      )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-3 p-4">
                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <Video className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">No {selectedProjectType} projects</p>
                      <p className="text-xs text-gray-500">
                        Generate {selectedProjectType} videos on Zanopy to see them here.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="rendered-video" className="flex-1 overflow-y-auto p-0">
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
                      className={`relative group/item border rounded-md overflow-hidden cursor-pointer transition-all ${
                        downloadingCards.has(video.id) 
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                          : 'dark:border-gray-700 border-gray-200 hover:border-blue-500 dark:hover:border-blue-400 bg-white dark:bg-gray-800/80 shadow-sm hover:shadow-md'
                      }`}
                      onClick={() => handleRenderedVideoClick(video)}
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

                        {/* Download Progress Overlay */}
                        {downloadingCards.has(video.id) && (
                          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
                            <div className="text-white text-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent mb-2 mx-auto"></div>
                              <p className="text-sm font-medium">Downloading...</p>
                              <p className="text-xs">{downloadProgress.get(video.id) || 0}%</p>
                              
                              {/* Progress Bar */}
                              <div className="w-24 h-1 bg-gray-600 rounded-full mt-2 overflow-hidden">
                                <div 
                                  className="h-full bg-white transition-all duration-300"
                                  style={{ width: `${downloadProgress.get(video.id) || 0}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        )}

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