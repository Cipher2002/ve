import React from "react";
import { useCurrentFrame } from "remotion";
import { TextOverlay } from "../../../types";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadMerriweather } from "@remotion/google-fonts/Merriweather";
import { loadFont as loadRobotoMono } from "@remotion/google-fonts/RobotoMono";
import { loadFont as loadVT323 } from "@remotion/google-fonts/VT323";
import { loadFont as loadLeagueSpartan } from "@remotion/google-fonts/LeagueSpartan";
import { loadFont as loadBungeeInline } from "@remotion/google-fonts/BungeeInline";
import { animationTemplates } from "../../../templates/animation-templates";
import { useTextEffects, EffectConfig } from './text-effects';
import "../../../remotion/text-styles.css";

// Updated font loading with specific weights and subsets
const { fontFamily: interFontFamily } = loadInter("normal", {
  weights: ["700"],
});

const { fontFamily: merriweatherFontFamily } = loadMerriweather("normal", {
  weights: ["700"],
  subsets: ["latin"],
});

const { fontFamily: robotoMonoFontFamily } = loadRobotoMono("normal", {
  weights: ["400"],
  subsets: ["latin"],
});

const { fontFamily: vt323FontFamily } = loadVT323("normal", {
  weights: ["400"],
  subsets: ["latin"],
});

const { fontFamily: leagueSpartanFontFamily } = loadLeagueSpartan("normal", {
  weights: ["400", "700"],
  subsets: ["latin"],
});

const { fontFamily: bungeeInlineFontFamily } = loadBungeeInline("normal", {
  weights: ["400"],
  subsets: ["latin"],
});

interface TextLayerContentProps {
  overlay: TextOverlay;
}

