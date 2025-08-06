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
    const userDir = path.join(process.cwd(), "users", uid);
    
    // Check if user directory exists
    if (!fs.existsSync(userDir)) {
      return NextResponse.json([]);
    }

    const audioFiles: any[] = [];
    const supportedExtensions = ['.wav', '.mp3', '.aac'];

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

        // Filter for supported audio files
        const audioFilesList = files.filter(file => 
          supportedExtensions.some(ext => file.toLowerCase().endsWith(ext))
        );

        // Add each audio file to the audioFiles array
        for (const filename of audioFilesList) {
          const filePath = path.join(projectPath, filename);
          const stats = fs.statSync(filePath);
          
          // Extract render ID from filename (remove extension)
          const renderId = path.parse(filename).name;
          
          audioFiles.push({
            id: renderId,
            filename: filename,
            url: `${apiBaseUrl}/user-files/${uid}/${projectFolder}/${filename}`,
            size: stats.size,
            createdAt: stats.birthtime.toISOString(),
            modifiedAt: stats.mtime.toISOString(),
            projectName: projectFolder, // Include project name for reference
          });
        }
      }

      // Sort by creation date (newest first)
      audioFiles.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      return NextResponse.json(audioFiles);
    } catch (error) {
      console.error('Error reading user directories:', error);
      return NextResponse.json([]);
    }
  } catch (error) {
    console.error('Error in rendered-audio API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}