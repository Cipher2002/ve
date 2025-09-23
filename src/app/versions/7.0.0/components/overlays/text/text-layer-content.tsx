import React from "react";
import { useCurrentFrame } from "remotion";
import { TextOverlay } from "../../../types";
import { getFontFamilyString } from '../../../utils/google-fonts';
import { animationTemplates } from "../../../templates/animation-templates";
import { useTextEffects, EffectConfig } from './text-effects';
import "../../../remotion/text-styles.css";

// Updated font loading with specific weights and subsets
// const { fontFamily: interFontFamily } = loadInter("normal", {
//   weights: ["700"],
// });

interface TextLayerContentProps {
  overlay: TextOverlay;
}

// const getFontFamily = (fontClass: string) => {
//   switch (fontClass) {
//     case "font-sans":
//       return interFontFamily;
//     case "font-custom-alexbrush-regular":
//       return "Alex Brush, cursive";
//     case "font-custom-allertastencil-regular":
//       return "Allerta Stencil, sans-serif";
//     case "font-custom-allison-regular":
//       return "Allison, cursive";
//     case "font-custom-allura-regular":
//       return "Allura, cursive";
//     case "font-custom-alumnisans-variablefont-wght":
//       return "Alumni Sans Variable Font, sans-serif";
//     case "font-custom-berkshireswash-regular":
//       return "Berkshire Swash, cursive";
//     case "font-custom-bitcountpropsingle-variablefont-crsv-elsh-elxp-slnt-wght":
//       return "Bitcount Prop Single Variable Font ,,,,, monospace";
//     case "font-custom-bitcountpropsingle-cursive-regular":
//       return "Bitcount Prop Single Cursive, cursive";
//     case "font-custom-bodonimoda-variablefont-opsz-wght":
//       return "Bodoni Moda Variable Font ,, serif";
//     case "font-custom-bungeeinline-regular":
//       return "Bungee Inline, display";
//     case "font-custom-bungeetint-regular":
//       return "Bungee Tint, display";
//     case "font-custom-caesardressing-regular":
//       return "Caesar Dressing, cursive";
//     case "font-custom-caveat-variablefont-wght":
//       return "Caveat Variable Font, cursive";
//     case "font-custom-cinzel-variablefont-wght":
//       return "Cinzel Variable Font, serif";
//     case "font-custom-courgette-regular":
//       return "Courgette, cursive";
//     case "font-custom-creepster-regular":
//       return "Creepster, cursive";
//     case "font-custom-damion-regular":
//       return "Damion, cursive";
//     case "font-custom-dancingscript-variablefont-wght":
//       return "Dancing Script Variable Font, cursive";
//     case "font-custom-eduqldhand-variablefont-wght":
//       return "Edu Qldhand Variable Font, cursive";
//     case "font-custom-eduvicwanthand-variablefont-wght":
//       return "Edu Vicwanthand Variable Font, cursive";
//     case "font-custom-exile-regular":
//       return "Exile, sans-serif";
//     case "font-custom-exo-variablefont-wght":
//       return "Exo Variable Font, sans-serif";
//     case "font-custom-frederickathegreat-regular":
//       return "Frederickathe Great, cursive";
//     case "font-custom-gloriahallelujah-regular":
//       return "Gloria Hallelujah, cursive";
//     case "font-custom-goldman-bold":
//       return "Goldman Bold, sans-serif";
//     case "font-custom-goldman-regular":
//       return "Goldman, sans-serif";
//     case "font-custom-gravitasone-regular":
//       return "Gravitas One, display";
//     case "font-custom-greatvibes-regular":
//       return "Great Vibes, cursive";
//     case "font-custom-homemadeapple-regular":
//       return "Homemade Apple, cursive";
//     case "font-custom-indieflower-regular":
//       return "Indie Flower, cursive";
//     case "font-custom-justanotherhand-regular":
//       return "Just Another Hand, cursive";
//     case "font-custom-lato-regular":
//       return "Lato, sans-serif";
//     case "font-custom-lato-thin":
//       return "Lato Thin, sans-serif";
//     case "font-custom-leckerlione-regular":
//       return "Leckerli One, cursive";
//     case "font-custom-libertinusmono-regular":
//       return "Libertinus Mono, monospace";
//     case "font-custom-lobstertwo-regular":
//       return "Lobster Two, cursive";
//     case "font-custom-manufacturingconsent-regular":
//       return "Manufacturing Consent, sans-serif";
//     case "font-custom-marcellus-regular":
//       return "Marcellus, serif";
//     case "font-custom-marckscript-regular":
//       return "Marck Script, cursive";
//     case "font-custom-michroma-regular":
//       return "Michroma, sans-serif";
//     case "font-custom-monoton-regular":
//       return "Monoton, cursive";
//     case "font-custom-montserrat-italic-variablefont-wght":
//       return "Montserrat Italic Variable Font, sans-serif";
//     case "font-custom-mrdafoe-regular":
//       return "Mr Dafoe, cursive";
//     case "font-custom-mrssaintdelafield-regular":
//       return "Mrs Saint Delafield, cursive";
//     case "font-custom-mysoul-regular":
//       return "My Soul, cursive";
//     case "font-custom-nothingyoucoulddo-regular":
//       return "Nothing You Could Do, cursive";
//     case "font-custom-orbitron-variablefont-wght":
//       return "Orbitron Variable Font, sans-serif";
//     case "font-custom-pacifico-regular":
//       return "Pacifico, cursive";
//     case "font-custom-parisienne-regular":
//       return "Parisienne, cursive";
//     case "font-custom-permanentmarker-regular":
//       return "Permanent Marker, cursive";
//     case "font-custom-pinyonscript-regular":
//       return "Pinyon Script, cursive";
//     case "font-custom-protestrevolution-regular":
//       return "Protest Revolution, display";
//     case "font-custom-reeniebeanie-regular":
//       return "Reenie Beanie, cursive";
//     case "font-custom-robotocondensed-italic-variablefont-wght":
//       return "Roboto Condensed Italic Variable Font, sans-serif";
//     case "font-custom-robotocondensed-variablefont-wght":
//       return "Roboto Condensed Variable Font, sans-serif";
//     case "font-custom-rocksalt-regular":
//       return "Rock Salt, cursive";
//     case "font-custom-rubikmonoone-regular":
//       return "Rubik Mono One, monospace";
//     case "font-custom-rubikmoonrocks-regular":
//       return "Rubik Moonrocks, display";
//     case "font-custom-rye-regular":
//       return "Rye, display";
//     case "font-custom-sacramento-regular":
//       return "Sacramento, cursive";
//     case "font-custom-satisfy-regular":
//       return "Satisfy, cursive";
//     case "font-custom-savate-variablefont-wght":
//       return "Savate Variable Font, sans-serif";
//     case "font-custom-shadowsintolight-regular":
//       return "Shadows Into Light, cursive";
//     case "font-custom-smoochsans-variablefont-wght":
//       return "Smooch Sans Variable Font, sans-serif";
//     case "font-custom-sourceserif4-variablefont-opsz-wght":
//       return "Source Serif4 Variable Font ,, serif";
//     case "font-custom-specialgothicexpandedone-regular":
//       return "Special Gothic Expanded One, display";
//     case "font-custom-squadaone-regular":
//       return "Squada One, display";
//     case "font-custom-tangerine-bold":
//       return "Tangerine Bold, cursive";
//     case "font-custom-titilliumweb-extralightitalic":
//       return "Titillium Web Extra Light Italic, sans-serif";
//     case "font-custom-titilliumweb-regular":
//       return "Titillium Web, sans-serif";
//     case "font-custom-winkyrough-variablefont-wght":
//       return "Winky Rough Variable Font, display";
//     case "font-custom-zeyada-regular":
//       return "Zeyada, cursive";
//     case "font-custom-zillaslab-medium":
//       return "Zilla Slab Medium, serif";
    
