import React from "react";
import { useCurrentFrame } from "remotion";
import { TextOverlay } from "../../../types";
import { getFontFamilyString } from '../../../utils/google-fonts';
import { animationTemplates } from "../../../templates/animation-templates";
import { useTextEffects, EffectConfig } from './text-effects';
import "../../../remotion/text-styles.css";

interface TextLayerContentProps {
  overlay: TextOverlay;
}

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
          overlay.durationInFrames,
          overlay.styles.animation.enterDirection,
          overlay.styles.animation.enterSpeed || 1
        )
      : {};

  // Apply exit animation only during exit phase
  const exitAnimation =
    isExitPhase && overlay.styles.animation?.exit
      ? animationTemplates[overlay.styles.animation.exit]?.exit(
          frame,
          overlay.durationInFrames,
          overlay.styles.animation.exitDirection,
          overlay.styles.animation.exitSpeed || 1
        )
      : {};

  const calculateFontSize = () => {
    const multiplier = overlay.styles.fontSizeMultiplier || 1;
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

  // Use direct fontSize if set, otherwise calculate it
  const finalFontSize = overlay.styles.fontSize 
    ? parseInt(overlay.styles.fontSize) 
    : calculateFontSize();

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
const textContent = typeof overlay.content === 'string' ? overlay.content : '';

return (
  <div style={containerStyle}>
    {overlay.templateType === "multi-element" && typeof overlay.content === 'object' ? (
      // Multi-element template
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
      const effectTextStyle = {
        ...textStyle,
        lineHeight: overlay.styles.lineHeight || textStyle.lineHeight || "1.2",
        letterSpacing: overlay.styles.letterSpacing || textStyle.letterSpacing || "0px"
      };
      
      const effect = createEffect(effectConfig, effectTextStyle, textContent);
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
      // Plain text - no effects
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
