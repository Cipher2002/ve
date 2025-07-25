import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";

export async function GET() {
  try {
    const renderedAudioDir = path.join(process.cwd(), "public", "rendered-audio");
    
    // Check if directory exists
    if (!fs.existsSync(renderedAudioDir)) {
      return NextResponse.json([]);
    }

    // Read all files in the directory
    const files = fs.readdirSync(renderedAudioDir);
    
    // Define supported audio extensions
    const audioExtensions = ['.wav', '.mp3', '.aac'];
    
    // Filter audio files and get their stats
    const audioFiles = files
      .filter(file => audioExtensions.some(ext => file.endsWith(ext)))
      .map(file => {
        const filePath = path.join(renderedAudioDir, file);
        const stats = fs.statSync(filePath);
        
        // Extract filename without extension
        const extension = path.extname(file);
        const id = file.replace(extension, '');
        
        return {
            id,
            filename: file,
            url: `/rendered-audio/${file}`,
            size: stats.size,
            createdAt: stats.birthtime.toISOString(),
            modifiedAt: stats.mtime.toISOString(),
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); // Sort by newest first

    return NextResponse.json(audioFiles);
  } catch (error) {
    console.error("Error listing rendered audio:", error);
    return NextResponse.json({ error: "Failed to list rendered audio" }, { status: 500 });
  }
}