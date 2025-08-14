import { useState, useEffect, useRef } from "react";
import { Overlay } from "../types";
import { TIMELINE_DURATION_LIMIT_FRAMES } from "../constants";

export const useTimelineDurationWarning = (overlays: Overlay[]) => {
  const [showWarning, setShowWarning] = useState(false);
  const [hasShownWarningInSession, setHasShownWarningInSession] = useState(false);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate current timeline duration (same logic as useCompositionDuration)
  const currentDuration = overlays.length > 0 
    ? overlays.reduce((maxEnd, overlay) => {
        const endFrame = overlay.from + overlay.durationInFrames;
        return Math.max(maxEnd, endFrame);
      }, 0)
    : 0;

  const isOverLimit = currentDuration > TIMELINE_DURATION_LIMIT_FRAMES;

  // Reset session when user gets back under the limit
  useEffect(() => {
    if (!isOverLimit && hasShownWarningInSession) {
      setHasShownWarningInSession(false);
    }
  }, [isOverLimit, hasShownWarningInSession]);

  const triggerWarningIfNeeded = () => {
    if (isOverLimit && !hasShownWarningInSession && !showWarning) {
      setShowWarning(true);
      setHasShownWarningInSession(true);

      // Auto-dismiss after 3 seconds
      warningTimeoutRef.current = setTimeout(() => {
        setShowWarning(false);
      }, 3000);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
    };
  }, []);

  return {
    showWarning,
    isOverLimit,
    currentDuration,
    triggerWarningIfNeeded,
  };
};