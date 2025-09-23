import React, { useState, useCallback, useMemo } from "react";
import { useCurrentScale } from "remotion";
import { ClipOverlay } from "../../../types";

interface CropOverlayProps {
  overlay: ClipOverlay;
  onCropChange: (crop: { x: number; y: number; width: number; height: number }) => void;
}

export const CropOverlay: React.FC<CropOverlayProps> = ({ overlay, onCropChange }) => {
    const scale = useCurrentScale();
  const HANDLE_SIZE = 12;
  const size = Math.round(HANDLE_SIZE / scale);
  const borderSize = 1 / scale;
  
  const handleStyle: React.CSSProperties = useMemo(() => ({
    position: "absolute",
    height: Number.isFinite(size) ? size : HANDLE_SIZE,
    width: Number.isFinite(size) ? size : HANDLE_SIZE,
    backgroundColor: "white",
    border: `${borderSize}px solid #3B8BF2`,
    pointerEvents: "auto",
  }), [size, borderSize]);

  const margin = -size / 2 - borderSize;
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string>("");
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

//   const handleMouseDown = useCallback((e: React.MouseEvent, action: "drag" | "resize", handle?: string) => {
//     e.preventDefault();
//     e.stopPropagation();
    
//     const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
//     setDragStart({
//       x: e.clientX - rect.left,
//       y: e.clientY - rect.top,
//     });

//     if (action === "drag") {
//       setIsDragging(true);
//     } else if (action === "resize" && handle) {
//       setIsResizing(true);
//       setResizeHandle(handle);
//     }
//   }, []);

const handleMouseDown = useCallback((e: React.MouseEvent, action: "drag" | "resize", handle?: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Get the container rect instead of the current target rect
    const containerRect = document.querySelector(`[data-crop-container="${overlay.id}"]`)?.getBoundingClientRect();
    if (!containerRect) return;
    
    setDragStart({
      x: e.clientX - containerRect.left,
      y: e.clientY - containerRect.top,
    });

    if (action === "drag") {
      setIsDragging(true);
    } else if (action === "resize" && handle) {
      setIsResizing(true);
      setResizeHandle(handle);
    }
  }, [overlay.id]);

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
    zIndex: 10000,
  };

//   const handleStyle: React.CSSProperties = {
//     position: "absolute",
//     width: "12px",
//     height: "12px",
//     backgroundColor: "white",
//     border: "1px solid #3B8BF2",
//     cursor: "nw-resize",
//     pointerEvents: "auto",
//   };

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
        style={{ 
          ...handleStyle, 
          marginLeft: margin,
          marginTop: margin,
          cursor: "nw-resize"
        }}
        onMouseDown={(e) => handleMouseDown(e, "resize", "top-left")}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      />
      <div
        style={{ 
          ...handleStyle, 
          marginTop: margin,
          marginRight: margin,
          right: 0,
          cursor: "ne-resize"
        }}
        onMouseDown={(e) => handleMouseDown(e, "resize", "top-right")}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      />
      <div
        style={{ 
          ...handleStyle, 
          marginBottom: margin,
          marginLeft: margin,
          bottom: 0,
          cursor: "sw-resize"
        }}
        onMouseDown={(e) => handleMouseDown(e, "resize", "bottom-left")}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      />
      <div
        style={{ 
          ...handleStyle, 
          marginBottom: margin,
          marginRight: margin,
          right: 0,
          bottom: 0,
          cursor: "se-resize"
        }}
        onMouseDown={(e) => handleMouseDown(e, "resize", "bottom-right")}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      />
      
      {/* Edge handles */}
      <div
        style={{
          ...handleStyle,
          marginTop: margin,
          left: "50%",
          transform: "translateX(-50%)",
          cursor: "n-resize",
        }}
        onMouseDown={(e) => handleMouseDown(e, "resize", "top")}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      />
      <div
        style={{
          ...handleStyle,
          marginBottom: margin,
          left: "50%",
          bottom: 0,
          transform: "translateX(-50%)",
          cursor: "s-resize",
        }}
        onMouseDown={(e) => handleMouseDown(e, "resize", "bottom")}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      />
      
      <div
        style={{
          ...handleStyle,
          marginLeft: margin,
          top: "50%",
          transform: "translateY(-50%)",
          cursor: "w-resize",
        }}
        onMouseDown={(e) => handleMouseDown(e, "resize", "left")}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      />
      <div
        style={{
          ...handleStyle,
          marginRight: margin,
          top: "50%",
          right: 0,
          transform: "translateY(-50%)",
          cursor: "e-resize",
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
        Crop Area ({Math.round(crop.width * overlay.width)}x{Math.round(crop.height * overlay.height)})
      </div>
    </div>
  );
}; 