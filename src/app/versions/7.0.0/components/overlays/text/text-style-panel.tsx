import React from "react";
import { TextOverlay } from "../../../types";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { AlignLeft, AlignCenter, AlignRight } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import ColorPicker from "react-best-gradient-color-picker";
import { useEditorContext } from "../../../contexts/editor-context";

/**
 * Available font options for text overlays
 */

import { GOOGLE_FONTS, GoogleFont, FontVariant, loadGoogleFont, getFontFamilyString } from '../../../utils/google-fonts';


/**
 * Props for the TextStylePanel component
 * @interface TextStylePanelProps
 * @property {TextOverlay} localOverlay - The current text overlay object containing styles and content
 * @property {Function} handleInputChange - Callback function to handle changes to overlay text content
 * @property {Function} handleStyleChange - Callback function to handle style changes for the text overlay
 */
interface TextStylePanelProps {
  localOverlay: TextOverlay;
  handleInputChange: (field: keyof TextOverlay, value: string) => void;
  handleStyleChange: (field: keyof TextOverlay["styles"], value: any) => void;
}

/**
 * Panel component for managing text overlay styling options
 * Provides controls for typography settings (font family, alignment) and colors (text color, highlight)
 *
 * @component
 * @param {TextStylePanelProps} props - Component props
 * @returns {JSX.Element} A panel with text styling controls
 */
export const TextStylePanel: React.FC<TextStylePanelProps> = ({
  localOverlay,
  handleStyleChange,
}) => {
  const { selectedOverlayId, changeOverlay, overlays } = useEditorContext();
  const [fontsLoaded, setFontsLoaded] = React.useState(false);
  const [selectedFont, setSelectedFont] = React.useState<GoogleFont | null>(null);
  const [hoveredFont, setHoveredFont] = React.useState<string | null>(null);

  // Load fonts when style panel opens
  React.useEffect(() => {
    setFontsLoaded(true); // Skip initial loading for now
  }, []);

const handleFontSelect = async (font: GoogleFont, variant: FontVariant) => {
    try {
      await loadGoogleFont(font.family, [variant]);
      const fontFamilyString = getFontFamilyString(font.family);
      
      // Update all font properties together
      if (selectedOverlayId !== null) {
        const overlay = overlays.find((o) => o.id === selectedOverlayId);
        if (overlay) {
          const updatedOverlay = {
            ...overlay,
            styles: { 
              ...overlay.styles, 
              fontFamily: fontFamilyString,
              fontWeight: variant.weight,
              fontStyle: variant.style
            },
          };
          
          changeOverlay(selectedOverlayId, (currentOverlay) => updatedOverlay as TextOverlay);
        }
      }
      
      setSelectedFont(null);
      setHoveredFont(null);
    } catch (error) {
      console.error('Failed to load font:', error);
      // Fallback to system fonts
      handleStyleChange("fontFamily", "Arial, sans-serif");
      handleStyleChange("fontWeight", "400");
      handleStyleChange("fontStyle", "normal");
      setSelectedFont(null);
      setHoveredFont(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Typography Settings */}
      <div className="space-y-4 rounded-md bg-background/50 p-4 border">
        <h3 className="text-sm font-medium">Typography</h3>

        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Font Family</label>
          <div className="relative">
            <div className="relative">
              <button 
                className="w-full text-left px-3 py-2 text-xs border rounded-md bg-background hover:bg-accent"
                onClick={() => setSelectedFont(selectedFont ? null : GOOGLE_FONTS[0])}
              >
                {localOverlay.styles.fontFamily || "Select a font"}
              </button>
              
              {selectedFont && (
                <div className="absolute top-full left-0 mt-1 w-full bg-popover border rounded-md shadow-lg z-40 max-h-60 overflow-y-auto">
                  <div className="p-1">
                    {hoveredFont ? (
                      // Show variants view with back button
                      <div>
                        <button
                          className="w-full text-left px-2 py-1 text-xs hover:bg-accent rounded-sm mb-1 border-b"
                          onClick={() => setHoveredFont(null)}
                        >
                          ← Back to fonts
                        </button>
                        <div className="font-medium px-2 py-1 text-xs mb-1" style={{ fontFamily: getFontFamilyString(hoveredFont) }}>
                          {hoveredFont}
                        </div>
                        {GOOGLE_FONTS.find(f => f.family === hoveredFont)?.variants.map((variant) => (
                          <button
                            key={`${variant.weight}-${variant.style}`}
                            className="w-full text-left px-2 py-1 text-xs hover:bg-accent rounded-sm"
                            style={{ 
                              fontFamily: getFontFamilyString(hoveredFont),
                              fontWeight: variant.weight,
                              fontStyle: variant.style
                            }}
                            onClick={() => {
                              const font = GOOGLE_FONTS.find(f => f.family === hoveredFont);
                              if (font) handleFontSelect(font, variant);
                            }}
                          >
                            {variant.displayName}
                          </button>
                        ))}
                      </div>
                    ) : (
                      // Show fonts list
                      GOOGLE_FONTS.map((font) => (
                        <div
                          key={font.family}
                          className="px-2 py-1 text-xs cursor-pointer hover:bg-accent rounded-sm flex justify-between items-center"
                          style={{ fontFamily: getFontFamilyString(font.family) }}
                          onClick={() => setHoveredFont(font.family)}
                        >
                          <span>{font.family}</span>
                          <span className="text-xs opacity-50">→</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Alignment</label>
            <ToggleGroup
              type="single"
              className="justify-start gap-1"
              value={localOverlay.styles.textAlign}
              onValueChange={(value) => {
                if (value) handleStyleChange("textAlign", value);
              }}
            >
              <ToggleGroupItem
                value="left"
                aria-label="Align left"
                className="h-10 w-10"
              >
                <AlignLeft className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem
                value="center"
                aria-label="Align center"
                className="h-10 w-10"
              >
                <AlignCenter className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem
                value="right"
                aria-label="Align right"
                className="h-10 w-10"
              >
                <AlignRight className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
      </div>

      {/* Colors */}
      <div className="space-y-4 rounded-md bg-background/50 p-4 border">
        <h3 className="text-sm font-medium">Colors</h3>

        <div className="grid grid-cols-3 gap-4">
          {!localOverlay.styles.WebkitBackgroundClip ? (
            <>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">
                  Text Color
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <div
                      className="h-8 w-8 rounded-md border cursor-pointer"
                      style={{ backgroundColor: localOverlay.styles.color }}
                    />
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-[330px] dark:bg-gray-900 border border-gray-700"
                    side="right"
                  >
                    <ColorPicker
                      value={localOverlay.styles.color}
                      onChange={(color) => handleStyleChange("color", color)}
                      // hideInputs
                      hideHue
                      hideControls
                      hideColorTypeBtns
                      hideAdvancedSliders
                      hideColorGuide
                      hideInputType
                      height={200}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">
                  Highlight
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <div
                      className="h-8 w-8 rounded-md border cursor-pointer"
                      style={{
                        backgroundColor: localOverlay.styles.backgroundColor,
                      }}
                    />
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-[330px] dark:bg-gray-900 border border-gray-700"
                    side="right"
                  >
                    <ColorPicker
                      value={localOverlay.styles.backgroundColor}
                      onChange={(color) => {
                        handleStyleChange("backgroundColor", color);
                      }}
                      hideInputs
                      hideHue
                      hideControls
                      hideColorTypeBtns
                      hideAdvancedSliders
                      hideColorGuide
                      hideInputType
                      height={200}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </>
          ) : (
            <div className="col-span-3">
              <p className="text-xs text-muted-foreground">
                Color settings are not available for gradient text styles
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
