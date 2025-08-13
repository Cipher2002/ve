import React, { useState, useCallback } from "react";
import { Button } from "../../../../../../components/ui/button";
import { Textarea } from "../../../../../../components/ui/textarea";
import { useEditorContext } from "../../../contexts/editor-context";
import { useTimelinePositioning } from "../../../hooks/use-timeline-positioning";
import { useTimeline } from "../../../contexts/timeline-context";
import { CaptionOverlay, OverlayType, Caption } from "../../../types";
import { CaptionSettings } from "./caption-settings";
import { captionTemplates } from "../../../templates/caption-templates";
import { useSidebar } from "../../../contexts/sidebar-context";

//SETTING THE API BASE URL
const apiBaseUrl = 'https://zanopy.ai/vedit/api/latest';

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
  const { activePanel, setActivePanel, setIsOpen } = useSidebar();

  const { findNextAvailablePosition } = useTimelinePositioning();
  const { visibleRows } = useTimeline();
  const [localOverlay, setLocalOverlay] = useState<CaptionOverlay | null>(null);

  React.useEffect(() => {
    if (selectedOverlayId === null) {
      setLocalOverlay(null);
      return;
    }

    const selectedOverlay = overlays.find(
      (overlay) => overlay.id === selectedOverlayId
    );

    if (selectedOverlay?.type === OverlayType.CAPTION) {
      setLocalOverlay(selectedOverlay as CaptionOverlay);
    } else {
      setLocalOverlay(null);
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
      template: "default",
      styles: captionTemplates.default.styles,
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
    
    const uploadResponse = await fetch(`${apiBaseUrl}/captions/save-audio`, {
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
    
    const uploadResponse = await fetch(`${apiBaseUrl}/captions/save-audio`, {
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

      // Prepare audio data with overlay information
      const audioDataWithOverlays = [];

      // Process video overlays
      for (const overlay of videoOverlays) {
        try {
          const audioUrl = await extractAndSaveAudio(overlay.src);
          audioDataWithOverlays.push({
            audioUrl,
            overlayId: overlay.id,
            fromFrame: overlay.from,
            durationInFrames: overlay.durationInFrames,
            type: 'video'
          });
        } catch (error) {
          console.error('Failed to extract audio from video:', error);
        }
      }

      // Process audio overlays
      for (const overlay of audioOverlays) {
        try {
          const audioUrl = await saveExistingAudio(overlay.src);
          audioDataWithOverlays.push({
            audioUrl,
            overlayId: overlay.id,
            fromFrame: overlay.from,
            durationInFrames: overlay.durationInFrames,
            type: 'audio'
          });
        } catch (error) {
          console.error('Failed to save audio:', error);
        }
      }

      if (audioDataWithOverlays.length === 0) {
        alert('Failed to extract audio from videos');
        return;
      }

      // Send request to Zanopy API
      const response = await fetch(`${apiBaseUrl}/captions/auto-generate?uid=${uid}&email=${email}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ audioDataWithOverlays }),
      });
      
      const result = await response.json();
      
      if (!result.success) {
        alert(result.error || 'Failed to start caption generation');
        return;
      }
      

      await pollMultipleCaptionStatus(result.results);
      
    } catch (error) {
      alert('Failed to generate captions. Please try again.');
      setIsGeneratingCaptions(false);
    }
    // Don't reset loading state here - let pollCaptionStatus handle it
  };

  // Function to handle credit deduction for captions
  const handleCaptionCreditDeduction = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('uid');
    const sessionId = urlParams.get('sid');
    
    if (!userId || !sessionId) {
      console.error('Missing uid or sid from URL parameters');
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/deduct-credits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          sessionId,
          productCode: 'EDIT_VIDEO_ADD_CAPTION',
        }),
      });
      
      if (!response.ok) {
        console.error('Failed to deduct credits for captions');
        return;
      }
      
      const data = await response.json();
      
      if (data.success) {
        console.log('Caption credits deducted successfully:', data.data);
      } else {
        console.error('Caption credit deduction failed:', data.error);
      }
      
    } catch (error) {
      console.error('Error in caption credit deduction process:', error);
    }
  };

  const pollMultipleCaptionStatus = async (results: any[]) => {
    const maxAttempts = 150; // 5 minutes with 2-second intervals
    let attempts = 0;
    
    // Filter out failed results and only process successful ones
    const activeResults = results.filter(result => result.status === 'started');
    
    if (activeResults.length === 0) {
      setIsGeneratingCaptions(false);
      alert('Failed to start caption generation for any audio files');
      return;
    }
    
    // Wait 3 seconds before starting to poll
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const completedCaptions = [];
    const pendingResults = [...activeResults];
    
    while (attempts < maxAttempts && pendingResults.length > 0) {
      try {
        // Check status for all pending results
        const statusPromises = pendingResults.map(async (result) => {
          const response = await fetch(`${apiBaseUrl}/captions/check-status`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ genaiCode: result.genaiCode }),
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const statusResult = await response.json();
          
          if (statusResult.error) {
            throw new Error(statusResult.error);
          }
          
          return {
            ...result,
            statusResult
          };
        });
        
        const statusResults = await Promise.all(statusPromises);
        
        // Process completed results
        for (let i = statusResults.length - 1; i >= 0; i--) {
          const { statusResult, ...originalResult } = statusResults[i];
          
          if (statusResult.completed) {
            // Move to completed array
            completedCaptions.push({
              ...originalResult,
              subtitlesData: statusResult.subtitlesData
            });
            
            // Remove from pending
            pendingResults.splice(i, 1);
            
          }
        }
        
        attempts++;
        
        // Wait 2 seconds before next poll if there are still pending results
        if (pendingResults.length > 0 && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
      } catch (error) {
        console.error('Polling error:', error);
        setIsGeneratingCaptions(false);
        throw error;
      }
    }
    
    if (pendingResults.length > 0) {
      console.warn(`${pendingResults.length} caption generation(s) timed out`);
    }
    
    if (completedCaptions.length > 0) {
      // Process all completed captions
      await processMultipleCaptionData(completedCaptions);
    } else {
      setIsGeneratingCaptions(false);
      alert('No captions were successfully generated');
    }
  };

  const processMultipleCaptionData = async (completedCaptions: any[]) => {
    try {
      const FPS = 30; // Assuming 30 FPS
      let updatedOverlays = [...overlays];
      const newCaptionOverlays = [];
      
      // Find the topmost row with media content for positioning
      const mediaOverlays = overlays.filter(overlay => 
        overlay.type === OverlayType.VIDEO || overlay.type === OverlayType.SOUND
      );
      
      let targetRow = 0;
      if (mediaOverlays.length > 0) {
        const minMediaRow = Math.min(...mediaOverlays.map(overlay => overlay.row));
        targetRow = Math.max(0, minMediaRow - 1);
        
        // Shift all overlays at or above the target row down by 1
        updatedOverlays = updatedOverlays.map(overlay => {
          if (overlay.row >= targetRow) {
            return { ...overlay, row: overlay.row + 1 };
          }
          return overlay;
        });
      }
      
      // Process each completed caption
      for (const captionData of completedCaptions) {
        const { subtitlesData, fromFrame, overlayId } = captionData;
        
        // Convert frame start time to milliseconds
        const overlayStartTimeMs = (fromFrame / FPS) * 1000;

        // Convert the API response to our caption format with relative timing
        const processedCaptions = subtitlesData.segments.map((segment: any) => {
          const words = segment.words.map((word: any) => ({
            word: word.word.trim(),
            startMs: word.start * 1000, // Keep relative to overlay start
            endMs: word.end * 1000,     // Keep relative to overlay start
            confidence: word.probability || 0.99,
          }));
          
          return {
            text: segment.text.trim(),
            startMs: segment.start * 1000, // Keep relative to overlay start
            endMs: segment.end * 1000,     // Keep relative to overlay start
            timestampMs: null,
            confidence: 0.99,
            words,
          };
        });
        
        // Calculate duration for this specific caption overlay
        const maxEndTime = Math.max(...processedCaptions.map((cap: Caption) => cap.endMs));
        const minStartTime = Math.min(...processedCaptions.map((cap: Caption) => cap.startMs));
        const calculatedDurationInFrames = Math.ceil(((maxEndTime - minStartTime) / 1000) * FPS);
        const newCaptionOverlay: CaptionOverlay = {
          id: Date.now() + overlayId, // Ensure unique IDs
          type: OverlayType.CAPTION,
          from: fromFrame, // Start from the same frame as the original overlay
          durationInFrames: calculatedDurationInFrames,
          captions: processedCaptions,
          left: 230,
          top: 414,
          width: 833,
          height: 269,
          rotation: 0,
          isDragging: false,
          row: targetRow,
          template: "default",
          styles: captionTemplates.default.styles,
        };
        
        newCaptionOverlays.push(newCaptionOverlay);
      }
      
      // Add all caption overlays
      const finalOverlays = [...updatedOverlays, ...newCaptionOverlays];
      setOverlays(finalOverlays);
      
      // Deduct credits for caption generation
      handleCaptionCreditDeduction();
      
      // Force open the style panel with the first caption overlay
      if (newCaptionOverlays.length > 0) {
        const firstCaptionOverlay = newCaptionOverlays[0];
        
        // Check if captions panel is currently active
        const isCaptionsPanelOpen = activePanel === OverlayType.CAPTION;
        
        if (!isCaptionsPanelOpen) {
          // Panel is not open, open it 
          setActivePanel(OverlayType.CAPTION);
          setIsOpen(true);
        }
        
        // Set generation to false and overlay after a small delay to ensure state updates
        setTimeout(() => {
          setIsGeneratingCaptions(false);
          setLocalOverlay(firstCaptionOverlay);
        }, 50);
      } else {
        setIsGeneratingCaptions(false);
      }
      
    } catch (error) {
      alert('Failed to process generated captions');
      setIsGeneratingCaptions(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 bg-white dark:bg-gray-900/40">
      {(!localOverlay) ? (
        <>
          <div className="space-y-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Button
                  className="w-full bg-[#490972] hover:bg-[#3a0759] text-white 
                    disabled:bg-gray-200 disabled:text-gray-500 disabled:dark:bg-gray-800 
                    disabled:dark:text-gray-600 disabled:opacity-100 disabled:cursor-not-allowed 
                    transition-colors"
                  onClick={handleAutomaticCaptions}
                  disabled={isGeneratingCaptions}
                >
                  {isGeneratingCaptions ? (
                    'Generating Captions...'
                  ) : (
                    <>
                      <img
                        src="https://zanopy.ai/assets/images/3491bfc1ad15744a7aa565f8f4cbce1e.png"
                        alt="Export"
                        className="w-3.5 h-3.5 mr-0.5"
                      />
                      20
                      <span className="ml-2">Automatically Add Captions</span>
                    </>
                  )}
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
                  className="flex-1 text-white bg-[#490972] hover:bg-[#3a0759] disabled:bg-gray-200 disabled:text-gray-500 disabled:dark:bg-gray-800 
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
          defaultTab="display"
        />
      )}

    </div>
  );
};
