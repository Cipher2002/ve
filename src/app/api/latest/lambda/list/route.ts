import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";

//SETTING THE API BASE URL
const apiBaseUrl = 'https://zanopy.ai/vedit/api/latest';

export async function GET(request: NextRequest) {
  try {
    // Get UID from query parameters
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid') || 'default-user';

    // Search in user's directory instead of public
    const userDir = path.join("/home/zanopyai/htdocs/data/video_editor_data", uid);
    
    // Check if user directory exists
    if (!fs.existsSync(userDir)) {
      return NextResponse.json([]);
    }

    const videos: any[] = [];
    const supportedExtensions = ['.mp4', '.mov', '.mkv', '.gif', '.webm', '.wav', '.mp3', '.aac'];

    try {
      // Get all project folders for this user
      const projectFolders = fs.readdirSync(userDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

      // Search through all project folders
      for (const projectFolder of projectFolders) {
        const projectPath = path.join(userDir, projectFolder);
        
        // Get all files in the project folder
        const files = fs.readdirSync(projectPath, { withFileTypes: true })
          .filter(dirent => dirent.isFile())
          .map(dirent => dirent.name);

        // Filter for supported video/audio files
        const mediaFiles = files.filter(file => 
          supportedExtensions.some(ext => file.toLowerCase().endsWith(ext))
        );

        // Add each media file to the videos array
        for (const filename of mediaFiles) {
          const filePath = path.join(projectPath, filename);
          const stats = fs.statSync(filePath);
          
          // Extract render ID from filename (remove extension)
          const renderId = path.parse(filename).name;
          
          videos.push({
            id: renderId,
            filename: filename,
            url: `${apiBaseUrl}/user-files/${uid}/${projectFolder}/${filename}`,
            thumbnail: null, // You can implement thumbnail generation if needed
            size: stats.size,
            createdAt: stats.birthtime.toISOString(),
            modifiedAt: stats.mtime.toISOString(),
            projectName: projectFolder, // Include project name for reference
          });
        }
      }

      // Sort by creation date (newest first)
      videos.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      return NextResponse.json(videos);
    } catch (error) {
      console.error('Error reading user directories:', error);
      return NextResponse.json([]);
    }
  } catch (error) {
    console.error('Error in list API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}