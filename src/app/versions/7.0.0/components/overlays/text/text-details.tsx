import React, { useCallback, useState, useRef } from "react";
import { useEditorContext } from "../../../contexts/editor-context";
import { TextOverlay } from "../../../types";
import { PaintBucket, Settings } from "lucide-react";
import debounce from "lodash/debounce";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TextSettingsPanel } from "./text-settings-panel";
import { TextStylePanel } from "./text-style-panel";
import { createEffectPreview } from './text-effect-preview';
import { RichTextEditor } from './rich-text-editor';

// // Helper function to calculate text dimensions
// const calculateTextDimensions = (overlay: TextOverlay): { width: number; height: number } => {
//   const canvas = document.createElement('canvas');
//   const context = canvas.getContext('2d');
  
//   if (!context) return { width: overlay.width, height: overlay.height };
  
//   const multiplier = overlay.styles.fontSizeMultiplier || 1;
//   const baseFontSize = Math.sqrt((overlay.width * overlay.height) / 100) * 1.2; // Simplified base calculation
//   const fontSize = baseFontSize * multiplier;
  
//   context.font = `${overlay.styles.fontWeight || '400'} ${fontSize}px ${overlay.styles.fontFamily || 'Arial'}`;
  
//   const textContent = typeof overlay.content === 'string' ? overlay.content : 
//     (overlay.content?.elements?.map(el => el.text).join(' ') || '');
  
//   const lines = textContent.split('\n');
//   const maxWidth = Math.max(...lines.map(line => context.measureText(line).width));
//   const height = lines.length * fontSize * 1.2; // Line height factor
  
//   return {
//     width: Math.max(50, maxWidth + 20), // Add padding
//     height: Math.max(30, height + 10)   // Add padding
//   };
// };

/**
 * Props for the TextDetails component
 * @interface TextDetailsProps
 * @property {TextOverlay} localOverlay - The local state of the text overlay being edited
 * @property {function} setLocalOverlay - Function to update the local overlay state
 */
interface TextDetailsProps {
  localOverlay: TextOverlay;
  setLocalOverlay: (overlay: TextOverlay) => void;
}

/**
 * TextDetails component provides a UI for editing text overlay properties and styles.
 * It includes a live preview, text editor, and tabbed panels for settings and styling.
 * Changes are debounced to prevent excessive re-renders.
 *
 * @component
 * @param {TextDetailsProps} props - Component props
 * @returns {JSX.Element} Rendered component
 */
