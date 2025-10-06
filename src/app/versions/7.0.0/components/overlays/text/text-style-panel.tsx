import React from "react";
import { TextOverlay } from "../../../types";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { AlignLeft, AlignCenter, AlignRight, ChevronDown, ChevronRight } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import ColorPicker from "react-best-gradient-color-picker";
import { useEditorContext } from "../../../contexts/editor-context";
// import { RichTextEditor } from './rich-text-editor';

/**
 * Available font options for text overlays
 */

import { GOOGLE_FONTS, GoogleFont, FontVariant, loadGoogleFont, getFontFamilyString } from '../../../utils/google-fonts';

// Helper function to extract just the font name from font family string
const extractFontName = (fontFamily: string | undefined): string => {
  if (!fontFamily) return '';
  
  // Remove quotes and everything after the first comma
  return fontFamily
    .split(',')[0]  // Take only the first part before comma
    .replace(/['"]/g, '')  // Remove all quotes
    .trim();  // Remove any whitespace
};


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
  handleStyleChange: (updates: Partial<TextOverlay["styles"]>) => void;
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
  
// Helper function to update a single style field
  const updateStyle = (field: keyof TextOverlay["styles"], value: any) => {
    handleStyleChange({ [field]: value });
  };
  const [fontsLoaded, setFontsLoaded] = React.useState(false);
  const [selectedFont, setSelectedFont] = React.useState<GoogleFont | null>(null);
  const [hoveredFont, setHoveredFont] = React.useState<string | null>(null);
  const [isTypographyOpen, setIsTypographyOpen] = React.useState(false);
  const [isSpacingOpen, setIsSpacingOpen] = React.useState(false);

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
      updateStyle("fontFamily", "Arial, sans-serif");
      updateStyle("fontWeight", "400");
      updateStyle("fontStyle", "normal");
      setSelectedFont(null);
      setHoveredFont(null);
    }
  };

  return (
    <div className="space-y-4 px-2">
      {/* Typography Settings */}
      <div className="rounded-md bg-background/50 border">
        <button
          onClick={() => setIsTypographyOpen(!isTypographyOpen)}
          className="w-full flex items-center justify-between p-4 text-sm font-medium hover:bg-accent/50 rounded-t-md"
        >
          <span>Typography</span>
          {isTypographyOpen ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
        
        {isTypographyOpen && (
          <div className="space-y-4 p-4 pt-0">

        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Font Family</label>
          <div className="relative">
            <div className="relative">
              <button 
                className="w-full text-left px-3 py-2 text-xs border rounded-md bg-background hover:bg-accent"
                onClick={() => setSelectedFont(selectedFont ? null : GOOGLE_FONTS[0])}
                style={{ fontFamily: localOverlay.styles.fontFamily || 'Arial, sans-serif' }}
              >
                {extractFontName(localOverlay.styles.fontFamily) || "Select a font"}
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
                        {/* <div className="font-medium px-2 py-1 text-xs mb-1" style={{ fontFamily: getFontFamilyString(hoveredFont) }}>
                          {hoveredFont}
                        </div> */}
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
                            {hoveredFont} {variant.displayName}
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

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Font Size</label>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                min="12"
                max="200"
                step="1"
                value={parseInt(localOverlay.styles.fontSize || "32")}
                onChange={(e) => updateStyle("fontSize", `${e.target.value}px`)}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <input
                type="number"
                min="12"
                max="200"
                step="1"
                value={parseInt(localOverlay.styles.fontSize || "32")}
                onChange={(e) => updateStyle("fontSize", `${e.target.value}px`)}
                className="w-16 px-2 py-1 text-xs border rounded"
              />
              <span className="text-xs text-muted-foreground">px</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Text Style</label>
            <div className="flex gap-1">
              <button
                onClick={() => {
                  const currentWeight = localOverlay.styles.fontWeight || '400';
                  const isBold = parseInt(currentWeight.toString()) >= 700;
                  updateStyle("fontWeight", isBold ? "400" : "700");
                }}
                className={`px-3 py-1 text-xs border rounded font-bold transition-colors ${
                  parseInt((localOverlay.styles.fontWeight || '400').toString()) >= 700 
                    ? 'bg-accent border-accent-foreground' 
                    : 'bg-background hover:bg-accent'
                }`}
              >
                B
              </button>
              <button
                onClick={() => {
                  const isItalic = localOverlay.styles.fontStyle === 'italic';
                  updateStyle("fontStyle", isItalic ? "normal" : "italic");
                }}
                className={`px-3 py-1 text-xs border rounded italic transition-colors ${
                  localOverlay.styles.fontStyle === 'italic' 
                    ? 'bg-accent border-accent-foreground' 
                    : 'bg-background hover:bg-accent'
                }`}
              >
                I
              </button>
              <button
                onClick={() => {
                  const isUnderlined = localOverlay.styles.textDecoration === 'underline';
                  updateStyle("textDecoration", isUnderlined ? "none" : "underline");
                }}
                className={`px-3 py-1 text-xs border rounded underline transition-colors ${
                  localOverlay.styles.textDecoration === 'underline' 
                    ? 'bg-accent border-accent-foreground' 
                    : 'bg-background hover:bg-accent'
                }`}
              >
                U
              </button>
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
                if (value) updateStyle("textAlign", value);
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

        {/* Colors */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Colors</h4>
          <div className="grid grid-cols-3 gap-4">
            {!localOverlay.styles.WebkitBackgroundClip ? (
              <>
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Text Color</label>
                  <div className="h-8 w-8 rounded-md border cursor-pointer flex items-center gap-2">
                    <input
                      type="color"
                      value={
                        localOverlay?.styles?.color === "transparent"
                          ? "#ffffff"
                          : localOverlay?.styles?.color.replace(/rgba?\([^)]+\)/, "#ffffff")
                      }
                      onChange={(e) => updateStyle("color", e.target.value)}
                      className="h-8 w-8 border rounded-md cursor-pointer"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Highlight</label>
                  <div className="h-8 w-8 rounded-md border cursor-pointer flex items-center gap-2">
                    <input
                      type="color"
                      value={
                        localOverlay?.styles?.backgroundColor === "transparent"
                          ? "#ffffff"
                          : localOverlay?.styles?.backgroundColor.replace(/rgba?\([^)]+\)/, "#ffffff")
                      }
                      onChange={(e) => updateStyle("backgroundColor", e.target.value)}
                      className="h-8 w-8 border rounded-md cursor-pointer"
                    />
                  </div>
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

        {/* Drop Shadow */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Drop Shadow</h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground">Offset X (px)</label>
              <input
                type="range"
                min="-10"
                max="10"
                step="1"
                value={(() => {
                  const shadow = localOverlay.styles.textShadow;
                  if (!shadow || shadow === 'none') return 0;
                  const match = shadow.match(/(-?\d+)px\s+(-?\d+)px/);
                  return match ? parseInt(match[1]) : 0;
                })()}
                onChange={(e) => {
                  const currentShadow = localOverlay.styles.textShadow || 'none';
                  const offsetX = e.target.value;
                  let offsetY = '0', blur = '0', color = 'rgba(0,0,0,0.5)';
                  
                  if (currentShadow !== 'none') {
                    const match = currentShadow.match(/(-?\d+)px\s+(-?\d+)px\s+(\d+)px\s+(.+)/);
                    if (match) {
                      offsetY = match[2];
                      blur = match[3];
                      color = match[4];
                    }
                  }
                  
                  const newShadow = `${offsetX}px ${offsetY}px ${blur}px ${color}`;
                  updateStyle("textShadow", newShadow);
                }}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground">Offset Y (px)</label>
              <input
                type="range"
                min="-10"
                max="10"
                step="1"
                value={(() => {
                  const shadow = localOverlay.styles.textShadow;
                  if (!shadow || shadow === 'none') return 0;
                  const match = shadow.match(/(-?\d+)px\s+(-?\d+)px/);
                  return match ? parseInt(match[2]) : 0;
                })()}
                onChange={(e) => {
                  const currentShadow = localOverlay.styles.textShadow || 'none';
                  const offsetY = e.target.value;
                  let offsetX = '0', blur = '0', color = 'rgba(0,0,0,0.5)';
                  
                  if (currentShadow !== 'none') {
                    const match = currentShadow.match(/(-?\d+)px\s+(-?\d+)px\s+(\d+)px\s+(.+)/);
                    if (match) {
                      offsetX = match[1];
                      blur = match[3];
                      color = match[4];
                    }
                  }
                  
                  const newShadow = `${offsetX}px ${offsetY}px ${blur}px ${color}`;
                  updateStyle("textShadow", newShadow);
                }}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground">Blur (px)</label>
              <input
                type="range"
                min="0"
                max="20"
                step="1"
                value={(() => {
                  const shadow = localOverlay.styles.textShadow;
                  if (!shadow || shadow === 'none') return 0;
                  const match = shadow.match(/(-?\d+)px\s+(-?\d+)px\s+(\d+)px/);
                  return match ? parseInt(match[3]) : 0;
                })()}
                onChange={(e) => {
                  const currentShadow = localOverlay.styles.textShadow || 'none';
                  const blur = e.target.value;
                  let offsetX = '0', offsetY = '0', color = 'rgba(0,0,0,0.5)';
                  
                  if (currentShadow !== 'none') {
                    const match = currentShadow.match(/(-?\d+)px\s+(-?\d+)px\s+(\d+)px\s+(.+)/);
                    if (match) {
                      offsetX = match[1];
                      offsetY = match[2];
                      color = match[4];
                    }
                  }
                  
                  const newShadow = `${offsetX}px ${offsetY}px ${blur}px ${color}`;
                  updateStyle("textShadow", newShadow);
                }}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground">Color</label>
              <input
                type="color"
                value={(() => {
                  const shadow = localOverlay.styles.textShadow;
                  if (!shadow || shadow === 'none') return '#808080'; // fallback
                  const match = shadow.match(/rgba?\([^)]+\)|#[a-fA-F0-9]{3,6}|[a-zA-Z]+$/);
                  return match ? match[0] : '#808080';
                })()}
                onChange={(e) => {
                  const color = e.target.value;
                  const currentShadow = localOverlay.styles.textShadow || 'none';
                  let offsetX = '0', offsetY = '0', blur = '0';

                  if (currentShadow !== 'none') {
                    const match = currentShadow.match(/(-?\d+)px\s+(-?\d+)px\s+(\d+)px/);
                    if (match) {
                      offsetX = match[1];
                      offsetY = match[2];
                      blur = match[3];
                    }
                  }

                  const newShadow = `${offsetX}px ${offsetY}px ${blur}px ${color}`;
                  updateStyle("textShadow", newShadow);
                }}
                className="h-6 w-16 rounded border cursor-pointer"
              />
            </div>
          </div>
          
          <button
            onClick={() => updateStyle("textShadow", "none")}
            className="w-full px-2 py-1 text-xs border rounded hover:bg-accent"
          >
            Remove Shadow
          </button>
        </div>
          </div>
        )}
      </div>

      {/* Spacing Settings */}
      <div className="rounded-md bg-background/50 border">
        <button
          onClick={() => setIsSpacingOpen(!isSpacingOpen)}
          className="w-full flex items-center justify-between p-4 text-sm font-medium hover:bg-accent/50 rounded-t-md"
        >
          <span>Spacing</span>
          {isSpacingOpen ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
        
        {isSpacingOpen && (
          <div className="space-y-4 p-4 pt-0">
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Line Height</label>
              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  min="0.8"
                  max="3"
                  step="0.1"
                  value={parseFloat(localOverlay.styles.lineHeight || "1.2")}
                  onChange={(e) => updateStyle("lineHeight", e.target.value)}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <input
                  type="number"
                  min="0.8"
                  max="3"
                  step="0.1"
                  value={parseFloat(localOverlay.styles.lineHeight || "1.2")}
                  onChange={(e) => updateStyle("lineHeight", e.target.value)}
                  className="w-16 px-2 py-1 text-xs border rounded"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Letter Spacing (px)</label>
              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  min="-2"
                  max="10"
                  step="0.1"
                  value={(() => {
                    const spacing = localOverlay.styles.letterSpacing;
                    if (!spacing || spacing === 'normal') return 0;
                    return parseFloat(spacing.replace('px', ''));
                  })()}
                  onChange={(e) => updateStyle("letterSpacing", `${e.target.value}px`)}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <input
                  type="number"
                  min="-2"
                  max="10"
                  step="0.1"
                  value={(() => {
                    const spacing = localOverlay.styles.letterSpacing;
                    if (!spacing || spacing === 'normal') return 0;
                    return parseFloat(spacing.replace('px', ''));
                  })()}
                  onChange={(e) => updateStyle("letterSpacing", `${e.target.value}px`)}
                  className="w-16 px-2 py-1 text-xs border rounded"
                />
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};
