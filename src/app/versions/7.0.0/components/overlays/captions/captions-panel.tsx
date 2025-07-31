import React, { useState, useCallback } from "react";
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
    setOverlays, // Add this
    isGeneratingCaptions,
    setIsGeneratingCaptions,
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

  const extractAndSaveAudio = async (videoSrc: string): Promise<string> => {
    // Import FFmpeg dynamically for client-side use
    const { FFmpeg } = await import('@ffmpeg/ffmpeg');
    const { fetchFile } = await import('@ffmpeg/util');
    
    const ffmpeg = new FFmpeg();
    await ffmpeg.load();
    
    // Fetch video file
    let videoFile: File;
    if (videoSrc.startsWith('blob:')) {
      const response = await fetch(videoSrc);
      const blob = await response.blob();
      videoFile = new File([blob], 'video.mp4', { type: 'video/mp4' });
    } else {
      const response = await fetch(videoSrc);
      videoFile = new File([await response.blob()], 'video.mp4', { type: 'video/mp4' });
    }
    
    // Extract audio using FFmpeg
    await ffmpeg.writeFile('input.mp4', await fetchFile(videoFile));
    await ffmpeg.exec(['-i', 'input.mp4', '-vn', '-acodec', 'pcm_s16le', '-ar', '44100', 'output.wav']);
    
    // Get extracted audio
    const data = await ffmpeg.readFile('output.wav');
    const audioBlob = new Blob([data], { type: 'audio/wav' });
    
    // Clean up FFmpeg files
    await ffmpeg.deleteFile('input.mp4');
    await ffmpeg.deleteFile('output.wav');
    
    // Upload to server
    const formData = new FormData();
    const audioFile = new File([audioBlob], 'extracted_audio.wav', { type: 'audio/wav' });
    formData.append('audio', audioFile);
    
    const uploadResponse = await fetch('/api/latest/captions/save-audio', {
      method: 'POST',
      body: formData,
    });
    
    const uploadResult = await uploadResponse.json();
    
    if (!uploadResult.success) {
      throw new Error('Failed to save extracted audio');
    }
    
    return uploadResult.audioUrl;
  };

  const saveExistingAudio = async (audioSrc: string): Promise<string> => {
    // Fetch existing audio file
    const response = await fetch(audioSrc);
    const audioBlob = await response.blob();
    
    // Upload to server
    const formData = new FormData();
    const audioFile = new File([audioBlob], 'existing_audio.wav', { type: 'audio/wav' });
    formData.append('audio', audioFile);
    
    const uploadResponse = await fetch('/api/latest/captions/save-audio', {
      method: 'POST',
      body: formData,
    });
    
    const uploadResult = await uploadResponse.json();
    
    if (!uploadResult.success) {
      throw new Error('Failed to save existing audio');
    }
    
    return uploadResult.audioUrl;
  };

