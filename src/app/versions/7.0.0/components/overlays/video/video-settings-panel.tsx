import React from "react";
import { ClipOverlay } from "../../../types";
import { AnimationSettings } from "../../shared/animation-preview";
import { animationTemplates } from "../../../templates/animation-templates";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Toggle } from "../../../../../../components/ui/toggle";
import { Button } from "../../../../../../components/ui/button";
import { useEditorContext } from "../../../contexts/editor-context";
import { useTimeline } from "../../../contexts/timeline-context";
import { useFFmpeg } from "../../../hooks/use-ffmpeg";
import { OverlayType } from "../../../types";

const SPEED_OPTIONS = [
  { value: 0.25, label: "0.25x" },
  { value: 0.5, label: "0.5x" },
  { value: 0.75, label: "0.75x" },
  { value: 1, label: "1x (Normal)" },
  { value: 1.25, label: "1.25x" },
  { value: 1.5, label: "1.5x" },
  { value: 1.75, label: "1.75x" },
  { value: 2, label: "2x" },
  { value: 3, label: "3x" },
  { value: 4, label: "4x" },
];

//SETTING THE API BASE URL
const apiBaseUrl = 'https://zanopy.ai/vedit/api/latest';

/**
 * Props for the VideoSettingsPanel component
 * @interface VideoSettingsPanelProps
 * @property {ClipOverlay} localOverlay - The current overlay object containing video settings and styles
 * @property {Function} handleStyleChange - Callback function to update overlay styles
 * @property {Function} onSpeedChange - Callback function to update speed and duration
 */
interface VideoSettingsPanelProps {
  localOverlay: ClipOverlay;
  handleStyleChange: (updates: Partial<ClipOverlay["styles"]>) => void;
  onSpeedChange?: (speed: number, newDuration: number) => void;
}

/**
 * VideoSettingsPanel Component
 *
 * A panel that provides controls for configuring video overlay settings including:
 * - Volume control with mute/unmute functionality
 * - Enter/Exit animation selection
 *
 * The component uses a local overlay state and provides a UI for users to modify
 * video-specific settings. Changes are propagated through the handleStyleChange callback.
 *
 * @component
 * @param {VideoSettingsPanelProps} props - Component props
 * @returns {JSX.Element} The rendered settings panel
 */
