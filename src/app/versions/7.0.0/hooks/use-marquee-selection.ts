import { useState, useCallback, useEffect, useRef } from 'react';
import { Overlay } from '../types';
import { ROW_HEIGHT } from '../constants';

interface UseMarqueeSelectionProps {
  timelineRef: React.RefObject<HTMLDivElement | null>;
  overlays: Overlay[];
  totalDuration: number;
  visibleRows: number;
  selectedOverlayIds: number[];
  onSelectedOverlaysChange: (ids: number[]) => void;
  isDragging?: boolean;
  isContextMenuOpen?: boolean;
}

export const useMarqueeSelection = ({
  timelineRef,
  overlays,
  totalDuration,
  visibleRows,
  selectedOverlayIds,
  onSelectedOverlaysChange,
  isDragging = false,
  isContextMenuOpen = false,
}: UseMarqueeSelectionProps) => {
  const [isMarqueeSelecting, setIsMarqueeSelecting] = useState(false);
  const [marqueeStartPoint, setMarqueeStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [marqueeEndPoint, setMarqueeEndPoint] = useState<{ x: number; y: number } | null>(null);
  const marqueeThrottleRef = useRef<number | null>(null);

  const handleTimelineMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // Only left mouse button, not during drag or context menu
      if (e.button !== 0 || isDragging || isContextMenuOpen) return;

      // Don't start marquee if clicking on timeline items or markers
      const target = e.target as HTMLElement;
      if (
        target.closest('[data-timeline-item]') || 
        target.closest('[data-timeline-marker]') ||
        target.closest('.timeline-item')
      ) {
        return;
      }

      if (timelineRef?.current) {
        e.preventDefault();
        e.stopPropagation();

        const rect = timelineRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        setIsMarqueeSelecting(true);
        setMarqueeStartPoint({ x, y });
        setMarqueeEndPoint({ x, y });

        // Clear selection unless Shift is held
        if (!e.shiftKey) {
          onSelectedOverlaysChange([]);
        }
      }
    },
    [isDragging, isContextMenuOpen, timelineRef, onSelectedOverlaysChange]
  );

  const handleMarqueeMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isMarqueeSelecting || !timelineRef?.current || !marqueeStartPoint || isContextMenuOpen) {
        return;
      }

      // Throttle with requestAnimationFrame
      if (marqueeThrottleRef.current) {
        cancelAnimationFrame(marqueeThrottleRef.current);
      }

      marqueeThrottleRef.current = requestAnimationFrame(() => {
        const rect = timelineRef.current?.getBoundingClientRect();
        if (!rect) return;

        const currentEndPoint = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        };
        setMarqueeEndPoint(currentEndPoint);

        // Calculate marquee rectangle
        const marqueeRect = {
          x1: Math.min(marqueeStartPoint.x, currentEndPoint.x),
          y1: Math.min(marqueeStartPoint.y, currentEndPoint.y),
          x2: Math.max(marqueeStartPoint.x, currentEndPoint.x),
          y2: Math.max(marqueeStartPoint.y, currentEndPoint.y),
        };

        // Find overlays within marquee
        const newlySelectedIds = new Set<number>();
        const containerWidth = rect.width;

        overlays.forEach((overlay) => {
          // Calculate overlay position
          const itemLeftPx = (overlay.from / totalDuration) * containerWidth;
          const itemRightPx = ((overlay.from + overlay.durationInFrames) / totalDuration) * containerWidth;
          const itemTopPx = overlay.row * ROW_HEIGHT;
          const itemBottomPx = itemTopPx + ROW_HEIGHT;

          // Check overlap with marquee
          const xOverlaps = marqueeRect.x1 < itemRightPx && marqueeRect.x2 > itemLeftPx;
          const yOverlaps = marqueeRect.y1 < itemBottomPx && marqueeRect.y2 > itemTopPx;

          if (xOverlaps && yOverlaps) {
            newlySelectedIds.add(overlay.id);
          }
        });

        // Update selection if changed
        const currentSet = new Set(selectedOverlayIds);
        if (
          newlySelectedIds.size !== currentSet.size ||
          !Array.from(newlySelectedIds).every(id => currentSet.has(id))
        ) {
          onSelectedOverlaysChange(Array.from(newlySelectedIds));
        }
      });
    },
    [
      isMarqueeSelecting,
      timelineRef,
      marqueeStartPoint,
      isContextMenuOpen,
      overlays,
      totalDuration,
      selectedOverlayIds,
      onSelectedOverlaysChange,
    ]
  );

  const handleMarqueeMouseUp = useCallback(() => {
    if (isMarqueeSelecting) {
      if (marqueeThrottleRef.current) {
        cancelAnimationFrame(marqueeThrottleRef.current);
        marqueeThrottleRef.current = null;
      }

      setIsMarqueeSelecting(false);
      setMarqueeStartPoint(null);
      setMarqueeEndPoint(null);
      return true;
    }
    return false;
  }, [isMarqueeSelecting]);

  // Reset marquee when context menu opens or dragging starts
  useEffect(() => {
    if ((isContextMenuOpen || isDragging) && isMarqueeSelecting) {
      setIsMarqueeSelecting(false);
      setMarqueeStartPoint(null);
      setMarqueeEndPoint(null);
    }
  }, [isContextMenuOpen, isDragging, isMarqueeSelecting]);

  return {
    isMarqueeSelecting,
    marqueeStartPoint,
    marqueeEndPoint,
    handleTimelineMouseDown,
    handleMarqueeMouseMove,
    handleMarqueeMouseUp,
  };
};