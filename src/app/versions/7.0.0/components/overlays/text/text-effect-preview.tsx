export interface EffectConfig {
  type: string;
  params?: Record<string, any>;
}

export const createEffectPreview = (config: EffectConfig, textStyle: any, content: string) => {
  switch (config.type) {
    case 'striped-shadow':
      const offsetPx = 8; // Fixed for preview
      
      return {
        container: { 
          position: 'relative', 
          width: 'fit-content',
          height: 'fit-content',
          margin: 'auto'
        },
        layers: [
          // Striped shadow
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
              color: config.params?.color || '#ff5555'
            },
            content
          }
        ]
      };

    case 'neon-glow-script':
      const glowColor = config.params?.glowColor || '#E91E63';
      const neonTextColor = config.params?.textColor || '#ffffff';
      
      return {
        container: null,
        layers: [{
          style: {
            ...textStyle,
            color: neonTextColor,
            textShadow: `0 0 5px ${glowColor}, 0 0 10px ${glowColor}, 0 0 15px ${glowColor}, 0 0 20px ${glowColor}`
          },
          content
        }]
      };

    case '3d-layered':
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
              left: '-6px',
              zIndex: 1,
              color: '#00FFFF'
            },
            content
          },
          // Right pink layer
          {
            style: {
              ...textStyle,
              position: 'absolute',
              top: '0px',
              left: '6px',
              zIndex: 2,
              color: '#FF69B4'
            },
            content
          },
          // Main text
          {
            style: {
              ...textStyle,
              position: 'relative',
              zIndex: 3,
              color: '#E91E63'
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