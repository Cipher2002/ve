import React from "react";
import { useEditorContext } from "../../../contexts/editor-context";
import { OverlayType, StickerOverlay } from "../../../types";

interface SelectStickerOverlayProps {
  setLocalOverlay: (overlay: StickerOverlay) => void;
}

export const SelectStickerOverlay: React.FC<SelectStickerOverlayProps> = ({
  setLocalOverlay,
}) => {
  const { overlays, setSelectedOverlayId } = useEditorContext();

  const stickerOverlays = overlays.filter(
    (overlay) => overlay.type === OverlayType.STICKER
  ) as StickerOverlay[];

  const handleStickerClick = (sticker: StickerOverlay) => {
    setSelectedOverlayId(sticker.id);
    setLocalOverlay(sticker);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-4">
      {stickerOverlays.length === 0 ? (
        <>
          <div className="mb-4">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-blue-600 dark:text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z"
                />
              </svg>
            </div>
          </div>
        </>
      ) : (
        <>
        </>
      )}
    </div>
  );
};