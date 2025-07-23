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

  const fetchVideos = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/latest/ssr/list');
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
  }, []);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const deleteVideo = useCallback(async (videoId: string) => {
    try {
        const response = await fetch('/api/latest/ssr/delete', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ videoId }),
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
    }, [fetchVideos]);

    return {
        videos,
        isLoading,
        error,
        refetch: fetchVideos,
        deleteVideo,
    };
};