const getFontFamily = (fontClass: string) => {
  switch (fontClass) {
    case "font-sans":
      return interFontFamily;
    case "font-serif":
      return merriweatherFontFamily;
    case "font-mono":
      return robotoMonoFontFamily;
    case "font-retro":
      return vt323FontFamily;
    case "font-league-spartan":
      return leagueSpartanFontFamily;
    case "font-bungee-inline":
      return bungeeInlineFontFamily;
    
    // Custom fonts - return the CSS font family name
    case "font-custom-alexbrush-regular":
      return "AlexBrush";
    case "font-custom-allertastencil-regular":
      return "AllertaStencil";
    case "font-custom-allison-regular":
      return "Allison";
    case "font-custom-allura-regular":
      return "Allura";
    case "font-custom-alumnisans-variablefont-wght":
      return "Alumni Sans";
    case "font-custom-berkshireswash-regular":
      return "Berkshire Swash";
    case "font-custom-bitcountpropsingle-variablefont-crsv-elsh-elxp-slnt-wght":
      return "Bitcount Prop Single";
    case "font-custom-bitcountpropsingle-cursive-regular":
      return "Bitcount Prop Single";
    case "font-custom-bodonimoda-variablefont-opsz-wght":
      return "Bodoni Moda";
    case "font-custom-bungeeinline-regular":
      return "Bungee Inline";
    case "font-custom-bungeetint-regular":
      return "Bungee Tint";
    case "font-custom-caesardressing-regular":
      return "Caesar Dressing";
    case "font-custom-caveat-variablefont-wght":
      return "Caveat";
    case "font-custom-cinzel-variablefont-wght":
      return "Cinzel";
    case "font-custom-courgette-regular":
      return "Courgette";
    case "font-custom-creepster-regular":
      return "Creepster";
    case "font-custom-damion-regular":
      return "Damion";
    case "font-custom-dancingscript-variablefont-wght":
      return "Dancing Script";
    case "font-custom-eduqldhand-variablefont-wght":
      return "Edu QLD Hand";
    case "font-custom-eduvicwanthand-variablefont-wght":
      return "Edu VIC WA NT Hand";
    case "font-custom-exile-regular":
      return "Exile";
    case "font-custom-exo-variablefont-wght":
      return "Exo";
    case "font-custom-frederickathegreat-regular":
      return "Fredericka the Great";
    case "font-custom-gloriahallelujah-regular":
      return "Gloria Hallelujah";
    case "font-custom-goldman-bold":
      return "Goldman";
    case "font-custom-goldman-regular":
      return "Goldman";
    case "font-custom-gravitasone-regular":
      return "Gravitas One";
    case "font-custom-greatvibes-regular":
      return "Great Vibes";
    case "font-custom-homemadeapple-regular":
      return "Homemade Apple";
    case "font-custom-indieflower-regular":
      return "Indie Flower";
    case "font-custom-justanotherhand-regular":
      return "Just Another Hand";
    case "font-custom-lato-regular":
      return "Lato";
    case "font-custom-lato-thin":
      return "Lato";
    case "font-custom-leckerlione-regular":
      return "Leckerli One";
    case "font-custom-libertinusmono-regular":
      return "Libertinus Mono";
    case "font-custom-lobstertwo-regular":
      return "Lobster Two";
    case "font-custom-manufacturingconsent-regular":
      return "Manufacturing Consent";
    case "font-custom-marcellus-regular":
      return "Marcellus";
    case "font-custom-marckscript-regular":
      return "Marck Script";
    case "font-custom-michroma-regular":
      return "Michroma";
    case "font-custom-monoton-regular":
      return "Monoton";
    case "font-custom-montserrat-italic-variablefont-wght":
      return "Montserrat";
    case "font-custom-mrdafoe-regular":
      return "Mr Dafoe";
    case "font-custom-mrssaintdelafield-regular":
      return "Mrs Saint Delafield";
    case "font-custom-mysoul-regular":
      return "My Soul";
    case "font-custom-nothingyoucoulddo-regular":
      return "Nothing You Could Do";
    case "font-custom-orbitron-variablefont-wght":
      return "Orbitron";
    case "font-custom-pacifico-regular":
      return "Pacifico";
    case "font-custom-parisienne-regular":
      return "Parisienne";
    case "font-custom-permanentmarker-regular":
      return "Permanent Marker";
    case "font-custom-pinyonscript-regular":
      return "Pinyon Script";
    case "font-custom-protestrevolution-regular":
      return "Protest Revolution";
    case "font-custom-reeniebeanie-regular":
      return "Reenie Beanie";
    case "font-custom-robotocondensed-italic-variablefont-wght":
      return "Roboto Condensed";
    case "font-custom-robotocondensed-variablefont-wght":
      return "Roboto Condensed";
    case "font-custom-rocksalt-regular":
      return "Rock Salt";
    case "font-custom-rubikmonoone-regular":
      return "Rubik Mono One";
    case "font-custom-rubikmoonrocks-regular":
      return "Rubik Moonrocks";
    case "font-custom-rye-regular":
      return "Rye";
    case "font-custom-sacramento-regular":
      return "Sacramento";
    case "font-custom-satisfy-regular":
      return "Satisfy";
    case "font-custom-savate-variablefont-wght":
      return "Savate";
    case "font-custom-shadowsintolight-regular":
      return "Shadows Into Light";
    case "font-custom-smoochsans-variablefont-wght":
      return "Smooch Sans";
    case "font-custom-sourceserif4-variablefont-opsz-wght":
      return "Source Serif 4";
    case "font-custom-specialgothicexpandedone-regular":
      return "Special Gothic Expanded One";
    case "font-custom-squadaone-regular":
      return "Squada One";
    case "font-custom-tangerine-bold":
      return "Tangerine";
    case "font-custom-titilliumweb-extralightitalic":
      return "Titillium Web";
    case "font-custom-titilliumweb-regular":
      return "Titillium Web";
    case "font-custom-winkyrough-variablefont-wght":
      return "Winky Rough";
    case "font-custom-zeyada-regular":
      return "Zeyada";
    case "font-custom-zillaslab-medium":
      return "Zilla Slab";
    
    default:
      return interFontFamily;
  }
};

