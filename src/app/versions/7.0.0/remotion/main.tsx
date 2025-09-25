import React, { useCallback, useEffect } from "react";
import { AbsoluteFill, continueRender, delayRender, staticFile } from "remotion";

import { Overlay, ClipOverlay, OverlayType } from "../types";
import { SortedOutlines } from "../components/selection/sorted-outlines";
import { Layer } from "../components/core/layer";
import { CropOverlay } from "../components/overlays/video/crop-overlay";

import "./text-styles.css";


/**
 * Props for the Main component
 */
export type MainProps = {
  /** Array of overlay objects to be rendered */
  readonly overlays: Overlay[];
  /** Function to set the currently selected overlay ID */
  readonly setSelectedOverlayId: React.Dispatch<
    React.SetStateAction<number | null>
  >;
  /** Currently selected overlay ID, or null if none selected */
  readonly selectedOverlayId: number | null;
  /**
   * Function to update an overlay
   * @param overlayId - The ID of the overlay to update
   * @param updater - Function that receives the current overlay and returns an updated version
   */
  readonly changeOverlay: (
    overlayId: number,
    updater: (overlay: Overlay) => Overlay
  ) => void;
  /** Duration in frames of the composition */
  readonly durationInFrames: number;
  /** Frames per second of the composition */
  readonly fps: number;
  /** Width of the composition */
  readonly width: number;
  /** Height of the composition */
  readonly height: number;
  /** Base URL for media assets (optional) */
  readonly baseUrl?: string;
  /** Current playback frame */
  readonly currentFrame: number;
  /** Number of frames to premount videos before they start */
  readonly premountFrames: number;
  /** Maximum number of videos to premount simultaneously */
  readonly maxPremountedVideos: number;
};

const outer: React.CSSProperties = {
  backgroundColor: "black",
};

const layerContainer: React.CSSProperties = {
  overflow: "hidden",
  maxWidth: "3000px",
};

/**
 * Main component that renders a canvas-like area with overlays and their outlines.
 * Handles selection of overlays and provides a container for editing them.
 *
 * @param props - Component props of type MainProps
 * @returns React component that displays overlays and their interactive outlines
 */
export const Main: React.FC<MainProps> = ({
  overlays,
  setSelectedOverlayId,
  selectedOverlayId,
  changeOverlay,
  baseUrl,
  currentFrame,
  premountFrames,
  maxPremountedVideos,
}) => {
  useEffect(() => {
    const handle = delayRender();
    
    continueRender(handle);

  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) {
        return;
      }

      setSelectedOverlayId(null);
    },
    [setSelectedOverlayId]
  );

  return (
    <AbsoluteFill
      style={{
        ...outer,
      }}
      onPointerDown={onPointerDown}
    >
      <AbsoluteFill style={layerContainer}>
        {overlays.map((overlay) => {
          return (
            <Layer
              key={overlay.id}
              overlay={overlay}
              selectedOverlayId={selectedOverlayId}
              baseUrl={baseUrl}
              allOverlays={overlays}
              currentFrame={currentFrame}
              premountFrames={premountFrames}
              maxPremountedVideos={maxPremountedVideos}
            />
          );
        })}
      </AbsoluteFill>

      {/* Crop overlays positioned absolutely */}
      {overlays.map((overlay) => {
        const isVideoOverlay = overlay.type === OverlayType.VIDEO;
        const isImageOverlay = overlay.type === OverlayType.IMAGE;
        const isSelected = overlay.id === selectedOverlayId;
        const cropEnabled = (overlay as any).styles?.crop?.enabled === true;
        
        console.log('Checking crop overlay for overlay:', overlay.id, {
          isVideoOverlay,
          isImageOverlay,
          isSelected,
          cropEnabled,
          cropData: (overlay as any).styles?.crop
        });
        
        if ((isVideoOverlay || isImageOverlay) && isSelected && cropEnabled) {
          return (
            <div
              key={`crop-${overlay.id}`}
              data-crop-container={overlay.id}
              style={{
                position: "absolute",
                left: overlay.left,
                top: overlay.top,
                width: overlay.width,
                height: overlay.height,
                transform: `rotate(${overlay.rotation || 0}deg)`,
                transformOrigin: "center center",
                pointerEvents: "auto",
                zIndex: 10000,
              }}
            >
              <CropOverlay
                overlay={overlay as any}
                onCropChange={(crop) => {
                  changeOverlay(overlay.id, (prevOverlay) => {
                    if (prevOverlay.type === OverlayType.VIDEO || prevOverlay.type === OverlayType.IMAGE) {
                      return {
                        ...prevOverlay,
                        styles: {
                          ...prevOverlay.styles,
                          crop: {
                            ...prevOverlay.styles.crop,
                            ...crop,
                          },
                        },
                      } as any;
                    }
                    return prevOverlay;
                  });
                }}
              />
            </div>
          );
        }
        return null;
      })}

      <SortedOutlines
        selectedOverlayId={selectedOverlayId}
        overlays={overlays}
        setSelectedOverlayId={setSelectedOverlayId}
        changeOverlay={changeOverlay}
      />
    </AbsoluteFill>
  );
};