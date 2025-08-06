import os
import re

def format_font_name(filename):
    """Convert filename to a readable font name"""
    # Remove file extension
    name = os.path.splitext(filename)[0]
    
    # Handle camelCase and PascalCase by adding spaces before uppercase letters
    name = re.sub(r'(?<=[a-z])(?=[A-Z])', ' ', name)
    
    # Replace hyphens and underscores with spaces
    name = re.sub(r'[-_]', ' ', name)
    
    # Remove common font weight and style indicators (case insensitive)
    weight_patterns = [
        r'\bregular\b', r'\bnormal\b', r'\b400\b',
        r'\bbold\b', r'\b700\b', r'\bsemibold\b', r'\b600\b',
        r'\blight\b', r'\b300\b', r'\bthin\b', r'\b100\b',
        r'\bmedium\b', r'\b500\b', r'\bextrabold\b', r'\b800\b',
        r'\bblack\b', r'\b900\b', r'\bitalic\b', r'\boblique\b',
        r'\bvariablefont\b', r'\bwght\b', r'\bopsz\b', r'\bslnt\b',
        r'\bcrsv\b', r'\belsh\b', r'\belxp\b', r'\bextralightitalic\b'
    ]
    
    for pattern in weight_patterns:
        name = re.sub(pattern, '', name, flags=re.IGNORECASE)
    
    # Clean up extra spaces
    name = re.sub(r'\s+', ' ', name).strip()
    
    # Capitalize each word properly
    name = ' '.join(word.capitalize() for word in name.split())
    
    return name

def generate_font_value(filename):
    """Generate font value in format font-custom-name"""
    # Remove file extension
    name = os.path.splitext(filename)[0]
    
    # Convert to lowercase first
    name = name.lower()
    
    # Replace any non-alphanumeric characters with hyphens
    value = re.sub(r'[^a-z0-9]', '-', name)
    
    # Remove multiple consecutive hyphens
    value = re.sub(r'-+', '-', value)
    
    # Remove leading/trailing hyphens
    value = value.strip('-')
    
    return f"font-custom-{value}"

def generate_css_font_family_name(filename):
    """Generate the CSS font-family name that matches Tailwind config"""
    # Remove file extension
    name = os.path.splitext(filename)[0]
    
    # Handle camelCase and PascalCase by adding spaces before uppercase letters
    name = re.sub(r'(?<=[a-z])(?=[A-Z])', ' ', name)
    
    # Replace hyphens and underscores with spaces
    name = re.sub(r'[-_]', ' ', name)
    
    # Remove common font weight and style indicators but preserve important parts
    weight_patterns = [
        r'\bregular\b', r'\bnormal\b', r'\b400\b',
        r'\bvariablefont\b', r'\bwght\b', r'\bopsz\b', r'\bslnt\b',
        r'\bcrsv\b', r'\belsh\b', r'\belxp\b'
    ]
    
    for pattern in weight_patterns:
        name = re.sub(pattern, '', name, flags=re.IGNORECASE)
    
    # Clean up extra spaces
    name = re.sub(r'\s+', ' ', name).strip()
    
    # Capitalize each word
    name = ' '.join(word.capitalize() for word in name.split())
    
    return name

