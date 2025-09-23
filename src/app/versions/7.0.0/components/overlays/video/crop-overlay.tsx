import React, { useState, useCallback } from "react";
import { ClipOverlay } from "../../../types";

interface CropOverlayProps {
  overlay: ClipOverlay;
  onCropChange: (crop: { x: number; y: number; width: number; height: number }) => void;
}

export const CropOverlay: React.FC<CropOverlayProps> = ({ overlay, onCropChange }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string>("");
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent, action: "drag" | "resize", handle?: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDragStart({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });

    if (action === "drag") {
      setIsDragging(true);
    } else if (action === "resize" && handle) {
      setIsResizing(true);
      setResizeHandle(handle);
    }
  }, []);

//   const handleMouseMove = useCallback((e: MouseEvent) => {
//     if (!isDragging && !isResizing) return;

//     // Get the mouse position relative to the crop overlay's container
//     const containerRect = document.querySelector(`[data-crop-container="${overlay.id}"]`)?.getBoundingClientRect();
//     if (!containerRect) return;

//     const relativeX = e.clientX - containerRect.left;
//     const relativeY = e.clientY - containerRect.top;
//     const crop = overlay.styles.crop;
//     if (!crop) return;

//     if (isDragging) {
//       const newX = Math.max(0, Math.min(overlay.width - crop.width, relativeX - dragStart.x));
//       const newY = Math.max(0, Math.min(overlay.height - crop.height, relativeY - dragStart.y));
      
//       onCropChange({ x: newX, y: newY, width: crop.width, height: crop.height });
//     } else if (isResizing) {
//       let newWidth = crop.width;
//       let newHeight = crop.height;
//       let newX = crop.x;
//       let newY = crop.y;

//       if (resizeHandle.includes("right")) {
//         newWidth = Math.max(50, Math.min(overlay.width - crop.x, relativeX - crop.x));
//       }
//       if (resizeHandle.includes("left")) {
//         const oldRight = crop.x + crop.width;
//         newX = Math.max(0, Math.min(oldRight - 50, relativeX));
//         newWidth = oldRight - newX;
//       }
//       if (resizeHandle.includes("bottom")) {
//         newHeight = Math.max(50, Math.min(overlay.height - crop.y, relativeY - crop.y));
//       }
//       if (resizeHandle.includes("top")) {
//         const oldBottom = crop.y + crop.height;
//         newY = Math.max(0, Math.min(oldBottom - 50, relativeY));
//         newHeight = oldBottom - newY;
//       }

//       onCropChange({ x: newX, y: newY, width: newWidth, height: newHeight });
//     }
//   }, [isDragging, isResizing, dragStart, overlay, resizeHandle, onCropChange]);

const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging && !isResizing) return;

    // Get the mouse position relative to the crop overlay's container
    const containerRect = document.querySelector(`[data-crop-container="${overlay.id}"]`)?.getBoundingClientRect();
    if (!containerRect) return;

    const relativeX = e.clientX - containerRect.left;
    const relativeY = e.clientY - containerRect.top;
    const crop = overlay.styles.crop;
    if (!crop) return;

    // Convert to percentages
    const relativeXPercent = relativeX / overlay.width;
    const relativeYPercent = relativeY / overlay.height;
    const dragStartXPercent = dragStart.x / overlay.width;
    const dragStartYPercent = dragStart.y / overlay.height;

    if (isDragging) {
      const newX = Math.max(0, Math.min(1 - crop.width, relativeXPercent - dragStartXPercent));
      const newY = Math.max(0, Math.min(1 - crop.height, relativeYPercent - dragStartYPercent));
      
      onCropChange({ x: newX, y: newY, width: crop.width, height: crop.height });
    } else if (isResizing) {
      let newWidth = crop.width;
      let newHeight = crop.height;
      let newX = crop.x;
      let newY = crop.y;

      const minSizePercent = 50 / Math.max(overlay.width, overlay.height); // Minimum 50px converted to percentage

      if (resizeHandle.includes("right")) {
        newWidth = Math.max(minSizePercent, Math.min(1 - crop.x, relativeXPercent - crop.x));
      }
      if (resizeHandle.includes("left")) {
        const oldRight = crop.x + crop.width;
        newX = Math.max(0, Math.min(oldRight - minSizePercent, relativeXPercent));
        newWidth = oldRight - newX;
      }
      if (resizeHandle.includes("bottom")) {
        newHeight = Math.max(minSizePercent, Math.min(1 - crop.y, relativeYPercent - crop.y));
      }
      if (resizeHandle.includes("top")) {
        const oldBottom = crop.y + crop.height;
        newY = Math.max(0, Math.min(oldBottom - minSizePercent, relativeYPercent));
        newHeight = oldBottom - newY;
      }

      onCropChange({ x: newX, y: newY, width: newWidth, height: newHeight });
    }
  }, [isDragging, isResizing, dragStart, overlay, resizeHandle, onCropChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle("");
  }, []);

  React.useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  const crop = overlay.styles.crop;
  if (!crop?.enabled) return null;

