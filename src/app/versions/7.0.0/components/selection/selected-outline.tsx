import React, { useCallback, useMemo } from "react";
import { useCurrentScale } from "remotion";
import { ResizeHandle } from "./resize-handle";
import { Overlay, OverlayType } from "../../types";
import { RotateHandle } from "./rotate-handle";

/**
 * SelectionOutline is a component that renders a draggable, resizable outline around selected overlays.
 * It provides visual feedback and interaction handles for manipulating overlay elements.
 *
 * @component
 * @param {Object} props
 * @param {Overlay} props.overlay - The overlay object containing position, size, and other properties
 * @param {Function} props.changeOverlay - Callback to update overlay properties
 * @param {Function} props.setSelectedOverlayId - Function to update the currently selected overlay
 * @param {number|null} props.selectedOverlayId - ID of the currently selected overlay
 * @param {boolean} props.isDragging - Whether the overlay is currently being dragged
 */
export const SelectionOutline: React.FC<{
  overlay: Overlay;
  allOverlays: Overlay[];  // ADD THIS
  changeOverlay: (
    overlayId: number,
    updater: (overlay: Overlay) => Overlay
  ) => void;
  setSelectedOverlayId: React.Dispatch<React.SetStateAction<number | null>>;
  selectedOverlayId: number | null;
  selectedOverlayIds?: number[];
  isDragging: boolean;
}> = ({
  overlay,
  allOverlays,  // ADD THIS
  changeOverlay,
  setSelectedOverlayId,
  selectedOverlayId,
  selectedOverlayIds = [],
  isDragging,
}) => {
  const scale = useCurrentScale();
  const scaledBorder = Math.ceil(1 / scale);

  const [hovered, setHovered] = React.useState(false);

  const onMouseEnter = useCallback(() => {
    setHovered(true);
  }, []);

  const onMouseLeave = useCallback(() => {
    setHovered(false);
  }, []);

  const isSelected = overlay.id === selectedOverlayId;

  const style: React.CSSProperties = useMemo(() => {
    // Selection outlines should match layer stacking
    // But start at 1000 to be above content
    // e.g. row 4 = z-index 960, row 0 = z-index 1000
    const baseZIndex = 1000 - (overlay.row || 0) * 10;

    // Selected items get an additional boost
    const selectionBoost = isSelected ? 1000 : 0;
    const zIndex = baseZIndex + selectionBoost;

    return {
      width: Number.isFinite(overlay.width) ? overlay.width : 0,
      height: Number.isFinite(overlay.height) ? overlay.height : 0,
      left: overlay.left,
      top: overlay.top,
      position: "absolute",
      // outline:
      //   (hovered && !isDragging) || isSelected
      //     ? `${scaledBorder}px solid #3B8BF2`
      //     : undefined,

      outline:
        ((hovered && !isDragging) || isSelected) && 
        !((overlay.type === OverlayType.VIDEO || overlay.type === OverlayType.IMAGE) && (overlay as any).styles?.crop?.enabled)
          ? `${scaledBorder}px solid #3B8BF2`
          : undefined,
      transform: `rotate(${overlay.rotation || 0}deg)`,
      transformOrigin: "center center",
      userSelect: "none",
      touchAction: "none",
      zIndex,
      pointerEvents: ((overlay.type === OverlayType.VIDEO || overlay.type === OverlayType.IMAGE) && (overlay as any).styles?.crop?.enabled) ? "none" : "all",
      // hovered || isDragging ? "all" : isSelected ? "none" : "all",
      cursor: "pointer",
    };
  }, [overlay, hovered, isDragging, isSelected, scaledBorder]);

  const startDragging = useCallback(
    (e: PointerEvent | React.MouseEvent, draggedOverlays: Overlay[]) => {
      const initialX = e.clientX;
      const initialY = e.clientY;

      const onPointerMove = (pointerMoveEvent: PointerEvent) => {
        const offsetX = (pointerMoveEvent.clientX - initialX) / scale;
        const offsetY = (pointerMoveEvent.clientY - initialY) / scale;
        
        // Update all selected overlays
        draggedOverlays.forEach(draggedOverlay => {
          changeOverlay(draggedOverlay.id, (o) => {
            return {
              ...o,
              left: Math.round(draggedOverlay.left + offsetX),
              top: Math.round(draggedOverlay.top + offsetY),
              isDragging: true,
            };
          });
        });
      };

      const onPointerUp = () => {
        // Reset dragging state for all overlays
        draggedOverlays.forEach(draggedOverlay => {
          changeOverlay(draggedOverlay.id, (o) => {
            return {
              ...o,
              isDragging: false,
            };
          });
        });
        window.removeEventListener("pointermove", onPointerMove);
      };

      window.addEventListener("pointermove", onPointerMove, { passive: true });

      window.addEventListener("pointerup", onPointerUp, {
        once: true,
      });
    },
    [scale, changeOverlay]
  );

  const onPointerDown = useCallback(
    (e: React.MouseEvent, allOverlays: Overlay[]) => {
      e.stopPropagation();
      if (e.button !== 0) {
        return;
      }

      setSelectedOverlayId(overlay.id);
      
      // Determine which overlays to drag
      const isPartOfMultiSelection = selectedOverlayIds.length > 1 && selectedOverlayIds.includes(overlay.id);
      const overlaysToDrag = isPartOfMultiSelection
        ? allOverlays.filter(o => selectedOverlayIds.includes(o.id))
        : [overlay];
      
      startDragging(e, overlaysToDrag);
    },
    [overlay, selectedOverlayIds, setSelectedOverlayId, startDragging]
  );

  if (overlay.type === OverlayType.SOUND) {
    return null;
  }

  return (
    <>
      <div
        onPointerDown={(e) => onPointerDown(e, allOverlays)}
        onPointerEnter={onMouseEnter}
        onPointerLeave={onMouseLeave}
        style={style}
      >
        {isSelected ? (
          <>
            {/* Hide handles when crop edit mode is active for video and image overlays */}
            {!((overlay.type === OverlayType.VIDEO || overlay.type === OverlayType.IMAGE) && (overlay as any).styles?.crop?.enabled) && (
              <>
                <ResizeHandle
                  overlay={overlay}
                  setOverlay={changeOverlay}
                  type="top-left"
                />
                <ResizeHandle
                  overlay={overlay}
                  setOverlay={changeOverlay}
                  type="top-right"
                />
                <ResizeHandle
                  overlay={overlay}
                  setOverlay={changeOverlay}
                  type="bottom-left"
                />
                <ResizeHandle
                  overlay={overlay}
                  setOverlay={changeOverlay}
                  type="bottom-right"
                />
                <RotateHandle
                  overlay={overlay}
                  setOverlay={changeOverlay}
                  scale={scale}
                />
              </>
            )}
          </>
        ) : null}
      </div>
    </>
  );
};
