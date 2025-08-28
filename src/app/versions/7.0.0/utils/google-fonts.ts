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

// export const GOOGLE_FONTS: GoogleFont[] = [
//   // Sans-Serif
//   {
//     family: 'Inter',
//     category: 'sans-serif',
//     variants: [
//       { weight: '300', style: 'normal', displayName: 'Light' },
//       { weight: '400', style: 'normal', displayName: 'Regular' },
//       { weight: '500', style: 'normal', displayName: 'Medium' },
//       { weight: '700', style: 'normal', displayName: 'Bold' },
//       { weight: '300', style: 'italic', displayName: 'Light Italic' },
//       { weight: '400', style: 'italic', displayName: 'Regular Italic' },
//       { weight: '500', style: 'italic', displayName: 'Medium Italic' },
//       { weight: '700', style: 'italic', displayName: 'Bold Italic' },
//     ]
//   },
//   {
//     family: 'Roboto',
//     category: 'sans-serif',
//     variants: [
//       { weight: '300', style: 'normal', displayName: 'Light' },
//       { weight: '400', style: 'normal', displayName: 'Regular' },
//       { weight: '500', style: 'normal', displayName: 'Medium' },
//       { weight: '700', style: 'normal', displayName: 'Bold' },
//       { weight: '300', style: 'italic', displayName: 'Light Italic' },
//       { weight: '400', style: 'italic', displayName: 'Regular Italic' },
//       { weight: '500', style: 'italic', displayName: 'Medium Italic' },
//       { weight: '700', style: 'italic', displayName: 'Bold Italic' },
//     ]
//   },
//   {
//     family: 'Open Sans',
//     category: 'sans-serif',
//     variants: [
//       { weight: '300', style: 'normal', displayName: 'Light' },
//       { weight: '400', style: 'normal', displayName: 'Regular' },
//       { weight: '500', style: 'normal', displayName: 'Medium' },
//       { weight: '700', style: 'normal', displayName: 'Bold' },
//       { weight: '300', style: 'italic', displayName: 'Light Italic' },
//       { weight: '400', style: 'italic', displayName: 'Regular Italic' },
//       { weight: '500', style: 'italic', displayName: 'Medium Italic' },
//       { weight: '700', style: 'italic', displayName: 'Bold Italic' },
//     ]
//   },
//   {
//     family: 'Lato',
//     category: 'sans-serif',
//     variants: [
//       { weight: '300', style: 'normal', displayName: 'Light' },
//       { weight: '400', style: 'normal', displayName: 'Regular' },
//       { weight: '700', style: 'normal', displayName: 'Bold' },
//       { weight: '300', style: 'italic', displayName: 'Light Italic' },
//       { weight: '400', style: 'italic', displayName: 'Regular Italic' },
//       { weight: '700', style: 'italic', displayName: 'Bold Italic' },
//     ]
//   },
//   {
//     family: 'Poppins',
//     category: 'sans-serif',
//     variants: [
//       { weight: '300', style: 'normal', displayName: 'Light' },
//       { weight: '400', style: 'normal', displayName: 'Regular' },
//       { weight: '500', style: 'normal', displayName: 'Medium' },
//       { weight: '700', style: 'normal', displayName: 'Bold' },
//       { weight: '300', style: 'italic', displayName: 'Light Italic' },
//       { weight: '400', style: 'italic', displayName: 'Regular Italic' },
//       { weight: '500', style: 'italic', displayName: 'Medium Italic' },
//       { weight: '700', style: 'italic', displayName: 'Bold Italic' },
//     ]
//   },
//   {
//     family: 'Nunito',
//     category: 'sans-serif',
//     variants: [
//       { weight: '300', style: 'normal', displayName: 'Light' },
//       { weight: '400', style: 'normal', displayName: 'Regular' },
//       { weight: '500', style: 'normal', displayName: 'Medium' },
//       { weight: '700', style: 'normal', displayName: 'Bold' },
//       { weight: '300', style: 'italic', displayName: 'Light Italic' },
//       { weight: '400', style: 'italic', displayName: 'Regular Italic' },
//       { weight: '500', style: 'italic', displayName: 'Medium Italic' },
//       { weight: '700', style: 'italic', displayName: 'Bold Italic' },
//     ]
//   },
//   {
//     family: 'Source Sans Pro',
//     category: 'sans-serif',
//     variants: [
//       { weight: '300', style: 'normal', displayName: 'Light' },
//       { weight: '400', style: 'normal', displayName: 'Regular' },
//       { weight: '700', style: 'normal', displayName: 'Bold' },
//       { weight: '300', style: 'italic', displayName: 'Light Italic' },
//       { weight: '400', style: 'italic', displayName: 'Regular Italic' },
//       { weight: '700', style: 'italic', displayName: 'Bold Italic' },
//     ]
//   },
//   {
//     family: 'Work Sans',
//     category: 'sans-serif',
//     variants: [
//       { weight: '300', style: 'normal', displayName: 'Light' },
//       { weight: '400', style: 'normal', displayName: 'Regular' },
//       { weight: '500', style: 'normal', displayName: 'Medium' },
//       { weight: '700', style: 'normal', displayName: 'Bold' },
//       { weight: '300', style: 'italic', displayName: 'Light Italic' },
//       { weight: '400', style: 'italic', displayName: 'Regular Italic' },
//       { weight: '500', style: 'italic', displayName: 'Medium Italic' },
//       { weight: '700', style: 'italic', displayName: 'Bold Italic' },
//     ]
//   },
//   {
//     family: 'Fira Sans',
//     category: 'sans-serif',
//     variants: [
//       { weight: '300', style: 'normal', displayName: 'Light' },
//       { weight: '400', style: 'normal', displayName: 'Regular' },
//       { weight: '500', style: 'normal', displayName: 'Medium' },
//       { weight: '700', style: 'normal', displayName: 'Bold' },
//       { weight: '300', style: 'italic', displayName: 'Light Italic' },
//       { weight: '400', style: 'italic', displayName: 'Regular Italic' },
//       { weight: '500', style: 'italic', displayName: 'Medium Italic' },
//       { weight: '700', style: 'italic', displayName: 'Bold Italic' },
//     ]
//   },
//   {
//     family: 'Ubuntu',
//     category: 'sans-serif',
//     variants: [
//       { weight: '300', style: 'normal', displayName: 'Light' },
//       { weight: '400', style: 'normal', displayName: 'Regular' },
//       { weight: '500', style: 'normal', displayName: 'Medium' },
//       { weight: '700', style: 'normal', displayName: 'Bold' },
//       { weight: '300', style: 'italic', displayName: 'Light Italic' },
//       { weight: '400', style: 'italic', displayName: 'Regular Italic' },
//       { weight: '500', style: 'italic', displayName: 'Medium Italic' },
//       { weight: '700', style: 'italic', displayName: 'Bold Italic' },
//     ]
//   },
//   {
//     family: 'Raleway',
//     category: 'sans-serif',
//     variants: [
//       { weight: '300', style: 'normal', displayName: 'Light' },
//       { weight: '400', style: 'normal', displayName: 'Regular' },
//       { weight: '500', style: 'normal', displayName: 'Medium' },
//       { weight: '700', style: 'normal', displayName: 'Bold' },
//       { weight: '300', style: 'italic', displayName: 'Light Italic' },
//       { weight: '400', style: 'italic', displayName: 'Regular Italic' },
//       { weight: '500', style: 'italic', displayName: 'Medium Italic' },
//       { weight: '700', style: 'italic', displayName: 'Bold Italic' },
//     ]
//   },
//   {
//     family: 'Montserrat',
//     category: 'sans-serif',
//     variants: [
//       { weight: '300', style: 'normal', displayName: 'Light' },
//       { weight: '400', style: 'normal', displayName: 'Regular' },
//       { weight: '500', style: 'normal', displayName: 'Medium' },
//       { weight: '700', style: 'normal', displayName: 'Bold' },
//       { weight: '300', style: 'italic', displayName: 'Light Italic' },
//       { weight: '400', style: 'italic', displayName: 'Regular Italic' },
//       { weight: '500', style: 'italic', displayName: 'Medium Italic' },
//       { weight: '700', style: 'italic', displayName: 'Bold Italic' },
//     ]
//   },
//   // Serif
//   {
//     family: 'Playfair Display',
//     category: 'serif',
//     variants: [
//       { weight: '400', style: 'normal', displayName: 'Regular' },
//       { weight: '500', style: 'normal', displayName: 'Medium' },
//       { weight: '700', style: 'normal', displayName: 'Bold' },
//       { weight: '400', style: 'italic', displayName: 'Regular Italic' },
//       { weight: '500', style: 'italic', displayName: 'Medium Italic' },
//       { weight: '700', style: 'italic', displayName: 'Bold Italic' },
//     ]
//   },
//   {
//     family: 'Merriweather',
//     category: 'serif',
//     variants: [
//       { weight: '300', style: 'normal', displayName: 'Light' },
//       { weight: '400', style: 'normal', displayName: 'Regular' },
//       { weight: '700', style: 'normal', displayName: 'Bold' },
//       { weight: '300', style: 'italic', displayName: 'Light Italic' },
//       { weight: '400', style: 'italic', displayName: 'Regular Italic' },
//       { weight: '700', style: 'italic', displayName: 'Bold Italic' },
//     ]
//   },
//   {
//     family: 'Lora',
//     category: 'serif',
//     variants: [
//       { weight: '400', style: 'normal', displayName: 'Regular' },
//       { weight: '500', style: 'normal', displayName: 'Medium' },
//       { weight: '700', style: 'normal', displayName: 'Bold' },
//       { weight: '400', style: 'italic', displayName: 'Regular Italic' },
//       { weight: '500', style: 'italic', displayName: 'Medium Italic' },
//       { weight: '700', style: 'italic', displayName: 'Bold Italic' },
//     ]
//   },
//   {
//     family: 'Crimson Text',
//     category: 'serif',
//     variants: [
//       { weight: '400', style: 'normal', displayName: 'Regular' },
//       { weight: '700', style: 'normal', displayName: 'Bold' },
//       { weight: '400', style: 'italic', displayName: 'Regular Italic' },
//       { weight: '700', style: 'italic', displayName: 'Bold Italic' },
//     ]
//   },
//   {
//     family: 'Libre Baskerville',
//     category: 'serif',
//     variants: [
//       { weight: '400', style: 'normal', displayName: 'Regular' },
//       { weight: '700', style: 'normal', displayName: 'Bold' },
//       { weight: '400', style: 'italic', displayName: 'Regular Italic' },
//     ]
//   },
//   {
//     family: 'Cormorant Garamond',
//     category: 'serif',
//     variants: [
//       { weight: '300', style: 'normal', displayName: 'Light' },
//       { weight: '400', style: 'normal', displayName: 'Regular' },
//       { weight: '500', style: 'normal', displayName: 'Medium' },
//       { weight: '700', style: 'normal', displayName: 'Bold' },
//       { weight: '300', style: 'italic', displayName: 'Light Italic' },
//       { weight: '400', style: 'italic', displayName: 'Regular Italic' },
//       { weight: '500', style: 'italic', displayName: 'Medium Italic' },
//       { weight: '700', style: 'italic', displayName: 'Bold Italic' },
//     ]
//   },
//   {
//     family: 'Source Serif Pro',
//     category: 'serif',
//     variants: [
//       { weight: '300', style: 'normal', displayName: 'Light' },
//       { weight: '400', style: 'normal', displayName: 'Regular' },
//       { weight: '700', style: 'normal', displayName: 'Bold' },
//       { weight: '300', style: 'italic', displayName: 'Light Italic' },
//       { weight: '400', style: 'italic', displayName: 'Regular Italic' },
//       { weight: '700', style: 'italic', displayName: 'Bold Italic' },
//     ]
//   },
//   {
//     family: 'Volkhov',
//     category: 'serif',
//     variants: [
//       { weight: '400', style: 'normal', displayName: 'Regular' },
//       { weight: '700', style: 'normal', displayName: 'Bold' },
//       { weight: '400', style: 'italic', displayName: 'Regular Italic' },
//       { weight: '700', style: 'italic', displayName: 'Bold Italic' },
//     ]
//   },
//   // Script/Handwriting
//   {
//     family: 'Dancing Script',
//     category: 'handwriting',
//     variants: [
//       { weight: '400', style: 'normal', displayName: 'Regular' },
//       { weight: '500', style: 'normal', displayName: 'Medium' },
//       { weight: '700', style: 'normal', displayName: 'Bold' },
//     ]
//   },
//   {
//     family: 'Pacifico',
//     category: 'handwriting',
//     variants: [
//       { weight: '400', style: 'normal', displayName: 'Regular' },
//     ]
//   },
//   {
//     family: 'Great Vibes',
//     category: 'handwriting',
//     variants: [
//       { weight: '400', style: 'normal', displayName: 'Regular' },
//     ]
//   },
//   {
//     family: 'Kaushan Script',
//     category: 'handwriting',
//     variants: [
//       { weight: '400', style: 'normal', displayName: 'Regular' },
//     ]
//   },
//   {
//     family: 'Satisfy',
//     category: 'handwriting',
//     variants: [
//       { weight: '400', style: 'normal', displayName: 'Regular' },
//     ]
//   },
//   {
//     family: 'Caveat',
//     category: 'handwriting',
//     variants: [
//       { weight: '400', style: 'normal', displayName: 'Regular' },
//       { weight: '500', style: 'normal', displayName: 'Medium' },
//       { weight: '700', style: 'normal', displayName: 'Bold' },
//     ]
//   },
//   {
//     family: 'Amatic SC',
//     category: 'handwriting',
//     variants: [
//       { weight: '400', style: 'normal', displayName: 'Regular' },
//       { weight: '700', style: 'normal', displayName: 'Bold' },
//     ]
//   },
//   {
//     family: 'Sacramento',
//     category: 'handwriting',
//     variants: [
//       { weight: '400', style: 'normal', displayName: 'Regular' },
//     ]
//   },
//   // Display
//   {
//     family: 'Oswald',
//     category: 'display',
//     variants: [
//       { weight: '300', style: 'normal', displayName: 'Light' },
//       { weight: '400', style: 'normal', displayName: 'Regular' },
//       { weight: '500', style: 'normal', displayName: 'Medium' },
//       { weight: '700', style: 'normal', displayName: 'Bold' },
//     ]
//   },
//   {
//     family: 'Bebas Neue',
//     category: 'display',
//     variants: [
//       { weight: '400', style: 'normal', displayName: 'Regular' },
//     ]
//   },
//   {
//     family: 'Abril Fatface',
//     category: 'display',
//     variants: [
//       { weight: '400', style: 'normal', displayName: 'Regular' },
//     ]
//   },
//   {
//     family: 'Fredoka One',
//     category: 'display',
//     variants: [
//       { weight: '400', style: 'normal', displayName: 'Regular' },
//     ]
//   },
//   {
//     family: 'Anton',
//     category: 'display',
//     variants: [
//       { weight: '400', style: 'normal', displayName: 'Regular' },
//     ]
//   },
//   {
//     family: 'Righteous',
//     category: 'display',
//     variants: [
//       { weight: '400', style: 'normal', displayName: 'Regular' },
//     ]
//   },
//   {
//     family: 'Bungee',
//     category: 'display',
//     variants: [
//       { weight: '400', style: 'normal', displayName: 'Regular' },
//     ]
//   },
//   {
//     family: 'Orbitron',
//     category: 'display',
//     variants: [
//       { weight: '400', style: 'normal', displayName: 'Regular' },
//       { weight: '500', style: 'normal', displayName: 'Medium' },
//       { weight: '700', style: 'normal', displayName: 'Bold' },
//     ]
//   },
//   // Monospace
//   {
//     family: 'Roboto Mono',
//     category: 'monospace',
//     variants: [
//       { weight: '300', style: 'normal', displayName: 'Light' },
//       { weight: '400', style: 'normal', displayName: 'Regular' },
//       { weight: '500', style: 'normal', displayName: 'Medium' },
//       { weight: '700', style: 'normal', displayName: 'Bold' },
//       { weight: '300', style: 'italic', displayName: 'Light Italic' },
//       { weight: '400', style: 'italic', displayName: 'Regular Italic' },
//       { weight: '500', style: 'italic', displayName: 'Medium Italic' },
//       { weight: '700', style: 'italic', displayName: 'Bold Italic' },
//     ]
//   },
//   {
//     family: 'Source Code Pro',
//     category: 'monospace',
//     variants: [
//       { weight: '300', style: 'normal', displayName: 'Light' },
//       { weight: '400', style: 'normal', displayName: 'Regular' },
//       { weight: '500', style: 'normal', displayName: 'Medium' },
//       { weight: '700', style: 'normal', displayName: 'Bold' },
//       { weight: '300', style: 'italic', displayName: 'Light Italic' },
//       { weight: '400', style: 'italic', displayName: 'Regular Italic' },
//       { weight: '500', style: 'italic', displayName: 'Medium Italic' },
//       { weight: '700', style: 'italic', displayName: 'Bold Italic' },
//     ]
//   },
//   {
//     family: 'JetBrains Mono',
//     category: 'monospace',
//     variants: [
//       { weight: '300', style: 'normal', displayName: 'Light' },
//       { weight: '400', style: 'normal', displayName: 'Regular' },
//       { weight: '500', style: 'normal', displayName: 'Medium' },
//       { weight: '700', style: 'normal', displayName: 'Bold' },
//       { weight: '300', style: 'italic', displayName: 'Light Italic' },
//       { weight: '400', style: 'italic', displayName: 'Regular Italic' },
//       { weight: '500', style: 'italic', displayName: 'Medium Italic' },
//       { weight: '700', style: 'italic', displayName: 'Bold Italic' },
//     ]
//   },
//   {
//     family: 'Fira Code',
//     category: 'monospace',
//     variants: [
//       { weight: '300', style: 'normal', displayName: 'Light' },
//       { weight: '400', style: 'normal', displayName: 'Regular' },
//       { weight: '500', style: 'normal', displayName: 'Medium' },
//       { weight: '700', style: 'normal', displayName: 'Bold' },
//     ]
//   },
// ];

