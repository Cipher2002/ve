export interface FontVariant {
  weight: string;
  style: 'normal' | 'italic';
  displayName: string;
}

export interface GoogleFont {
  family: string;
  category: 'sans-serif' | 'serif' | 'display' | 'handwriting' | 'monospace';
  variants: FontVariant[];
}

export const GOOGLE_FONTS: GoogleFont[] = [
  // Sans-Serif
  {
    family: 'Inter',
    category: 'sans-serif',
    variants: [
      { weight: '300', style: 'normal', displayName: 'Light' },
      { weight: '400', style: 'normal', displayName: 'Regular' },
      { weight: '500', style: 'normal', displayName: 'Medium' },
      { weight: '700', style: 'normal', displayName: 'Bold' },
      { weight: '300', style: 'italic', displayName: 'Light Italic' },
      { weight: '400', style: 'italic', displayName: 'Regular Italic' },
      { weight: '500', style: 'italic', displayName: 'Medium Italic' },
      { weight: '700', style: 'italic', displayName: 'Bold Italic' },
    ]
  },
  {
    family: 'Roboto',
    category: 'sans-serif',
    variants: [
      { weight: '300', style: 'normal', displayName: 'Light' },
      { weight: '400', style: 'normal', displayName: 'Regular' },
      { weight: '500', style: 'normal', displayName: 'Medium' },
      { weight: '700', style: 'normal', displayName: 'Bold' },
      { weight: '300', style: 'italic', displayName: 'Light Italic' },
      { weight: '400', style: 'italic', displayName: 'Regular Italic' },
      { weight: '500', style: 'italic', displayName: 'Medium Italic' },
      { weight: '700', style: 'italic', displayName: 'Bold Italic' },
    ]
  },
  {
    family: 'Open Sans',
    category: 'sans-serif',
    variants: [
      { weight: '300', style: 'normal', displayName: 'Light' },
      { weight: '400', style: 'normal', displayName: 'Regular' },
      { weight: '500', style: 'normal', displayName: 'Medium' },
      { weight: '700', style: 'normal', displayName: 'Bold' },
      { weight: '300', style: 'italic', displayName: 'Light Italic' },
      { weight: '400', style: 'italic', displayName: 'Regular Italic' },
      { weight: '500', style: 'italic', displayName: 'Medium Italic' },
      { weight: '700', style: 'italic', displayName: 'Bold Italic' },
    ]
  },
  {
    family: 'Lato',
    category: 'sans-serif',
    variants: [
      { weight: '300', style: 'normal', displayName: 'Light' },
      { weight: '400', style: 'normal', displayName: 'Regular' },
      { weight: '700', style: 'normal', displayName: 'Bold' },
      { weight: '300', style: 'italic', displayName: 'Light Italic' },
      { weight: '400', style: 'italic', displayName: 'Regular Italic' },
      { weight: '700', style: 'italic', displayName: 'Bold Italic' },
    ]
  },
  {
    family: 'Poppins',
    category: 'sans-serif',
    variants: [
      { weight: '300', style: 'normal', displayName: 'Light' },
      { weight: '400', style: 'normal', displayName: 'Regular' },
      { weight: '500', style: 'normal', displayName: 'Medium' },
      { weight: '700', style: 'normal', displayName: 'Bold' },
      { weight: '300', style: 'italic', displayName: 'Light Italic' },
      { weight: '400', style: 'italic', displayName: 'Regular Italic' },
      { weight: '500', style: 'italic', displayName: 'Medium Italic' },
      { weight: '700', style: 'italic', displayName: 'Bold Italic' },
    ]
  },
  {
    family: 'Nunito',
    category: 'sans-serif',
    variants: [
      { weight: '300', style: 'normal', displayName: 'Light' },
      { weight: '400', style: 'normal', displayName: 'Regular' },
      { weight: '500', style: 'normal', displayName: 'Medium' },
      { weight: '700', style: 'normal', displayName: 'Bold' },
      { weight: '300', style: 'italic', displayName: 'Light Italic' },
      { weight: '400', style: 'italic', displayName: 'Regular Italic' },
      { weight: '500', style: 'italic', displayName: 'Medium Italic' },
      { weight: '700', style: 'italic', displayName: 'Bold Italic' },
    ]
  },
  {
    family: 'Source Sans Pro',
    category: 'sans-serif',
    variants: [
      { weight: '300', style: 'normal', displayName: 'Light' },
      { weight: '400', style: 'normal', displayName: 'Regular' },
      { weight: '700', style: 'normal', displayName: 'Bold' },
      { weight: '300', style: 'italic', displayName: 'Light Italic' },
      { weight: '400', style: 'italic', displayName: 'Regular Italic' },
      { weight: '700', style: 'italic', displayName: 'Bold Italic' },
    ]
  },
  {
    family: 'Work Sans',
    category: 'sans-serif',
    variants: [
      { weight: '300', style: 'normal', displayName: 'Light' },
      { weight: '400', style: 'normal', displayName: 'Regular' },
      { weight: '500', style: 'normal', displayName: 'Medium' },
      { weight: '700', style: 'normal', displayName: 'Bold' },
      { weight: '300', style: 'italic', displayName: 'Light Italic' },
      { weight: '400', style: 'italic', displayName: 'Regular Italic' },
      { weight: '500', style: 'italic', displayName: 'Medium Italic' },
      { weight: '700', style: 'italic', displayName: 'Bold Italic' },
    ]
  },
  {
    family: 'Fira Sans',
    category: 'sans-serif',
    variants: [
      { weight: '300', style: 'normal', displayName: 'Light' },
      { weight: '400', style: 'normal', displayName: 'Regular' },
      { weight: '500', style: 'normal', displayName: 'Medium' },
      { weight: '700', style: 'normal', displayName: 'Bold' },
      { weight: '300', style: 'italic', displayName: 'Light Italic' },
      { weight: '400', style: 'italic', displayName: 'Regular Italic' },
      { weight: '500', style: 'italic', displayName: 'Medium Italic' },
      { weight: '700', style: 'italic', displayName: 'Bold Italic' },
    ]
  },
  {
    family: 'Ubuntu',
    category: 'sans-serif',
    variants: [
      { weight: '300', style: 'normal', displayName: 'Light' },
      { weight: '400', style: 'normal', displayName: 'Regular' },
      { weight: '500', style: 'normal', displayName: 'Medium' },
      { weight: '700', style: 'normal', displayName: 'Bold' },
      { weight: '300', style: 'italic', displayName: 'Light Italic' },
      { weight: '400', style: 'italic', displayName: 'Regular Italic' },
      { weight: '500', style: 'italic', displayName: 'Medium Italic' },
      { weight: '700', style: 'italic', displayName: 'Bold Italic' },
    ]
  },
  {
    family: 'Raleway',
    category: 'sans-serif',
    variants: [
      { weight: '300', style: 'normal', displayName: 'Light' },
      { weight: '400', style: 'normal', displayName: 'Regular' },
      { weight: '500', style: 'normal', displayName: 'Medium' },
      { weight: '700', style: 'normal', displayName: 'Bold' },
      { weight: '300', style: 'italic', displayName: 'Light Italic' },
      { weight: '400', style: 'italic', displayName: 'Regular Italic' },
      { weight: '500', style: 'italic', displayName: 'Medium Italic' },
      { weight: '700', style: 'italic', displayName: 'Bold Italic' },
    ]
  },
  {
    family: 'Montserrat',
    category: 'sans-serif',
    variants: [
      { weight: '300', style: 'normal', displayName: 'Light' },
      { weight: '400', style: 'normal', displayName: 'Regular' },
      { weight: '500', style: 'normal', displayName: 'Medium' },
      { weight: '700', style: 'normal', displayName: 'Bold' },
      { weight: '300', style: 'italic', displayName: 'Light Italic' },
      { weight: '400', style: 'italic', displayName: 'Regular Italic' },
      { weight: '500', style: 'italic', displayName: 'Medium Italic' },
      { weight: '700', style: 'italic', displayName: 'Bold Italic' },
    ]
  },
  // Serif
  {
    family: 'Playfair Display',
    category: 'serif',
    variants: [
      { weight: '400', style: 'normal', displayName: 'Regular' },
      { weight: '500', style: 'normal', displayName: 'Medium' },
      { weight: '700', style: 'normal', displayName: 'Bold' },
      { weight: '400', style: 'italic', displayName: 'Regular Italic' },
      { weight: '500', style: 'italic', displayName: 'Medium Italic' },
      { weight: '700', style: 'italic', displayName: 'Bold Italic' },
    ]
  },
  {
    family: 'Merriweather',
    category: 'serif',
    variants: [
      { weight: '300', style: 'normal', displayName: 'Light' },
      { weight: '400', style: 'normal', displayName: 'Regular' },
      { weight: '700', style: 'normal', displayName: 'Bold' },
      { weight: '300', style: 'italic', displayName: 'Light Italic' },
      { weight: '400', style: 'italic', displayName: 'Regular Italic' },
      { weight: '700', style: 'italic', displayName: 'Bold Italic' },
    ]
  },
  {
    family: 'Lora',
    category: 'serif',
    variants: [
      { weight: '400', style: 'normal', displayName: 'Regular' },
      { weight: '500', style: 'normal', displayName: 'Medium' },
      { weight: '700', style: 'normal', displayName: 'Bold' },
      { weight: '400', style: 'italic', displayName: 'Regular Italic' },
      { weight: '500', style: 'italic', displayName: 'Medium Italic' },
      { weight: '700', style: 'italic', displayName: 'Bold Italic' },
    ]
  },
  {
    family: 'Crimson Text',
    category: 'serif',
    variants: [
      { weight: '400', style: 'normal', displayName: 'Regular' },
      { weight: '700', style: 'normal', displayName: 'Bold' },
      { weight: '400', style: 'italic', displayName: 'Regular Italic' },
      { weight: '700', style: 'italic', displayName: 'Bold Italic' },
    ]
  },
  {
    family: 'Libre Baskerville',
    category: 'serif',
    variants: [
      { weight: '400', style: 'normal', displayName: 'Regular' },
      { weight: '700', style: 'normal', displayName: 'Bold' },
      { weight: '400', style: 'italic', displayName: 'Regular Italic' },
    ]
  },
  {
    family: 'Cormorant Garamond',
    category: 'serif',
    variants: [
      { weight: '300', style: 'normal', displayName: 'Light' },
      { weight: '400', style: 'normal', displayName: 'Regular' },
      { weight: '500', style: 'normal', displayName: 'Medium' },
      { weight: '700', style: 'normal', displayName: 'Bold' },
      { weight: '300', style: 'italic', displayName: 'Light Italic' },
      { weight: '400', style: 'italic', displayName: 'Regular Italic' },
      { weight: '500', style: 'italic', displayName: 'Medium Italic' },
      { weight: '700', style: 'italic', displayName: 'Bold Italic' },
    ]
  },
  {
    family: 'Source Serif Pro',
    category: 'serif',
    variants: [
      { weight: '300', style: 'normal', displayName: 'Light' },
      { weight: '400', style: 'normal', displayName: 'Regular' },
      { weight: '700', style: 'normal', displayName: 'Bold' },
      { weight: '300', style: 'italic', displayName: 'Light Italic' },
      { weight: '400', style: 'italic', displayName: 'Regular Italic' },
      { weight: '700', style: 'italic', displayName: 'Bold Italic' },
    ]
  },
  {
    family: 'Volkhov',
    category: 'serif',
    variants: [
      { weight: '400', style: 'normal', displayName: 'Regular' },
      { weight: '700', style: 'normal', displayName: 'Bold' },
      { weight: '400', style: 'italic', displayName: 'Regular Italic' },
      { weight: '700', style: 'italic', displayName: 'Bold Italic' },
    ]
  },
  // Script/Handwriting
  {
    family: 'Dancing Script',
    category: 'handwriting',
    variants: [
      { weight: '400', style: 'normal', displayName: 'Regular' },
      { weight: '500', style: 'normal', displayName: 'Medium' },
      { weight: '700', style: 'normal', displayName: 'Bold' },
    ]
  },
  {
    family: 'Pacifico',
    category: 'handwriting',
    variants: [
      { weight: '400', style: 'normal', displayName: 'Regular' },
    ]
  },
  {
    family: 'Great Vibes',
    category: 'handwriting',
    variants: [
      { weight: '400', style: 'normal', displayName: 'Regular' },
    ]
  },
  {
    family: 'Kaushan Script',
    category: 'handwriting',
    variants: [
      { weight: '400', style: 'normal', displayName: 'Regular' },
    ]
  },
  {
    family: 'Satisfy',
    category: 'handwriting',
    variants: [
      { weight: '400', style: 'normal', displayName: 'Regular' },
    ]
  },
  {
    family: 'Caveat',
    category: 'handwriting',
    variants: [
      { weight: '400', style: 'normal', displayName: 'Regular' },
      { weight: '500', style: 'normal', displayName: 'Medium' },
      { weight: '700', style: 'normal', displayName: 'Bold' },
    ]
  },
  {
    family: 'Amatic SC',
    category: 'handwriting',
    variants: [
      { weight: '400', style: 'normal', displayName: 'Regular' },
      { weight: '700', style: 'normal', displayName: 'Bold' },
    ]
  },
  {
    family: 'Sacramento',
    category: 'handwriting',
    variants: [
      { weight: '400', style: 'normal', displayName: 'Regular' },
    ]
  },
  // Display
  {
    family: 'Oswald',
    category: 'display',
    variants: [
      { weight: '300', style: 'normal', displayName: 'Light' },
      { weight: '400', style: 'normal', displayName: 'Regular' },
      { weight: '500', style: 'normal', displayName: 'Medium' },
      { weight: '700', style: 'normal', displayName: 'Bold' },
    ]
  },
  {
    family: 'Bebas Neue',
    category: 'display',
    variants: [
      { weight: '400', style: 'normal', displayName: 'Regular' },
    ]
  },
  {
    family: 'Abril Fatface',
    category: 'display',
    variants: [
      { weight: '400', style: 'normal', displayName: 'Regular' },
    ]
  },
  {
    family: 'Fredoka One',
    category: 'display',
    variants: [
      { weight: '400', style: 'normal', displayName: 'Regular' },
    ]
  },
  {
    family: 'Anton',
    category: 'display',
    variants: [
      { weight: '400', style: 'normal', displayName: 'Regular' },
    ]
  },
  {
    family: 'Righteous',
    category: 'display',
    variants: [
      { weight: '400', style: 'normal', displayName: 'Regular' },
    ]
  },
  {
    family: 'Bungee',
    category: 'display',
    variants: [
      { weight: '400', style: 'normal', displayName: 'Regular' },
    ]
  },
  {
    family: 'Orbitron',
    category: 'display',
    variants: [
      { weight: '400', style: 'normal', displayName: 'Regular' },
      { weight: '500', style: 'normal', displayName: 'Medium' },
      { weight: '700', style: 'normal', displayName: 'Bold' },
    ]
  },
  // Monospace
  {
    family: 'Roboto Mono',
    category: 'monospace',
    variants: [
      { weight: '300', style: 'normal', displayName: 'Light' },
      { weight: '400', style: 'normal', displayName: 'Regular' },
      { weight: '500', style: 'normal', displayName: 'Medium' },
      { weight: '700', style: 'normal', displayName: 'Bold' },
      { weight: '300', style: 'italic', displayName: 'Light Italic' },
      { weight: '400', style: 'italic', displayName: 'Regular Italic' },
      { weight: '500', style: 'italic', displayName: 'Medium Italic' },
      { weight: '700', style: 'italic', displayName: 'Bold Italic' },
    ]
  },
  {
    family: 'Source Code Pro',
    category: 'monospace',
    variants: [
      { weight: '300', style: 'normal', displayName: 'Light' },
      { weight: '400', style: 'normal', displayName: 'Regular' },
      { weight: '500', style: 'normal', displayName: 'Medium' },
      { weight: '700', style: 'normal', displayName: 'Bold' },
      { weight: '300', style: 'italic', displayName: 'Light Italic' },
      { weight: '400', style: 'italic', displayName: 'Regular Italic' },
      { weight: '500', style: 'italic', displayName: 'Medium Italic' },
      { weight: '700', style: 'italic', displayName: 'Bold Italic' },
    ]
  },
  {
    family: 'JetBrains Mono',
    category: 'monospace',
    variants: [
      { weight: '300', style: 'normal', displayName: 'Light' },
      { weight: '400', style: 'normal', displayName: 'Regular' },
      { weight: '500', style: 'normal', displayName: 'Medium' },
      { weight: '700', style: 'normal', displayName: 'Bold' },
      { weight: '300', style: 'italic', displayName: 'Light Italic' },
      { weight: '400', style: 'italic', displayName: 'Regular Italic' },
      { weight: '500', style: 'italic', displayName: 'Medium Italic' },
      { weight: '700', style: 'italic', displayName: 'Bold Italic' },
    ]
  },
  {
    family: 'Fira Code',
    category: 'monospace',
    variants: [
      { weight: '300', style: 'normal', displayName: 'Light' },
      { weight: '400', style: 'normal', displayName: 'Regular' },
      { weight: '500', style: 'normal', displayName: 'Medium' },
      { weight: '700', style: 'normal', displayName: 'Bold' },
    ]
  },
];

