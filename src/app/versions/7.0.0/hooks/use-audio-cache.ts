/**
 * Audio Cache Manager Hook
 * 
 * Manages downloading, caching, and cleanup of audio for the timeline
 */

import { useCallback, useEffect, useRef } from 'react';
import { 
  addCachedVideo, 
  getCachedVideo, 
  deleteCachedVideo, 
  cleanupExpiredVideos,
  clearAllCachedVideos 
} from '../utils/indexdb-helper';

//SETTING THE API BASE URL
const apiBaseUrl = 'https://zanopy.ai/vedit/api/latest';

export const useAudioCache = () => {
  const downloadingAudio = useRef<Set<string>>(new Set());
  const cleanupIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Set up periodic cleanup (every hour)
  useEffect(() => {
    const startCleanupInterval = () => {
      cleanupIntervalRef.current = setInterval(async () => {
        try {
          const deletedCount = await cleanupExpiredVideos();
        } catch (error) {
          console.error('Error during periodic audio cache cleanup:', error);
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
   * Download and cache an audio file with progress tracking
   */
  const downloadAudio = useCallback(async (
    url: string, 
    onProgress?: (progress: number) => void
  ): Promise<string | null> => {
    // Check if already downloading
    if (downloadingAudio.current.has(url)) {
      return null;
    }

    // Check cache first
    const cachedUrl = await getCachedVideo(url);
    if (cachedUrl) {
      return cachedUrl;
    }

    // Start download
    downloadingAudio.current.add(url);
    
    try {
      
      // Use the video proxy endpoint to download the audio (it can handle any media file)
      const proxyUrl = `${apiBaseUrl}/video/download?url=${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to download audio: ${response.status}`);
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
      const blob = new Blob(chunks.map(chunk => new Uint8Array(chunk as unknown as ArrayBuffer)), { type: 'audio/mpeg' });
      const filename = url.split('/').pop() || 'audio.mp3';
      
      // Cache the audio
      const success = await addCachedVideo(url, blob, filename);
      
      if (success) {
        return URL.createObjectURL(blob);
      } else {
        console.error('Failed to cache audio:', url);
        return null;
      }
      
    } catch (error) {
      console.error('Error downloading audio:', error);
      return null;
    } finally {
      downloadingAudio.current.delete(url);
    }
  }, []);

  /**
   * Get cached audio URL (creates blob URL)
   */
  const getCachedAudioUrl = useCallback(async (url: string): Promise<string | null> => {
    return await getCachedVideo(url);
  }, []);

  /**
   * Remove audio from cache
   */
  const removeCachedAudio = useCallback(async (url: string): Promise<boolean> => {
    return await deleteCachedVideo(url);
  }, []);

  /**
   * Check if audio should be deleted when removed from timeline
   * Only delete if not accessed recently (within last 2 hours)
   */
  const shouldDeleteOnRemove = useCallback(async (url: string): Promise<boolean> => {
    try {
      // For now, we'll keep it simple and not delete immediately on remove
      // This allows users to re-add the same audio without re-downloading
      return false;
    } catch (error) {
      console.error('Error checking if should delete audio:', error);
      return false;
    }
  }, []);

  /**
   * Clean up expired audio manually
   */
  const cleanupNow = useCallback(async (): Promise<number> => {
    return await cleanupExpiredVideos();
  }, []);

  /**
   * Clear entire cache
   */
  const clearCache = useCallback(async (): Promise<boolean> => {
    return await clearAllCachedVideos();
  }, []);

  return {
    downloadAudio,
    getCachedAudioUrl,
    removeCachedAudio,
    shouldDeleteOnRemove,
    cleanupNow,
    clearCache,
    isDownloading: (url: string) => downloadingAudio.current.has(url),
  };
};