// Font loading utilities

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
    ]
  },
  {
    family: 'Alumni Sans',
    category: 'sans-serif',
    variants: [
      { weight: '400', style: 'normal', displayName: 'Regular' },
      { weight: '700', style: 'normal', displayName: 'Bold' },
    ]
  },
  {
    family: 'Exo',
    category: 'sans-serif',
    variants: [
      { weight: '300', style: 'normal', displayName: 'Light' },
      { weight: '400', style: 'normal', displayName: 'Regular' },
      { weight: '700', style: 'normal', displayName: 'Bold' },
    ]
  },
  {
    family: 'Goldman',
    category: 'sans-serif',
    variants: [
      { weight: '400', style: 'normal', displayName: 'Regular' },
      { weight: '700', style: 'normal', displayName: 'Bold' },
    ]
  },
  {
    family: 'Lato',
    category: 'sans-serif',
    variants: [
      { weight: '300', style: 'normal', displayName: 'Light' },
      { weight: '400', style: 'normal', displayName: 'Regular' },
      { weight: '700', style: 'normal', displayName: 'Bold' },
    ]
  },
  {
    family: 'Michroma',
    category: 'sans-serif',
    variants: [
      { weight: '400', style: 'normal', displayName: 'Regular' },
    ]
  },
  {
    family: 'Montserrat',
    category: 'sans-serif',
    variants: [
      { weight: '300', style: 'normal', displayName: 'Light' },
      { weight: '400', style: 'normal', displayName: 'Regular' },
      { weight: '700', style: 'normal', displayName: 'Bold' },
      { weight: '400', style: 'italic', displayName: 'Regular Italic' },
    ]
  },
  {
    family: 'Orbitron',
    category: 'sans-serif',
    variants: [
      { weight: '400', style: 'normal', displayName: 'Regular' },
      { weight: '700', style: 'normal', displayName: 'Bold' },
    ]
  },
  {
    family: 'Roboto Condensed',
    category: 'sans-serif',
    variants: [
      { weight: '300', style: 'normal', displayName: 'Light' },
      { weight: '400', style: 'normal', displayName: 'Regular' },
      { weight: '700', style: 'normal', displayName: 'Bold' },
      { weight: '400', style: 'italic', displayName: 'Regular Italic' },
    ]
  },
  {
    family: 'Savate',
    category: 'sans-serif',
    variants: [
      { weight: '400', style: 'normal', displayName: 'Regular' },
    ]
  },
  {
    family: 'Smooch Sans',
    category: 'sans-serif',
    variants: [
      { weight: '300', style: 'normal', displayName: 'Light' },
      { weight: '400', style: 'normal', displayName: 'Regular' },
      { weight: '700', style: 'normal', displayName: 'Bold' },
    ]
  },
  {
    family: 'Squada One',
    category: 'sans-serif',
    variants: [
      { weight: '400', style: 'normal', displayName: 'Regular' },
    ]
  },
  {
    family: 'Titillium Web',
    category: 'sans-serif',
    variants: [
      { weight: '300', style: 'normal', displayName: 'Light' },
      { weight: '400', style: 'normal', displayName: 'Regular' },
      { weight: '700', style: 'normal', displayName: 'Bold' },
    ]
  },

  // Serif
  {
    family: 'Bodoni Moda',
    category: 'serif',
    variants: [
      { weight: '400', style: 'normal', displayName: 'Regular' },
      { weight: '700', style: 'normal', displayName: 'Bold' },
    ]
  },
  {
    family: 'Cinzel',
    category: 'serif',
    variants: [
      { weight: '400', style: 'normal', displayName: 'Regular' },
      { weight: '700', style: 'normal', displayName: 'Bold' },
    ]
  },
  {
    family: 'Marcellus',
    category: 'serif',
    variants: [
      { weight: '400', style: 'normal', displayName: 'Regular' },
    ]
  },
  {
    family: 'Source Serif 4',
    category: 'serif',
    variants: [
      { weight: '300', style: 'normal', displayName: 'Light' },
      { weight: '400', style: 'normal', displayName: 'Regular' },
      { weight: '700', style: 'normal', displayName: 'Bold' },
    ]
  },
  {
    family: 'Zilla Slab',
    category: 'serif',
    variants: [
      { weight: '300', style: 'normal', displayName: 'Light' },
      { weight: '400', style: 'normal', displayName: 'Regular' },
      { weight: '700', style: 'normal', displayName: 'Bold' },
    ]
  },

  // Script/Handwriting
  {
    family: 'Alex Brush',
    category: 'handwriting',
    variants: [
      { weight: '400', style: 'normal', displayName: 'Regular' },
    ]
  },
  {
    family: 'Allison',
    category: 'handwriting',
    variants: [
      { weight: '400', style: 'normal', displayName: 'Regular' },
    ]
  },
  {
    family: 'Allura',
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
      { weight: '700', style: 'normal', displayName: 'Bold' },
    ]
  },
  {
    family: 'Courgette',
    category: 'handwriting',
    variants: [
      { weight: '400', style: 'normal', displayName: 'Regular' },
    ]
  },
  {
    family: 'Damion',
    category: 'handwriting',
    variants: [
      { weight: '400', style: 'normal', displayName: 'Regular' },
    ]
  },
  {
    family: 'Dancing Script',
    category: 'handwriting',
    variants: [
      { weight: '400', style: 'normal', displayName: 'Regular' },
      { weight: '700', style: 'normal', displayName: 'Bold' },
    ]
  },
  {
    family: 'Edu QLD Hand',
    category: 'handwriting',
    variants: [
      { weight: '400', style: 'normal', displayName: 'Regular' },
      { weight: '700', style: 'normal', displayName: 'Bold' },
    ]
  },
  {
    family: 'Edu VIC WA NT Hand',
    category: 'handwriting',
    variants: [
      { weight: '400', style: 'normal', displayName: 'Regular' },
      { weight: '700', style: 'normal', displayName: 'Bold' },
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
    family: 'Homemade Apple',
    category: 'handwriting',
    variants: [
      { weight: '400', style: 'normal', displayName: 'Regular' },
    ]
  },
  {
    family: 'Indie Flower',
    category: 'handwriting',
    variants: [
      { weight: '400', style: 'normal', displayName: 'Regular' },
    ]
  },
  {
    family: 'Just Another Hand',
    category: 'handwriting',
    variants: [
      { weight: '400', style: 'normal', displayName: 'Regular' },
    ]
  },
  {
    family: 'Leckerli One',
    category: 'handwriting',
    variants: [
      { weight: '400', style: 'normal', displayName: 'Regular' },
    ]
  },
  {
    family: 'Lobster Two',
    category: 'handwriting',
    variants: [
      { weight: '400', style: 'normal', displayName: 'Regular' },
      { weight: '700', style: 'normal', displayName: 'Bold' },
    ]
  },
  {
    family: 'Marck Script',
    category: 'handwriting',
    variants: [
      { weight: '400', style: 'normal', displayName: 'Regular' },
    ]
  },
  {
    family: 'Mr Dafoe',
    category: 'handwriting',
    variants: [
      { weight: '400', style: 'normal', displayName: 'Regular' },
    ]
  },
  {
    family: 'Mrs Saint Delafield',
    category: 'handwriting',
    variants: [
      { weight: '400', style: 'normal', displayName: 'Regular' },
    ]
  },
  {
    family: 'My Soul',
    category: 'handwriting',
    variants: [
      { weight: '400', style: 'normal', displayName: 'Regular' },
    ]
  },
  {
    family: 'Nothing You Could Do',
    category: 'handwriting',
    variants: [
      { weight: '400', style: 'normal', displayName: 'Regular' },
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
    family: 'Parisienne',
    category: 'handwriting',
    variants: [
      { weight: '400', style: 'normal', displayName: 'Regular' },
    ]
  },
  {
    family: 'Permanent Marker',
    category: 'handwriting',
    variants: [
      { weight: '400', style: 'normal', displayName: 'Regular' },
    ]
  },
  {
    family: 'Pinyon Script',
    category: 'handwriting',
    variants: [
      { weight: '400', style: 'normal', displayName: 'Regular' },
    ]
  },
  {
    family: 'Reenie Beanie',
    category: 'handwriting',
    variants: [
      { weight: '400', style: 'normal', displayName: 'Regular' },
    ]
  },
  {
    family: 'Rock Salt',
    category: 'handwriting',
    variants: [
      { weight: '400', style: 'normal', displayName: 'Regular' },
    ]
  },
  {
    family: 'Sacramento',
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
    family: 'Shadows Into Light',
    category: 'handwriting',
    variants: [
      { weight: '400', style: 'normal', displayName: 'Regular' },
    ]
  },
  {
    family: 'Tangerine',
    category: 'handwriting',
    variants: [
      { weight: '400', style: 'normal', displayName: 'Regular' },
      { weight: '700', style: 'normal', displayName: 'Bold' },
    ]
  },
  {
    family: 'Winky Rough',
    category: 'handwriting',
    variants: [
      { weight: '400', style: 'normal', displayName: 'Regular' },
    ]
  },
  {
    family: 'Zeyada',
    category: 'handwriting',
    variants: [
      { weight: '400', style: 'normal', displayName: 'Regular' },
    ]
  },

  // Display
  {
    family: 'Allerta Stencil',
    category: 'display',
    variants: [
      { weight: '400', style: 'normal', displayName: 'Regular' },
    ]
  },
  {
    family: 'Berkshire Swash',
    category: 'display',
    variants: [
      { weight: '400', style: 'normal', displayName: 'Regular' },
    ]
  },
  {
    family: 'Bitcount Prop Single',
    category: 'display',
    variants: [
      { weight: '400', style: 'normal', displayName: 'Regular' },
    ]
  },
  {
    family: 'Bungee Inline',
    category: 'display',
    variants: [
      { weight: '400', style: 'normal', displayName: 'Regular' },
    ]
  },
  {
    family: 'Bungee Tint',
    category: 'display',
    variants: [
      { weight: '400', style: 'normal', displayName: 'Regular' },
    ]
  },
  {
    family: 'Caesar Dressing',
    category: 'display',
    variants: [
      { weight: '400', style: 'normal', displayName: 'Regular' },
    ]
  },
  {
    family: 'Creepster',
    category: 'display',
    variants: [
      { weight: '400', style: 'normal', displayName: 'Regular' },
    ]
  },
  {
    family: 'Exile',
    category: 'display',
    variants: [
      { weight: '400', style: 'normal', displayName: 'Regular' },
    ]
  },
  {
    family: 'Fredericka the Great',
    category: 'display',
    variants: [
      { weight: '400', style: 'normal', displayName: 'Regular' },
    ]
  },
  {
    family: 'Gloria Hallelujah',
    category: 'display',
    variants: [
      { weight: '400', style: 'normal', displayName: 'Regular' },
    ]
  },
  {
    family: 'Gravitas One',
    category: 'display',
    variants: [
      { weight: '400', style: 'normal', displayName: 'Regular' },
    ]
  },
  {
    family: 'Manufacturing Consent',
    category: 'display',
    variants: [
      { weight: '400', style: 'normal', displayName: 'Regular' },
    ]
  },
  {
    family: 'Monoton',
    category: 'display',
    variants: [
      { weight: '400', style: 'normal', displayName: 'Regular' },
    ]
  },
  {
    family: 'Protest Revolution',
    category: 'display',
    variants: [
      { weight: '400', style: 'normal', displayName: 'Regular' },
    ]
  },
  {
    family: 'Rubik Moon Rocks',
    category: 'display',
    variants: [
      { weight: '400', style: 'normal', displayName: 'Regular' },
    ]
  },
  {
    family: 'Rye',
    category: 'display',
    variants: [
      { weight: '400', style: 'normal', displayName: 'Regular' },
    ]
  },
  {
    family: 'Special Gothic Expanded One',
    category: 'display',
    variants: [
      { weight: '400', style: 'normal', displayName: 'Regular' },
    ]
  },

  // Monospace
  {
    family: 'Libertinus Mono',
    category: 'monospace',
    variants: [
      { weight: '400', style: 'normal', displayName: 'Regular' },
    ]
  },
  {
    family: 'Rubik Mono One',
    category: 'monospace',
    variants: [
      { weight: '400', style: 'normal', displayName: 'Regular' },
    ]
  },
];

const loadedFonts = new Set<string>();

export const loadGoogleFont = (family: string, variants: FontVariant[]): Promise<void> => {
  return new Promise((resolve, reject) => {
    const fontKey = family; // Simplified key
    
    if (loadedFonts.has(fontKey)) {
      resolve();
      return;
    }

    // Build a simple URL with proper encoding
    const familyName = family.replace(/\s+/g, '+');
    const fontUrl = `https://fonts.googleapis.com/css2?family=${familyName}:wght@400;700&display=swap`;
    
    console.log('Loading font URL:', fontUrl); // Debug log
    
    // Create link element
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = fontUrl;
    
    link.onload = () => {
      console.log('Font loaded successfully:', family); // Debug log
      loadedFonts.add(fontKey);
      resolve();
    };
    
    link.onerror = (error) => {
      console.error('Font load error for:', family, error); // Debug log
      reject(new Error(`Failed to load font: ${family}`));
    };

    document.head.appendChild(link);
  });
};

export const getFontFamilyString = (family: string): string => {
  return `"${family}", sans-serif`;
};