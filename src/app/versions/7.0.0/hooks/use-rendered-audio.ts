import { useState, useEffect } from "react";

interface RenderedAudio {
  id: string;
  filename: string;
  url: string;
  size: number;
  createdAt: string;
  modifiedAt: string;
}

export const useRenderedAudio = () => {
  const [audio, setAudio] = useState<RenderedAudio[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAudio = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/latest/rendered-audio');
      const data = await response.json();
      setAudio(data);
    } catch (error) {
      console.error('Error fetching rendered audio:', error);
      setAudio([]);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAudio = async (audioId: string) => {
    // Optimistically remove from UI
    setAudio(prev => prev.filter(a => a.id !== audioId));
    
    try {
      await fetch(`/api/latest/rendered-audio/${audioId}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Error deleting audio:', error);
      // Refetch to restore state on error
      fetchAudio();
    }
  };

  const refetch = () => {
    fetchAudio();
  };

  useEffect(() => {
    fetchAudio();
  }, []);

  return {
    audio,
    isLoading,
    refetch,
    deleteAudio
  };
};