//     default:
//       return interFontFamily;
//   }
// };


const getFontFamily = (fontFamilyString: string) => {
  // If it's already a font family string (contains quotes or comma), return as is
  if (fontFamilyString && (fontFamilyString.includes('"') || fontFamilyString.includes(','))) {
    return fontFamilyString;
  }
  
  // If it's a simple font name, wrap it properly
  if (fontFamilyString && !fontFamilyString.startsWith('font-')) {
    return fontFamilyString;
  }
  
  // Legacy fallback for old font classes - default to system font
  return "Arial, sans-serif";
};

export const TextLayerContent: React.FC<TextLayerContentProps> = ({
  overlay,
}) => {
  const frame = useCurrentFrame();

  const { createEffect } = useTextEffects(frame);

  // Helper function to strip HTML tags and get plain text
  const stripHtmlTags = (html: string): string => {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  };

  // Helper function to convert Lexical editor state to HTML
  const convertLexicalToHtml = (editorState: any): string => {
    try {
      // This is a simplified conversion - in a real implementation you'd use Lexical's serialization
      // For now, we'll assume the content has already been converted to HTML
      return JSON.stringify(editorState);
    } catch (error) {
      console.error('Error converting Lexical state:', error);
      return '';
    }
  };

  // Helper function to render HTML content
  const renderHtmlContent = (html: string, style: React.CSSProperties) => {
    // Apply global styles while preserving inline rich text styles
    const styledHtml = html.replace(
      /<([^>]+)>/g, 
      (match, tagContent) => {
        if (tagContent.startsWith('/')) return match; // Don't modify closing tags
        
        // Merge global styles with existing inline styles, prioritizing inline styles
        const globalStyles = `line-height: ${style.lineHeight}; letter-spacing: ${style.letterSpacing}; font-family: ${style.fontFamily}; font-size: ${style.fontSize};`;
        
        if (tagContent.includes('style=')) {
          // If style already exists, prepend global styles (inline takes precedence)
          return match.replace(/style="([^"]*)"/, `style="${globalStyles} $1"`);
        } else {
          // Add global style attributes
          return `<${tagContent} style="${globalStyles}">`;
        }
      }
    );

    return (
      <div 
        style={style}
        dangerouslySetInnerHTML={{ __html: styledHtml }}
      />
    );
  };

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
    const multiplier = overlay.styles.fontSizeMultiplier || 1;
    const aspectRatio = overlay.width / overlay.height;
    
    // Handle multi-element content
    let lines, numLines, maxLineLength;
    
    if (overlay.templateType === "multi-element" && typeof overlay.content === 'object' && overlay.content !== null && 'elements' in overlay.content) {
      // For multi-element, combine all text and calculate based on that
      const combinedText = overlay.content.elements?.map((el: any) => el.text).join(' ') || '';
      lines = combinedText.split("\n");
      numLines = lines.length;
      maxLineLength = Math.max(...lines.map((line: any) => line.length));
    } else {
      // For single element, use existing logic - handle Lexical content
      let contentString = '';
      if (typeof overlay.content === 'string') {
        contentString = overlay.content;
      } else if (typeof overlay.content === 'object' && overlay.content !== null && 'editorState' in overlay.content) {
        // For Lexical content, we need to extract text length - use a simple approximation
        contentString = 'Sample text for calculation'; // Placeholder for now
      }
      lines = contentString.split("\n");
      numLines = lines.length;
      maxLineLength = Math.max(...lines.map((line) => line.length));
    }

    // Base size on container dimensions - adjust for multiplier
    const areaBasedSize = Math.sqrt(
      (overlay.width * overlay.height) / (maxLineLength * numLines * multiplier)
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

    // Apply multiplier and set bounds
    const finalFontSize = fontSize * multiplier;
    return Math.max(12, Math.min(finalFontSize, (overlay.height / numLines) * 0.8));
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

  
  const resolvedFontFamily = getFontFamily(overlay.styles.fontFamily);

  const finalFontSize = calculateFontSize();

  const textStyle: React.CSSProperties = {
    ...restStyles,
    animation: undefined,
    fontSize: `${finalFontSize}px`,
    fontFamily: resolvedFontFamily,
    maxWidth: "100%",
    wordWrap: "break-word",
    whiteSpace: "pre-wrap",
    lineHeight: overlay.styles.lineHeight || "1.2",
    letterSpacing: overlay.styles.letterSpacing || "0px",
    textShadow: overlay.styles.textShadow && overlay.styles.textShadow !== 'none' ? overlay.styles.textShadow : undefined,
    padding: "0.1em",
    ...(isExitPhase ? exitAnimation : enterAnimation),
  };

const effectConfig = getEffectConfig();

// Get content based on type - handle Lexical editor state
const getTextContent = () => {
  if (typeof overlay.content === 'object' && overlay.content !== null) {
    // Type guard for editorState
    if ('editorState' in overlay.content && overlay.content.editorState) {
      // Convert Lexical editor state to HTML
      return convertLexicalToHtml(overlay.content.editorState);
    }
    // Type guard for elements
    else if ('elements' in overlay.content && overlay.content.elements) {
      // Multi-element content
      return overlay.content.elements.map(el => el.text).join(' ');
    }
  }
  return typeof overlay.content === 'string' ? overlay.content : '';
};

const textContent = getTextContent();

return (
  <div style={containerStyle}>
    {overlay.templateType === "multi-element" && typeof overlay.content === 'object' && overlay.content !== null && 'elements' in overlay.content && overlay.content.elements ? (
      // Multi-element template (unchanged)
      overlay.content.elements?.map((element: any, index: any) => (
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
      // Apply dynamic effect - use plain text for effects but preserve rich formatting
      let effectContent = textContent;
      
      // For effects, we want to preserve the rich text HTML but apply the effect styling
      if (typeof overlay.content === 'object' && overlay.content !== null && 'editorState' in overlay.content && overlay.content.editorState) {
        // For Lexical content with effects, render the rich HTML with effect applied
        effectContent = textContent;
      } else {
        // For plain text effects, strip HTML
        effectContent = overlay.styles.isRichText ? stripHtmlTags(textContent) : textContent;
      }
      
      // Ensure textStyle includes all spacing properties for effects
      const effectTextStyle = {
        ...textStyle,
        lineHeight: overlay.styles.lineHeight || textStyle.lineHeight || "1.2",
        letterSpacing: overlay.styles.letterSpacing || textStyle.letterSpacing || "0px"
      };
      
      const effect = createEffect(effectConfig, effectTextStyle, effectContent);
      if (!effect) return null;

      if (effect.container) {
        return (
          <div style={effect.container as React.CSSProperties}>
            {effect.layers.map((layer, index) => {
              const isLexicalContent = typeof overlay.content === 'object' && overlay.content !== null && 'editorState' in overlay.content && overlay.content.editorState;
              
              return isLexicalContent ? (
                <div 
                  key={index} 
                  style={layer.style}
                  dangerouslySetInnerHTML={{ __html: layer.content || '' }}
                />
              ) : (
                <div key={index} style={layer.style}>
                  {layer.content}
                </div>
              );
            })}
          </div>
        );
      } else {
        return effect.layers.map((layer, index) => {
          const isLexicalContent = typeof overlay.content === 'object' && overlay.content !== null && 'editorState' in overlay.content && overlay.content.editorState;
          
          return isLexicalContent ? (
            <div 
              key={index} 
              style={layer.style}
              dangerouslySetInnerHTML={{ __html: layer.content || '' }}
            />
          ) : (
            <div key={index} style={layer.style}>
              {layer.content}
            </div>
          );
        });
      }
    })() : (
      // Always render as rich HTML for Lexical content, or fallback to plain text
      (typeof overlay.content === 'object' && overlay.content !== null && 'editorState' in overlay.content && overlay.content.editorState) ? (
        renderHtmlContent(textContent, textStyle)
      ) : overlay.styles.isRichText || textContent.includes('<') ? (
        <div 
          style={textStyle}
          className={overlay.styles.cssClass || ''}
          dangerouslySetInnerHTML={{ __html: textContent }}
        />
      ) : (
        <div 
          style={textStyle}
          className={overlay.styles.cssClass || ''}
          data-text={textContent}
        >
          {textContent}
        </div>
      )
    )}
  </div>
);

};
