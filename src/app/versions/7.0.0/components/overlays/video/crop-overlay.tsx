import React, { useState, useCallback, useMemo } from "react";
import { useCurrentScale } from "remotion";
import { ClipOverlay, ImageOverlay } from "../../../types";

interface CropOverlayProps {
  overlay: ClipOverlay | ImageOverlay;
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

const handleMouseDown = useCallback((e: React.MouseEvent, action: "drag" | "resize", handle?: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const crop = overlay.styles.crop;
    if (!crop) return;
    
    // Get the container rect for mouse position calculation
    const containerRect = document.querySelector(`[data-crop-container="${overlay.id}"]`)?.getBoundingClientRect();
    if (!containerRect) return;
    
    const relativeX = e.clientX - containerRect.left;
    const relativeY = e.clientY - containerRect.top;
    
    if (action === "drag") {
      // For dragging, store the offset from the current crop position
      setDragStart({
        x: relativeX - (crop.x * overlay.width),
        y: relativeY - (crop.y * overlay.height),
      });
      setIsDragging(true);
    } else if (action === "resize" && handle) {
      // For resizing, store the offset from the handle's anchor point
      let anchorX = 0;
      let anchorY = 0;
      
      if (handle.includes("left")) {
        anchorX = crop.x * overlay.width;
      } else if (handle.includes("right")) {
        anchorX = (crop.x + crop.width) * overlay.width;
      } else {
        // Middle handles (top/bottom only)
        anchorX = (crop.x + crop.width / 2) * overlay.width;
      }
      
      if (handle.includes("top")) {
        anchorY = crop.y * overlay.height;
      } else if (handle.includes("bottom")) {
        anchorY = (crop.y + crop.height) * overlay.height;
      } else {
        // Middle handles (left/right only)
        anchorY = (crop.y + crop.height / 2) * overlay.height;
      }
      
      setDragStart({
        x: relativeX - anchorX,
        y: relativeY - anchorY,
      });
      setIsResizing(true);
      setResizeHandle(handle);
    }
  }, [overlay.id, overlay.styles.crop, overlay.width, overlay.height]);

const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging && !isResizing) return;

    // Get the mouse position relative to the crop overlay's container
    const containerRect = document.querySelector(`[data-crop-container="${overlay.id}"]`)?.getBoundingClientRect();
    if (!containerRect) return;

    const relativeX = e.clientX - containerRect.left;
    const relativeY = e.clientY - containerRect.top;
    const crop = overlay.styles.crop;
    if (!crop) return;

    if (isDragging) {
      // For dragging, dragStart contains the offset from crop position
      const newX = Math.max(0, Math.min(1 - crop.width, (relativeX - dragStart.x) / overlay.width));
      const newY = Math.max(0, Math.min(1 - crop.height, (relativeY - dragStart.y) / overlay.height));
      
      onCropChange({ x: newX, y: newY, width: crop.width, height: crop.height });
    } else if (isResizing) {
      // For resizing, adjust mouse position by the drag start offset
      const adjustedX = relativeX - dragStart.x;
      const adjustedY = relativeY - dragStart.y;
      const adjustedXPercent = adjustedX / overlay.width;
      const adjustedYPercent = adjustedY / overlay.height;

      let newWidth = crop.width;
      let newHeight = crop.height;
      let newX = crop.x;
      let newY = crop.y;

      const minSizePercent = 50 / Math.max(overlay.width, overlay.height); // Minimum 50px converted to percentage

      if (resizeHandle.includes("right")) {
        newWidth = Math.max(minSizePercent, Math.min(1 - crop.x, adjustedXPercent - crop.x));
      }
      if (resizeHandle.includes("left")) {
        const oldRight = crop.x + crop.width;
        newX = Math.max(0, Math.min(oldRight - minSizePercent, adjustedXPercent));
        newWidth = oldRight - newX;
      }
      if (resizeHandle.includes("bottom")) {
        newHeight = Math.max(minSizePercent, Math.min(1 - crop.y, adjustedYPercent - crop.y));
      }
      if (resizeHandle.includes("top")) {
        const oldBottom = crop.y + crop.height;
        newY = Math.max(0, Math.min(oldBottom - minSizePercent, adjustedYPercent));
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