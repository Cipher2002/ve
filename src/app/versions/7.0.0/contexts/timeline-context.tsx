import React, { createContext, useContext, useRef, useMemo, useEffect } from "react";
import { useTimelineZoom } from "../hooks/use-timeline-zoom";
import { useVisibleRows } from "../hooks/use-visible-rows";
import { useOverlays } from "../hooks/use-overlays";

/**
 * Context interface for managing timeline state and interactions.
 * @interface TimelineContextType
 */
interface TimelineContextType {
  /** Number of currently visible rows in the timeline */
  visibleRows: number;
  /** Update the number of visible rows */
  setVisibleRows: (rows: number) => void;
  /** Add a new row to the timeline */
  addRow: () => void;
  /** Remove the last row from the timeline */
  removeRow: () => void;
  /** Reference to the timeline DOM element */
  timelineRef: React.RefObject<HTMLDivElement | null>;
  /** Current zoom level of the timeline */
  zoomScale: number;
  /** Update the zoom scale */
  setZoomScale: (scale: number) => void;
  /** Current horizontal scroll position */
  scrollPosition: number;
  /** Update the scroll position */
  setScrollPosition: (position: number) => void;
  /** Handle zoom interactions with delta and client X position */
  handleZoom: (delta: number, clientX: number) => void;
  /** Handle zoom interactions from wheel events */
  handleWheelZoom: (event: WheelEvent) => void;
}

/**
 * Context for sharing timeline state and functionality across components.
 */
export const TimelineContext = createContext<TimelineContextType | null>(null);

/**
 * Provider component that manages timeline state and makes it available to child components.
 * Combines functionality from multiple hooks to handle timeline interactions.
 *
 * @component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components that will have access to the timeline context
 */
export const TimelineProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // const { resetOverlays, shiftOverlaysDown, shiftOverlaysUp } = useOverlays();
  
  // const { visibleRows, setVisibleRows, addRow, removeRow } = useVisibleRows(
  //   () => {
  //     // This callback will be called when a row is actually added
  //     shiftOverlaysDown();
  //   },
  //   () => {
  //     // This callback will be called when a row is actually removed
  //     shiftOverlaysUp();
  //   }
  // );
  const { visibleRows, setVisibleRows, addRow, removeRow } = useVisibleRows(
    () => {
      // Dispatch custom event that the Timeline component will handle
      console.log('Dispatching addRowRequested event');
      window.dispatchEvent(new CustomEvent('addRowRequested'));
    },
    () => {
      // Dispatch custom event for remove row
      console.log('Dispatching removeRowRequested event');
      window.dispatchEvent(new CustomEvent('removeRowRequested'));
    }
  );

  const timelineRef = useRef<HTMLDivElement>(null);

  const {
    zoomScale,
    scrollPosition,
    setZoomScale,
    setScrollPosition,
    handleZoom,
    handleWheelZoom,
  } = useTimelineZoom(timelineRef);

  // Listen for timeline row adjustment events
    useEffect(() => {
      const handleAdjustRows = (event: CustomEvent) => {
        const { requiredRows } = event.detail;
        if (requiredRows > visibleRows && requiredRows <= 11) {
          setVisibleRows(requiredRows);
        }
      };

      window.addEventListener('adjustTimelineRows', handleAdjustRows as EventListener);
      return () => window.removeEventListener('adjustTimelineRows', handleAdjustRows as EventListener);
    }, [visibleRows, setVisibleRows]);

  const value = useMemo(
    () => ({
      visibleRows,
      setVisibleRows,
      addRow,
      removeRow,
      timelineRef,
      zoomScale,
      setZoomScale,
      scrollPosition,
      setScrollPosition,
      handleZoom,
      handleWheelZoom,
    }),
    [
      visibleRows,
      addRow,
      removeRow,
      timelineRef,
      zoomScale,
      setZoomScale,
      scrollPosition,
      setScrollPosition,
      handleZoom,
      handleWheelZoom,
    ]
  );

  return (
    <TimelineContext.Provider value={value}>
      {children}
    </TimelineContext.Provider>
  );
};

/**
 * Hook to access timeline context and functionality.
 * Must be used within a TimelineProvider component.
 *
 * @returns {TimelineContextType} Timeline context object containing state and methods
 * @throws {Error} If used outside of a TimelineProvider
 */
export const useTimeline = () => {
  const context = useContext(TimelineContext);
  if (!context) {
    throw new Error("useTimeline must be used within a TimelineProvider");
  }
  return context;
};
