import React from "react";
import { ImageOverlay, OverlayType } from "../../../types";
import { AnimationSettings } from "../../shared/animation-preview";
import { animationTemplates } from "../../../templates/animation-templates";
import { useEditorContext } from "../../../contexts/editor-context";
import { useTimeline } from "../../../contexts/timeline-context";
import { useFFmpeg } from "../../../hooks/use-ffmpeg";

/**
 * Props for the ImageSettingsPanel component
 */
interface ImageSettingsPanelProps {
  /** The current state of the image overlay being edited */
  localOverlay: ImageOverlay;
  /** Callback to update the overlay's style properties */
  handleStyleChange: (updates: Partial<ImageOverlay["styles"]>) => void;
}

/**
 * ImageSettingsPanel Component
 *
 * A panel that allows users to configure animation settings for an image overlay.
 * Provides options to set both enter and exit animations from a predefined set
 * of animation templates.
 *
 * Features:
 * - Enter animation selection
 * - Exit animation selection
 * - Option to remove animations ("None" selection)
 */
export const ImageSettingsPanel: React.FC<ImageSettingsPanelProps> = ({
  localOverlay,
  handleStyleChange,
}) => {

  const [aiAudioSection, setAiAudioSection] = React.useState<'prompt' | 'ai-decide' | null>(null);
  const [audioPrompt, setAudioPrompt] = React.useState('');
  const [isGeneratingAudio, setIsGeneratingAudio] = React.useState(false);

  const { addOverlay, overlays } = useEditorContext();
  const { addRow } = useTimeline();
  const { extractAudio } = useFFmpeg();

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

      console.log('Starting audio generation with:', { prompt, isAiDecide, uid });

      // For "Let AI Decide" - send image URL directly
      if (isAiDecide) {
        console.log('Using image URL directly for AI decision:', localOverlay.src);
        
        // Check if the image source is available
        if (!localOverlay.src) {
          throw new Error('No image source available');
        }

        // Create form data - send image URL directly like in your successful curl
        const formData = new FormData();
        formData.append('do_action', 'BLYNKK_ADD_GENAI_AUDIOSYNTH_REQUEST');
        formData.append('input_type', 'image_to_audio');
        formData.append('user_id', uid);
        formData.append('seed', '-1');
        
        // Send the image URL directly, not as a file upload
        formData.append('input_file', localOverlay.src);

        console.log('Form data prepared with image URL');

        // Make API call
        await makeApiCall(formData);
      } else {
        // For prompt-based generation (text-to-audio)
        console.log('Using text prompt with image URL for text-to-audio:', { prompt, imageUrl: localOverlay.src });
        
        // Check if the image source is available
        if (!localOverlay.src) {
          throw new Error('No image source available');
        }

        const formData = new FormData();
        formData.append('do_action', 'ADD_AUDIO');
        formData.append('input_type', 'image_to_audio');
        formData.append('input_file', localOverlay.src);
        formData.append('user_id', uid);
        formData.append('prompt', prompt);
        formData.append('negative_prompt', 'speech, voice, talking, narration, vocals, dialogue, singing, human sounds');
        formData.append('seed', '-1');

        console.log('Form data prepared for text-to-audio with image URL');

        // Make API call
        await makeApiCallPrompt(formData);
      }
      
    } catch (error) {
      console.error('Audio generation error:', error);
    }
  };

  // Separate function to handle the API call for prompt-based generation (different URL)
  const makeApiCallPrompt = async (formData: FormData) => {
    try {
      console.log('Making prompt-based API call...');
      
      // Log form data contents for debugging
      console.log('FormData contents:');
      for (const [key, value] of formData.entries()) {
        console.log(`${key}:`, value instanceof File ? `File: ${value.name} (${value.size} bytes)` : value);
      }

      // Use different proxy API for prompt-based generation
      const apiResponse = await fetch('/api/latest/audio/generate-prompt', {
        method: 'POST',
        body: formData,
      });

      // ... rest of the response handling code same as makeApiCall
      console.log('API Response received:', {
        status: apiResponse.status,
        statusText: apiResponse.statusText,
        type: apiResponse.type
      });

      if (apiResponse.type === 'opaque') {
        console.log('Received opaque response (no-cors mode)');
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
      console.log('Raw API Response:', responseText);

      if (!responseText || responseText.trim().length === 0) {
        console.log('Empty response - might be normal for this API');
        setTimeout(() => {
          setAudioPrompt('');
          setAiAudioSection(null);
        }, 5000);
        return;
      }

      let result;
      try {
        result = JSON.parse(responseText);
        console.log('Parsed result:', result);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        throw new Error('Invalid response format from server');
      }

      if (result.status === 'success' && result.genai_code) {
        const genaiCode = result.genai_code;
        console.log('Audio generation started with code:', genaiCode);
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
      console.log('Making API call...');
      
      // Log form data contents for debugging
      console.log('FormData contents:');
      for (const [key, value] of formData.entries()) {
        console.log(`${key}:`, value instanceof File ? `File: ${value.name} (${value.size} bytes)` : value);
      }

      // Use your proxy API instead of direct call
      const apiResponse = await fetch('/api/latest/audio/generate', {
        method: 'POST',
        body: formData,
      });

      console.log('API Response received:', {
        status: apiResponse.status,
        statusText: apiResponse.statusText,
        type: apiResponse.type
      });

      // Handle no-cors mode (opaque response)
      if (apiResponse.type === 'opaque') {
        console.log('Received opaque response (no-cors mode)');
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
      console.log('Raw API Response:', responseText);

      if (!responseText || responseText.trim().length === 0) {
        console.log('Empty response - might be normal for this API');
        setTimeout(() => {
          setAudioPrompt('');
          setAiAudioSection(null);
        }, 5000);
        return;
      }

      let result;
      try {
        result = JSON.parse(responseText);
        console.log('Parsed result:', result);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        throw new Error('Invalid response format from server');
      }

      if (result.RESULT === 'SUCCESS' && result.RESPONSE) {
        console.log('Audio generation started with code:', result.RESPONSE);
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

        const response = await fetch('/api/latest/audio/generate', {
          method: 'POST',
          body: formData,
        });

        // Check if the response is ok
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Get the response text first to debug
        const responseText = await response.text();
        console.log('Polling Response:', responseText);

        // Try to parse as JSON
        let result;
        try {
          result = JSON.parse(responseText);
        } catch (parseError) {
          console.error('Failed to parse polling JSON response:', responseText);
          throw new Error('Invalid response format from server');
        }
        
        if (result.RESULT === 'SUCCESS' && result.RESPONSE && typeof result.RESPONSE === 'string' && (result.RESPONSE.startsWith('http') || result.RESPONSE.endsWith('.mp4'))) {
          console.log('Video URL received, extracting audio:', result.RESPONSE);
          
          try {            
            // Download the video file using your proxy to avoid CORS
            const videoResponse = await fetch('/api/latest/images/proxy', {
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
            
            console.log('Video downloaded, extracting audio with FFmpeg...');
            
            // Use your existing FFmpeg hook to extract audio
            const extractedAudioUrl = await extractAudio(videoFile);
            
            console.log('Audio extraction completed:', extractedAudioUrl);
                        
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
            // Stop the loading state only after successfully adding to timeline
            setIsGeneratingAudio(false);
            
          } catch (extractionError) {
              console.error('Polling error:', extractionError);
              setIsGeneratingAudio(false); // Stop loading on error
          }
          
        } else if (result.RESULT === 'SUCCESS' && result.RESPONSE && typeof result.RESPONSE === 'object' && result.RESPONSE.progress !== undefined) {
          // Handle progress response - still generating
          console.log(`Audio generation in progress... ${result.RESPONSE.progress_msg || 'Processing'} (attempt ${attempts + 1}/${maxAttempts})`);
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
          console.log(`Audio still generating... attempt ${attempts + 1}/${maxAttempts}`);
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

  // Handlers for animation selection
  const handleEnterAnimationSelect = (animationKey: string) => {
    handleStyleChange({
      animation: {
        ...localOverlay.styles.animation,
        enter: animationKey === "none" ? undefined : animationKey,
      },
    });
  };

  const handleExitAnimationSelect = (animationKey: string) => {
    handleStyleChange({
      animation: {
        ...localOverlay.styles.animation,
        exit: animationKey === "none" ? undefined : animationKey,
      },
    });
  };

  return (
    <div className="space-y-6">
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
                  className="w-full px-3 py-2 text-xs bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-md transition-colors flex items-center justify-center gap-2"
                >
                  {isGeneratingAudio ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                      Generating...
                    </>
                  ) : (
                    'Generate Audio'
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
                  className="w-full px-3 py-2 text-xs bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-md transition-colors flex items-center justify-center gap-2"
                >
                  {isGeneratingAudio ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                      Generating...
                    </>
                  ) : (
                    'Generate AI Audio'
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimationSettings
        animations={animationTemplates}
        selectedEnterAnimation={localOverlay.styles.animation?.enter}
        selectedExitAnimation={localOverlay.styles.animation?.exit}
        onEnterAnimationSelect={handleEnterAnimationSelect}
        onExitAnimationSelect={handleExitAnimationSelect}
      />
    </div>
  );
};
