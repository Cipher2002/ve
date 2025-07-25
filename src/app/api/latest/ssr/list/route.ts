import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";

export async function GET() {
  try {
    const renderedVideosDir = path.join(process.cwd(), "public", "rendered-videos");
    
    // Check if directory exists
    if (!fs.existsSync(renderedVideosDir)) {
      return NextResponse.json([]);
    }

    // Read all files in the directory
    const files = fs.readdirSync(renderedVideosDir);
    
    // Define supported video extensions
    const videoExtensions = ['.mp4', '.mov', '.mkv', '.gif', '.webm'];
    
    // Filter video files and get their stats
    const videoFiles = files
      .filter(file => videoExtensions.some(ext => file.endsWith(ext)))
      .map(file => {
        const filePath = path.join(renderedVideosDir, file);
        const stats = fs.statSync(filePath);
        
        // Extract filename without extension
        const extension = path.extname(file);
        const id = file.replace(extension, '');
        
        return {
            id,
            filename: file,
            url: `/rendered-videos/${file}`,
            thumbnail: null, // Will be generated client-side
            size: stats.size,
            createdAt: stats.birthtime.toISOString(),
            modifiedAt: stats.mtime.toISOString(),
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); // Sort by newest first

    return NextResponse.json(videoFiles);
  } catch (error) {
    console.error("Error listing rendered videos:", error);
    return NextResponse.json({ error: "Failed to list rendered videos" }, { status: 500 });
  }
}