const handleAutomaticCaptions = async () => {
    setIsGeneratingCaptions(true);
    
    try {
      // Get URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const uid = urlParams.get('uid');
      const email = urlParams.get('email');
      
      if (!uid || !email) {
        alert('Missing user parameters. Please reload the page.');
        return;
      }
      
      // Find video and audio overlays
      const videoOverlays = overlays.filter(overlay => overlay.type === OverlayType.VIDEO);
      const audioOverlays = overlays.filter(overlay => overlay.type === OverlayType.SOUND);
      
      if (videoOverlays.length === 0 && audioOverlays.length === 0) {
        alert('No video or audio found in timeline');
        return;
      }
      
      // Extract audio from videos using client-side FFmpeg and save to server
      const audioUrls = [];
      
      for (const overlay of videoOverlays) {
        try {
          const audioUrl = await extractAndSaveAudio(overlay.src);
          audioUrls.push(audioUrl);
        } catch (error) {
          console.error('Failed to extract audio from video:', error);
        }
      }
      
      // Process existing audio overlays
      for (const overlay of audioOverlays) {
        try {
          const audioUrl = await saveExistingAudio(overlay.src);
          audioUrls.push(audioUrl);
        } catch (error) {
          console.error('Failed to save audio:', error);
        }
      }
      
      if (audioUrls.length === 0) {
        alert('Failed to extract audio from videos');
        return;
      }
      
      // Start caption generation
      const response = await fetch(`/api/latest/captions/auto-generate?uid=${uid}&email=${email}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ audioUrls }),
      });
      
      const result = await response.json();
      
      if (!result.success) {
        alert(result.error || 'Failed to start caption generation');
        return;
      }
      
      // Start polling for completion
      await pollCaptionStatus(result.genaiCode);
      
    } catch (error) {
      console.error('Auto caption error:', error);
      alert('Failed to generate captions. Please try again.');
      setIsGeneratingCaptions(false);
    }
    // Don't reset loading state here - let pollCaptionStatus handle it
  };


const pollCaptionStatus = async (genaiCode: string) => {
    const maxAttempts = 150; // 5 minutes with 2-second intervals
    let attempts = 0;
    
    // Wait 3 seconds before starting to poll
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    while (attempts < maxAttempts) {
      try {
        const response = await fetch('/api/latest/captions/check-status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ genaiCode }),
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.error) {
          throw new Error(result.error);
        }
        
        if (result.completed) {
          // Process the subtitles data directly
          await processCaptionData(result.subtitlesData);
          return;
        }
        
        attempts++;
        console.log(`Caption generation progress: ${result.progress || 0}% - ${result.message || 'Processing...'}`);
        
        // Wait 2 seconds before next poll
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
      } catch (error) {
        console.error('Polling error:', error);
        // Reset loading state on error
        setIsGeneratingCaptions(false);
        throw error;
      }
    }
    
    // If we exit the loop, it means we've exceeded maxAttempts
    setIsGeneratingCaptions(false);
    throw new Error('Caption generation timed out');
  };


const processCaptionData = async (captionData: any) => {
    try {
      // Convert the API response to our caption format
      const processedCaptions: Caption[] = captionData.segments.map((segment: any) => {
        const words = segment.words.map((word: any) => ({
          word: word.word.trim(),
          startMs: word.start * 1000,
          endMs: word.end * 1000,
          confidence: word.probability || 0.99,
        }));
        
        return {
          text: segment.text.trim(),
          startMs: segment.start * 1000,
          endMs: segment.end * 1000,
          timestampMs: null,
          confidence: 0.99,
          words,
        };
      });
      
      // Calculate duration and position
      const totalDurationMs = Math.max(...processedCaptions.map(cap => cap.endMs));
      const calculatedDurationInFrames = Math.ceil((totalDurationMs / 1000) * 30);
      
      // Find the topmost row with video or audio content
      const mediaOverlays = overlays.filter(overlay => 
        overlay.type === OverlayType.VIDEO || overlay.type === OverlayType.SOUND
      );
      
      let targetRow = 0; // Default to top row if no media found
      let updatedOverlays = [...overlays]; // Initialize with current overlays
      
      if (mediaOverlays.length > 0) {
        // Find the minimum row number (topmost row with media)
        const minMediaRow = Math.min(...mediaOverlays.map(overlay => overlay.row));
        
        // Place captions above the topmost media row
        targetRow = Math.max(0, minMediaRow - 1);
        
        // Shift all overlays at or above the target row down by 1
        updatedOverlays = overlays.map(overlay => {
          if (overlay.row >= targetRow) {
            return { ...overlay, row: overlay.row + 1 };
          }
          return overlay;
        });
      }
      
      const newCaptionOverlay: CaptionOverlay = {
        id: Date.now(),
        type: OverlayType.CAPTION,
        from: 0, // Start from beginning
        durationInFrames: calculatedDurationInFrames,
        captions: processedCaptions,
        left: 230,
        top: 414,
        width: 833,
        height: 269,
        rotation: 0,
        isDragging: false,
        row: targetRow,
      };
      
      // Add the caption overlay
      const finalOverlays = [...updatedOverlays, newCaptionOverlay];
      setOverlays(finalOverlays);
      setIsGeneratingCaptions(false);
      
      } catch (error) {
        console.error('Failed to process caption data:', error);
        alert('Failed to process generated captions');
        setIsGeneratingCaptions(false);
      }
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
                  onClick={handleAutomaticCaptions}
                  disabled={isGeneratingCaptions}
                >
                  {isGeneratingCaptions ? 'Generating Captions...' : 'Automatically Add Captions'}
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