//   const cropStyle: React.CSSProperties = {
//     position: "absolute",
//     left: `${crop.x}px`,
//     top: `${crop.y}px`,
//     width: `${crop.width}px`,
//     height: `${crop.height}px`,
//     border: "2px solid #3b82f6",
//     backgroundColor: "rgba(59, 130, 246, 0.1)",
//     cursor: isDragging ? "grabbing" : "grab",
//     pointerEvents: "auto",
//     zIndex: 1000,
//   };
const cropStyle: React.CSSProperties = {
    position: "absolute",
    left: `${crop.x * overlay.width}px`,
    top: `${crop.y * overlay.height}px`,
    width: `${crop.width * overlay.width}px`,
    height: `${crop.height * overlay.height}px`,
    border: "2px solid #3b82f6",
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    cursor: isDragging ? "grabbing" : "grab",
    pointerEvents: "auto",
    zIndex: 1000,
  };

  const handleStyle: React.CSSProperties = {
    position: "absolute",
    width: "8px",
    height: "8px",
    backgroundColor: "#3b82f6",
    border: "1px solid white",
    cursor: "nw-resize",
    pointerEvents: "auto",
  };

  return (
    <div
      style={cropStyle}
      onMouseDown={(e) => handleMouseDown(e, "drag")}
      onPointerDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      data-crop-overlay
    >
      {/* Resize handles */}
      <div
        style={{ ...handleStyle, top: "-4px", left: "-4px", cursor: "nw-resize" }}
        onMouseDown={(e) => handleMouseDown(e, "resize", "top-left")}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      />
      <div
        style={{ ...handleStyle, top: "-4px", right: "-4px", cursor: "ne-resize" }}
        onMouseDown={(e) => handleMouseDown(e, "resize", "top-right")}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      />
      <div
        style={{ ...handleStyle, bottom: "-4px", left: "-4px", cursor: "sw-resize" }}
        onMouseDown={(e) => handleMouseDown(e, "resize", "bottom-left")}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      />
      <div
        style={{ ...handleStyle, bottom: "-4px", right: "-4px", cursor: "se-resize" }}
        onMouseDown={(e) => handleMouseDown(e, "resize", "bottom-right")}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      />
      
      {/* Edge handles */}
      <div
        style={{
          position: "absolute",
          top: "-4px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "8px",
          height: "8px",
          backgroundColor: "#3b82f6",
          border: "1px solid white",
          cursor: "n-resize",
          pointerEvents: "auto",
        }}
        onMouseDown={(e) => handleMouseDown(e, "resize", "top")}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-4px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "8px",
          height: "8px",
          backgroundColor: "#3b82f6",
          border: "1px solid white",
          cursor: "s-resize",
          pointerEvents: "auto",
        }}
        onMouseDown={(e) => handleMouseDown(e, "resize", "bottom")}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      />
      
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "-4px",
          transform: "translateY(-50%)",
          width: "8px",
          height: "8px",
          backgroundColor: "#3b82f6",
          border: "1px solid white",
          cursor: "w-resize",
          pointerEvents: "auto",
        }}
        onMouseDown={(e) => handleMouseDown(e, "resize", "left")}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      />
      <div
        style={{
          position: "absolute",
          top: "50%",
          right: "-4px",
          transform: "translateY(-50%)",
          width: "8px",
          height: "8px",
          backgroundColor: "#3b82f6",
          border: "1px solid white",
          cursor: "e-resize",
          pointerEvents: "auto",
        }}
        onMouseDown={(e) => handleMouseDown(e, "resize", "right")}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      />

      {/* Crop area label */}
      {/* <div
        style={{
          position: "absolute",
          top: "-24px",
          left: "0",
          backgroundColor: "#3b82f6",
          color: "white",
          padding: "2px 6px",
          fontSize: "12px",
          borderRadius: "4px",
          whiteSpace: "nowrap",
        }}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        Crop Area ({Math.round(crop.width)}×{Math.round(crop.height)})
      </div> */}

      <div
        style={{
          position: "absolute",
          top: "-24px",
          left: "0",
          backgroundColor: "#3b82f6",
          color: "white",
          padding: "2px 6px",
          fontSize: "12px",
          borderRadius: "4px",
          whiteSpace: "nowrap",
        }}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        Crop Area ({Math.round(crop.width * overlay.width)}×{Math.round(crop.height * overlay.height)})
      </div>
    </div>
  );
}; 