import { useState, useEffect, useCallback } from 'react';

interface RenderedVideo {
  id: string;
  renderId: string;
  filename: string;
  url: string;
  s3Url: string;
  thumbnailPath: string | null;
  size: number;
  createdAt: string;
  modifiedAt: string;
  format: string;
  codec: string;
  mediaType: string;
  projectId: string;
  projectName: string;
}

//SETTING THE API BASE URL
const apiBaseUrl = 'https://zanopy.ai/vedit/api/latest';

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
      const response = await fetch(`${apiBaseUrl}/save-to-user/get?uid=${uid}`);
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      
      const projectsData = await response.json();
      const allVideos: RenderedVideo[] = [];
      
      // Iterate through each project to get renders
      for (const project of projectsData.projects || []) {
        try {
          const rendersResponse = await fetch(`${apiBaseUrl}/save-to-user/get-renders?uid=${uid}&projectId=${project.id}`);
          if (rendersResponse.ok) {
            const rendersData = await rendersResponse.json();
            
            // Filter only video renders and transform the data
            const videoRenders = (rendersData.renders || [])
              .filter((render: any) => render.mediaType === 'video')
              .map((render: any) => ({
                id: render.renderId,
                renderId: render.renderId,
                filename: `${render.renderId}.${render.format}`,
                url: render.s3Url,
                s3Url: render.s3Url,
                thumbnailPath: render.thumbnailPath,
                size: render.fileSize,
                createdAt: render.timestamp,
                modifiedAt: render.timestamp,
                format: render.format,
                codec: render.codec,
                mediaType: render.mediaType,
                projectId: project.id,
                projectName: project.name
              }));
            
            allVideos.push(...videoRenders);
          }
        } catch (projectError) {
          console.error(`Error fetching renders for project ${project.name}:`, projectError);
        }
      }
      
      // Sort by creation date (newest first)
      allVideos.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setVideos(allVideos);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [getUidFromUrl]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  return {
    videos,
    isLoading,
    error,
    refetch: fetchVideos,
  };
};