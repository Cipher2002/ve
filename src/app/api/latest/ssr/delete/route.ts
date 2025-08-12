import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";

export async function POST(request: NextRequest) {
  try {
    const { videoId, uid } = await request.json();

    if (!videoId || !uid) {
      return NextResponse.json({ error: 'Video ID and UID are required' }, { status: 400 });
    }

    // Search for the file in user's directories
    const userDir = path.join(process.cwd(), "users", uid);
    
    if (!fs.existsSync(userDir)) {
      return NextResponse.json({ error: 'User directory not found' }, { status: 404 });
    }

    let fileDeleted = false;
    const supportedExtensions = ['.mp4', '.mov', '.mkv', '.gif', '.webm', '.wav', '.mp3', '.aac'];

    try {
      // Get all project folders for this user
      const projectFolders = fs.readdirSync(userDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

      // Search through all project folders for the file
      for (const projectFolder of projectFolders) {
        const projectPath = path.join(userDir, projectFolder);
        
        // Check each possible extension
        for (const ext of supportedExtensions) {
          const filePath = path.join(projectPath, `${videoId}${ext}`);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            fileDeleted = true;
            break;
          }
        }
        
        if (fileDeleted) break;
      }

      if (fileDeleted) {
        return NextResponse.json({ success: true, message: 'Video deleted successfully' });
      } else {
        return NextResponse.json({ error: 'Video not found' }, { status: 404 });
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      return NextResponse.json({ error: 'Failed to delete video' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in delete API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}