import React from "react";
import { ImageOverlay } from "../../../types";
import { AnimationSettings } from "../../shared/animation-preview";
import { animationTemplates } from "../../../templates/animation-templates";

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
                  onClick={() => {
                    // Handle audio generation here
                  }}
                  disabled={!audioPrompt.trim()}
                  className="w-full px-3 py-2 text-xs bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-md transition-colors"
                >
                  Generate Audio
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
                  onClick={() => {
                    // Handle AI decision audio generation here
                  }}
                  className="w-full px-3 py-2 text-xs bg-green-500 hover:bg-green-600 text-white rounded-md transition-colors"
                >
                  Generate AI Audio
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
