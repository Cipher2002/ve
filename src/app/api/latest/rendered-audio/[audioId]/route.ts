import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ audioId: string }> }
) {
  try {
    const { audioId } = await params;
    const { uid } = await request.json();

    if (!audioId || !uid) {
      return NextResponse.json({ error: 'Audio ID and UID are required' }, { status: 400 });
    }

    // Search for the file in user's directories
    const userDir = path.join("/home/zanopyai/htdocs/data/video_editor_data", uid);
    
    if (!fs.existsSync(userDir)) {
      return NextResponse.json({ error: 'User directory not found' }, { status: 404 });
    }

    let fileDeleted = false;
    const supportedExtensions = ['.wav', '.mp3', '.aac'];

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
          const filePath = path.join(projectPath, `${audioId}${ext}`);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            fileDeleted = true;
            break;
          }
        }
        
        if (fileDeleted) break;
      }

      if (fileDeleted) {
        return NextResponse.json({ success: true, message: 'Audio deleted successfully' });
      } else {
        return NextResponse.json({ error: 'Audio file not found' }, { status: 404 });
      }
    } catch (error) {
      console.error('Error deleting audio file:', error);
      return NextResponse.json({ error: 'Failed to delete audio' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in delete audio API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}