import { useState, useEffect, useCallback } from "react";

interface RenderedAudio {
  id: string;
  renderId: string;
  filename: string;
  url: string;
  s3Url: string;
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

export const useRenderedAudio = () => {
  const [audio, setAudio] = useState<RenderedAudio[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Get UID from URL parameters
  const getUidFromUrl = useCallback(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('uid') || 'default-user';
    }
    return 'default-user';
  }, []);

  const fetchAudio = useCallback(async () => {
    try {
      setIsLoading(true);
      const uid = getUidFromUrl();
      const response = await fetch(`${apiBaseUrl}/save-to-user/get?uid=${uid}`);
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      
      const projectsData = await response.json();
      const allAudio: RenderedAudio[] = [];
      
      // Iterate through each project to get renders
      for (const project of projectsData.projects || []) {
        try {
          const rendersResponse = await fetch(`${apiBaseUrl}/save-to-user/get-renders?uid=${uid}&projectId=${project.id}`);
          if (rendersResponse.ok) {
            const rendersData = await rendersResponse.json();
            
            // Filter only audio renders and transform the data
            const audioRenders = (rendersData.renders || [])
              .filter((render: any) => render.mediaType === 'audio')
              .map((render: any) => ({
                id: render.renderId,
                renderId: render.renderId,
                filename: `${render.renderId}.${render.format}`,
                url: render.s3Url,
                s3Url: render.s3Url,
                size: render.fileSize,
                createdAt: render.timestamp,
                modifiedAt: render.timestamp,
                format: render.format,
                codec: render.codec,
                mediaType: render.mediaType,
                projectId: project.id,
                projectName: project.name
              }));
            
            allAudio.push(...audioRenders);
          }
        } catch (projectError) {
          console.error(`Error fetching renders for project ${project.name}:`, projectError);
        }
      }
      
      // Sort by creation date (newest first)
      allAudio.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setAudio(allAudio);
    } catch (error) {
      console.error('Error fetching rendered audio:', error);
      setAudio([]);
    } finally {
      setIsLoading(false);
    }
  }, [getUidFromUrl]);

  const refetch = useCallback(() => {
    fetchAudio();
  }, [fetchAudio]);

  useEffect(() => {
    fetchAudio();
  }, [fetchAudio]);

  return {
    audio,
    isLoading,
    refetch
  };
};