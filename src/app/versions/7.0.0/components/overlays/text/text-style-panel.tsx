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

/**
 * Available font options for text overlays
 */
const fonts = [
  // Original fonts
  { value: "font-sans", label: "Inter (Sans-serif)" },
      { value: "font-serif", label: "Merriweather (Serif)" },
      { value: "font-mono", label: "Roboto Mono (Monospace)" },
      { value: "font-retro", label: "VT323" },
      { value: "font-league-spartan", label: "League Spartan" },
      { value: "font-bungee-inline", label: "Bungee Inline" },
      { value: "font-display", label: "Playfair Display" },
      { value: "font-handwriting", label: "Caveat" },
      { value: "font-futuristic", label: "Orbitron" },
      { value: "font-elegant", label: "Cormorant Garamond" },
      { value: "font-quirky", label: "Fredoka One" },
  
      // Custom fonts from public/fonts
      { value: "font-custom-alexbrush-regular", label: "Alexbrush" },
      { value: "font-custom-allertastencil-regular", label: "Allertastencil" },
      { value: "font-custom-allison-regular", label: "Allison" },
      { value: "font-custom-allura-regular", label: "Allura" },
      { value: "font-custom-alumnisans-variablefont-wght", label: "Alumnisans Variablefont Wght" },
      { value: "font-custom-berkshireswash-regular", label: "Berkshireswash" },
      { value: "font-custom-bitcountpropsingle-variablefont-crsv-elsh-elxp-slnt-wght", label: "Bitcountpropsingle Variablefont Crsv,elsh,elxp,slnt,wght" },
      { value: "font-custom-bitcountpropsingle-cursive-regular", label: "Bitcountpropsingle Cursive" },
      { value: "font-custom-bodonimoda-variablefont-opsz-wght", label: "Bodonimoda Variablefont Opsz,wght" },
      { value: "font-custom-bungeeinline-regular", label: "Bungeeinline" },
      { value: "font-custom-bungeetint-regular", label: "Bungeetint" },
      { value: "font-custom-caesardressing-regular", label: "Caesardressing" },
      { value: "font-custom-caveat-variablefont-wght", label: "Caveat Variablefont Wght" },
      { value: "font-custom-cinzel-variablefont-wght", label: "Cinzel Variablefont Wght" },
      { value: "font-custom-courgette-regular", label: "Courgette" },
      { value: "font-custom-creepster-regular", label: "Creepster" },
      { value: "font-custom-damion-regular", label: "Damion" },
      { value: "font-custom-dancingscript-variablefont-wght", label: "Dancingscript Variablefont Wght" },
      { value: "font-custom-eduqldhand-variablefont-wght", label: "Eduqldhand Variablefont Wght" },
      { value: "font-custom-eduvicwanthand-variablefont-wght", label: "Eduvicwanthand Variablefont Wght" },
      { value: "font-custom-exile-regular", label: "Exile" },
      { value: "font-custom-exo-variablefont-wght", label: "Exo Variablefont Wght" },
      { value: "font-custom-frederickathegreat-regular", label: "Frederickathegreat" },
      { value: "font-custom-gloriahallelujah-regular", label: "Gloriahallelujah" },
      { value: "font-custom-goldman-bold", label: "Goldman" },
      { value: "font-custom-goldman-regular", label: "Goldman" },
      { value: "font-custom-gravitasone-regular", label: "Gravitasone" },
      { value: "font-custom-greatvibes-regular", label: "Greatvibes" },
      { value: "font-custom-homemadeapple-regular", label: "Homemadeapple" },
      { value: "font-custom-indieflower-regular", label: "Indieflower" },
      { value: "font-custom-justanotherhand-regular", label: "Justanotherhand" },
      { value: "font-custom-lato-regular", label: "Lato" },
      { value: "font-custom-lato-thin", label: "Lato Thin" },
      { value: "font-custom-leckerlione-regular", label: "Leckerlione" },
      { value: "font-custom-libertinusmono-regular", label: "Libertinusmono" },
      { value: "font-custom-lobstertwo-regular", label: "Lobstertwo" },
      { value: "font-custom-manufacturingconsent-regular", label: "Manufacturingconsent" },
      { value: "font-custom-marcellus-regular", label: "Marcellus" },
      { value: "font-custom-marckscript-regular", label: "Marckscript" },
      { value: "font-custom-michroma-regular", label: "Michroma" },
      { value: "font-custom-monoton-regular", label: "Monoton" },
      { value: "font-custom-montserrat-italic-variablefont-wght", label: "Montserrat Italic Variablefont Wght" },
      { value: "font-custom-mrdafoe-regular", label: "Mrdafoe" },
      { value: "font-custom-mrssaintdelafield-regular", label: "Mrssaintdelafield" },
      { value: "font-custom-mysoul-regular", label: "Mysoul" },
      { value: "font-custom-nothingyoucoulddo-regular", label: "Nothingyoucoulddo" },
      { value: "font-custom-orbitron-variablefont-wght", label: "Orbitron Variablefont Wght" },
      { value: "font-custom-pacifico-regular", label: "Pacifico" },
      { value: "font-custom-parisienne-regular", label: "Parisienne" },
      { value: "font-custom-permanentmarker-regular", label: "Permanentmarker" },
      { value: "font-custom-pinyonscript-regular", label: "Pinyonscript" },
      { value: "font-custom-protestrevolution-regular", label: "Protestrevolution" },
      { value: "font-custom-reeniebeanie-regular", label: "Reeniebeanie" },
      { value: "font-custom-robotocondensed-italic-variablefont-wght", label: "Robotocondensed Italic Variablefont Wght" },
      { value: "font-custom-robotocondensed-variablefont-wght", label: "Robotocondensed Variablefont Wght" },
      { value: "font-custom-rocksalt-regular", label: "Rocksalt" },
      { value: "font-custom-rubikmonoone-regular", label: "Rubikmonoone" },
      { value: "font-custom-rubikmoonrocks-regular", label: "Rubikmoonrocks" },
      { value: "font-custom-rye-regular", label: "Rye" },
      { value: "font-custom-sacramento-regular", label: "Sacramento" },
      { value: "font-custom-satisfy-regular", label: "Satisfy" },
      { value: "font-custom-savate-variablefont-wght", label: "Savate Variablefont Wght" },
      { value: "font-custom-shadowsintolight-regular", label: "Shadowsintolight" },
      { value: "font-custom-smoochsans-variablefont-wght", label: "Smoochsans Variablefont Wght" },
      { value: "font-custom-sourceserif4-variablefont-opsz-wght", label: "Sourceserif4 Variablefont Opsz,wght" },
      { value: "font-custom-specialgothicexpandedone-regular", label: "Specialgothicexpandedone" },
      { value: "font-custom-squadaone-regular", label: "Squadaone" },
      { value: "font-custom-tangerine-bold", label: "Tangerine" },
      { value: "font-custom-titilliumweb-extralightitalic", label: "Titilliumweb Extralightitalic" },
      { value: "font-custom-titilliumweb-regular", label: "Titilliumweb" },
      { value: "font-custom-winkyrough-variablefont-wght", label: "Winkyrough Variablefont Wght" },
      { value: "font-custom-zeyada-regular", label: "Zeyada" },
      { value: "font-custom-zillaslab-medium", label: "Zillaslab" },
];

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
  return (
    <div className="space-y-6">
      {/* Typography Settings */}
      <div className="space-y-4 rounded-md bg-background/50 p-4 border">
        <h3 className="text-sm font-medium">Typography</h3>

        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Font Family</label>
          <Select
            value={localOverlay.styles.fontFamily}
            onValueChange={(value) => handleStyleChange("fontFamily", value)}
          >
            <SelectTrigger className="w-full text-xs">
              <SelectValue placeholder="Select a font" />
            </SelectTrigger>
            <SelectContent>
              {fonts.map((font) => (
                <SelectItem
                  key={font.value}
                  value={font.value}
                  className={`${font.value} text-xs`}
                >
                  {font.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
