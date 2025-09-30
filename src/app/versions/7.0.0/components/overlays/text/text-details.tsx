import React, { useCallback, useState, useRef } from "react";
import { useEditorContext } from "../../../contexts/editor-context";
import { TextOverlay } from "../../../types";
import { PaintBucket, Settings } from "lucide-react";
import debounce from "lodash/debounce";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TextSettingsPanel } from "./text-settings-panel";
import { TextStylePanel } from "./text-style-panel";
import { createEffectPreview } from './text-effect-preview';


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
  // const [selectedText, setSelectedText] = useState({ start: 0, end: 0, selectedText: '' });
  // const editorRef = useRef<any>(null);
  // // Pass editor ref to style panel
  // React.useEffect(() => {
  //   if (editorRef.current) {
  //     window.dispatchEvent(new CustomEvent('setEditorRef', { 
  //       detail: { editorRef: editorRef.current } 
  //     }));
  //   }
  // }, [editorRef.current]);
  // const [isUserTyping, setIsUserTyping] = useState(false);

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
   * @param {Partial<TextOverlay["styles"]>} updates - The style updates to apply
   */
  const handleStyleChange = (
    updates: Partial<TextOverlay["styles"]>
  ) => {
    const updatedLocalOverlay = {
      ...localOverlay,
      styles: { ...localOverlay.styles, ...updates },
    };
    
    setLocalOverlay(updatedLocalOverlay);

    // Debounce the actual overlay update if an overlay is selected
    if (selectedOverlayId !== null) {
      debouncedUpdateOverlay(selectedOverlayId, updatedLocalOverlay as TextOverlay);
    }
  };

  return (
    <div className="space-y-4">
      {/* Preview and Edit Section */}
      <div className="flex flex-col gap-4 px-2 mt-2">
        {/* Editor */}
        <textarea
          value={typeof localOverlay.content === 'string' ? localOverlay.content : ''}
          onChange={(e) => handleInputChange("content", e.target.value)}
          placeholder="Enter your text here..."
          className="w-full min-h-[60px] resize-none text-sm bg-input border-gray-300 rounded-md border p-2"
          spellCheck="false"
        />
      </div>
      <div className="border-t border-border mx-2" />

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