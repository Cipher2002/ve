"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { LocalMediaFile } from "../types";
interface LocalMediaContextType {
  localMediaFiles: LocalMediaFile[];
  addMediaFile: (file: File) => Promise<LocalMediaFile | void>;
  removeMediaFile: (id: string) => Promise<void>;
  clearMediaFiles: () => Promise<void>;
  isLoading: boolean;
  isLoadingMore: boolean;
  loadMoreMedia: () => Promise<void>;
  hasMore: boolean;
  loadMediaFiles: (isInitial?: boolean) => Promise<void>;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  filteredMediaFiles: LocalMediaFile[];
}

const LocalMediaContext = createContext<LocalMediaContextType | undefined>(
  undefined
);

// Add this function to get URL parameters
const getUrlParams = () => {
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    return {
      uid: urlParams.get('uid') || '',
      sid: urlParams.get('sid') || '',
      user_ref: urlParams.get('email') || ''
    };
  }
  return { uid: '', sid: '', user_ref: '' };
};

// Helper function to get audio duration
const getAudioDuration = (audioUrl: string): Promise<number> => {
  return new Promise((resolve) => {
    const audio = document.createElement('audio');
    audio.preload = 'metadata';
    
    audio.onloadedmetadata = () => {
      const durationInSeconds = audio.duration;
      resolve(durationInSeconds);
    };
    
    audio.onerror = () => {
      resolve(0); // Fallback to 0 on error
    };
    
    audio.src = audioUrl;
  });
};

/**
 * LocalMediaProvider Component
 *
 * Provides context for managing local media files uploaded by the user.
 * Handles:
 * - Storing and retrieving local media files from IndexedDB and server
 * - Adding new media files
 * - Removing media files
 * - Persisting media files between sessions
 */