export const TextDetails: React.FC<TextDetailsProps> = ({
  localOverlay,
  setLocalOverlay,
}) => {
  const { changeOverlay, selectedOverlayId, overlays } = useEditorContext();
  const [selectedText, setSelectedText] = useState({ start: 0, end: 0, selectedText: '' });
  const editorRef = useRef<{ 
    applyFormatting: (command: string, value?: string) => void; 
    applyInlineStyle: (property: string, value: string) => void;
    toggleInlineFormat: (command: string) => void;
    focus: () => void 
  }>(null);
  const [isUserTyping, setIsUserTyping] = useState(false);

  /**
   * Debounced function to update the overlay in the global state
   * Prevents excessive re-renders by waiting 300ms between updates
   */
  const debouncedUpdateOverlay = useCallback(
    debounce((id: number, newOverlay: TextOverlay) => {
      changeOverlay(id, newOverlay);
    }, 300),
    [changeOverlay]
  );

  /**
   * Handles changes to direct overlay properties
   * @param {keyof TextOverlay} field - The field to update
   * @param {string} value - The new value
   */
  const handleInputChange = (field: keyof TextOverlay, value: string) => {
    // Update local state immediately for responsive UI
    setLocalOverlay({ ...localOverlay, [field]: value });

    // For content changes, mark user as typing
    if (field === 'content') {
      setIsUserTyping(true);
      
      // Clear typing state after user stops typing
      setTimeout(() => {
        setIsUserTyping(false);
      }, 1000);
    }

    // Debounce the actual overlay update if an overlay is selected
    if (selectedOverlayId !== null) {
      const overlay = overlays.find((o) => o.id === selectedOverlayId);
      if (overlay) {
        debouncedUpdateOverlay(selectedOverlayId, {
          ...overlay,
          [field]: value,
        } as TextOverlay);
      }
    }
  };

  /**
   * Handles changes to nested style properties
   * @param {keyof TextOverlay["styles"]} field - The style field to update
   * @param {string} value - The new value
   */
  const handleStyleChange = (
    field: keyof TextOverlay["styles"],
    value: string | number
  ) => {
    
    const updatedLocalOverlay = {
      ...localOverlay,
      styles: { ...localOverlay.styles, [field]: value },
    };
    
    setLocalOverlay(updatedLocalOverlay);

    // Update the global state immediately
    if (selectedOverlayId !== null) {
      changeOverlay(selectedOverlayId, (overlay) => {
        return updatedLocalOverlay as TextOverlay;
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Preview and Edit Section */}
      <div className="flex flex-col gap-2 ">
        {/* Preview */}
        <div className="flex flex-col gap-2 bg-slate-100/90 dark:bg-gray-800">
          <div
            style={{
              backgroundColor: localOverlay.styles.backgroundColor,
            }}
            className="relative w-full overflow-hidden rounded-t-sm border border-border p-4"
          >
          <div className="w-full break-words">
            {(() => {
              const effectConfig = localOverlay.styles.effect || 
                                  (localOverlay.styles.cssClass === 'striped-shadow' ? { type: 'striped-shadow' } : null);
              
              if (effectConfig) {
                const previewStyle = {
                  fontFamily: localOverlay.styles.fontFamily,
                  fontSize: '16px',
                  fontWeight: localOverlay.styles.fontWeight,
                  fontStyle: localOverlay.styles.fontStyle,
                  textDecoration: localOverlay.styles.textDecoration,
                  letterSpacing: localOverlay.styles.letterSpacing,
                  lineHeight: localOverlay.styles.lineHeight
                };
                
                const effect = createEffectPreview(effectConfig, previewStyle, 
                  typeof localOverlay.content === 'string' ? localOverlay.content : "Text Preview");
                
                if (effect) {
                  if (effect.container) {
                    return (
                      <div style={effect.container as React.CSSProperties}>
                        {effect.layers.map((layer, index) => (
                          <div key={index} style={layer.style}>
                            {layer.content}
                          </div>
                        ))}
                      </div>
                    );
                  } else {
                    return effect.layers.map((layer, index) => (
                      <div key={index} style={layer.style}>
                        {layer.content}
                      </div>
                    ));
                  }
                }
              }
              
              // Fallback for non-effect styles
              const previewContent = typeof localOverlay.content === 'string' ? localOverlay.content : "Text Preview";
              const previewStyle = {
                color: localOverlay.styles.color || '#000000',
                fontSize: '16px',
                fontWeight: localOverlay.styles.fontWeight,
                fontFamily: localOverlay.styles.fontFamily || 'Arial, sans-serif',
                fontStyle: localOverlay.styles.fontStyle,
                textDecoration: localOverlay.styles.textDecoration,
                lineHeight: localOverlay.styles.lineHeight,
                letterSpacing: localOverlay.styles.letterSpacing
              };
              
              return localOverlay.styles.isRichText ? (
                <div 
                  style={previewStyle}
                  dangerouslySetInnerHTML={{ __html: previewContent }}
                />
              ) : (
                <span style={previewStyle}>
                  {previewContent}
                </span>
              );
            })()}
          </div>
        </div>
        </div>

        {/* Editor */}
        <div className="relative w-full overflow-hidden rounded-b-sm border border-border bg-muted/40">
          {/* Formatting Toolbar */}
          {selectedText.selectedText && (
            <div className="flex items-center gap-1 p-2 border-b border-border bg-background/80 backdrop-blur-sm">
              <button
                onClick={() => editorRef.current?.toggleInlineFormat('bold')}
                className="px-2 py-1 text-xs border rounded font-bold hover:bg-accent"
                title="Bold"
              >
                B
              </button>
              <button
                onClick={() => editorRef.current?.toggleInlineFormat('italic')}
                className="px-2 py-1 text-xs border rounded italic hover:bg-accent"
                title="Italic"
              >
                I
              </button>
              <button
                onClick={() => editorRef.current?.toggleInlineFormat('underline')}
                className="px-2 py-1 text-xs border rounded underline hover:bg-accent"
                title="Underline"
              >
                U
              </button>
              
              <div className="w-px h-4 bg-border mx-1" />
              
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    editorRef.current?.applyInlineStyle('font-family', e.target.value);
                    e.target.value = '';
                  }
                }}
                className="text-xs border rounded px-1 py-1 bg-background"
                defaultValue=""
              >
                <option value="">Font</option>
                <option value="Arial, sans-serif">Arial</option>
                <option value="Georgia, serif">Georgia</option>
                <option value="Times New Roman, serif">Times</option>
                <option value="Helvetica, sans-serif">Helvetica</option>
                <option value="Courier New, monospace">Courier</option>
              </select>
              
              <input
                type="range"
                min="0.8"
                max="2"
                step="0.1"
                onChange={(e) => {
                  editorRef.current?.applyInlineStyle('font-size', `${parseFloat(e.target.value)}em`);
                }}
                className="w-16 h-2"
                title="Font Size"
              />
              
              <input
                type="range"
                min="-2"
                max="10"
                step="0.5"
                onChange={(e) => {
                  editorRef.current?.applyInlineStyle('letter-spacing', `${e.target.value}px`);
                }}
                className="w-16 h-2"
                title="Letter Spacing"
              />
              
              <input
                type="color"
                onChange={(e) => {
                  editorRef.current?.applyInlineStyle('color', e.target.value);
                }}
                className="w-6 h-6 border rounded cursor-pointer"
                title="Text Color"
              />
            </div>
          )}
          
          <RichTextEditor
            ref={editorRef}
            content={localOverlay.styles.isRichText 
              ? (typeof localOverlay.content === 'string' ? localOverlay.content : '') 
              : (typeof localOverlay.content === 'string' ? localOverlay.content : '')
            }
            onChange={(content) => {
              handleInputChange("content", content);
              // Enable rich text mode when HTML content is detected
              if (content.includes('<') && !localOverlay.styles.isRichText) {
                handleStyleChange("isRichText", true as any);
              }
            }}
            onSelectionChange={setSelectedText}
            placeholder="Enter your text here..."
            className="w-full min-h-[60px]"
          />
        </div>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="settings" className="w-full">
        <TabsList className="w-full grid grid-cols-2 bg-gray-100/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-sm border border-gray-200 dark:border-gray-700 gap-1">
          <TabsTrigger
            value="settings"
            className="data-[state=active]:bg-[rgb(41,0,156)]/15 data-[state=active]:text-[rgb(41,0,156)] dark:data-[state=active]:text-white 
            rounded-sm transition-all duration-200 text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-200 hover:bg-gray-200/50 dark:hover:bg-gray-700/50"
          >
            <span className="flex items-center gap-2 text-xs">
              <Settings className="w-3 h-3" />
              Settings
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="style"
            className="data-[state=active]:bg-[rgb(41,0,156)]/15 data-[state=active]:text-[rgb(41,0,156)] dark:data-[state=active]:text-white 
            rounded-sm transition-all duration-200 text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-200 hover:bg-gray-200/50 dark:hover:bg-gray-700/50"
          >
            <span className="flex items-center gap-2 text-xs">
              <PaintBucket className="w-3 h-3" />
              Style
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-4 mt-4">
          <TextSettingsPanel
            localOverlay={localOverlay}
            handleStyleChange={handleStyleChange}
          />
        </TabsContent>

        <TabsContent value="style" className="space-y-4 mt-4">
          <TextStylePanel
            localOverlay={localOverlay}
            handleInputChange={handleInputChange}
            handleStyleChange={handleStyleChange}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
