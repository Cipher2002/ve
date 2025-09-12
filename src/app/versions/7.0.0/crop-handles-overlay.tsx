import React, { useCallback, useState, useRef, useEffect } from "react";
import { useEditorContext } from "./contexts/editor-context";
import { ImageOverlay, ClipOverlay, OverlayType } from "./types";

interface CropHandlesOverlayProps {
  overlayId: number;
}

export const CropHandlesOverlay: React.FC<CropHandlesOverlayProps> = ({
  overlayId,
}) => {
  const {
    overlays,
    selectedOverlayId,
    updateCropData,
    exitCropMode,
    applyCrop,
    getAspectRatioDimensions,
    playerDimensions,
  } = useEditorContext();

  const [isDragging, setIsDragging] = useState(false);
  const [dragHandle, setDragHandle] = useState<string | null>(null);
  const [cropRect, setCropRect] = useState({ x: 0.1, y: 0.1, width: 0.8, height: 0.8 });
  const containerRef = useRef<HTMLDivElement>(null);

  const overlay = overlays.find(o => o.id === overlayId) as ImageOverlay | ClipOverlay | undefined;

  useEffect(() => {
    if (overlay && overlay.cropData) {
      setCropRect(overlay.cropData);
    }
  }, [overlay]);

  const handleMouseDown = useCallback((e: React.MouseEvent, handle: string) => {
    e.preventDefault();
    setIsDragging(true);
    setDragHandle(handle);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !dragHandle || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const relativeX = (e.clientX - rect.left) / rect.width;
    const relativeY = (e.clientY - rect.top) / rect.height;

    setCropRect(prev => {
      let newRect = { ...prev };

      switch (dragHandle) {
        case 'top-left':
          newRect.width = Math.max(0.1, prev.width + (prev.x - relativeX));
          newRect.height = Math.max(0.1, prev.height + (prev.y - relativeY));
          newRect.x = Math.max(0, Math.min(relativeX, prev.x + prev.width - 0.1));
          newRect.y = Math.max(0, Math.min(relativeY, prev.y + prev.height - 0.1));
          break;
        case 'top-right':
          newRect.width = Math.max(0.1, relativeX - prev.x);
          newRect.height = Math.max(0.1, prev.height + (prev.y - relativeY));
          newRect.y = Math.max(0, Math.min(relativeY, prev.y + prev.height - 0.1));
          break;
        case 'bottom-left':
          newRect.width = Math.max(0.1, prev.width + (prev.x - relativeX));
          newRect.height = Math.max(0.1, relativeY - prev.y);
          newRect.x = Math.max(0, Math.min(relativeX, prev.x + prev.width - 0.1));
          break;
        case 'bottom-right':
          newRect.width = Math.max(0.1, relativeX - prev.x);
          newRect.height = Math.max(0.1, relativeY - prev.y);
          break;
        case 'move':
          const deltaX = relativeX - (prev.x + prev.width / 2);
          const deltaY = relativeY - (prev.y + prev.height / 2);
          newRect.x = Math.max(0, Math.min(1 - prev.width, prev.x + deltaX));
          newRect.y = Math.max(0, Math.min(1 - prev.height, prev.y + deltaY));
          break;
      }

      // Ensure bounds
      newRect.x = Math.max(0, Math.min(1 - newRect.width, newRect.x));
      newRect.y = Math.max(0, Math.min(1 - newRect.height, newRect.y));
      newRect.width = Math.max(0.1, Math.min(1 - newRect.x, newRect.width));
      newRect.height = Math.max(0.1, Math.min(1 - newRect.y, newRect.height));

      return newRect;
    });
  }, [isDragging, dragHandle]);

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      setDragHandle(null);
      updateCropData(overlayId, cropRect);
    }
  }, [isDragging, overlayId, cropRect, updateCropData]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  console.log('CropHandlesOverlay render check:', {
    overlay: !!overlay,
    selectedOverlayId,
    overlayId,
    playerDimensions,
    aspectRatio: getAspectRatioDimensions()
  });

  if (!overlay || selectedOverlayId !== overlayId) {
    console.log('CropHandlesOverlay early return:', { overlay: !!overlay, selectedOverlayId, overlayId });
    return null;
  }

  console.log('CropHandlesOverlay rendering with cropRect:', cropRect);

  // Calculate the actual image/video dimensions and position within the player
  const { width: compositionWidth, height: compositionHeight } = getAspectRatioDimensions();
  
  // Find the actual rendered size of the image/video (it might be letterboxed)
  const containerAspect = playerDimensions.width / playerDimensions.height;
  const contentAspect = compositionWidth / compositionHeight;
  
  let actualContentWidth, actualContentHeight, offsetX, offsetY;
  
  if (contentAspect > containerAspect) {
    // Content is wider - fit to width, letterbox top/bottom
    actualContentWidth = Math.min(playerDimensions.width, compositionWidth);
    actualContentHeight = actualContentWidth / contentAspect;
    offsetX = 0;
    offsetY = (playerDimensions.height - actualContentHeight) / 2;
  } else {
    // Content is taller - fit to height, letterbox left/right
    actualContentHeight = Math.min(playerDimensions.height, compositionHeight);
    actualContentWidth = actualContentHeight * contentAspect;
    offsetX = (playerDimensions.width - actualContentWidth) / 2;
    offsetY = 0;
  }

  return (
    <div 
      ref={containerRef}
      className="absolute z-50"
      style={{
        width: actualContentWidth,
        height: actualContentHeight,
        left: '50%',
        top: '50%',
        transform: `translate(${-50 + (offsetX / playerDimensions.width) * 100}%, ${-50 + (offsetY / playerDimensions.height) * 100}%)`,
        border: '2px solid yellow', // Debug border for content area
        background: 'rgba(255, 255, 0, 0.1)', // Debug background
      }}
    >
      {/* Dark overlay outside crop area */}
      <div className="absolute inset-0 bg-black bg-opacity-50">
        {/* Clear window inside crop area */}
        <div
          className="absolute border-2 border-white shadow-lg"
          style={{
            left: `${cropRect.x * 100}%`,
            top: `${cropRect.y * 100}%`,
            width: `${cropRect.width * 100}%`,
            height: `${cropRect.height * 100}%`,
            background: 'transparent',
          }}
        >
          {/* Corner handles */}
          {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((handle) => (
            <div
              key={handle}
              className={`absolute w-3 h-3 bg-white border-2 border-blue-500 cursor-${
                handle.includes('top') ? (handle.includes('left') ? 'nw' : 'ne') : (handle.includes('left') ? 'sw' : 'se')
              }-resize`}
              style={{
                [handle.includes('top') ? 'top' : 'bottom']: -6,
                [handle.includes('left') ? 'left' : 'right']: -6,
              }}
              onMouseDown={(e) => handleMouseDown(e, handle)}
            />
          ))}
          
          {/* Move handle (center) */}
          <div
            className="absolute w-4 h-4 bg-white border-2 border-blue-500 cursor-move rounded-full"
            style={{
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
            }}
            onMouseDown={(e) => handleMouseDown(e, 'move')}
          />
        </div>
      </div>
      
      {/* Control buttons */}
      <div className="absolute bottom-4 right-4 flex gap-2">
        <button
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          onClick={() => exitCropMode()}
        >
          Cancel
        </button>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={() => applyCrop(overlayId)}
        >
          Apply
        </button>
      </div>
    </div>
  );
};