export const TextLayerContent: React.FC<TextLayerContentProps> = ({
  overlay,
}) => {
  const frame = useCurrentFrame();

  const { createEffect } = useTextEffects(frame);

  // Parse effect from cssClass or effect config
  const getEffectConfig = (): EffectConfig | null => {
    if (overlay.styles.cssClass === 'striped-shadow') {
      return { type: 'striped-shadow' };
    }
    if (overlay.styles.cssClass === 'neon-glow-text') {
      return { type: 'neon-glow' };
    }
    if (overlay.styles.effect) {
      return overlay.styles.effect;
    }
    return null;
  };

  // Calculate if we're in the exit phase (last 30 frames)
  const isExitPhase = frame >= overlay.durationInFrames - 30;

  // Apply enter animation only during entry phase
  const enterAnimation =
    !isExitPhase && overlay.styles.animation?.enter
      ? animationTemplates[overlay.styles.animation.enter]?.enter(
          frame,
          overlay.durationInFrames
        )
      : {};

  // Apply exit animation only during exit phase
  const exitAnimation =
    isExitPhase && overlay.styles.animation?.exit
      ? animationTemplates[overlay.styles.animation.exit]?.exit(
          frame,
          overlay.durationInFrames
        )
      : {};

  const calculateFontSize = () => {
    const aspectRatio = overlay.width / overlay.height;
    
    // Handle multi-element content
    let lines, numLines, maxLineLength;
    
    if (overlay.templateType === "multi-element" && typeof overlay.content === 'object') {
      // For multi-element, combine all text and calculate based on that
      const combinedText = overlay.content.elements?.map(el => el.text).join(' ') || '';
      lines = combinedText.split("\n");
      numLines = lines.length;
      maxLineLength = Math.max(...lines.map((line) => line.length));
    } else {
      // For single element, use existing logic
      const contentString = typeof overlay.content === 'string' ? overlay.content : '';
      lines = contentString.split("\n");
      numLines = lines.length;
      maxLineLength = Math.max(...lines.map((line) => line.length));
    }

    // Base size on container dimensions
    const areaBasedSize = Math.sqrt(
      (overlay.width * overlay.height) / (maxLineLength * numLines)
    );
    let fontSize = areaBasedSize * 1.2; // Scaling factor

    // Adjust for number of lines
    if (numLines > 1) {
      fontSize *= Math.max(0.5, 1 - numLines * 0.1);
    }

    // Adjust for line length
    if (maxLineLength > 20) {
      fontSize *= Math.max(0.6, 1 - (maxLineLength - 20) / 100);
    }

    // Adjust for extreme aspect ratios
    if (aspectRatio > 2 || aspectRatio < 0.5) {
      fontSize *= 0.8;
    }

    // Set minimum and maximum bounds
    return Math.max(12, Math.min(fontSize, (overlay.height / numLines) * 0.8));
  };

  const containerStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center", // Center vertically
    textAlign: overlay.styles.textAlign,
    justifyContent:
      overlay.styles.textAlign === "center"
        ? "center"
        : overlay.styles.textAlign === "right"
        ? "flex-end"
        : "flex-start",
    overflow: "hidden",
    ...(isExitPhase ? exitAnimation : enterAnimation),
  };

  const { ...restStyles } = overlay.styles;

  
  const textStyle: React.CSSProperties = {
    ...restStyles,
    animation: undefined,
    fontSize: `${calculateFontSize()}px`,
    fontFamily: getFontFamily(overlay.styles.fontFamily),
    maxWidth: "100%",
    wordWrap: "break-word",
    whiteSpace: "pre-wrap",
    lineHeight: "1.2",
    padding: "0.1em",
    ...(isExitPhase ? exitAnimation : enterAnimation),
  };

const effectConfig = getEffectConfig();
const textContent = typeof overlay.content === 'string' ? overlay.content : '';

return (
  <div style={containerStyle}>
    {overlay.templateType === "multi-element" && typeof overlay.content === 'object' ? (
      // Multi-element template (unchanged)
      overlay.content.elements?.map((element, index) => (
        <span 
          key={element.id || index}
          style={{
            ...Object.fromEntries(
              Object.entries(overlay.styles.elements?.[element.id] || {}).filter(
                ([key, value]) =>
                  key !== "position" || value === undefined || typeof value === "string"
              )
            ),
            ...(overlay.styles.elements?.[element.id]?.position
              ? { position: overlay.styles.elements?.[element.id]?.position as React.CSSProperties["position"] }
              : {}),
            fontFamily: getFontFamily(overlay.styles.elements?.[element.id]?.fontFamily || overlay.styles.fontFamily)
          }}
        >
          {element.text}
        </span>
      ))
    ) : effectConfig ? (() => {
      // Apply dynamic effect
      const effect = createEffect(effectConfig, textStyle, textContent);
      if (!effect) return null;

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
    })() : (
      // Fallback to regular text
      <div 
        style={textStyle}
        className={overlay.styles.cssClass || ''}
        data-text={textContent}
      >
        {textContent}
      </div>
    )}
  </div>
);

};