def read_fonts_from_directory(directory_path):
    """Read fonts from directory and generate the JavaScript array format"""
    
    if not os.path.exists(directory_path):
        print(f"Directory {directory_path} does not exist!")
        return
    
    # Supported font file extensions
    font_extensions = {'.woff', '.woff2', '.ttf', '.otf', '.eot'}
    
    # Get all font files
    font_files = []
    for filename in os.listdir(directory_path):
        file_ext = os.path.splitext(filename)[1].lower()
        if file_ext in font_extensions:
            font_files.append(filename)
    
    if not font_files:
        print("No font files found in the directory!")
        return
    
    # Sort files alphabetically
    font_files.sort()
    
    print("=== JavaScript Array for fonts list ===")
    print("const fonts = [")
    print("  // Original fonts")
    print('  { value: "font-sans", label: "Inter (Sans-serif)" },')
    print('  { value: "font-serif", label: "Merriweather (Serif)" },')
    print('  { value: "font-mono", label: "Roboto Mono (Monospace)" },')
    print('  { value: "font-retro", label: "VT323" },')
    print('  { value: "font-league-spartan", label: "League Spartan" },')
    print('  { value: "font-bungee-inline", label: "Bungee Inline" },')
    print('  { value: "font-display", label: "Playfair Display" },')
    print('  { value: "font-handwriting", label: "Caveat" },')
    print('  { value: "font-futuristic", label: "Orbitron" },')
    print('  { value: "font-elegant", label: "Cormorant Garamond" },')
    print('  { value: "font-quirky", label: "Fredoka One" },')
    print()
    print("  // Custom fonts from public/fonts")
    
    for i, filename in enumerate(font_files):
        font_value = generate_font_value(filename)
        font_label = format_font_name(filename)
        
        # Add comma except for the last item
        comma = "," if i < len(font_files) - 1 else ""
        print(f'  {{ value: "{font_value}", label: "{font_label}" }}{comma}')
    
    print("];")
    print()
    
    print("=== Tailwind Config fontFamily entries ===")
    print("// Add these to your tailwind.config.ts fontFamily section:")
    for filename in font_files:
        font_value = generate_font_value(filename).replace("font-custom-", "")  # Remove prefix for Tailwind config
        css_family_name = generate_css_font_family_name(filename)
        print(f'"{font_value}": ["{css_family_name}", ...fontFamily.fontFamily.sans],')
    
    print()
    print("=== CSS @font-face declarations ===")
    print("// Add these to your globals.css:")
    for filename in font_files:
        css_family_name = generate_css_font_family_name(filename)
        font_weight = "normal"
        font_style = "normal"
        
        # Detect font weight and style from filename
        filename_lower = filename.lower()
        if any(weight in filename_lower for weight in ['bold', '700']):
            font_weight = "bold"
        elif any(weight in filename_lower for weight in ['thin', '100']):
            font_weight = "100"
        elif any(weight in filename_lower for weight in ['light', '300']):
            font_weight = "300"
        elif any(weight in filename_lower for weight in ['medium', '500']):
            font_weight = "500"
        elif any(weight in filename_lower for weight in ['semibold', '600']):
            font_weight = "600"
        elif any(weight in filename_lower for weight in ['extrabold', '800']):
            font_weight = "800"
        elif any(weight in filename_lower for weight in ['black', '900']):
            font_weight = "900"
        
        if 'italic' in filename_lower:
            font_style = "italic"
        
        # Determine format
        file_ext = os.path.splitext(filename)[1].lower()
        format_map = {
            '.ttf': 'truetype',
            '.otf': 'opentype',
            '.woff': 'woff',
            '.woff2': 'woff2',
            '.eot': 'embedded-opentype'
        }
        font_format = format_map.get(file_ext, 'truetype')
        
        print(f"""@font-face {{
  font-family: '{css_family_name}';
  src: url('/vedit/fonts/{filename}') format('{font_format}');
  font-weight: {font_weight};
  font-style: {font_style};
  font-display: swap;
}}
""")
    
    print(f"Found {len(font_files)} font files:")
    for filename in font_files:
        font_value = generate_font_value(filename)
        font_label = format_font_name(filename)
        css_name = generate_css_font_family_name(filename)
        print(f"  - {filename}")
        print(f"    → Value: {font_value}")
        print(f"    → Label: {font_label}")
        print(f"    → CSS Family: {css_name}")
        print()

# Main execution
if __name__ == "__main__":
    # Use the directory where this script is located (your fonts directory)
    fonts_directory = os.path.dirname(os.path.abspath(__file__))
    
    print(f"Scanning fonts directory: {fonts_directory}")
    print("-" * 50)
    
    read_fonts_from_directory(fonts_directory)