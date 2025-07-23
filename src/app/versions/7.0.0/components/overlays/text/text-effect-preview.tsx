export interface EffectConfig {
  type: string;
  params?: Record<string, any>;
}

export const createEffectPreview = (config: EffectConfig, textStyle: any, content: string) => {
  switch (config.type) {
    case 'striped-shadow':
      const offsetPx = 1.5;
      
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
    // Add more cases for your other effects...


    default:
      return null;
  }
};