import { useState, useCallback, useRef } from 'react';
import { calculateMousePosition } from '../utils';

/**
 * Custom hook to handle timeline mouse interactions
 * Uses CSS custom properties for ghost marker positioning to avoid React re-renders
 */
export const useTimelineInteractions = (timelineRef: React.RefObject<HTMLDivElement>) => {
  // Keep only essential React state that actually needs to trigger re-renders
  const [isDragging, setIsDragging] = useState(false);
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
  
  // Throttle mouse move updates to improve performance
  const throttleRef = useRef<number | null>(null);
  const lastPositionRef = useRef<number | null>(null);
  const isGhostMarkerVisibleRef = useRef<boolean>(false);

  // Handle mouse movement using CSS custom properties (no React re-renders!)
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging && timelineRef.current) {
      // Cancel previous throttled call
      if (throttleRef.current) {
        cancelAnimationFrame(throttleRef.current);
      }
      
      // Throttle using requestAnimationFrame for smooth 60fps updates
      throttleRef.current = requestAnimationFrame(() => {
        const element = timelineRef.current;
        if (!element) return;
        
        const rect = element.getBoundingClientRect();
        const position = calculateMousePosition(e.clientX, rect);
        
        // Only update if position has changed significantly
        if (lastPositionRef.current === null || Math.abs(position - lastPositionRef.current) > 0.1) {
          // Update CSS custom property directly - NO REACT RE-RENDER!
          element.style.setProperty('--ghost-marker-position', `${position}%`);
          element.style.setProperty('--ghost-marker-visible', '1');
          
          lastPositionRef.current = position;
          isGhostMarkerVisibleRef.current = true;
        }
      });
    }
  }, [isDragging, timelineRef]);

  // Handle mouse leave to hide ghost marker
  const handleMouseLeave = useCallback(() => {
    // Cancel any pending throttled updates
    if (throttleRef.current) {
      cancelAnimationFrame(throttleRef.current);
      throttleRef.current = null;
    }
    
    // Hide ghost marker using CSS custom property - NO REACT RE-RENDER!
    if (timelineRef.current && isGhostMarkerVisibleRef.current) {
      timelineRef.current.style.setProperty('--ghost-marker-visible', '0');
      isGhostMarkerVisibleRef.current = false;
    }
    
    lastPositionRef.current = null;
  }, [timelineRef]);

  return {
    ghostMarkerPosition: null, // Legacy prop for backward compatibility - always null now
    isDragging,
    isContextMenuOpen,
    setIsDragging,
    setIsContextMenuOpen,
    handleMouseMove,
    handleMouseLeave,
  };
}; 