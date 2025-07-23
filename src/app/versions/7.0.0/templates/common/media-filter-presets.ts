/**
 * Media Filter Presets
 *
 * This file defines preset CSS filters that can be applied to video and image overlays.
 * Each preset represents a specific visual style that can be selected from the UI.
 * The filter strings are valid CSS filter values to be directly applied to the media element.
 */

export interface MediaFilterPreset {
  id: string;
  name: string;
  description: string;
  filter: string;
}

export const MEDIA_FILTER_PRESETS: MediaFilterPreset[] = [
  {
    id: "none",
    name: "None",
    description: "No filter applied",
    filter: "none",
  },
  {
    id: "retro",
    name: "Retro",
    description: "Intense vintage effect with strong grain and warm saturation",
    filter:
      "contrast(130%) sepia(45%) brightness(85%) saturate(160%) hue-rotate(5deg)",
  },
  {
    id: "vintage",
    name: "Vintage",
    description: "Aged film look with faded colors and warm tint",
    filter: "contrast(95%) brightness(95%) saturate(70%) sepia(15%)",
  },
  {
    id: "wesAnderson",
    name: "Wes Anderson",
    description:
      "Bold symmetrical aesthetics with highly saturated pastel tones",
    filter: "contrast(135%) brightness(110%) saturate(190%) hue-rotate(345deg)",
  },
  {
    id: "noir",
    name: "Film Noir",
    description: "High contrast black and white",
    filter: "grayscale(100%) contrast(150%) brightness(90%)",
  },
  {
    id: "highKey",
    name: "High Key",
    description: "Bright, airy black and white with soft contrast",
    filter: "grayscale(100%) contrast(90%) brightness(120%)",
  },
  {
    id: "polaroid",
    name: "Polaroid",
    description: "Nostalgic instant photo look with white border",
    filter: "sepia(15%) contrast(95%) brightness(105%) saturate(80%)",
  },
  {
    id: "cinematic",
    name: "Cinematic",
    description: "Professional film look with enhanced contrast",
    filter: "contrast(115%) brightness(95%) saturate(110%)",
  },
  {
    id: "cool",
    name: "Cool",
    description: "Blue toned filter for a calming effect",
    filter: "brightness(100%) sepia(20%) hue-rotate(180deg) saturate(90%)",
  },
  {
    id: "warm",
    name: "Warm",
    description: "Golden hour effect with warm tones",
    filter: "brightness(105%) sepia(30%) saturate(130%) hue-rotate(350deg)",
  },
  {
    id: "expired",
    name: "Expired Film",
    description: "Dreamy vintage effect with subtle color shifts",
    filter:
      "contrast(110%) brightness(100%) saturate(85%) sepia(20%) hue-rotate(5deg)",
  },
  {
    id: "kodak",
    name: "Kodak",
    description: "Classic film stock with rich colors and golden highlights",
    filter:
      "contrast(120%) brightness(105%) saturate(120%) sepia(10%) hue-rotate(355deg)",
  },
  {
    id: "super8",
    name: "Super 8",
    description: "Grainy retro film effect with warm nostalgic tone",
    filter:
      "contrast(125%) brightness(95%) saturate(70%) sepia(30%) hue-rotate(340deg)",
  },
  {
    id: "teal",
    name: "Teal & Orange",
    description: "Popular cinematic color scheme with complementary tones",
    filter: "contrast(110%) saturate(140%) hue-rotate(15deg) brightness(95%)",
  },
  {
    id: "cyberpunk",
    name: "Cyberpunk",
    description: "Neon-soaked futuristic aesthetic with purple and cyan",
    filter: "contrast(140%) saturate(150%) brightness(85%) hue-rotate(260deg)",
  },
  {
    id: "matrix",
    name: "Matrix",
    description: "Green-tinted digital world effect",
    filter: "contrast(125%) brightness(90%) saturate(200%) hue-rotate(80deg) sepia(40%)",
  },
  {
    id: "lomography",
    name: "Lomography",
    description: "Cross-processed film with oversaturated colors and vignetting",
    filter: "contrast(130%) saturate(180%) brightness(90%) hue-rotate(10deg)",
  },
  {
    id: "slide",
    name: "Slide Film",
    description: "Vibrant colors with deep shadows like Fuji Velvia",
    filter: "contrast(140%) saturate(150%) brightness(85%)",
  },
  {
    id: "instagram",
    name: "Social Media",
    description: "Bright, punchy look popular on social platforms",
    filter: "contrast(120%) brightness(110%) saturate(130%)",
  },
  {
    id: "hdr",
    name: "HDR",
    description: "Hyper-realistic with enhanced detail and saturation",
    filter: "contrast(150%) brightness(105%) saturate(140%)",
  },
  {
    id: "bleach",
    name: "Bleach Bypass",
    description: "Desaturated with retained highlights",
    filter: "contrast(130%) brightness(110%) saturate(60%)",
  },
  {
    id: "melancholy",
    name: "Melancholy",
    description: "Subdued colors with blue undertones",
    filter: "contrast(90%) brightness(85%) saturate(70%) hue-rotate(200deg)",
  },
  {
    id: "dreamy",
    name: "Dreamy",
    description: "Soft, ethereal look with lifted shadows",
    filter: "contrast(85%) brightness(115%) saturate(80%) sepia(10%)",
  },
  {
    id: "dramatic",
    name: "Dramatic",
    description: "High contrast with deep shadows and bright highlights",
    filter: "contrast(160%) brightness(90%) saturate(120%)",
  },
];

/**
 * Helper function to parse a CSS filter string and extract individual filter values
 *
 * @param filterString - CSS filter string to parse
 * @returns Object with individual filter values
 */
export const parseFilterString = (
  filterString: string = "none"
): Record<string, string> => {
  if (filterString === "none") {
    return {};
  }

  const filterObject: Record<string, string> = {};

  // Extract individual filter functions using regex
  const filterMatches = filterString.match(/([a-z-]+)\(([^)]+)\)/g) || [];

  filterMatches.forEach((match) => {
    const [, filterName, value] = match.match(/([a-z-]+)\(([^)]+)\)/) || [];
    if (filterName && value) {
      filterObject[filterName] = value;
    }
  });

  return filterObject;
};

/**
 * Helper function to get a preset by its ID
 *
 * @param presetId - ID of the preset to retrieve
 * @returns The preset object or the "none" preset if not found
 */
export const getPresetById = (presetId: string): MediaFilterPreset => {
  return (
    MEDIA_FILTER_PRESETS.find((preset) => preset.id === presetId) ||
    MEDIA_FILTER_PRESETS[0]
  ); // Default to "none" preset
};
