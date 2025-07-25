/**
 * Video Cache Manager Hook
 * 
 * Manages downloading, caching, and cleanup of videos for the timeline
 */

import { useCallback, useEffect, useRef } from 'react';
import { 
  addCachedVideo, 
  getCachedVideo, 
  deleteCachedVideo, 
  cleanupExpiredVideos,
  clearAllCachedVideos 
} from '../utils/indexdb-helper';

export const useVideoCache = () => {
  const downloadingVideos = useRef<Set<string>>(new Set());
  const cleanupIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Set up periodic cleanup (every hour)
  useEffect(() => {
    const startCleanupInterval = () => {
      cleanupIntervalRef.current = setInterval(async () => {
        try {
          const deletedCount = await cleanupExpiredVideos();
          if (deletedCount > 0) {
            console.log(`Cleaned up ${deletedCount} expired cached videos`);
          }
        } catch (error) {
          console.error('Error during periodic video cache cleanup:', error);
        }
      }, 60 * 60 * 1000); // Run every hour
    };

    startCleanupInterval();

    // Cleanup on browser close/refresh
    const handleBeforeUnload = () => {
      clearAllCachedVideos();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      if (cleanupIntervalRef.current) {
        clearInterval(cleanupIntervalRef.current);
      }
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  /**
   * Download and cache a video with progress tracking
   */
  const downloadVideo = useCallback(async (
    url: string, 
    onProgress?: (progress: number) => void
  ): Promise<string | null> => {
    // Check if already downloading
    if (downloadingVideos.current.has(url)) {
      console.log('Video already being downloaded:', url);
      return null;
    }

    // Check cache first
    const cachedUrl = await getCachedVideo(url);
    if (cachedUrl) {
      console.log('Video found in cache:', url);
      return cachedUrl;
    }

    // Start download
    downloadingVideos.current.add(url);
    
    try {
      console.log('Downloading video for cache:', url);
      
      // Use your proxy endpoint to download the video
      const proxyUrl = `/api/latest/video/download?url=${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to download video: ${response.status}`);
      }

      // Get total size for progress calculation
      const contentLength = response.headers.get('Content-Length');
      const totalSize = contentLength ? parseInt(contentLength, 10) : 0;
      
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Failed to get response reader');
      }

      const chunks: Uint8Array[] = [];
      let downloadedSize = 0;

      // Read the stream and track progress
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        chunks.push(value);
        downloadedSize += value.length;
        
        // Report progress
        if (totalSize > 0 && onProgress) {
          const progress = Math.round((downloadedSize / totalSize) * 100);
          onProgress(progress);
        }
      }

      // Combine all chunks into a single blob
      const blob = new Blob(chunks, { type: 'video/mp4' });
      const filename = url.split('/').pop() || 'video.mp4';
      
      // Cache the video
      const success = await addCachedVideo(url, blob, filename);
      
      if (success) {
        console.log('Video cached successfully:', url);
        return URL.createObjectURL(blob);
      } else {
        console.error('Failed to cache video:', url);
        return null;
      }
      
    } catch (error) {
      console.error('Error downloading video:', error);
      return null;
    } finally {
      downloadingVideos.current.delete(url);
    }
  }, []);

  /**
   * Get cached video URL (creates blob URL)
   */
  const getCachedVideoUrl = useCallback(async (url: string): Promise<string | null> => {
    return await getCachedVideo(url);
  }, []);

  /**
   * Remove video from cache
   */
  const removeCachedVideo = useCallback(async (url: string): Promise<boolean> => {
    console.log('Removing video from cache:', url);
    return await deleteCachedVideo(url);
  }, []);

  /**
   * Check if video should be deleted when removed from timeline
   * Only delete if not accessed recently (within last 2 hours)
   */
  const shouldDeleteOnRemove = useCallback(async (url: string): Promise<boolean> => {
    try {
      // For now, we'll keep it simple and not delete immediately on remove
      // This allows users to re-add the same video without re-downloading
      return false;
    } catch (error) {
      console.error('Error checking if should delete video:', error);
      return false;
    }
  }, []);

  /**
   * Clean up expired videos manually
   */
  const cleanupNow = useCallback(async (): Promise<number> => {
    console.log('Starting manual video cache cleanup...');
    return await cleanupExpiredVideos();
  }, []);

  /**
   * Clear entire cache
   */
  const clearCache = useCallback(async (): Promise<boolean> => {
    console.log('Clearing entire video cache...');
    return await clearAllCachedVideos();
  }, []);

  return {
    downloadVideo,
    getCachedVideoUrl,
    removeCachedVideo,
    shouldDeleteOnRemove,
    cleanupNow,
    clearCache,
    isDownloading: (url: string) => downloadingVideos.current.has(url),
  };
};