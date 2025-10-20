// Create a new file: hooks/use-template-loader.ts

import { useCallback } from 'react';
import { useVideoCache } from './use-video-cache';
import { TemplateOverlay, Overlay } from '../types';

export const useTemplateLoader = () => {
  const { downloadVideo } = useVideoCache();

  const loadTemplateWithVideos = useCallback(async (
    template: TemplateOverlay,
    onProgress?: (current: number, total: number) => void
  ): Promise<Overlay[]> => {
    // Count both video and audio overlays that need downloading
    const mediaOverlays = template.overlays.filter(overlay => 
      (overlay.type === 'video' && overlay.originalUrl) ||
      (overlay.type === 'sound' && overlay.originalUrl)
    );
    
    let processedCount = 0;
    
    const processedOverlays = await Promise.all(
      template.overlays.map(async (overlayTemplate, index) => {
        const newOverlay = {
          ...overlayTemplate,
          id: Math.floor(Math.random() * 1000000) + index,
        };

        // If this is a video overlay, we need to re-download the video
        if (newOverlay.type === 'video' && newOverlay.originalUrl) {
          try {
            // Download the video and get a new blob URL
            const newBlobUrl = await downloadVideo(newOverlay.originalUrl);
            
            if (newBlobUrl) {
              // Update the overlay with the new blob URL
              newOverlay.src = newBlobUrl;
            } else {
              // Fallback: use the original URL directly
              console.warn('Failed to download video, using original URL');
              newOverlay.src = newOverlay.originalUrl;
            }
          } catch (error) {
            console.error('Error re-downloading video for template:', error);
            // Fallback: use the original URL directly
            newOverlay.src = newOverlay.originalUrl;
          }
          
          processedCount++;
          if (onProgress) {
            onProgress(processedCount, mediaOverlays.length);
          }
        }

        // If this is a sound overlay, we need to re-download the audio
        if (newOverlay.type === 'sound' && newOverlay.originalUrl) {
          try {
            // Download the audio file
            const response = await fetch(newOverlay.originalUrl);
            const blob = await response.blob();
            const newBlobUrl = URL.createObjectURL(blob);
            
            // Update the overlay with the new blob URL
            newOverlay.src = newBlobUrl;
            // Keep originalUrl as is for rendering
          } catch (error) {
            console.error('Error re-downloading audio for template:', error);
            // Fallback: use the original URL directly
            newOverlay.src = newOverlay.originalUrl;
          }
          
          processedCount++;
          if (onProgress) {
            onProgress(processedCount, mediaOverlays.length);
          }
        }

        return newOverlay;
      })
    );
    
    return processedOverlays;
  }, [downloadVideo]);

  return { loadTemplateWithVideos };
};