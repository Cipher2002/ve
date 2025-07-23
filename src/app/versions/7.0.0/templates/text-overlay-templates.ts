export const textOverlayTemplates: Record<string, any> = {
  mainHeading: {
    name: "Main Heading",
    content: "Add a heading",
    preview: "Primary Title",
    styles: {
      fontSize: "10rem",
      fontWeight: "700",
      color: "#000000",
      backgroundColor: "transparent",
      fontFamily: "font-sans",
      fontStyle: "normal",
      textDecoration: "none",
      lineHeight: "1.1",
      textAlign: "left",
      letterSpacing: "-0.02em",
      textTransform: "none",
      padding: "16px 24px",
      margin: "0",
      borderRadius: "12px",
      border: "1px solid rgba(0, 0, 0, 0.1)",
    },
  },

  impact: {
    name: "Impact Statement",
    content: "MAKE AN IMPACT",
    preview: "Bold & Commanding",
    styles: {
      fontSize: "3.5rem",
      fontWeight: "900",
      color: "#FFFFFF",
      backgroundColor: "",
      fontFamily: "font-sans",
      fontStyle: "normal",
      textDecoration: "none",
      lineHeight: "1",
      textAlign: "center",
      letterSpacing: "0.02em",
      textTransform: "uppercase",
      textShadow: "2px 2px 0px rgba(0, 0, 0, 0.2)",
    },
  },

  slicedText: {
    name: "Sliced Text",
    content: "SLICED",
    preview: "Edgy & Modern",
    styles: {
      fontSize: "4.2rem",
      fontWeight: "900",
      color: "#FFFFFF",
      backgroundColor: "",
      fontFamily: "font-sans",
      fontStyle: "normal",
      textDecoration: "none",
      lineHeight: "1",
      textAlign: "center",
      letterSpacing: "0.05em",
      textTransform: "uppercase",
      textShadow: "6px 6px 0px #FF2D55, -6px -6px 0px #5E5CE6",
    },
  },

  minimalMonochrome: {
    name: "Minimal Monochrome",
    content: "less is more",
    preview: "Ultra Minimal",
    styles: {
      fontSize: "3rem",
      fontWeight: "200",
      color: "#FFFFFF",
      backgroundColor: "",
      fontFamily: "font-sans",
      fontStyle: "normal",
      textDecoration: "none",
      lineHeight: "1",
      textAlign: "center",
      letterSpacing: "0.25em",
      textTransform: "lowercase",
      border: "1px solid rgba(255, 255, 255, 0.3)",
      padding: "24px 48px",
    },
  },

  highlight: {
    name: "Highlight Box",
    content: "Highlighted Text",
    preview: "Modern & Distinctive",
    styles: {
      fontSize: "2.4rem",
      fontWeight: "700",
      color: "#FFFFFF",
      backgroundColor: "rgba(79, 70, 229, 0.85)",
      fontFamily: "font-sans",
      fontStyle: "normal",
      textDecoration: "none",
      lineHeight: "1.2",
      padding: "16px 32px",
      borderRadius: "12px",
      textAlign: "center",
      boxShadow:
        "0 8px 16px -4px rgba(79, 70, 229, 0.25), 0 4px 6px -2px rgba(0, 0, 0, 0.1)",
      backdropFilter: "blur(8px)",
      border: "1px solid rgba(255, 255, 255, 0.1)",
    },
  },

  gradient: {
    name: "Gradient Pop",
    content: "Gradient Style",
    preview: "Dynamic & Modern",
    isPro: true,
    styles: {
      fontSize: "3.2rem",
      fontWeight: "800",
      background:
        "linear-gradient(135deg, #6366F1 0%, #EC4899 50%, #F59E0B 100%)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      fontFamily: "font-sans",
      fontStyle: "normal",
      textDecoration: "none",
      lineHeight: "1.1",
      textAlign: "center",
      textShadow: "0px 0px 20px rgba(236, 72, 153, 0.3)",
    },
  },

  glassmorphic: {
    name: "Glassmorphic",
    content: "GLASS EFFECT",
    preview: "Modern Transparency",
    styles: {
      fontSize: "3rem",
      fontWeight: "700",
      color: "#FFFFFF",
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      fontFamily: "font-sans",
      fontStyle: "normal",
      textDecoration: "none",
      lineHeight: "1.2",
      textAlign: "center",
      letterSpacing: "0.1em",
      padding: "24px 48px",
      borderRadius: "16px",
      backdropFilter: "blur(10px)",
      border: "1px solid rgba(255, 255, 255, 0.2)",
      boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
    },
  },

  quantumBlur: {
    name: "Quantum Blur",
    content: "QUANTUM LEAP",
    preview: "Dimensional Shift",
    isPro: true,
    styles: {
      fontSize: "3.6rem",
      fontWeight: "800",
      color: "#FFFFFF",
      fontFamily: "font-sans",
      fontStyle: "normal",
      textDecoration: "none",
      lineHeight: "1",
      textAlign: "center",
      letterSpacing: "0.12em",
      textTransform: "uppercase",
      textShadow: "2px 2px 0px #FF0080, -2px -2px 0px #0080FF, 4px 4px 10px rgba(255, 0, 128, 0.3)",
      filter: "blur(0.5px)",
      padding: "16px",
    },
  },

  stripedShadow: {
    name: "Striped Shadow",
    content: "SHIPPING",
    preview: "Bold Striped Effect",
    styles: {
      fontSize: "4rem",
      fontWeight: "900",
      backgroundColor: "transparent",
      fontFamily: "font-sans",
      fontStyle: "normal",
      textDecoration: "none",
      lineHeight: "1.2",
      textAlign: "center",
      letterSpacing: "0.05em",
      textTransform: "uppercase",
      effect: {
        type: "striped-shadow",
        params: {
          color: "#ff5555",
          offsetX: "8px",
          offsetY: "8px",
          gradient: "repeating-linear-gradient(135deg, #ff5555 0px, #ff5555 2px, transparent 2px, transparent 6px)"
        }
      }
    },
  },

  threeDLayered: {
    name: "3D Layered",
    content: "GAME\nCODE",
    preview: "Bold 3D Effect",
    styles: {
      fontSize: "4rem",
      fontWeight: "900",
      backgroundColor: "transparent",
      fontFamily: "font-sans",
      fontStyle: "normal",
      textDecoration: "none",
      lineHeight: "1.1",
      textAlign: "center",
      letterSpacing: "0.05em",
      textTransform: "uppercase",
      effect: {
        type: "3d-layered",
        params: {
          mainColor: "#E91E63",      // Main pink color
          leftColor: "#00FFFF",      // Cyan/blue left offset
          rightColor: "#FF69B4",     // Light pink right offset
          leftOffset: "-8px",        // How far left the cyan layer is
          rightOffset: "8px"         // How far right the light pink layer is
        }
      }
    },
  },

  scriptLayered: {
    name: "Script Layered",
    content: "Live\nforever",
    preview: "3-Layer Script Effect",
    styles: {
      fontSize: "4.5rem",
      fontWeight: "600",
      backgroundColor: "transparent",
      fontFamily: "font-custom-dancingscript-variablefont-wght",
      fontStyle: "italic",
      textDecoration: "none",
      lineHeight: "1.1",
      textAlign: "center",
      letterSpacing: "0.02em",
      textTransform: "none",
      effect: {
        type: "script-layered",
        params: {
          mainTextColor: "#FF4757",
          layer1Color: "#FFB3BA",
          layer2Color: "#F8F8F8",
          offsetDistance: "4px"
        }
      }
    },
  },

  pinkOutline: {
    name: "Pink Outline",
    content: "AWESOME",
    preview: "Pink Fill with Outline",
    styles: {
      fontSize: "4rem",
      fontWeight: "900",
      backgroundColor: "transparent",
      fontFamily: "font-sans",
      fontStyle: "normal",
      textDecoration: "none",
      lineHeight: "1.2",
      textAlign: "center",
      letterSpacing: "0.05em",
      textTransform: "uppercase",
      effect: {
        type: "pink-outline",
        params: {
          fillColor: "#FF1493",
          outlineColor: "#AD1457",
          outlineWidth: "2px"
        }
      }
    },
  },

  handwrittenScript: {
    name: "Handwritten Script",
    content: "I Got You",
    preview: "Script Handwriting",
    styles: {
      fontSize: "4rem",
      fontWeight: "400",
      backgroundColor: "transparent",
      fontFamily: "font-custom-dancingscript-variablefont-wght",
      fontStyle: "italic",
      textDecoration: "none",
      lineHeight: "1.1",
      textAlign: "center",
      letterSpacing: "0.02em",
      textTransform: "none",
      effect: {
        type: "handwritten-script",
        params: {
          textColor: "#000000"
        }
      }
    },
  },

  stackedContrast: {
    name: "Stacked Contrast",
    content: "CUT CAKE\nNOWWWW",
    preview: "Contrasting Backgrounds",
    styles: {
      fontSize: "3.5rem",
      fontWeight: "900",
      backgroundColor: "transparent",
      fontFamily: "font-sans",
      fontStyle: "normal",
      textDecoration: "none",
      lineHeight: "1.2",
      textAlign: "center",
      letterSpacing: "0.05em",
      textTransform: "uppercase",
      effect: {
        type: "stacked-contrast",
        params: {
          line1TextColor: "#E53E3E",
          line1BgColor: "#F7F3D3",
          line2TextColor: "#F7F3D3",
          line2BgColor: "#E53E3E",
          borderRadius: "20px",
          padding: "16px 32px"
        }
      }
    },
  },

  redPinkOutline: {
    name: "Red Pink Outline",
    content: "cuty\npie",
    preview: "Red with Thick Pink Outline",
    styles: {
      fontSize: "4rem",
      fontWeight: "900",
      backgroundColor: "transparent",
      fontFamily: "font-sans",
      fontStyle: "normal",
      textDecoration: "none",
      lineHeight: "1.1",
      textAlign: "center",
      letterSpacing: "0.02em",
      textTransform: "lowercase",
      effect: {
        type: "red-pink-outline",
        params: {
          textColor: "#E53E3E",
          outlineColor: "#FFB6C1",
          outlineWidth: "24px"
        }
      }
    },
  },

  heroOutline: {
    name: "Hero Outline",
    content: "HERO",
    preview: "Beige with Green Rounded Outline",
    styles: {
      fontSize: "4rem",
      fontWeight: "900",
      backgroundColor: "transparent",
      fontFamily: "font-sans",
      fontStyle: "normal",
      textDecoration: "none",
      lineHeight: "1.2",
      textAlign: "center",
      letterSpacing: "0.05em",
      textTransform: "uppercase",
      effect: {
        type: "hero-outline",
        params: {
          textColor: "#F5F5DC",
          outlineColor: "#228B22",
          outlineWidth: "12px"
        }
      }
    },
  },

  rippleContour: {
    name: "Ripple Contour",
    content: "SOLD",
    preview: "Layered Contour Effect",
    styles: {
      fontSize: "4.5rem",
      fontWeight: "900",
      backgroundColor: "transparent",
      fontFamily: "font-sans",
      fontStyle: "normal",
      textDecoration: "none",
      lineHeight: "1.1",
      textAlign: "center",
      letterSpacing: "0.05em",
      textTransform: "uppercase",
      effect: {
        type: "ripple-contour",
        params: {
          baseColor: "#FF6B6B",
          lightColor: "#FFB3B3",
          layerSpacing: 8
        }
      }
    },
  },

  brushPaint: {
    name: "Brush Paint",
    content: "JUMPY",
    preview: "Hand-Painted Brush Style",
    styles: {
      fontSize: "4.5rem",
      fontWeight: "900",
      backgroundColor: "transparent",
      fontFamily: "font-custom-permanentmarker-regular",
      fontStyle: "italic",
      textDecoration: "none",
      lineHeight: "1.1",
      textAlign: "center",
      letterSpacing: "0.02em",
      textTransform: "uppercase",
      transform: "skew(-5deg)",
      effect: {
        type: "brush-paint",
        params: {
          paintColor: "#000000",
          brushTexture: "rough"
        }
      }
    },
  },

  neonOutline: {
    name: "Neon Outline",
    content: "JUMP\nJUMP",
    preview: "Bright Neon Hollow Effect",
    styles: {
      fontSize: "4rem",
      fontWeight: "900",
      backgroundColor: "transparent",
      fontFamily: "font-sans",
      fontStyle: "normal",
      textDecoration: "none",
      lineHeight: "1.1",
      textAlign: "center",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      effect: {
        type: "neon-outline",
        params: {
          neonColor: "#FFFF00",
          strokeWidth: "3px"
        }
      }
    },
  },

  neonGlowScript: {
    name: "Neon Glow Script",
    content: "Clapping",
    preview: "Glowing Neon Cursive",
    styles: {
      fontSize: "4rem",
      fontWeight: "400",
      backgroundColor: "transparent",
      fontFamily: "font-custom-dancingscript-variablefont-wght",
      fontStyle: "italic",
      textDecoration: "none",
      lineHeight: "1.2",
      textAlign: "center",
      letterSpacing: "0.02em",
      textTransform: "none",
      effect: {
        type: "neon-glow-script",
        params: {
          glowColor: "#E91E63",
          neonTextColor: "#ffffffff",
          glowIntensity: "20px"
        }
      }
    },
  },

  softScriptShadow: {
    name: "Soft Script Shadow",
    content: "Right Now",
    preview: "Gentle Cursive with Drop Shadow",
    styles: {
      fontSize: "4rem",
      fontWeight: "500",
      backgroundColor: "transparent",
      fontFamily: "font-custom-dancingscript-variablefont-wght",
      fontStyle: "italic",
      textDecoration: "none",
      lineHeight: "1.2",
      textAlign: "center",
      letterSpacing: "0.02em",
      textTransform: "none",
      effect: {
        type: "soft-script-shadow",
        params: {
          scriptColor: "#A5A8FF",
          shadowOffset: "3px"
        }
      }
    },
  },

lowerThirdBrushAngled: {
  name: "Angled 3D Bar Lower Third",
  content: "SIENNA CARTER",
  preview: "Angled 3D Orange Bar",
  styles: {
    fontSize: "2.5rem",
    fontWeight: "700",
    backgroundColor: "transparent",
    fontFamily: "font-sans",
    fontStyle: "normal",
    textDecoration: "none",
    lineHeight: "1.2",
    textAlign: "left",
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    effect: {
      type: "lower-third-3d-angled-bar",
      params: {
        textColor: "#000000",
        imageName: "orange-angled-bar.png"
      }
    }
  },
},
  

};
