import React, { useState, useRef, useCallback } from "react";

interface CropOverlayProps {
  containerWidth: number;
  containerHeight: number;
  initialCrop?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  onCropChange: (crop: { x: number; y: number; width: number; height: number }) => void;
  onCropComplete: (crop: { x: number; y: number; width: number; height: number }) => void;
  onCancel: () => void;
}

export const CropOverlay: React.FC<CropOverlayProps> = ({
  containerWidth,
  containerHeight,
  initialCrop,
  onCropChange,
  onCropComplete,
  onCancel,
}) => {
  const [crop, setCrop] = useState(
    initialCrop || {
      x: containerWidth * 0.1,
      y: containerHeight * 0.1,
      width: containerWidth * 0.8,
      height: containerHeight * 0.8,
    }
  );

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragType, setDragType] = useState<'move' | 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w' | null>(null);

  const overlayRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((
    e: React.MouseEvent,
    type: 'move' | 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w'
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDragType(type);
    setDragStart({ x: e.clientX, y: e.clientY });
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !dragType) return;

    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;

    setCrop(prevCrop => {
      let newCrop = { ...prevCrop };

      switch (dragType) {
        case 'move':
          newCrop.x = Math.max(0, Math.min(containerWidth - newCrop.width, prevCrop.x + deltaX));
          newCrop.y = Math.max(0, Math.min(containerHeight - newCrop.height, prevCrop.y + deltaY));
          break;
        case 'nw':
          const nwDeltaX = Math.min(deltaX, prevCrop.width - 50);
          const nwDeltaY = Math.min(deltaY, prevCrop.height - 50);
          newCrop.x = Math.max(0, prevCrop.x + nwDeltaX);
          newCrop.y = Math.max(0, prevCrop.y + nwDeltaY);
          newCrop.width = prevCrop.width - nwDeltaX;
          newCrop.height = prevCrop.height - nwDeltaY;
          break;
        case 'ne':
          const neDeltaY = Math.min(deltaY, prevCrop.height - 50);
          newCrop.y = Math.max(0, prevCrop.y + neDeltaY);
          newCrop.width = Math.min(containerWidth - prevCrop.x, Math.max(50, prevCrop.width + deltaX));
          newCrop.height = prevCrop.height - neDeltaY;
          break;
        case 'sw':
          const swDeltaX = Math.min(deltaX, prevCrop.width - 50);
          newCrop.x = Math.max(0, prevCrop.x + swDeltaX);
          newCrop.width = prevCrop.width - swDeltaX;
          newCrop.height = Math.min(containerHeight - prevCrop.y, Math.max(50, prevCrop.height + deltaY));
          break;
        case 'se':
          newCrop.width = Math.min(containerWidth - prevCrop.x, Math.max(50, prevCrop.width + deltaX));
          newCrop.height = Math.min(containerHeight - prevCrop.y, Math.max(50, prevCrop.height + deltaY));
          break;
        case 'n':
          const nDeltaY = Math.min(deltaY, prevCrop.height - 50);
          newCrop.y = Math.max(0, prevCrop.y + nDeltaY);
          newCrop.height = prevCrop.height - nDeltaY;
          break;
        case 's':
          newCrop.height = Math.min(containerHeight - prevCrop.y, Math.max(50, prevCrop.height + deltaY));
          break;
        case 'e':
          newCrop.width = Math.min(containerWidth - prevCrop.x, Math.max(50, prevCrop.width + deltaX));
          break;
        case 'w':
          const wDeltaX = Math.min(deltaX, prevCrop.width - 50);
          newCrop.x = Math.max(0, prevCrop.x + wDeltaX);
          newCrop.width = prevCrop.width - wDeltaX;
          break;
      }

      onCropChange(newCrop);
      return newCrop;
    });

    setDragStart({ x: e.clientX, y: e.clientY });
  }, [isDragging, dragType, dragStart, containerWidth, containerHeight, onCropChange]);

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      setDragType(null);
    }
  }, [isDragging]);

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={overlayRef}
      className="absolute inset-0 z-50"
      style={{ pointerEvents: 'auto' }}
    >
      {/* Overlay backdrop */}
      <div className="absolute inset-0 bg-black/50" />
      
      {/* Crop area */}
      <div
        className="absolute border-2 border-white bg-transparent"
        style={{
          left: crop.x,
          top: crop.y,
          width: crop.width,
          height: crop.height,
        }}
      >
        {/* Move handle - the entire crop area */}
        <div
          className="absolute inset-0 cursor-move"
          onMouseDown={(e) => handleMouseDown(e, 'move')}
        />

        {/* Corner handles */}
        <div
          className="absolute -top-1 -left-1 w-3 h-3 bg-white border border-gray-400 cursor-nw-resize"
          onMouseDown={(e) => handleMouseDown(e, 'nw')}
        />
        <div
          className="absolute -top-1 -right-1 w-3 h-3 bg-white border border-gray-400 cursor-ne-resize"
          onMouseDown={(e) => handleMouseDown(e, 'ne')}
        />
        <div
          className="absolute -bottom-1 -left-1 w-3 h-3 bg-white border border-gray-400 cursor-sw-resize"
          onMouseDown={(e) => handleMouseDown(e, 'sw')}
        />
        <div
          className="absolute -bottom-1 -right-1 w-3 h-3 bg-white border border-gray-400 cursor-se-resize"
          onMouseDown={(e) => handleMouseDown(e, 'se')}
        />

        {/* Edge handles */}
        <div
          className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-white border border-gray-400 cursor-n-resize"
          onMouseDown={(e) => handleMouseDown(e, 'n')}
        />
        <div
          className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-white border border-gray-400 cursor-s-resize"
          onMouseDown={(e) => handleMouseDown(e, 's')}
        />
        <div
          className="absolute top-1/2 -left-1 transform -translate-y-1/2 w-3 h-3 bg-white border border-gray-400 cursor-w-resize"
          onMouseDown={(e) => handleMouseDown(e, 'w')}
        />
        <div
          className="absolute top-1/2 -right-1 transform -translate-y-1/2 w-3 h-3 bg-white border border-gray-400 cursor-e-resize"
          onMouseDown={(e) => handleMouseDown(e, 'e')}
        />
      </div>

      {/* Control buttons */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded-md transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => onCropComplete(crop)}
          className="px-4 py-2 bg-[rgb(41,0,156)] hover:bg-[rgb(31,0,126)] text-white text-sm rounded-md transition-colors"
        >
          Apply Crop
        </button>
      </div>
    </div>
  );
};