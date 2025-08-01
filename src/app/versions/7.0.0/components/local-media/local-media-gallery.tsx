"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useLocalMedia } from "../../contexts/local-media-context";
import { formatBytes, formatDuration } from "../../utils/format-utils";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Upload, Trash2, Image as ImageIcon, Video, Music } from "lucide-react";
import { LocalMediaFile } from "../../types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useVideoCache } from "../../hooks/use-video-cache";

/**
 * User Media Gallery Component
 *  
 * Displays the user's uploaded media files and provides functionality to:
 * - Upload new media files
 * - Filter media by type (image, video, audio)
 * - Preview media files
 * - Delete media files
 * - Add media to the timeline
 */
export function LocalMediaGallery({
  onSelectMedia,
}: {
  onSelectMedia?: (mediaFile: LocalMediaFile) => void;
}) {
  const { localMediaFiles, addMediaFile, removeMediaFile, isLoading, loadMoreMedia, hasMore, loadMediaFiles } =
    useLocalMedia();
  const [activeTab, setActiveTab] = useState("all");
  const [selectedFile, setSelectedFile] = useState<LocalMediaFile | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [confirmingMediaId, setConfirmingMediaId] = useState<string | null>(null);
  // const [isLoadingMore, setIsLoadingMore] = useState(false);
  const hasInitialized = useRef(false);
  // Add these state variables at the top
  const [downloadingCards, setDownloadingCards] = useState<Set<string>>(new Set());
  const [downloadProgress, setDownloadProgress] = useState<Map<string, number>>(new Map());
  const { downloadVideo } = useVideoCache();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (confirmingMediaId) {
        const target = event.target as Element;
        // Only reset if the click is outside the media gallery area
        const mediaGallery = document.querySelector('[data-media-gallery]');
        if (mediaGallery && !mediaGallery.contains(target)) {
          setConfirmingMediaId(null);
        }
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [confirmingMediaId]);

  // Load data only when component first becomes visible (like image-overlay-panel pattern)
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      loadMediaFiles(true); // Load initial data
    }
  }, [loadMediaFiles]);


  // Filter media files based on active tab
  const filteredMedia = localMediaFiles.filter((file) => {
    if (activeTab === "all") return true;
    return file.type === activeTab;
  });

  // Handle file upload
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      try {
        setUploadError(null);
        await addMediaFile(files[0]);
        // Reset the input value to allow uploading the same file again
        event.target.value = "";
      } catch (error) {
        console.error("Error uploading file:", error);
        setUploadError("Failed to upload file. Please try again.");
        event.target.value = "";
      }
    }
  };

  // Handle upload button click
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleMediaSelect = (file: LocalMediaFile) => {
    console.log('handleMediaSelect called with:', file.type, file.id); // Add this line
    if (file.type === "image" || file.type === "video") {
      console.log('Setting confirmingMediaId to:', file.id); // Add this line
      setConfirmingMediaId(file.id);
      setSelectedFile(file);
    } else {
      // For audio files, keep the original behavior
      setSelectedFile(file);
      setPreviewOpen(true);
    }
  };

  const handlePreviewInNewTab = () => {
    if (selectedFile) {
      window.open(selectedFile.path, '_blank');
      // Don't reset confirmingMediaId - keep the dialog open
    }
  };

  // Handle video click (download then add)
  const handleVideoClick = async (file: LocalMediaFile) => {
    if (downloadingCards.has(file.id)) return;

    setDownloadingCards(prev => new Set(prev).add(file.id));
    setDownloadProgress(prev => new Map(prev).set(file.id, 0));

    try {
      const cachedVideoUrl = await downloadVideo(file.path, (progress) => {
        setDownloadProgress(prev => new Map(prev).set(file.id, progress));
      });

      if (cachedVideoUrl && onSelectMedia) {
        const { width, height } = await getVideoNaturalDimensions(cachedVideoUrl);
        const durationInFrames = await getVideoDurationInFrames(cachedVideoUrl);
        
        const videoFile = {
          ...file,
          path: file.path, // Keep original URL for Remotion
          cachedPath: cachedVideoUrl, // Store cached URL separately
          duration: durationInFrames / 30,
          width,
          height,
        };
        
        onSelectMedia(videoFile);
      }
    } catch (error) {
      console.error('Failed to download video:', error);
    } finally {
      setDownloadingCards(prev => {
        const newSet = new Set(prev);
        newSet.delete(file.id);
        return newSet;
      });
      setDownloadProgress(prev => {
        const newMap = new Map(prev);
        newMap.delete(file.id);
        return newMap;
      });
    }
  };

  // Handle image click (get dimensions then add)
  const handleImageClick = async (file: LocalMediaFile) => {
    if (onSelectMedia) {
      const { width, height } = await getImageNaturalDimensions(file.path);
      
      const imageFile = {
        ...file,
        width,
        height,
      };
      
      onSelectMedia(imageFile);
    }
  };

  // Handle audio click (add directly)
  const handleAudioClick = (file: LocalMediaFile) => {
    if (onSelectMedia) {
      onSelectMedia(file);
    }
  };

  // Helper function to get video duration
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

  // Helper function to get video natural dimensions
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
        resolve({ width: 400, height: 300 }); // Fallback dimensions
      };
      
      video.src = videoUrl;
    });
  };

  // Helper function for image dimensions
  const getImageNaturalDimensions = (imageUrl: string): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
      const img = new Image();
      
      img.onload = () => {
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight
        });
      };
      
      img.onerror = () => {
        resolve({ width: 400, height: 300 });
      };
      
      img.src = imageUrl;
    });
  };

  // Add to timeline (for dialog)
  const handleAddToTimeline = async () => {
    if (selectedFile) {
      if (selectedFile.type === 'video') {
        await handleVideoClick(selectedFile);
      } else if (selectedFile.type === 'image') {
        await handleImageClick(selectedFile);
      } else {
        handleAudioClick(selectedFile);
      }
      setPreviewOpen(false);
    }
  };

  // Handle infinite scroll
  // const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
  //   const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
  //   if (scrollHeight - scrollTop <= clientHeight + 100) {
  //     if (hasMore && !isLoadingMore && !isLoading) {
  //       setIsLoadingMore(true);
  //       loadMoreMedia().finally(() => setIsLoadingMore(false));
  //     }
  //   }
  // }, [hasMore, isLoadingMore, isLoading, loadMoreMedia]);

  // Render preview content based on file type
  const renderPreviewContent = () => {
    if (!selectedFile) return null;

    const commonClasses =
      "max-h-[50vh] w-full object-contain rounded-lg shadow-sm";

    switch (selectedFile.type) {
      case "image":
        return (
          <div className="relative bg-gray-50 dark:bg-gray-900 rounded-lg p-2">
            <img
              src={
                selectedFile.path.startsWith("http")
                  ? selectedFile.path
                  : `${window.location.origin}${selectedFile.path}`
              }
              alt={selectedFile.name}
              className={`${commonClasses} object-contain`}
            />
          </div>
        );
      case "video":
        return (
          <div className="relative bg-gray-50 dark:bg-gray-900 rounded-lg p-2">
            <video
              src={
                selectedFile.path.startsWith("http")
                  ? selectedFile.path
                  : `${window.location.origin}${selectedFile.path}`
              }
              controls
              className={commonClasses}
              controlsList="nodownload"
              playsInline
            />
          </div>
        );
      case "audio":
        return (
          <div className="flex flex-col items-center space-y-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <Music className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <audio
              src={
                selectedFile.path.startsWith("http")
                  ? selectedFile.path
                  : `${window.location.origin}${selectedFile.path}`
              }
              controls
              className="w-[280px] max-w-full"
              controlsList="nodownload"
            />
          </div>
        );
      default:
        return (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Unsupported file type
          </div>
        );
    }
  };

  // Render media item
  const renderMediaItem = (file: LocalMediaFile) => {
    return (
        <div
          key={file.id}
          className="relative group/item border dark:border-gray-700 border-gray-200 rounded-md overflow-hidden cursor-pointer 
            hover:border-blue-500 dark:hover:border-blue-400 transition-all 
            bg-white dark:bg-gray-800/80 shadow-sm hover:shadow-md flex flex-col"
          onClick={(e) => {
            e.stopPropagation();
            if (confirmingMediaId === file.id) {
              setConfirmingMediaId(null);
            } else {
              handleMediaSelect(file);
            }
          }}
        >
        {confirmingMediaId === file.id ? (
        <div 
          className="flex-1 flex flex-col justify-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md"
        >
          <div className="flex flex-col items-center text-center space-y-3 select-none">
            <h3 className="text-sm font-semibold">Media Options</h3>
            <p className="text-xs text-gray-600 dark:text-gray-300">
              What would you like to do with this {file.type}?
            </p>
            <div className="flex flex-col gap-2 w-full">
              <button 
                className="w-full px-3 py-2 text-xs border rounded hover:bg-gray-50 dark:hover:bg-gray-700"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePreviewInNewTab();
                }}
              >
                Preview
              </button>
              <button 
                className="w-full px-3 py-2 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={async (e) => {
                  e.stopPropagation();
                  if (file.type === 'video') {
                    await handleVideoClick(file);
                  } else if (file.type === 'image') {
                    await handleImageClick(file);
                  } else {
                    handleAudioClick(file);
                  }
                  setConfirmingMediaId(null);
                }}
              >
                Add to Timeline
              </button>
            </div>
          </div>
        </div>
        ) : (
          <div>           
            {/* Thumbnail */}
            <div className="aspect-video relative">
              {file.type === "image" && (
                <>
                  {file.thumbnail && file.thumbnail.trim() !== '' ? (
                    <img
                      src={file.thumbnail}
                      alt={file.name}
                      className="w-full h-full object-cover bg-gray-50 dark:bg-gray-900"
                      onError={(e) => {
                        // Fallback to file path if thumbnail fails
                        const target = e.target as HTMLImageElement;
                        if (target.src !== file.path) {
                          target.src = file.path;
                        } else {
                          // If both fail, hide the image
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800"><span class="text-gray-400 text-sm">Image unavailable</span></div>';
                          }
                        }
                      }}
                    />
                  ) : (
                    <img
                      src={file.path}
                      alt={file.name}
                      className="w-full h-full object-cover bg-gray-50 dark:bg-gray-900"
                      onError={(e) => {
                        // If image fails to load, show error state
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800"><span class="text-gray-400 text-sm">Image unavailable</span></div>';
                        }
                      }}
                    />
                  )}
                </>
              )}
              {file.type === "video" && (
                <>
                  {/* Video thumbnail or fallback */}
                  {file.thumbnail && file.thumbnail.trim() !== '' ? (
                    <img
                      src={file.thumbnail}
                      alt={file.name}
                      className="w-full h-full object-cover bg-gray-50 dark:bg-gray-900"
                      onError={(e) => {
                        // If thumbnail fails, show video icon
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent && !parent.querySelector('.video-fallback')) {
                          const fallback = document.createElement('div');
                          fallback.className = 'video-fallback w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800';
                          fallback.innerHTML = '<div class="w-8 h-8 text-gray-400"><svg fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h6l2 2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z"></path></svg></div>';
                          parent.appendChild(fallback);
                        }
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                      <Video className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  
                  {/* Video label */}
                  <div className="absolute bottom-1.5 right-1.5 bg-black/75 dark:bg-black/90 text-white text-xs px-1.5 py-0.5 rounded-md">
                    Video
                  </div>
                  
                  {/* Download Progress Overlay */}
                  {downloadingCards.has(file.id) && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
                      <div className="text-white text-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent mb-2 mx-auto"></div>
                        <p className="text-xs font-medium">Downloading...</p>
                        <p className="text-xs">{downloadProgress.get(file.id) || 0}%</p>
                        <div className="w-16 h-1 bg-gray-600 rounded-full mt-1 overflow-hidden">
                          <div 
                            className="h-full bg-white transition-all duration-300"
                            style={{ width: `${downloadProgress.get(file.id) || 0}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
              {file.type === "audio" && (
                <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                  <Music className="w-10 h-10 text-gray-400 dark:text-gray-500" />
                </div>
              )}
            </div>

            {/* Media info */}
            <div className="p-2.5">
              <p className="text-sm font-medium truncate text-gray-900 dark:text-gray-100">
                {file.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {file.type.charAt(0).toUpperCase() + file.type.slice(1)}
              </p>
            </div>
          </div>
        )}

        {/* Delete button - only show when not in confirm mode */}
        {/* {confirmingMediaId !== file.id && (
          <button
            className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 
              text-white p-1.5 rounded-full opacity-0 group-hover/item:opacity-100 transition-all duration-200 
              shadow-sm hover:shadow-md transform hover:scale-105"
            onClick={(e) => {
              e.stopPropagation();
              // Show warning since delete is not supported by API
              if (confirm("Note: This will only remove the file from your current view. The file will remain on the server.")) {
                removeMediaFile(file.id);
              }
            }}
            title="Remove from view (file remains on server)"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )} */}
      </div>
    );
  };

  return (
  <div className="h-full flex flex-col" data-media-gallery>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-sm">Saved Uploads</h2>
        <div>
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={handleUploadClick}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            Upload
          </Button>
          <input
            ref={fileInputRef}
            id="file-upload"
            type="file"
            className="hidden"
            onChange={handleFileUpload}
            accept="image/*,video/*,audio/*"
            disabled={isLoading}
          />
        </div>
      </div>

      {uploadError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4">
          {uploadError}
        </div>
      )}

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col"
      >
        <TabsList className="w-full grid grid-cols-4 bg-gray-100/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-sm border border-gray-200 dark:border-gray-700 gap-1">
          <TabsTrigger
            value="all"
            className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white 
            rounded-sm transition-all duration-200 text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-200 hover:bg-gray-200/50 dark:hover:bg-gray-700/50"
          >
            <span className="flex items-center gap-2 text-xs">All</span>
          </TabsTrigger>
          <TabsTrigger
            value="image"
            className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white 
            rounded-sm transition-all duration-200 text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-200 hover:bg-gray-200/50 dark:hover:bg-gray-700/50"
          >
            <span className="flex items-center gap-2 text-xs">
              <ImageIcon className="w-3 h-3" />
              Images
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="video"
            className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white 
            rounded-sm transition-all duration-200 text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-200 hover:bg-gray-200/50 dark:hover:bg-gray-700/50"
          >
            <span className="flex items-center gap-2 text-xs">
              <Video className="w-3 h-3" />
              Videos
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="audio"
            className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white 
            rounded-sm transition-all duration-200 text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-200 hover:bg-gray-200/50 dark:hover:bg-gray-700/50"
          >
            <span className="flex items-center gap-2 text-xs">
              <Music className="w-3 h-3" />
              Audio
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="flex-1 overflow-y-auto p-0">
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 text-sm text-gray-500">
              <Loader2 className="w-5 h-5 animate-spin" />
              <p>Loading media files...</p>
            </div>
          ) : filteredMedia.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <Upload className="w-4 h-4 text-gray-400" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">No media files</p>
                <p className="text-xs text-gray-500">
                  Choose media from your device. User agrees not to use media that infringe rights, violate privacy, or are obscene.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleUploadClick}
                className="text-xs"
              >
                Upload Media
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 ">
              {filteredMedia.map(renderMediaItem)}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Media Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedFile?.name}</DialogTitle>
            <DialogDescription>
              {selectedFile?.type} • {formatBytes(selectedFile?.size)}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center">{renderPreviewContent()}</div>
          <div className="flex justify-end mt-4">
            <Button variant="default" size="sm" onClick={handleAddToTimeline}>
              Add to Timeline
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
