import React from "react";

interface TimelineMarqueeSelectionProps {
  isMarqueeSelecting: boolean;
  marqueeStartPoint: { x: number; y: number } | null;
  marqueeEndPoint: { x: number; y: number } | null;
}

export const TimelineMarqueeSelection: React.FC<TimelineMarqueeSelectionProps> = ({
  isMarqueeSelecting,
  marqueeStartPoint,
  marqueeEndPoint,
}) => {
  if (!isMarqueeSelecting || !marqueeStartPoint || !marqueeEndPoint) {
    return null;
  }

  return (
    <div
      className="absolute border-[1.5px] border-blue-500 pointer-events-none rounded-sm z-50"
      style={{
        left: Math.min(marqueeStartPoint.x, marqueeEndPoint.x),
        top: Math.min(marqueeStartPoint.y, marqueeEndPoint.y),
        width: Math.abs(marqueeEndPoint.x - marqueeStartPoint.x),
        height: Math.abs(marqueeEndPoint.y - marqueeStartPoint.y),
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        backgroundImage:
          "repeating-linear-gradient(45deg, rgba(59, 130, 246, 0.2), rgba(59, 130, 246, 0.2) 10px, rgba(59, 130, 246, 0.1) 10px, rgba(59, 130, 246, 0.1) 20px)",
      }}
    />
  );
};