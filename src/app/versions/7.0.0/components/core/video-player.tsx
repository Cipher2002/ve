import React, { useEffect } from "react";
import { Player, PlayerRef } from "@remotion/player";
import { Main } from "../../remotion/main";
import { useEditorContext } from "../../contexts/editor-context";
import { FPS } from "../../constants";
import { CropOverlay } from "../shared/crop-overlay";

/**
 * Props for the VideoPlayer component
 * @interface VideoPlayerProps
 * @property {React.RefObject<PlayerRef>} playerRef - Reference to the Remotion player instance
 */
interface VideoPlayerProps {
  playerRef: React.RefObject<PlayerRef>;
}

/**
 * VideoPlayer component that renders a responsive video editor with overlay support
 * The player automatically resizes based on its container and maintains the specified aspect ratio
 */
export const VideoPlayer: React.FC<VideoPlayerProps> = ({ playerRef }) => {
  const {
    overlays,
    setSelectedOverlayId,
    changeOverlay,
    selectedOverlayId,
    aspectRatio,
    playerDimensions,
    updatePlayerDimensions,
    getAspectRatioDimensions,
    durationInFrames,
    isAutoLoadingVideo,
    cropMode,
    setCropMode,
    activeCropOverlayId,
    setActiveCropOverlayId,
  } = useEditorContext();

  /**
   * Updates the player dimensions when the container size or aspect ratio changes
   */
  useEffect(() => {
    const handleDimensionUpdate = () => {
      const videoContainer = document.querySelector(".video-container");
      if (!videoContainer) return;

      const { width, height } = videoContainer.getBoundingClientRect();
      updatePlayerDimensions(width, height);
    };

    handleDimensionUpdate(); // Initial update
    window.addEventListener("resize", handleDimensionUpdate);

    return () => {
      window.removeEventListener("resize", handleDimensionUpdate);
    };
  }, [aspectRatio, updatePlayerDimensions]);

  const { width: compositionWidth, height: compositionHeight } =
    getAspectRatioDimensions();

  // Constants for player configuration
  const PLAYER_CONFIG = {
    durationInFrames: Math.round(durationInFrames),
    fps: FPS,
  };

  return (
    <div className="w-full h-full overflow-hidden">
      {/* Grid background container */}
      <div
        className="z-0 video-container relative w-full h-full
        bg-slate-100/90 dark:bg-gray-800
        bg-[linear-gradient(to_right,#80808015_1px,transparent_1px),linear-gradient(to_bottom,#80808015_1px,transparent_1px)] 
        dark:bg-[linear-gradient(to_right,#80808010_1px,transparent_1px),linear-gradient(to_bottom,#80808010_1px,transparent_1px)]
        bg-[size:16px_16px] 
        shadow-lg"
      >
        {/* Auto-load Video Loader */}
        {isAutoLoadingVideo && (
          <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="flex flex-col items-center gap-3 px-6 py-4 bg-white/95 dark:bg-gray-800/95 rounded-lg shadow-lg ring-1 ring-gray-200 dark:ring-gray-700">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Loading video...
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Preparing your content
                </p>
              </div>
            </div>
          </div>
        )}
        {/* Player wrapper with centering */}
        <div className="z-10 absolute inset-2 sm:inset-4 flex items-center justify-center">
          <div
            className="relative mx-2 sm:mx-0"
            style={{
              width: Math.min(playerDimensions.width, compositionWidth),
              height: Math.min(playerDimensions.height, compositionHeight),
              maxWidth: "100%",
              maxHeight: "100%",
            }}
          >
            <Player
              ref={playerRef}
              className="w-full h-full"
              component={Main}
              compositionWidth={compositionWidth}
              compositionHeight={compositionHeight}
              style={{
                width: "100%",
                height: "100%",
              }}
              durationInFrames={PLAYER_CONFIG.durationInFrames}
              fps={PLAYER_CONFIG.fps}
              inputProps={{
                overlays,
                setSelectedOverlayId,
                changeOverlay,
                selectedOverlayId,
                durationInFrames,
                fps: FPS,
                width: compositionWidth,
                height: compositionHeight,
              }}
              errorFallback={() => <></>}
              overflowVisible
            />
            {/* Crop Overlay */}
            {cropMode && activeCropOverlayId && selectedOverlayId === activeCropOverlayId && (
              <div className="absolute inset-0">
                <CropOverlay
                  containerWidth={Math.min(playerDimensions.width, compositionWidth)}
                  containerHeight={Math.min(playerDimensions.height, compositionHeight)}
                  initialCrop={
                    (overlays.find(o => o.id === activeCropOverlayId)?.styles as any)?.crop
                  }
                  onCropChange={(crop) => {
                    // Preview crop changes
                  }}
                  onCropComplete={(crop) => {
                    const overlay = overlays.find(o => o.id === activeCropOverlayId);
                    if (overlay) {
                      changeOverlay(overlay.id, {
                        ...overlay,
                        styles: {
                          ...overlay.styles,
                          crop,
                        } as any,
                      });
                    }
                    setCropMode(false);
                    setActiveCropOverlayId(null);
                  }}
                  onCancel={() => {
                    setCropMode(false);
                    setActiveCropOverlayId(null);
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