export const LocalMediaProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [localMediaFiles, setLocalMediaFiles] = useState<LocalMediaFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [activeTab, setActiveTab] = useState<string>("all");
  const { uid, user_ref } = getUrlParams();

  // Filter media files based on active tab
  const filteredMediaFiles = localMediaFiles.filter((file) => {
    if (activeTab === "all") return true;
    return file.type === activeTab;
  });

  // Reset pagination and reload when tab changes
  useEffect(() => {
    // Don't run on initial mount
    if (localMediaFiles.length > 0) {
      setCurrentPage(0);
      setHasMore(true);
    }
  }, [activeTab]);

  // Define BASE_URL at the top where API calls are made
  // const BASE_URL = 'http://zanopy.ai/vedit/'; // You can change this to your desired base URL

  //SETTING THE API BASE URL
  const apiBaseUrl = 'https://zanopy.ai/vedit/api/latest';

  // Function to load media files (call this when panel opens)
  const loadMediaFiles = useCallback(async (isInitial = true) => {
    if (!uid || !user_ref) return;
    
    try {
      if (isInitial) {
        setIsLoading(true);
        setCurrentPage(0); // Reset pagination
      } else {
        setIsLoadingMore(true);
      }

      const startFrom = isInitial ? 0 : (currentPage + 1) * 20;

      const response = await fetch(`${apiBaseUrl}/media/get`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: uid,
          user_ref: user_ref,
          start_from: startFrom.toString(),
          max_results: '20',
        }),
      });

      const data = await response.json();
      
      if (data.RESULT === 'SUCCESS' && data.RESPONSE) {
        const files: LocalMediaFile[] = data.RESPONSE
          .map((item: any) => ({
            id: item.file_id,
            name: item.file_url.split('/').pop() || 'Unknown',
            type: item.file_type,
            path: item.file_url,
            size: 0, // Not available from API
            lastModified: new Date(item.file_timestamp).getTime(),
            thumbnail: item.file_thumbnail_url || null, // Handle empty strings
            duration: 0, // Not available from API
          }))
          .filter((file: any, index: any, self: any) => {
            // Remove duplicates by file_id
            return index === self.findIndex((f: any) => f.id === file.id);
          });

        if (isInitial) {
          setLocalMediaFiles(files);
          setCurrentPage(0);
        } else {
          setLocalMediaFiles(prev => {
            // Merge new files with existing, avoiding duplicates
            const combined = [...prev];
            files.forEach(newFile => {
              const existingIndex = combined.findIndex(existing => existing.id === newFile.id);
              if (existingIndex === -1) {
                combined.push(newFile);
              }
            });
            return combined;
          });
          setCurrentPage(prev => prev + 1);
        }
        
        setHasMore(files.length === 20);
      }
    } catch (error) {
      console.error("Error loading media files from API:", error);
    } finally {
      if (isInitial) {
        setIsLoading(false);
      } else {
        setIsLoadingMore(false);
      }
    }
  }, [uid, user_ref, currentPage]);

  const loadMoreMedia = useCallback(async (): Promise<void> => {
    if (!hasMore || isLoadingMore || isLoading) return;
    await loadMediaFiles(false);
  }, [hasMore, isLoadingMore, isLoading, loadMediaFiles]);

  /**
   * Add a new media file to the collection
   */
  const addMediaFile = useCallback(
    async (file: File): Promise<LocalMediaFile | void> => {
      if (!uid || !user_ref) {
        throw new Error("User ID or User Ref not available");
      }

      setIsLoading(true);
      try {
        // Validate file type before processing
        const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/svg+xml'];
        const validVideoTypes = ['video/mp4', 'video/webm', 'video/mov', 'video/avi', 'video/mkv', 'video/flv', 'video/wmv'];
        const validAudioTypes = ['audio/mp3', 'audio/wav', 'audio/aac', 'audio/flac', 'audio/ogg', 'audio/m4a', 'audio/mpeg'];
        
        let fileType: "image" | "video" | "audio";
        if (validImageTypes.includes(file.type.toLowerCase())) {
          fileType = "image";
        } else if (validVideoTypes.includes(file.type.toLowerCase())) {
          fileType = "video";
        } else if (validAudioTypes.includes(file.type.toLowerCase())) {
          fileType = "audio";
        } else {
          throw new Error(`Unsupported file type: ${file.type}`);
        }
        // Upload file to server using existing API
        const formData = new FormData();
        formData.append('file', file);
        formData.append('userId', uid);

        const uploadResponse = await fetch(`${apiBaseUrl}/local-media/upload`, {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error('Upload failed');
        }

        const uploadResult = await uploadResponse.json();
        
        // // Get file metadata
        // const fileType: "image" | "video" | "audio" = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'audio'; // Default to audio if not image or video

        // Generate thumbnail for videos and get duration
        let thumbnailServerPath = '';
        let duration = 0;
        let size = file.size;

        if (fileType === 'video') {
          const video = document.createElement('video');
          video.src = URL.createObjectURL(file);
          
          thumbnailServerPath = await new Promise((resolve) => {
            video.onloadedmetadata = () => {
              duration = video.duration;
              
              // Seek to a specific time (e.g., 1 second) for better thumbnail
              video.currentTime = Math.min(1, duration / 4); // Seek to 1 second or 1/4 of video duration
            };

            video.onseeked = () => {
              // Generate thumbnail after seeking is complete
              const canvas = document.createElement('canvas');
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.drawImage(video, 0, 0);
                
                // Convert canvas to blob
                canvas.toBlob(async (blob) => {
                  if (blob) {
                    // Upload thumbnail as a separate file
                    const thumbnailFormData = new FormData();
                    const thumbnailName = `${uploadResult.fileName.split('.')[0]}_thumbnail.jpg`;
                    thumbnailFormData.append('file', blob, thumbnailName);
                    thumbnailFormData.append('userId', uid);
                    
                    try {
                      const thumbResponse = await fetch(`${apiBaseUrl}/local-media/upload`, {
                        method: 'POST',
                        body: thumbnailFormData,
                      });
                      
                      if (thumbResponse.ok) {
                        const thumbResult = await thumbResponse.json();
                        resolve(thumbResult.serverPath); // Return the actual thumbnail path
                      } else {
                        console.error('Thumbnail upload failed:', thumbResponse.status, await thumbResponse.text());
                        resolve(''); // Return empty string on failure
                      }
                    } catch (error) {
                      console.error('Failed to upload thumbnail:', error);
                      resolve(''); // Return empty string on failure
                    }
                  } else {
                    resolve(''); // Return empty string if blob creation failed
                  }
                  
                  URL.revokeObjectURL(video.src);
                }, 'image/jpeg', 0.7);
              } else {
                URL.revokeObjectURL(video.src);
                resolve(''); // Return empty string if canvas context failed
              }
            };
          });
        } else if (fileType === 'audio') {
          // Extract audio duration
          const audioUrl = URL.createObjectURL(file);
          duration = await getAudioDuration(audioUrl);
          URL.revokeObjectURL(audioUrl);
        }
        
        // Construct file URLs
        const fileName = uploadResult.fileName || file.name;
        const fileUrl = `${uploadResult.serverPath}`;
        const fileCdnUrl = fileUrl;
        const fileThumbnailUrl = thumbnailServerPath ? 
                                thumbnailServerPath : // Use actual thumbnail path
                                fileUrl; // Fallback to original file for non-videos

        // Call the Zanopy API to register the file
        const apiResponse = await fetch(`${apiBaseUrl}/media/upload-register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            file_url: fileUrl,
            file_cdn_url: fileCdnUrl,
            file_thumbnail_url: fileThumbnailUrl,
            file_category: 'edit_video',
            file_type: fileType,
            user_id: uid,
            user_ref: user_ref,
          }),
        });

        const apiData = await apiResponse.json();
        
        if (apiData.RESULT !== 'SUCCESS') {
          throw new Error('API registration failed');
        }

        // Create LocalMediaFile object
        const newMediaFile: LocalMediaFile = {
          id: apiData.RESPONSE.file_id,
          name: uploadResult.fileName,
          type: fileType,
          path: fileUrl,
          size: uploadResult.size,
          lastModified: Date.now(),
          thumbnail: fileThumbnailUrl,
          duration: duration,
        };

        // Update state with deduplication (add to beginning)
        setLocalMediaFiles((prev) => {
          // Check if file already exists by id
          const existingIndex = prev.findIndex(item => item.id === newMediaFile.id);
          if (existingIndex !== -1) {
            // File already exists, update it instead of adding duplicate
            const updated = [...prev];
            updated[existingIndex] = newMediaFile;
            return updated;
          }
          // File doesn't exist, add to beginning
          return [newMediaFile, ...prev];
        });

        return newMediaFile;
      } catch (error) {
        console.error("Error adding media file:", error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [uid, user_ref]
  );

  /**
   * Remove a media file by ID (Note: No delete API available)
   */
  const removeMediaFile = useCallback(
    async (id: string): Promise<void> => {
      // Since there's no delete API, we'll just remove from local state
      // The file will remain on the server
      console.warn("Delete functionality not available - removing from local view only");
      setLocalMediaFiles((prev) => prev.filter((file) => file.id !== id));
    },
    []
  );

  /**
   * Clear all media files (Note: No delete API available)
   */
  const clearMediaFiles = useCallback(async (): Promise<void> => {
    // Since there's no delete API, we'll just clear local state
    console.warn("Delete functionality not available - clearing local view only");
    setLocalMediaFiles([]);
  }, []);

  const value = {
    localMediaFiles,
    addMediaFile,
    removeMediaFile,
    clearMediaFiles,
    isLoading,
    isLoadingMore,
    loadMoreMedia,
    hasMore,
    loadMediaFiles,
    activeTab,
    setActiveTab,
    filteredMediaFiles,
  };

  return (
    <LocalMediaContext.Provider value={value}>
      {children}
    </LocalMediaContext.Provider>
  );
};

/**
 * Hook to use the local media context
 */
export const useLocalMedia = () => {
  const context = useContext(LocalMediaContext);
  if (context === undefined) {
    throw new Error("useLocalMedia must be used within a LocalMediaProvider");
  }
  return context;
};