export const VideoSettingsPanel: React.FC<VideoSettingsPanelProps> = ({
  localOverlay,
  handleStyleChange,
  onSpeedChange,
}) => {
  // Add state to control select open state
  const [isSelectOpen, setIsSelectOpen] = React.useState(false);
  const [aiAudioSection, setAiAudioSection] = React.useState<'prompt' | 'ai-decide' | null>(null);
  const [audioPrompt, setAudioPrompt] = React.useState('');
  const [isGeneratingAudio, setIsGeneratingAudio] = React.useState(false);

  const { addOverlay, overlays } = useEditorContext();
  const { addRow } = useTimeline();
  const { extractAudio } = useFFmpeg();

  // Function to handle credit deduction for audio generation
  const handleAudioCreditDeduction = async () => {
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
          productCode: 'EDIT_VIDEO_ADD_AUDIO',
        }),
      });
      
      if (!response.ok) {
        console.error('Failed to deduct credits for audio generation');
        return;
      }
      
      const data = await response.json();
      
      if (data.success) {
        console.log('Audio credits deducted successfully:', data.data);
      } else {
        console.error('Audio credit deduction failed:', data.error);
      }
      
    } catch (error) {
      console.error('Error in audio credit deduction process:', error);
    }
  };

  // Cleanup effect for unmounting
  React.useEffect(() => {
    return () => {
      // Ensure select is closed when component unmounts
      setIsSelectOpen(false);
    };
  }, []);

  const handleSpeedChange = (newSpeed: number) => {
    if (localOverlay) {
      // Get the base duration (duration at 1x speed)
      const baseDuration =
        localOverlay.durationInFrames * (localOverlay.speed ?? 1);
      // Calculate new duration based on new speed
      const newDuration = Math.round(baseDuration / newSpeed);

      if (onSpeedChange) {
        onSpeedChange(newSpeed, newDuration);
      } else {
        console.warn(
          "onSpeedChange not provided, speed changes will not work. Please provide onSpeedChange prop to handle speed updates."
        );
      }
      // Close select after change
      setIsSelectOpen(false);
    }
  };

  // Handlers for animation selection
  const handleEnterAnimationSelect = (animationKey: string) => {
    handleStyleChange({
      animation: {
        ...localOverlay?.styles?.animation,
        enter: animationKey,
      },
    });
  };

  const handleExitAnimationSelect = (animationKey: string) => {
    handleStyleChange({
      animation: {
        ...localOverlay?.styles?.animation,
        exit: animationKey,
      },
    });
  };

  // Helper function to get URL parameters
  const getUrlParams = () => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      return {
        uid: urlParams.get('uid') || '',
      };
    }
    return { uid: '' };
  };

  const generateAudio = async (prompt: string = '', isAiDecide: boolean = false) => {
    setIsGeneratingAudio(true);
    
    try {
      const { uid } = getUrlParams();
      
      if (!uid) {
        throw new Error('User ID not found in URL');
      }

      // For "Let AI Decide" - send video URL directly with video_to_audio
      if (isAiDecide) {
        
        // Check if the video source is available
        if (!localOverlay.src) {
          throw new Error('No video source available');
        }

        // Create form data - send video URL directly
        const formData = new FormData();
        formData.append('do_action', 'BLYNKK_ADD_GENAI_AUDIOSYNTH_REQUEST');
        formData.append('input_type', 'video_to_audio');
        formData.append('user_id', uid);
        formData.append('prompt', ''); // Empty for AI decide
        formData.append('negative_prompt', 'speech, voice, talking, narration, vocals, dialogue, singing, human sounds');
        formData.append('num_steps', '');
        formData.append('seed', '-1');
        formData.append('fps', '');
        formData.append('cfg_strength', '');
        formData.append('duration', '');
        
        // For video overlays, use the original URL stored in content field
        let videoUrlForAPI = localOverlay.src;

        // Check if this is a cached video (blob URL) - use original URL from content field
        if (localOverlay.src.startsWith('blob:') && localOverlay.content) {
          videoUrlForAPI = localOverlay.content;
        }

        // Check if we have a valid URL for the API
        if (!videoUrlForAPI || videoUrlForAPI.startsWith('blob:')) {
          throw new Error('Cannot generate audio from this video. Original video URL not available.');
        }

        // Send the original video URL that the API can access
        formData.append('input_file', videoUrlForAPI);


        // Make API call
        await makeApiCall(formData);
      } else {
        
        // Check if the video source is available
        if (!localOverlay.src) {
          throw new Error('No video source available');
        }

        const formData = new FormData();
        formData.append('do_action', 'ADD_AUDIO');
        formData.append('input_type', 'video_to_audio');
        formData.append('user_id', uid);
        formData.append('prompt', prompt);
        formData.append('seed', '-1');
        
        // For video overlays, use the original URL stored in content field
        let videoUrlForAPI = localOverlay.src;

        // Check if this is a cached video (blob URL) - use original URL from content field
        if (localOverlay.src.startsWith('blob:') && localOverlay.content) {
          videoUrlForAPI = localOverlay.content;
        }

        // Check if we have a valid URL for the API
        if (!videoUrlForAPI || videoUrlForAPI.startsWith('blob:')) {
          throw new Error('Cannot generate audio from this video. Original video URL not available.');
        }

        // Send the original video URL that the API can access
        formData.append('input_file', videoUrlForAPI);


        // Make API call
        await makeApiCallPrompt(formData);
      }
      
    } catch (error) {
      console.error('Video audio generation error:', error);
    }
  };

  // Separate function to handle the API call for prompt-based generation (different URL)
  const makeApiCallPrompt = async (formData: FormData) => {
    try {

      // Use different proxy API for prompt-based generation
      const apiResponse = await fetch(`${apiBaseUrl}/audio/generate-prompt`, {
        method: 'POST',
        body: formData,
      });

      if (apiResponse.type === 'opaque') {
        setTimeout(() => {
          setAudioPrompt('');
          setAiAudioSection(null);
        }, 5000);
        return;
      }

      if (!apiResponse.ok) {
        throw new Error(`HTTP error! status: ${apiResponse.status} - ${apiResponse.statusText}`);
      }

      const responseText = await apiResponse.text();

      if (!responseText || responseText.trim().length === 0) {
        setTimeout(() => {
          setAudioPrompt('');
          setAiAudioSection(null);
        }, 5000);
        return;
      }

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        throw new Error('Invalid response format from server');
      }

      if (result.status === 'success' && result.genai_code) {
        const genaiCode = result.genai_code;
        await pollForAudioCompletion(genaiCode);
      } else {
        throw new Error(result.MESSAGE || result.message || 'Failed to start audio generation');
      }

    } catch (error) {
      console.error('API call error:', error);
      throw error;
    }
  };

  // Separate function to handle the API call
  const makeApiCall = async (formData: FormData) => {
    try {


      // Use your proxy API instead of direct call
      const apiResponse = await fetch(`${apiBaseUrl}/audio/generate`, {
        method: 'POST',
        body: formData,
      });

      // Handle no-cors mode (opaque response)
      if (apiResponse.type === 'opaque') {
        setTimeout(() => {
          setAudioPrompt('');
          setAiAudioSection(null);
        }, 5000);
        return;
      }

      // Handle normal response
      if (!apiResponse.ok) {
        throw new Error(`HTTP error! status: ${apiResponse.status} - ${apiResponse.statusText}`);
      }

      const responseText = await apiResponse.text();

      if (!responseText || responseText.trim().length === 0) {
        setTimeout(() => {
          setAudioPrompt('');
          setAiAudioSection(null);
        }, 5000);
        return;
      }

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        throw new Error('Invalid response format from server');
      }

      if (result.RESULT === 'SUCCESS' && result.RESPONSE) {
        await pollForAudioCompletion(result.RESPONSE);
      } else {
        throw new Error(result.MESSAGE || 'Failed to start audio generation');
      }

    } catch (error) {
      console.error('API call error:', error);
      throw error;
    }
  };

  const pollForAudioCompletion = async (genaiCode: string) => {
    let attempts = 0;
    const maxAttempts = 60; // Poll for up to 5 minutes (5 second intervals)
    
    const poll = async () => {
      try {
        const formData = new FormData();
        formData.append('do_action', 'BLYNKK_CHECK_GENAI_AUDIOSYNTH_REQUEST');
        formData.append('request_type', '');
        formData.append('genai_code', genaiCode);

        const response = await fetch(`${apiBaseUrl}/audio/generate`, {
          method: 'POST',
          body: formData,
        });

        // Check if the response is ok
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Get the response text first to debug
        const responseText = await response.text();

        // Try to parse as JSON
        let result;
        try {
          result = JSON.parse(responseText);
        } catch (parseError) {
          console.error('Failed to parse polling JSON response:', responseText);
          throw new Error('Invalid response format from server');
        }
        
        if (result.RESULT === 'SUCCESS' && result.RESPONSE && typeof result.RESPONSE === 'string' && (result.RESPONSE.startsWith('http') || result.RESPONSE.endsWith('.mp4'))) {
          
          try {            
            // Download the video file using your proxy to avoid CORS
            const videoResponse = await fetch(`${apiBaseUrl}/images/proxy`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                imageUrl: result.RESPONSE
              })
            });

            if (!videoResponse.ok) {
              throw new Error(`Failed to download video via proxy: ${videoResponse.status}`);
            }

            const videoBlob = await videoResponse.blob();
            
            const videoFile = new File([videoBlob], 'generated_video.mp4', { type: 'video/mp4' });
            
            
            // Use your existing FFmpeg hook to extract audio
            const extractedAudioUrl = await extractAudio(videoFile);
            
                        
            // Add the extracted audio as a sound overlay to the timeline
            const newSoundOverlay = {
              id: Date.now(),
              type: OverlayType.SOUND,
              row: (() => {
                const targetRow = localOverlay.row + 1;
                // Add a new row if we need one
                addRow();
                return targetRow;
              })(),
              from: localOverlay.from,
              durationInFrames: localOverlay.durationInFrames,
              src: extractedAudioUrl,
              content: 'Generated Audio',
              startFromSound: 0,
              height: 100,
              left: 0,
              top: 0,
              width: 100,
              isDragging: false,
              rotation: 0,
              styles: {
                opacity: 1,
                volume: 1,
              },
            } as const;

            addOverlay(newSoundOverlay);
            // Deduct credits for audio generation
            handleAudioCreditDeduction();
            // Stop the loading state only after successfully adding to timeline
            setIsGeneratingAudio(false);
            
          } catch (extractionError) {
              console.error('Polling error:', extractionError);
              setIsGeneratingAudio(false); // Stop loading on error
          }
          
        } else if (result.RESULT === 'SUCCESS' && result.RESPONSE && typeof result.RESPONSE === 'object' && result.RESPONSE.progress !== undefined) {
          // Handle progress response - still generating
          attempts++;
          if (attempts < maxAttempts) {
            setTimeout(poll, 5000); // Poll every 5 seconds
          } else {
            throw new Error('Audio generation timed out - maximum polling attempts reached');
          }
        } else if (result.RESULT === 'PENDING' || result.status === 'processing') {
          // Still processing, continue polling
          attempts++;
          if (attempts < maxAttempts) {
            setTimeout(poll, 5000); // Poll every 5 seconds
          } else {
            throw new Error('Audio generation timed out');
          }
        } else if (result.RESULT === 'ERROR' && result.RESPONSE && result.RESPONSE.includes('Video is not generated')) {
          // Audio is still being generated, continue polling
          attempts++;
          if (attempts < maxAttempts) {
            setTimeout(poll, 5000); // Poll every 5 seconds
          } else {
            throw new Error('Audio generation timed out - video not ready after maximum attempts');
          }
        } else {
          throw new Error(result.MESSAGE || result.RESPONSE || 'Audio generation failed');
        }
        
      } catch (error) {
        console.error('Polling error:', error);
      }
    };
    
    // Start polling after a 2-second initial delay
    setTimeout(poll, 2000);
  };

  return (
    <div className="space-y-2">
      {/* Volume Settings */}
      <div className="space-y-4 rounded-md bg-gray-100/50 dark:bg-gray-800/50 p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Volume
          </h3>
          {localOverlay?.audioDetached ? (
            <span className="text-xs px-2.5 py-1.5 rounded-md bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800">
              Audio Detached
            </span>
          ) : (
            <button
              onClick={() =>
                handleStyleChange({
                  volume: localOverlay?.styles?.volume === 0 ? 1 : 0,
                })
              }
              className={`text-xs px-2.5 py-1.5 rounded-md transition-colors ${
                (localOverlay?.styles?.volume ?? 1) === 0
                  ? "bg-blue-500/20 text-blue-600 dark:text-blue-400 hover:bg-blue-500/30"
                  : "bg-gray-200/50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              {(localOverlay?.styles?.volume ?? 1) === 0 ? "Unmute" : "Mute"}
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 pt-1">
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={localOverlay?.styles?.volume ?? 1}
              onChange={(e) =>
                !localOverlay?.audioDetached && 
                handleStyleChange({ volume: parseFloat(e.target.value) })
              }
            disabled={localOverlay?.audioDetached}
            className={`flex-1 accent-blue-500 h-1.5 rounded-full ${
              localOverlay?.audioDetached 
                ? "bg-gray-300 dark:bg-gray-600 opacity-50 cursor-not-allowed" 
                : "bg-gray-200 dark:bg-gray-700"
            }`}
          />
          <span className="text-xs text-gray-600 dark:text-gray-400 min-w-[40px] text-right">
            {Math.round((localOverlay?.styles?.volume ?? 1) * 100) + "%"}
          </span>
        </div>
      </div>

      {/* Speed Settings */}
      <div className="space-y-4 rounded-md bg-gray-100/50 dark:bg-gray-800/50 p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Playback Speed
          </h3>
          <button
            onClick={() => {
              handleSpeedChange(1);
              setIsSelectOpen(false);
            }}
            className={`text-xs px-2.5 py-1.5 rounded-md transition-colors ${
              (localOverlay?.speed ?? 1) !== 1
                ? "bg-blue-500/20 text-blue-600 dark:text-blue-400 hover:bg-blue-500/30"
                : "bg-gray-200/50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-700"
            }`}
          >
            Reset
          </button>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <Select
            open={isSelectOpen}
            onOpenChange={setIsSelectOpen}
            value={String(localOverlay?.speed ?? 1)}
            onValueChange={(value) => handleSpeedChange(parseFloat(value))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select speed" />
            </SelectTrigger>
            <SelectContent>
              {SPEED_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={String(option.value)}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Crop Settings */}
      <div className="space-y-2 rounded-md bg-card p-4 border">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-light">
            Crop
          </h3>
          <Toggle
            pressed={localOverlay?.styles?.crop?.enabled ?? false}
            onPressedChange={(pressed) => {
              const currentCrop = localOverlay?.styles?.crop;
              
              // if (pressed) {
              //   // Enabling crop mode - initialize crop area
              //   console.log('Enabling crop mode for overlay:', localOverlay?.id);
              //   handleStyleChange({
              //     crop: {
              //       enabled: true,
              //       x: currentCrop?.x ?? 0,
              //       y: currentCrop?.y ?? 0,
              //       width: currentCrop?.width ?? localOverlay?.width ?? 300,
              //       height: currentCrop?.height ?? localOverlay?.height ?? 200,
              //     },
              //   });
              // } else {
              //   // Disabling crop mode - hide the crop overlay UI but keep crop settings active
              //   console.log('Disabling crop UI for overlay:', localOverlay?.id, 'keeping crop settings:', currentCrop);
              //   if (currentCrop) {
              //     // Keep the crop settings but mark it as not actively being edited
              //     handleStyleChange({
              //       crop: {
              //         enabled: false, // This just hides the crop overlay UI
              //         x: currentCrop.x,
              //         y: currentCrop.y,
              //         width: currentCrop.width,
              //         height: currentCrop.height,
              //       },
              //     });
              //   } else {
              //     // No existing crop, just disable
              //     handleStyleChange({
              //       crop: {
              //         enabled: false,
              //         x: 0,
              //         y: 0,
              //         width: localOverlay?.width ?? 300,
              //         height: localOverlay?.height ?? 200,
              //       },
              //     });
              //   }
              // }

              if (pressed) {
                // Enabling crop mode - initialize crop area
                console.log('Enabling crop mode for overlay:', localOverlay?.id);
                handleStyleChange({
                  crop: {
                    enabled: true,
                    x: currentCrop?.x ?? 0,
                    y: currentCrop?.y ?? 0,
                    width: currentCrop?.width ?? 1,
                    height: currentCrop?.height ?? 1,
                  },
                });
              } else {
                // Disabling crop mode - hide the crop overlay UI but keep crop settings active
                console.log('Disabling crop UI for overlay:', localOverlay?.id, 'keeping crop settings:', currentCrop);
                if (currentCrop) {
                  // Keep the crop settings but mark it as not actively being edited
                  handleStyleChange({
                    crop: {
                      enabled: false, // This just hides the crop overlay UI
                      x: currentCrop.x,
                      y: currentCrop.y,
                      width: currentCrop.width,
                      height: currentCrop.height,
                    },
                  });
                } else {
                  // No existing crop, just disable
                  handleStyleChange({
                    crop: {
                      enabled: false,
                      x: 0,
                      y: 0,
                      width: 1,
                      height: 1,
                    },
                  });
                }
              }
            }}
            size="sm"
            className="text-xs"
          >
            {localOverlay?.styles?.crop?.enabled ? "Edit Mode" : "View Mode"}
          </Toggle>
        </div>

        {localOverlay?.styles?.crop?.enabled && (
          <div className="space-y-2 pt-1">
            <div className="text-xs text-muted-foreground">
              Drag the crop area in the preview to adjust the crop region.
            </div>
          </div>
        )}
        
        {!localOverlay?.styles?.crop?.enabled && localOverlay?.styles?.crop && (
          <div className="space-y-2 pt-1">
            <div className="text-xs text-muted-foreground">
              Crop is active. Enable edit mode to modify the crop area.
            </div>
          </div>
        )}
        
        {localOverlay?.styles?.crop && (
          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                console.log('Clearing crop for overlay:', localOverlay?.id);
                handleStyleChange({
                  crop: undefined,
                });
              }}
              className="w-full text-xs"
            >
              Clear Crop
            </Button>
          </div>
        )}
      </div>

      {/* AI Audio Settings */}
      <div className="space-y-2 rounded-md bg-gray-100/50 dark:bg-gray-800/50 p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            AI Audio
          </h3>
        </div>

        <div className="space-y-2">
          {/* Prompt Section */}
          <div>
            <button
              onClick={() => setAiAudioSection(aiAudioSection === 'prompt' ? null : 'prompt')}
              className="flex items-center justify-between w-full p-2 text-left text-xs bg-gray-50 dark:bg-gray-700/50 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <span className="text-gray-700 dark:text-gray-300">Prompt</span>
              <svg
                className={`w-4 h-4 text-gray-500 transform transition-transform ${
                  aiAudioSection === 'prompt' ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {aiAudioSection === 'prompt' && (
              <div className="mt-2 space-y-3 p-3 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-600">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Audio Description
                  </label>
                  <textarea
                    value={audioPrompt}
                    onChange={(e) => setAudioPrompt(e.target.value)}
                    placeholder="Describe the audio you want to generate..."
                    className="w-full p-2 text-xs border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={3}
                  />
                </div>
                <button
                  onClick={() => generateAudio(audioPrompt, false)}
                  disabled={!audioPrompt.trim() || isGeneratingAudio}
                  className="w-full px-3 py-2 text-xs bg-[#490972] hover:bg-[#3a0759] disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-md transition-colors flex items-center justify-center gap-2"
                >
                  {isGeneratingAudio ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <img 
                        src="https://zanopy.ai/assets/images/3491bfc1ad15744a7aa565f8f4cbce1e.png" 
                        alt="Generate" 
                        className="w-4 h-4 mr-0.01" 
                      />
                      20<span className="ml-1.5">Generate Audio</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Let AI Decide Section */}
          <div>
            <button
              onClick={() => setAiAudioSection(aiAudioSection === 'ai-decide' ? null : 'ai-decide')}
              className="flex items-center justify-between w-full p-2 text-left text-xs bg-gray-50 dark:bg-gray-700/50 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <span className="text-gray-700 dark:text-gray-300">Let AI Decide</span>
              <svg
                className={`w-4 h-4 text-gray-500 transform transition-transform ${
                  aiAudioSection === 'ai-decide' ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {aiAudioSection === 'ai-decide' && (
              <div className="mt-2 p-3 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-600">
                <button
                  onClick={() => generateAudio('', true)}
                  disabled={isGeneratingAudio}
                  className="w-full px-3 py-2 text-xs bg-[#490972] hover:bg-[#3a0759] disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-md transition-colors flex items-center justify-center gap-2"
                >
                  {isGeneratingAudio ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <img 
                        src="https://zanopy.ai/assets/images/3491bfc1ad15744a7aa565f8f4cbce1e.png" 
                        alt="Generate" 
                        className="w-4 h-4 mr-0.01" 
                      />
                      20<span className="ml-1.5">Generate AI Audio</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Animation Settings - Using the new AnimationSettings component */}
      <AnimationSettings
        animations={animationTemplates}
        selectedEnterAnimation={localOverlay?.styles?.animation?.enter}
        selectedExitAnimation={localOverlay?.styles?.animation?.exit}
        onEnterAnimationSelect={handleEnterAnimationSelect}
        onExitAnimationSelect={handleExitAnimationSelect}
      />
    </div>
  );
};
