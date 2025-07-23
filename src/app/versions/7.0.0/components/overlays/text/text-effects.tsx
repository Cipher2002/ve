import { useCurrentFrame } from "remotion";

export interface EffectConfig {
  type: 'striped-shadow' | '3d-layered' | 'script-layered' | 'pink-outline' | 'handwritten-script' | string;
  params?: Record<string, any>;
}

export const useTextEffects = (frame: number) => {
  const createEffect = (config: EffectConfig, textStyle: any, content: string) => {
    switch (config.type) {

        case 'striped-shadow':
            const fontSize = parseFloat(textStyle.fontSize) || 48;
            const offsetPx = Math.round(10);
            
            return {
                container: { 
                position: 'relative', 
                width: 'fit-content',
                height: 'fit-content',
                margin: 'auto'
                },
                layers: [
                // Striped shadow - using exact same text metrics
                {
                    style: {
                    ...textStyle,
                    position: 'absolute',
                    top: `${offsetPx}px`,
                    left: `${offsetPx}px`,
                    zIndex: 1,
                    background: config.params?.gradient || 'repeating-linear-gradient(135deg, #ff5555 0px, #ff5555 2px, transparent 2px, transparent 6px)',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    // Force exact same text rendering
                    whiteSpace: textStyle.whiteSpace,
                    wordWrap: textStyle.wordWrap,
                    lineHeight: textStyle.lineHeight,
                    letterSpacing: textStyle.letterSpacing
                    },
                    content
                },
                // Main text - using exact same text metrics
                {
                    style: {
                    ...textStyle,
                    position: 'relative',
                    zIndex: 2,
                    color: config.params?.color || '#ff5555'
                    },
                    content
                }
                ]
            };

        case '3d-layered':
            const leftOffset = config.params?.leftOffset || '-8px';
            const rightOffset = config.params?.rightOffset || '8px';
            const leftColor = config.params?.leftColor || '#00FFFF';
            const rightColor = config.params?.rightColor || '#FF69B4';
            const mainColor = config.params?.mainColor || '#E91E63';

            return {
                container: { 
                    position: 'relative', 
                    width: 'fit-content',
                    height: 'fit-content',
                    margin: 'auto'
                },
                layers: [
                    // Left cyan layer
                    {
                        style: {
                            ...textStyle,
                            position: 'absolute',
                            top: '0px',
                            left: leftOffset,
                            zIndex: 1,
                            color: leftColor,
                            whiteSpace: textStyle.whiteSpace,
                            wordWrap: textStyle.wordWrap,
                            lineHeight: textStyle.lineHeight,
                            letterSpacing: textStyle.letterSpacing
                        },
                        content
                    },
                    // Right light pink layer
                    {
                        style: {
                            ...textStyle,
                            position: 'absolute',
                            top: '0px',
                            left: rightOffset,
                            zIndex: 2,
                            color: rightColor,
                            whiteSpace: textStyle.whiteSpace,
                            wordWrap: textStyle.wordWrap,
                            lineHeight: textStyle.lineHeight,
                            letterSpacing: textStyle.letterSpacing
                        },
                        content
                    },
                    // Main pink text (front layer)
                    {
                        style: {
                            ...textStyle,
                            position: 'relative',
                            zIndex: 3,
                            color: mainColor
                        },
                        content
                    }
                ]
            };
        
        case 'script-layered':
            const mainTextColor = config.params?.mainTextColor || '#FF4757';
            const layer1Color = config.params?.layer1Color || '#FFB3BA';
            const layer2Color = config.params?.layer2Color || '#F8F8F8';
            const offsetDistance = config.params?.offsetDistance || '4px';

            return {
                container: { 
                    position: 'relative', 
                    width: 'fit-content',
                    height: 'fit-content',
                    margin: 'auto'
                },
                layers: [
                    // Back layer (lightest)
                    {
                        style: {
                            ...textStyle,
                            position: 'absolute',
                            top: offsetDistance,
                            left: `-${parseInt(offsetDistance) * 2}px`,
                            zIndex: 1,
                            color: layer2Color,
                            whiteSpace: textStyle.whiteSpace,
                            wordWrap: textStyle.wordWrap,
                            lineHeight: textStyle.lineHeight,
                            letterSpacing: textStyle.letterSpacing
                        },
                        content
                    },
                    // Middle layer
                    {
                        style: {
                            ...textStyle,
                            position: 'absolute',
                            top: `${parseInt(offsetDistance) / 2}px`,
                            left: `-${offsetDistance}`,
                            zIndex: 2,
                            color: layer1Color,
                            whiteSpace: textStyle.whiteSpace,
                            wordWrap: textStyle.wordWrap,
                            lineHeight: textStyle.lineHeight,
                            letterSpacing: textStyle.letterSpacing
                        },
                        content
                    },
                    // Main text (front)
                    {
                        style: {
                            ...textStyle,
                            position: 'relative',
                            zIndex: 3,
                            color: mainTextColor
                        },
                        content
                    }
                ]
            };

        case 'pink-outline':
            const fillColor = config.params?.fillColor || '#FF1493';
            const outlineColor = config.params?.outlineColor || '#AD1457';
            const outlineWidth = config.params?.outlineWidth || '2px';

            return {
                container: { 
                    position: 'relative', 
                    width: 'fit-content',
                    height: 'fit-content',
                    margin: 'auto'
                },
                layers: [
                    {
                        style: {
                            ...textStyle,
                            position: 'relative',
                            zIndex: 1,
                            color: fillColor,
                            textShadow: `
                                -${outlineWidth} -${outlineWidth} 0 ${outlineColor},
                                ${outlineWidth} -${outlineWidth} 0 ${outlineColor},
                                -${outlineWidth} ${outlineWidth} 0 ${outlineColor},
                                ${outlineWidth} ${outlineWidth} 0 ${outlineColor}
                            `
                        },
                        content
                    }
                ]
            };

        case 'handwritten-script':
            const textColor = config.params?.textColor || '#000000';

            return {
                container: { 
                    position: 'relative', 
                    width: 'fit-content',
                    height: 'fit-content',
                    margin: 'auto'
                },
                layers: [
                    {
                        style: {
                            ...textStyle,
                            position: 'relative',
                            zIndex: 1,
                            color: textColor
                        },
                        content
                    }
                ]
            };

        case 'stacked-contrast':
            const line1TextColor = config.params?.line1TextColor || '#E53E3E';
            const line1BgColor = config.params?.line1BgColor || '#F7F3D3';
            const line2TextColor = config.params?.line2TextColor || '#F7F3D3';
            const line2BgColor = config.params?.line2BgColor || '#E53E3E';
            const borderRadius = config.params?.borderRadius || '20px';
            const padding = config.params?.padding || '16px 32px';

            const lines = content.split('\n');
            const line1 = lines[0] || '';
            const line2 = lines[1] || '';

            return {
                container: { 
                    position: 'relative', 
                    width: 'fit-content',
                    height: 'fit-content',
                    margin: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                },
                layers: [
                    {
                        style: {
                            ...textStyle,
                            position: 'relative',
                            zIndex: 1,
                            color: line1TextColor,
                            backgroundColor: line1BgColor,
                            borderRadius: borderRadius,
                            padding: padding,
                            display: 'block'
                        },
                        content: line1
                    },
                    {
                        style: {
                            ...textStyle,
                            position: 'relative',
                            zIndex: 1,
                            color: line2TextColor,
                            backgroundColor: line2BgColor,
                            borderRadius: borderRadius,
                            padding: padding,
                            display: 'block'
                        },
                        content: line2
                    }
                ]
            };

        case 'red-pink-outline':
            const redTextColor = config.params?.textColor || '#E53E3E';
            const pinkOutlineColor = config.params?.outlineColor || '#FFB6C1';
            const thickOutlineWidth = config.params?.outlineWidth || '24px';

            return {
                container: { 
                    position: 'relative', 
                    width: 'fit-content',
                    height: 'fit-content',
                    margin: 'auto'
                },
                layers: [
                    {
                        style: {
                            ...textStyle,
                            position: 'relative',
                            zIndex: 1,
                            color: redTextColor,
                            WebkitTextStroke: `${thickOutlineWidth} ${pinkOutlineColor}`,
                            textStroke: `${thickOutlineWidth} ${pinkOutlineColor}`,
                            paintOrder: 'stroke fill'
                        },
                        content
                    }
                ]
            };

        case 'hero-outline':
            const heroTextColor = config.params?.textColor || '#F5F5DC';
            const heroOutlineColor = config.params?.outlineColor || '#228B22';
            const heroOutlineWidth = config.params?.outlineWidth || '12px';

            return {
                container: { 
                    position: 'relative', 
                    width: 'fit-content',
                    height: 'fit-content',
                    margin: 'auto'
                },
                layers: [
                    // Background outline layer
                    {
                        style: {
                            ...textStyle,
                            position: 'absolute',
                            top: '0',
                            left: '0',
                            zIndex: 1,
                            color: heroOutlineColor,
                            WebkitTextStroke: `${heroOutlineWidth} ${heroOutlineColor}`,
                            textStroke: `${heroOutlineWidth} ${heroOutlineColor}`,
                            filter: 'blur(1px)'
                        },
                        content
                    },
                    // Main text
                    {
                        style: {
                            ...textStyle,
                            position: 'relative',
                            zIndex: 2,
                            color: heroTextColor
                        },
                        content
                    }
                ]
            };

        case 'ripple-contour':
            const baseColor = config.params?.baseColor || '#FF6B6B';
            const lightColor = config.params?.lightColor || '#FFB3B3';
            const layerSpacing = config.params?.layerSpacing || 8;

            return {
                container: { 
                    position: 'relative', 
                    width: 'fit-content',
                    height: 'fit-content',
                    margin: 'auto'
                },
                layers: [
                    // Layer 6 (furthest back)
                    {
                        style: {
                            ...textStyle,
                            position: 'absolute',
                            top: `${layerSpacing * 5}px`,
                            left: `${layerSpacing * 5}px`,
                            zIndex: 1,
                            color: 'transparent',
                            WebkitTextStroke: `2px ${lightColor}`,
                            textStroke: `2px ${lightColor}`,
                            opacity: 0.4,
                            whiteSpace: textStyle.whiteSpace,
                            wordWrap: textStyle.wordWrap,
                            lineHeight: textStyle.lineHeight,
                            letterSpacing: textStyle.letterSpacing
                        },
                        content
                    },
                    // Layer 5
                    {
                        style: {
                            ...textStyle,
                            position: 'absolute',
                            top: `${layerSpacing * 4}px`,
                            left: `${layerSpacing * 4}px`,
                            zIndex: 2,
                            color: 'transparent',
                            WebkitTextStroke: `2px ${baseColor}`,
                            textStroke: `2px ${baseColor}`,
                            opacity: 0.5,
                            whiteSpace: textStyle.whiteSpace,
                            wordWrap: textStyle.wordWrap,
                            lineHeight: textStyle.lineHeight,
                            letterSpacing: textStyle.letterSpacing
                        },
                        content
                    },
                    // Layer 4
                    {
                        style: {
                            ...textStyle,
                            position: 'absolute',
                            top: `${layerSpacing * 3}px`,
                            left: `${layerSpacing * 3}px`,
                            zIndex: 3,
                            color: 'transparent',
                            WebkitTextStroke: `2px ${lightColor}`,
                            textStroke: `2px ${lightColor}`,
                            opacity: 0.6,
                            whiteSpace: textStyle.whiteSpace,
                            wordWrap: textStyle.wordWrap,
                            lineHeight: textStyle.lineHeight,
                            letterSpacing: textStyle.letterSpacing
                        },
                        content
                    },
                    // Layer 3
                    {
                        style: {
                            ...textStyle,
                            position: 'absolute',
                            top: `${layerSpacing * 2}px`,
                            left: `${layerSpacing * 2}px`,
                            zIndex: 4,
                            color: 'transparent',
                            WebkitTextStroke: `2px ${baseColor}`,
                            textStroke: `2px ${baseColor}`,
                            opacity: 0.7,
                            whiteSpace: textStyle.whiteSpace,
                            wordWrap: textStyle.wordWrap,
                            lineHeight: textStyle.lineHeight,
                            letterSpacing: textStyle.letterSpacing
                        },
                        content
                    },
                    // Layer 2
                    {
                        style: {
                            ...textStyle,
                            position: 'absolute',
                            top: `${layerSpacing}px`,
                            left: `${layerSpacing}px`,
                            zIndex: 5,
                            color: 'transparent',
                            WebkitTextStroke: `2px ${lightColor}`,
                            textStroke: `2px ${lightColor}`,
                            opacity: 0.8,
                            whiteSpace: textStyle.whiteSpace,
                            wordWrap: textStyle.wordWrap,
                            lineHeight: textStyle.lineHeight,
                            letterSpacing: textStyle.letterSpacing
                        },
                        content
                    },
                    // Layer 1 (front)
                    {
                        style: {
                            ...textStyle,
                            position: 'relative',
                            zIndex: 6,
                            color: '#FF6B6B',
                            WebkitTextStroke: `2px ${baseColor}`,
                            textStroke: `2px ${baseColor}`
                        },
                        content
                    }
                ]
            };

        case 'brush-paint':
            const paintColor = config.params?.paintColor || '#000000';
            const brushTexture = config.params?.brushTexture || 'rough';

            return {
                container: { 
                    position: 'relative', 
                    width: 'fit-content',
                    height: 'fit-content',
                    margin: 'auto'
                },
                layers: [
                    {
                        style: {
                            ...textStyle,
                            position: 'relative',
                            zIndex: 1,
                            color: paintColor,
                            filter: 'contrast(1.2) saturate(1.1)',
                            textShadow: `
                                1px 1px 0px rgba(0,0,0,0.1),
                                -1px 1px 0px rgba(0,0,0,0.05),
                                1px -1px 0px rgba(0,0,0,0.05)
                            `
                        },
                        content
                    }
                ]
            };

        case 'neon-outline':
            const neonColor = config.params?.neonColor || '#FFFF00';
            const strokeWidth = config.params?.strokeWidth || '4px';

            return {
                container: { 
                    position: 'relative', 
                    width: 'fit-content',
                    height: 'fit-content',
                    margin: 'auto'
                },
                layers: [
                    {
                        style: {
                            ...textStyle,
                            position: 'relative',
                            zIndex: 1,
                            color: 'transparent',
                            WebkitTextStrokeWidth: strokeWidth,
                            WebkitTextStrokeColor: neonColor,
                            WebkitTextFillColor: 'transparent',
                            textStrokeWidth: strokeWidth,
                            textStrokeColor: neonColor,
                            paintOrder: 'stroke',
                            fontFeatureSettings: 'normal'
                        },
                        content
                    }
                ]
            };

        case 'neon-glow-script':
            const glowColor = config.params?.glowColor || '#E91E63';
            const neonTextColor = config.params?.textColor || '#ffffffff';
            const glowIntensity = config.params?.glowIntensity || '20px';

            return {
                container: { 
                    position: 'relative', 
                    width: 'fit-content',
                    height: 'fit-content',
                    margin: 'auto'
                },
                layers: [
                    {
                        style: {
                            ...textStyle,
                            position: 'relative',
                            zIndex: 1,
                            color: neonTextColor,
                            textShadow: `
                                0 0 5px ${glowColor},
                                0 0 10px ${glowColor},
                                0 0 15px ${glowColor},
                                0 0 ${glowIntensity} ${glowColor},
                                0 0 30px ${glowColor},
                                0 0 40px ${glowColor}
                            `,
                            filter: 'brightness(1.2)'
                        },
                        content
                    }
                ]
            };

        case 'soft-script-shadow':
            const scriptColor = config.params?.scriptColor || '#A5A8FF';

            return {
                container: { 
                    position: 'relative', 
                    width: 'fit-content',
                    height: 'fit-content',
                    margin: 'auto'
                },
                layers: [
                    // Shadow layer
                    {
                        style: {
                            ...textStyle,
                            position: 'absolute',
                            zIndex: 1,
                            whiteSpace: textStyle.whiteSpace,
                            wordWrap: textStyle.wordWrap,
                            lineHeight: textStyle.lineHeight,
                            letterSpacing: textStyle.letterSpacing
                        },
                        content
                    },
                    // Main text
                    {
                        style: {
                            ...textStyle,
                            position: 'relative',
                            zIndex: 2,
                            color: scriptColor
                        },
                        content
                    }
                ]
            };


        default:
            return null;
        }
  };

  return { createEffect };
};