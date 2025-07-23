import os
import re

def format_font_name(filename):
    """Convert filename to a readable font name"""
    # Remove file extension
    name = os.path.splitext(filename)[0]
    
    # Replace hyphens and underscores with spaces
    name = re.sub(r'[-_]', ' ', name)
    
    # Remove common font weight indicators
    name = re.sub(r'\b(regular|normal|400|bold|700|light|300|medium|500|semibold|600|extrabold|800|black|900)\b', '', name, flags=re.IGNORECASE)
    
    # Clean up extra spaces
    name = re.sub(r'\s+', ' ', name).strip()
    
    # Capitalize each word
    name = ' '.join(word.capitalize() for word in name.split())
    
    return name

def generate_font_value(filename):
    """Generate font value in format font-custom-name"""
    # Remove file extension
    name = os.path.splitext(filename)[0]
    
    # Convert to lowercase and replace spaces/special chars with hyphens
    value = re.sub(r'[^a-zA-Z0-9]', '-', name.lower())
    
    # Remove multiple consecutive hyphens
    value = re.sub(r'-+', '-', value)
    
    # Remove leading/trailing hyphens
    value = value.strip('-')
    
    return f"font-custom-{value}"

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
    
    # Generate the JavaScript array
    print("const [availableFonts, setAvailableFonts] = useState([")
    print("  // Default fonts as fallback")
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
    print('  { value: "font-geometric", label: "Montserrat" },')
    print('  { value: "font-fenix", label: "Fenix (Elegant Serif)" },')
    print('  { value: "font-butcherman", label: "Butcherman (Horror Style)" },')
    print('  { value: "font-fruktur", label: "Fruktur (Gothic/Blackletter)" },')
    print()
    print("  // Custom fonts from public/fonts")
    
    for i, filename in enumerate(font_files):
        font_value = generate_font_value(filename)
        font_label = format_font_name(filename)
        
        # Add comma except for the last item
        comma = "," if i < len(font_files) - 1 else ""
        print(f'  {{ value: "{font_value}", label: "{font_label}" }}{comma}')
    
    print("]);")
    print()
    print(f"Found {len(font_files)} font files:")
    for filename in font_files:
        print(f"  - {filename}")

# Main execution
if __name__ == "__main__":
    # You can change this path to match your fonts directory
    fonts_directory = os.path.dirname(os.path.abspath(__file__))

    
    # Alternative: Ask user for directory path
    # fonts_directory = input("Enter the path to your fonts directory: ").strip()
    
    read_fonts_from_directory(fonts_directory)