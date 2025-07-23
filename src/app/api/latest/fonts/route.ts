import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const fontsPath = path.join(process.cwd(), "public", "fonts");
    
    if (!fs.existsSync(fontsPath)) {
      return NextResponse.json([]);
    }

    const fontFiles = fs.readdirSync(fontsPath)
      .filter(file => file.endsWith('.woff') || file.endsWith('.woff2') || file.endsWith('.ttf') || file.endsWith('.otf'))
      .map(file => {
        const name = file.replace(/\.[^/.]+$/, ""); // Remove extension
        const displayName = name.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()); // Format name
        return {
          value: `font-custom-${name.toLowerCase().replace(/\s+/g, '-')}`,
          label: displayName,
          file: `/fonts/${file}`
        };
      });

    return NextResponse.json(fontFiles);
  } catch (error) {
    console.error("Error reading fonts directory:", error);
    return NextResponse.json([]);
  }
}