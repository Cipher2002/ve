// utils/lambda-overlay-transformer.ts

import { Overlay, ClipOverlay, SoundOverlay, ImageOverlay } from '../types';

/**
 * Transforms overlays for Lambda rendering by replacing blob URLs with original URLs
 * 
 * This function ensures that all media overlays use their original URLs instead of 
 * blob URLs when sending data to Lambda functions, since Lambda can't access browser blob URLs.
 * 
 * @param overlays - Array of overlay objects from the editor
 * @returns Transformed overlays safe for Lambda rendering
 */
export const transformOverlaysForLambda = (overlays: Overlay[]): Overlay[] => {
  return overlays.map(overlay => {
    // Handle video overlays
    if (overlay.type === 'video') {
      const videoOverlay = overlay as ClipOverlay;
      
      return {
        ...videoOverlay,
        src: getOriginalUrl(videoOverlay),
        // Keep content as is (might be used for other purposes)
        content: videoOverlay.content || videoOverlay.originalUrl || videoOverlay.src,
      };
    }
    
    // Handle sound overlays
    if (overlay.type === 'sound') {
      const soundOverlay = overlay as SoundOverlay;
      
      return {
        ...soundOverlay,
        src: getOriginalUrlForSound(soundOverlay),
        content: soundOverlay.content || soundOverlay.src,
      };
    }
    
    // Handle image overlays
    if (overlay.type === 'image') {
      const imageOverlay = overlay as ImageOverlay;
      
      return {
        ...imageOverlay,
        src: getOriginalUrlForImage(imageOverlay),
        content: imageOverlay.content || imageOverlay.src,
      };
    }
    
    // For other overlay types (text, shape, caption, sticker), return as-is
    return overlay;
  });
};

/**
 * Gets the original URL for a video overlay, prioritizing non-blob URLs
 */
const getOriginalUrl = (videoOverlay: ClipOverlay): string => {
  // If originalUrl exists and is not a blob, use it
  if (videoOverlay.originalUrl && !videoOverlay.originalUrl.startsWith('blob:')) {
    return videoOverlay.originalUrl;
  }
  
  // If content exists and is not a blob, use it
  if (videoOverlay.content && !videoOverlay.content.startsWith('blob:')) {
    return videoOverlay.content;
  }
  
  // If src is not a blob, use it
  if (videoOverlay.src && !videoOverlay.src.startsWith('blob:')) {
    return videoOverlay.src;
  }
  
  // Fallback: if all are blob URLs, log warning and use originalUrl
  console.log('All URLs for video overlay are blob URLs, Lambda rendering may fail:', videoOverlay);
  return videoOverlay.originalUrl || videoOverlay.content || videoOverlay.src;
};

/**
 * Gets the original URL for a sound overlay, prioritizing non-blob URLs
 */
const getOriginalUrlForSound = (soundOverlay: SoundOverlay): string => {
  // Similar logic for sound overlays
  if (soundOverlay.content && !soundOverlay.content.startsWith('blob:')) {
    return soundOverlay.content;
  }
  
  if (soundOverlay.src && !soundOverlay.src.startsWith('blob:')) {
    return soundOverlay.src;
  }

  console.log('All URLs for sound overlay are blob URLs, Lambda rendering may fail:', soundOverlay);
  return soundOverlay.content || soundOverlay.src;
};

/**
 * Gets the original URL for an image overlay, prioritizing non-blob URLs
 */
const getOriginalUrlForImage = (imageOverlay: ImageOverlay): string => {
  // Similar logic for image overlays
  if (imageOverlay.content && !imageOverlay.content.startsWith('blob:')) {
    return imageOverlay.content;
  }
  
  if (imageOverlay.src && !imageOverlay.src.startsWith('blob:')) {
    return imageOverlay.src;
  }

  console.log('All URLs for image overlay are blob URLs, Lambda rendering may fail:', imageOverlay);
  return imageOverlay.src;
};