import { useState, useEffect, useCallback } from "react";

interface RenderedAudio {
  id: string;
  filename: string;
  url: string;
  size: number;
  createdAt: string;
  modifiedAt: string;
}

//SETTING THE API BASE URL
const apiBaseUrl = window.location.hostname === 'devmagix.zanopy.ai' 
  ? 'https://devmagix.zanopy.ai/vedit/api/latest' 
  : 'https://zanopy.ai/vedit/api/latest';

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
      const response = await fetch(`${apiBaseUrl}/rendered-audio?uid=${uid}&t=${Date.now()}`);
      const data = await response.json();
      setAudio(data);
    } catch (error) {
      console.error('Error fetching rendered audio:', error);
      setAudio([]);
    } finally {
      setIsLoading(false);
    }
  }, [getUidFromUrl]);

  const deleteAudio = useCallback(async (audioId: string) => {
    // Optimistically remove from UI
    setAudio(prev => prev.filter(a => a.id !== audioId));
    
    try {
      const uid = getUidFromUrl();
      await fetch(`${apiBaseUrl}/rendered-audio/${audioId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uid }),
      });
    } catch (error) {
      console.error('Error deleting audio:', error);
      // Refetch to restore state on error
      fetchAudio();
    }
  }, [fetchAudio, getUidFromUrl]);

  const refetch = useCallback(() => {
    fetchAudio();
  }, [fetchAudio]);

  useEffect(() => {
    fetchAudio();
  }, [fetchAudio]);

  return {
    audio,
    isLoading,
    refetch,
    deleteAudio
  };
};