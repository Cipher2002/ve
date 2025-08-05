import { useState, useEffect, useCallback } from 'react';

interface RenderedVideo {
  id: string;
  filename: string;
  url: string;
  thumbnail: string | null;
  size: number;
  createdAt: string;
  modifiedAt: string;
}

export const useRenderedVideos = () => {
  const [videos, setVideos] = useState<RenderedVideo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get UID from URL parameters
  const getUidFromUrl = useCallback(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('uid') || 'default-user';
    }
    return 'default-user';
  }, []);

  const fetchVideos = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const uid = getUidFromUrl();
      const response = await fetch(`/vedit/api/latest/ssr/list?uid=${uid}&t=${Date.now()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch rendered videos');
      }
      
      const data = await response.json();
      setVideos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [getUidFromUrl]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const deleteVideo = useCallback(async (videoId: string) => {
    try {
      const uid = getUidFromUrl();
      const response = await fetch('/vedit/api/latest/ssr/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ videoId, uid }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete video');
      }

      // Refresh the video list after deletion
      await fetchVideos();
      return true;
    } catch (err) {
      console.error('Error deleting video:', err);
      return false;
    }
  }, [fetchVideos, getUidFromUrl]);

  return {
    videos,
    isLoading,
    error,
    refetch: fetchVideos,
    deleteVideo,
  };
};