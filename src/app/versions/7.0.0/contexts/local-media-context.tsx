"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { LocalMediaFile } from "../types";
import { getUserId } from "../utils/user-id";

interface LocalMediaContextType {
  localMediaFiles: LocalMediaFile[];
  addMediaFile: (file: File) => Promise<LocalMediaFile | void>;
  removeMediaFile: (id: string) => Promise<void>;
  clearMediaFiles: () => Promise<void>;
  isLoading: boolean;
  loadMoreMedia: () => Promise<void>;
  hasMore: boolean;
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

// Add this function to get user IP (you can implement this later)
const getUserIP = async (): Promise<string> => {
  // For now, return empty string as specified
  return '';
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
  const { uid, user_ref } = getUrlParams();

  // Define BASE_URL at the top where API calls are made
  const BASE_URL = 'https://7fi0l9jsbeg17t-3000.proxy.runpod.net/'; // You can change this to your desired base URL

  // Load media files from API on component mount
  useEffect(() => {
    const loadMediaFiles = async () => {
      if (!uid || !user_ref) return;
      
      try {
        setIsLoading(true);
        const response = await fetch('/api/latest/media/get', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: uid,
            user_ref: user_ref,
            start_from: '0',
            max_results: '20',
          }),
        });

        const data = await response.json();
        
        if (data.RESULT === 'SUCCESS' && data.RESPONSE) {
          const files: LocalMediaFile[] = data.RESPONSE.map((item: any) => ({
            id: item.file_id,
            name: item.file_url.split('/').pop() || 'Unknown',
            type: item.file_type,
            path: item.file_url,
            size: 0, // Will be calculated during upload
            lastModified: new Date(item.file_timestamp).getTime(),
            thumbnail: item.file_thumbnail_url,
            duration: 0, // Will be calculated during upload for videos
          }));

          setLocalMediaFiles(files);
          setHasMore(data.RESPONSE.length >= 20);
          setCurrentPage(1);
        }
      } catch (error) {
        console.error("Error loading media files from API:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMediaFiles();
  }, [uid, user_ref]);

  const loadMoreMedia = useCallback(async (): Promise<void> => {
    if (!uid || !user_ref || isLoadingMore || !hasMore) return;
    
    try {
      setIsLoadingMore(true);
      const response = await fetch('/api/latest/media/get', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: uid,
          user_ref: user_ref,
          start_from: (currentPage * 20).toString(),
          max_results: '20',
        }),
      });

      const data = await response.json();
      
      if (data.RESULT === 'SUCCESS' && data.RESPONSE) {
        const newFiles: LocalMediaFile[] = data.RESPONSE.map((item: any) => ({
          id: item.file_id,
          name: item.file_url.split('/').pop() || 'Unknown',
          type: item.file_type,
          path: item.file_url,
          size: 0,
          lastModified: new Date(item.file_timestamp).getTime(),
          thumbnail: item.file_thumbnail_url,
          duration: 0,
        }));

        setLocalMediaFiles(prev => [...prev, ...newFiles]);
        setHasMore(newFiles.length >= 20);
        setCurrentPage(prev => prev + 1);
      }
    } catch (error) {
      console.error("Error loading more media files:", error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [uid, user_ref, currentPage, isLoadingMore, hasMore]);

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
        // Upload file to server using existing API
        const formData = new FormData();
        formData.append('file', file);
        formData.append('userId', uid);

        const uploadResponse = await fetch('/api/latest/local-media/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error('Upload failed');
        }

        const uploadResult = await uploadResponse.json();
        
        // Get file metadata
        const fileType: "image" | "video" | "audio" = file.type.startsWith('image/') ? 'image' : 
                                                      file.type.startsWith('video/') ? 'video' : 
                                                      'audio'; // Default to audio if not image or video
        
        // Generate thumbnail for videos and get duration
        let thumbnail = '';
        let duration = 0;
        let size = file.size;
        
        if (fileType === 'video') {
          const video = document.createElement('video');
          video.src = URL.createObjectURL(file);
          
          await new Promise((resolve) => {
            video.onloadedmetadata = () => {
              duration = video.duration;
              
              // Generate thumbnail
              const canvas = document.createElement('canvas');
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              const ctx = canvas.getContext('2d');
              ctx?.drawImage(video, 0, 0);
              thumbnail = canvas.toDataURL('image/jpeg', 0.7);
              
              URL.revokeObjectURL(video.src);
              resolve(void 0);
            };
          });
        }
        
        // Construct file URLs using the serverPath from your API
        const fileUrl = `${BASE_URL}${uploadResult.serverPath}`;
        const fileCdnUrl = fileUrl;
        const fileThumbnailUrl = thumbnail || fileUrl;
        
        // Call the Zanopy API to register the file
        const apiResponse = await fetch('/api/latest/media/upload-register', {
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

        // Update state with the new media file (add to beginning)
        setLocalMediaFiles((prev) => [newMediaFile, ...prev]);

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
    loadMoreMedia,
    hasMore,
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