// Font loading utilities
const loadedFonts = new Set<string>();

export const loadGoogleFont = (family: string, variants: FontVariant[]): Promise<void> => {
  return new Promise((resolve, reject) => {
    const fontKey = `${family}-${variants.map(v => `${v.weight}${v.style}`).join('-')}`;
    
    if (loadedFonts.has(fontKey)) {
      resolve();
      return;
    }

    // Create weight:style pairs for the URL
    const weights = variants.map(variant => variant.weight).join(';');
    const hasItalic = variants.some(variant => variant.style === 'italic');
    
    let fontUrl;
    if (hasItalic) {
      const italicWeights = variants.filter(v => v.style === 'italic').map(v => v.weight).join(';');
      const normalWeights = variants.filter(v => v.style === 'normal').map(v => v.weight).join(';');
      fontUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:ital,wght@0,${normalWeights};1,${italicWeights}&display=swap`;
    } else {
      fontUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weights}&display=swap`;
    }

    // Create link element
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = fontUrl;
    
    link.onload = () => {
      loadedFonts.add(fontKey);
      resolve();
    };
    
    link.onerror = () => {
      reject(new Error(`Failed to load font: ${family}`));
    };

    document.head.appendChild(link);
  });
};

export const getFontFamilyString = (family: string): string => {
  return `"${family}", sans-serif`;
};