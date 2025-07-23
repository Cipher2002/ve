import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useEditorContext } from "../../../contexts/editor-context";
import { useTimelinePositioning } from "../../../hooks/use-timeline-positioning";
import { useTimeline } from "../../../contexts/timeline-context";
import { CaptionOverlay, OverlayType, Caption } from "../../../types";
import { CaptionSettings } from "./caption-settings";

/**
 * CaptionsPanel Component
 *
 * @component
 * @description
 * Main interface for managing captions in the video editor.
 * Provides functionality for:
 * - Uploading caption files (.json)
 * - Manual script entry
 * - Caption generation from text
 * - Caption editing and styling
 *
 * The component handles both the initial caption creation process
 * and the management of existing captions through different states
 * and interfaces.
 *
 * Features:
 * - File upload support
 * - Text-to-caption conversion
 * - Automatic timing calculation
 * - Position management in the timeline
 * - Integration with the editor's overlay system
 *
 * @example
 * ```tsx
 * <CaptionsPanel />
 * ```
 */
export const CaptionsPanel: React.FC = () => {
  const [script, setScript] = useState("");
  const [isBannerVisible, setIsBannerVisible] = useState(true);
  const {
    addOverlay,
    overlays,
    selectedOverlayId,
    durationInFrames,
    changeOverlay,
    currentFrame,
  } = useEditorContext();

  const { findNextAvailablePosition } = useTimelinePositioning();
  const { visibleRows } = useTimeline();
  const [localOverlay, setLocalOverlay] = useState<CaptionOverlay | null>(null);

  React.useEffect(() => {
    if (selectedOverlayId === null) {
      return;
    }

    const selectedOverlay = overlays.find(
      (overlay) => overlay.id === selectedOverlayId
    );

    if (selectedOverlay?.type === OverlayType.CAPTION) {
      setLocalOverlay(selectedOverlay as CaptionOverlay);
    }
  }, [selectedOverlayId, overlays]);

  const generateCaptions = () => {
    const sentences = script
      .split(/[.!?]+/)
      .map((sentence) => sentence.trim())
      .filter((sentence) => sentence.length > 0);

    let currentStartTime = 0;
    const wordsPerMinute = 160;
    const msPerWord = (60 * 1000) / wordsPerMinute;

    const processedCaptions: Caption[] = sentences.map((sentence) => {
      const words = sentence.split(/\s+/);
      const sentenceStartTime = currentStartTime;

      const processedWords = words.map((word, index) => ({
        word,
        startMs: sentenceStartTime + index * msPerWord,
        endMs: sentenceStartTime + (index + 1) * msPerWord,
        confidence: 0.99,
      }));

      const caption: Caption = {
        text: sentence,
        startMs: sentenceStartTime,
        endMs: sentenceStartTime + words.length * msPerWord,
        timestampMs: null,
        confidence: 0.99,
        words: processedWords,
      };

      currentStartTime = caption.endMs + 500;
      return caption;
    });

    // Calculate total duration in frames
    const totalDurationMs = currentStartTime;
    const calculatedDurationInFrames = Math.ceil((totalDurationMs / 1000) * 30);

    const position = findNextAvailablePosition(
      overlays,
      visibleRows,
      durationInFrames
    );

    const newCaptionOverlay: CaptionOverlay = {
      id: Date.now(),
      type: OverlayType.CAPTION,
      from: position.from, // Use the position from findNextAvailablePosition
      durationInFrames: calculatedDurationInFrames,
      captions: processedCaptions,
      left: 230,
      top: 414,
      width: 833,
      height: 269,
      rotation: 0,
      isDragging: false,
      row: position.row,
    };

    addOverlay(newCaptionOverlay);
    setScript("");
  };

  const handleUpdateOverlay = (updatedOverlay: CaptionOverlay) => {
    setLocalOverlay(updatedOverlay);
    changeOverlay(updatedOverlay.id, updatedOverlay);
  };

  return (
    <div className="flex flex-col gap-6 p-4 bg-white dark:bg-gray-900/40">
      {!localOverlay ? (
        <>
          <div className="space-y-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Button
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white 
                  disabled:bg-gray-200 disabled:text-gray-500 disabled:dark:bg-gray-800 
                  disabled:dark:text-gray-600 disabled:opacity-100 disabled:cursor-not-allowed 
                  transition-colors"
                  onClick={() => {
                    // Add your automatic caption generation logic here
                  }}
                >
                  Automatically Add Captions
                </Button>
              </div>


              <div className="relative">
                <div className="absolute inset-x-0 -top-3 flex items-center justify-center">
                  <span
                    className="px-3 py-1 text-xs text-gray-600 dark:text-gray-500 bg-white dark:bg-gray-900 
                  rounded-full border border-gray-200 dark:border-gray-800"
                  >
                    or
                  </span>
                </div>
                <div className="pt-4">
                  <Textarea
                    value={script}
                    onChange={(e) => setScript(e.target.value)}
                    placeholder="Type or paste your script here..."
                    className="min-h-[200px] bg-white dark:bg-gray-800/50 
                    border-gray-200 dark:border-gray-700 
                    text-gray-900 dark:text-gray-200 
                    placeholder:text-gray-400 dark:placeholder:text-gray-500 
                    focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 
                    transition-all rounded-lg"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  onClick={generateCaptions}
                  className="flex-1 text-white dark:text-black
                  disabled:bg-gray-200 disabled:text-gray-500 disabled:dark:bg-gray-800 
                  disabled:dark:text-gray-600 disabled:opacity-100 disabled:cursor-not-allowed 
                  transition-colors"
                  disabled={!script.trim()}
                >
                  Generate Captions
                </Button>
                {script && (
                  <Button
                    variant="ghost"
                    className="text-sm text-gray-600 dark:text-gray-400 
                    hover:text-gray-700 dark:hover:text-gray-300 
                    hover:bg-gray-100/80 dark:hover:bg-gray-800/80 
                    transition-colors"
                    onClick={() => setScript("")}
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        <CaptionSettings
          currentFrame={currentFrame}
          localOverlay={localOverlay}
          setLocalOverlay={handleUpdateOverlay}
          startFrame={localOverlay.from}
          captions={localOverlay.captions}
        />
      )}
    </div>
  );
};
