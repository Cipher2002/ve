import React, { useMemo, useState, useCallback, useRef } from "react";

/**
 * Props for the TimelineMarker component.
 * @interface TimelineMarkerProps
 * @property {number} currentFrame - The current frame position in the timeline.
 * @property {number} totalDuration - The total duration of the timeline.
 * @property {function} onSeek - Callback function when marker is dragged to new position.
 */
interface TimelineMarkerProps {
  currentFrame: number;
  totalDuration: number;
  onSeek?: (frame: number) => void;
}

/**
 * TimelineMarker component displays a marker on a timeline to indicate the current position.
 * It renders a vertical line with a draggable triangle pointer at the top.
 *
 * @component
 * @param {TimelineMarkerProps} props - The props for the TimelineMarker component.
 * @returns {React.ReactElement} A React element representing the timeline marker.
 */
const TimelineMarker: React.FC<TimelineMarkerProps> = React.memo(
  ({ currentFrame, totalDuration, onSeek }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [dragFrame, setDragFrame] = useState<number | null>(null);
    const timelineContainerRef = useRef<HTMLElement | null>(null);

    // Use dragFrame if dragging, otherwise use currentFrame
    const displayFrame = isDragging && dragFrame !== null ? dragFrame : currentFrame;

    // Calculate the marker's position with higher precision
    const markerPosition = useMemo(() => {
      const position = (displayFrame / totalDuration) * 100;
      return `${Math.round(position * 10000) / 10000}%`;
    }, [displayFrame, totalDuration]);

    const findTimelineContainer = useCallback(() => {
      // Look for the timeline container - it should be the div with timeline markers
      const markers = document.querySelector('[data-timeline-marker="root"]');
      return markers?.parentElement || null;
    }, []);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Find and cache the timeline container
      timelineContainerRef.current = findTimelineContainer();
      if (!timelineContainerRef.current) {
        console.warn('Timeline container not found');
        return;
      }

      setIsDragging(true);
      setDragFrame(currentFrame); // Start with current frame
    }, [currentFrame, findTimelineContainer]);

    const handleMouseMove = useCallback(
      (e: MouseEvent) => {
        if (!isDragging || !timelineContainerRef.current) return;

        const rect = timelineContainerRef.current.getBoundingClientRect();
        const relativeX = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, relativeX / rect.width));
        const newFrame = Math.round(percentage * totalDuration);
        
        // Update the drag frame for visual feedback
        setDragFrame(newFrame);
        
        // Call onSeek immediately for real-time feedback
        if (onSeek) {
          onSeek(newFrame);
        }
      },
      [isDragging, onSeek, totalDuration]
    );

    const handleMouseUp = useCallback(() => {
      setIsDragging(false);
      setDragFrame(null);
      timelineContainerRef.current = null;
    }, []);

    // Add global mouse event listeners when dragging
    React.useEffect(() => {
      if (isDragging) {
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = 'grabbing';
        document.body.style.userSelect = 'none';
        
        return () => {
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
          document.body.style.cursor = '';
          document.body.style.userSelect = '';
        };
      }
    }, [isDragging, handleMouseMove, handleMouseUp]);

    return (
      <div
        className="absolute top-0 w-[2px] bg-red-500/90 dark:bg-red-500 pointer-events-none z-50"
        style={{
          left: markerPosition,
          transform: "translateX(-50%)",
          height: "calc(100% + 0px)",
          top: "0px",
          willChange: "left",
        }}
      >
        {/* Draggable triangle pointer at the top of the marker */}
        <div
          className={`w-0 h-0 absolute top-[0px] left-1/2 transform -translate-x-1/2
            border-l-[5px] border-r-[5px] border-t-[8px] 
            border-l-transparent border-r-transparent 
            border-t-red-500/90 dark:border-t-red-500
            pointer-events-auto cursor-grab active:cursor-grabbing
            hover:border-t-red-600 dark:hover:border-t-red-400
            transition-colors duration-150
            ${isDragging ? 'border-t-red-600 dark:border-t-red-400' : ''}`}
          onMouseDown={handleMouseDown}
          title="Drag to seek"
        />
        
        {/* Visible draggable handle on the vertical line */}
        <div
          className={`absolute left-1/2 transform -translate-x-1/2 w-3 h-6 
            bg-red-500/90 dark:bg-red-500 rounded-sm
            pointer-events-auto cursor-grab active:cursor-grabbing
            hover:bg-red-600 dark:hover:bg-red-400
            transition-colors duration-150 shadow-sm
            flex items-center justify-center
            ${isDragging ? 'bg-red-600 dark:bg-red-400 scale-110' : ''}`}
          style={{ 
            top: "50%",
            marginTop: "-12px",
          }}
          onMouseDown={handleMouseDown}
          title="Drag to seek"
        >
          {/* Three small dots to indicate it's draggable */}
          <div className="flex flex-col gap-[1px]">
            <div className="w-[2px] h-[2px] bg-white/80 rounded-full"></div>
            <div className="w-[2px] h-[2px] bg-white/80 rounded-full"></div>
            <div className="w-[2px] h-[2px] bg-white/80 rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }
);

TimelineMarker.displayName = "TimelineMarker";

export default TimelineMarker;