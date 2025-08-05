import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useEditorContext } from "../../../contexts/editor-context";
import { useTimelinePositioning } from "../../../hooks/use-timeline-positioning";
import { useTimeline } from "../../../contexts/timeline-context";
import { CaptionOverlay, OverlayType, Caption } from "../../../types";
import { CaptionSettings } from "./caption-settings";
import { captionTemplates } from "../../../templates/caption-templates";
import { useSidebar } from "../../../contexts/sidebar-context";
import { Overlay } from "../../../types";

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
    setSelectedOverlayId,
    durationInFrames,
    changeOverlay,
    currentFrame,
    setOverlays,
    isGeneratingCaptions,
    setIsGeneratingCaptions,
  } = useEditorContext();
  const { setActivePanel } = useSidebar();

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
        setIsGeneratingCaptions(false);
        return;
      }
      
      // Find video and audio overlays
      const videoOverlays = overlays.filter(overlay => overlay.type === OverlayType.VIDEO);
      const audioOverlays = overlays.filter(overlay => overlay.type === OverlayType.SOUND);
      
      if (videoOverlays.length === 0 && audioOverlays.length === 0) {
        alert('No video or audio found in timeline');
        setIsGeneratingCaptions(false);
        return;
      }

      // Create temp caption overlays for each media overlay
      const tempCaptionOverlays: any[] = [];
      let updatedOverlays = [...overlays];
      
      // Find the topmost row for positioning
      const mediaOverlays = [...videoOverlays, ...audioOverlays];
      let targetRow = 0;
      if (mediaOverlays.length > 0) {
        const minMediaRow = Math.min(...mediaOverlays.map(overlay => overlay.row));
        targetRow = Math.max(0, minMediaRow - 1);
        
        // Shift all overlays at or above the target row down
        updatedOverlays = updatedOverlays.map(overlay => {
          if (overlay.row >= targetRow) {
            return { ...overlay, row: overlay.row + mediaOverlays.length };
          }
          return overlay;
        });
      }

      // Create temp overlays for each media item
      [...videoOverlays, ...audioOverlays].forEach((overlay, index) => {
        const tempCaptionOverlay = {
          id: Date.now() + overlay.id + index,
          type: OverlayType.CAPTION,
          from: overlay.from,
          durationInFrames: overlay.durationInFrames,
          captions: [],
          left: 230,
          top: 414,
          width: 833,
          height: 269,
          rotation: 0,
          isDragging: false,
          row: targetRow + index,
          template: "default",
          styles: captionTemplates.default.styles,
          isLoading: true,
          loadingStage: 'extracting', // 'extracting' -> 'generating' -> 'complete'
          sourceOverlayId: overlay.id,
          sourceType: overlay.type === OverlayType.VIDEO ? 'video' : 'audio'
        };
        tempCaptionOverlays.push(tempCaptionOverlay);
      });

      // Add temp overlays to timeline
      const overlaysWithTemp = [...updatedOverlays, ...tempCaptionOverlays];
      setOverlays(overlaysWithTemp);

      // Prepare audio data with overlay information
      const audioDataWithOverlays = [];

      // Process video overlays (update loading stage to 'generating' after extraction)
      for (let i = 0; i < videoOverlays.length; i++) {
        const overlay = videoOverlays[i];
        try {
          const audioUrl = await extractAndSaveAudio(overlay.src);
          
          // Update temp overlay to 'generating' stage
          const updatedOverlays = overlays.map((o: any) => 
            o.sourceOverlayId === overlay.id && o.isLoading 
              ? { ...o, loadingStage: 'generating' }
              : o
          ) as Overlay[];
          setOverlays(updatedOverlays);
          
          audioDataWithOverlays.push({
            audioUrl,
            overlayId: overlay.id,
            fromFrame: overlay.from,
            durationInFrames: overlay.durationInFrames,
            type: 'video'
          });
        } catch (error) {
          console.error('Failed to extract audio from video:', error);
          // Remove failed temp overlay
          const filteredOverlays = overlays.filter((o: any) => !(o.sourceOverlayId === overlay.id && o.isLoading)) as Overlay[];
          setOverlays(filteredOverlays);
        }
      }

      // Process audio overlays (update loading stage to 'generating' after saving)
      for (let i = 0; i < audioOverlays.length; i++) {
        const overlay = audioOverlays[i];
        try {
          const audioUrl = await saveExistingAudio(overlay.src);
          
          // Update temp overlay to 'generating' stage
          const updatedOverlays = overlays.map((o: any) => 
            o.sourceOverlayId === overlay.id && o.isLoading 
              ? { ...o, loadingStage: 'generating' }
              : o
          ) as Overlay[];
          setOverlays(updatedOverlays);
          
          audioDataWithOverlays.push({
            audioUrl,
            overlayId: overlay.id,
            fromFrame: overlay.from,
            durationInFrames: overlay.durationInFrames,
            type: 'audio'
          });
        } catch (error) {
          console.error('Failed to save audio:', error);
          // Remove failed temp overlay
          const filteredOverlays = overlays.filter((o: any) => !(o.sourceOverlayId === overlay.id && o.isLoading)) as Overlay[];
          setOverlays(filteredOverlays);
        }
      }

      if (audioDataWithOverlays.length === 0) {
        alert('Failed to extract audio from videos');
        setIsGeneratingCaptions(false);
        // Remove all temp overlays
        const filteredOverlays = overlays.filter((o: any) => !o.isLoading) as Overlay[];
        setOverlays(filteredOverlays);
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
        setIsGeneratingCaptions(false);
        // Remove all temp overlays
        const filteredOverlays = overlays.filter((o: any) => !o.isLoading) as Overlay[];
        setOverlays(filteredOverlays);
        return;
      }
      
      await pollMultipleCaptionStatus(result.results);
      
    } catch (error) {
      console.error('Caption generation error:', error);
      alert('Failed to generate captions. Please try again.');
      setIsGeneratingCaptions(false);
      // Remove all temp overlays
      const filteredOverlays = overlays.filter((o: any) => !o.isLoading) as Overlay[];
      setOverlays(filteredOverlays);
    }
  };

  

  const pollMultipleCaptionStatus = async (results: any[]) => {
    const maxAttempts = 150; // 5 minutes with 2-second intervals
    let attempts = 0;
    
    // Filter out failed results and only process successful ones
    const activeResults = results.filter(result => result.status === 'started');
    
    if (activeResults.length === 0) {
      setIsGeneratingCaptions(false);
      // Remove all temp overlays
      const filteredOverlays = overlays.filter((o: any) => !o.isLoading) as Overlay[];
      setOverlays(filteredOverlays);
      alert('Failed to start caption generation for any audio files');
      return;
    }
    
    // Wait 3 seconds before starting to poll
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const completedCaptions: any[] = [];
    const pendingResults = [...activeResults];
    
    while (attempts < maxAttempts && pendingResults.length > 0) {
      try {
        console.log(`Polling attempt ${attempts + 1}, pending results: ${pendingResults.length}`);
        
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
            console.error(`HTTP ${response.status}: ${response.statusText}`);
            return {
              ...result,
              statusResult: { completed: false, error: `HTTP ${response.status}` }
            };
          }
          
          const statusResult = await response.json();
          console.log(`Status for ${result.genaiCode}:`, statusResult);
          
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
            console.log('Caption completed for:', originalResult.overlayId);
            // Move to completed array
            completedCaptions.push({
              ...originalResult,
              subtitlesData: statusResult.subtitlesData
            });
            
            // Remove from pending
            pendingResults.splice(i, 1);
          } else if (statusResult.error) {
            console.error('Caption generation failed for:', originalResult.overlayId, statusResult.error);
            // Remove failed result from pending
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
        // Don't throw error, just continue polling
        attempts++;
        if (attempts < maxAttempts && pendingResults.length > 0) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }
    
    if (pendingResults.length > 0) {
      console.warn(`${pendingResults.length} caption generation(s) timed out`);
    }
    
    if (completedCaptions.length > 0) {
      console.log('Processing completed captions:', completedCaptions.length);
      // Process all completed captions
      await processMultipleCaptionData(completedCaptions);
    } else {
      setIsGeneratingCaptions(false);
      // Remove all temp overlays
      const filteredOverlays = overlays.filter((o: any) => !o.isLoading) as Overlay[];
      setOverlays(filteredOverlays);
      alert('No captions were successfully generated');
    }
  };

  const processMultipleCaptionData = async (completedCaptions: any[]) => {
    try {
      const FPS = 30; // Assuming 30 FPS
      const newCaptionOverlays: any[] = [];
      
      // Process each completed caption
      for (const captionData of completedCaptions) {
        const { subtitlesData, fromFrame, overlayId } = captionData;

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
        
        newCaptionOverlays.push({
          overlayId,
          fromFrame,
          processedCaptions,
          calculatedDurationInFrames
        });
      }
      
      // Replace temp overlays with real caption overlays
      console.log('Current overlays before replacement:', overlays.length);
      console.log('Temp overlays to replace:', overlays.filter((o: any) => o.isLoading).length);
      
      // First, get current overlays state
      const currentOverlays = [...overlays];
      let updatedOverlays = currentOverlays.filter((overlay: any) => !overlay.isLoading);
      
      console.log('Overlays after filtering loading ones:', updatedOverlays.length);
      
      newCaptionOverlays.forEach((captionData, index) => {
        // Find the temp overlay that corresponds to this caption data
        const tempOverlay = currentOverlays.find((o: any) => 
          o.isLoading && o.sourceOverlayId === captionData.overlayId
        );
        
        const finalCaptionOverlay: CaptionOverlay = {
          id: Date.now() + captionData.overlayId + index,
          type: OverlayType.CAPTION,
          from: captionData.fromFrame,
          durationInFrames: captionData.calculatedDurationInFrames,
          captions: captionData.processedCaptions,
          left: 230,
          top: 414,
          width: 833,
          height: 269,
          rotation: 0,
          isDragging: false,
          row: tempOverlay ? tempOverlay.row : 0, // Use the temp overlay's row
          template: "default",
          styles: captionTemplates.default.styles,
        };
        
        console.log('Adding caption overlay:', finalCaptionOverlay);
        updatedOverlays.push(finalCaptionOverlay as Overlay);
      });
      
      console.log('Final overlays count:', updatedOverlays.length);
      setOverlays(updatedOverlays as Overlay[]);
      
      setIsGeneratingCaptions(false);
      
      // Navigate to caption settings for the first caption
      setTimeout(() => {
        const firstCaptionOverlay = newCaptionOverlays[0];
        if (firstCaptionOverlay) {
          // Navigate to caption settings for the first caption
          setTimeout(() => {
            const captionOverlays = overlays.filter((o: any) => o.type === OverlayType.CAPTION && !o.isLoading);
            if (captionOverlays.length > 0) {
              console.log('Selecting first caption overlay:', captionOverlays[0].id);
              setSelectedOverlayId(captionOverlays[0].id);
            }
          }, 500);
        }
      }, 100);
      
    } catch (error) {
      console.error('Failed to process generated captions:', error);
      alert('Failed to process generated captions');
      setIsGeneratingCaptions(false);
      // Remove all temp overlays on error
      const filteredOverlays = overlays.filter((o: any) => !o.isLoading) as Overlay[];
      setOverlays(filteredOverlays);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 bg-white dark:bg-gray-900/40">
      {(!localOverlay || selectedOverlayId === null) ? (
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
