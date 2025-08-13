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

    const audioFiles: any[] = [];
    const supportedExtensions = ['.wav', '.mp3', '.aac'];

    try {
      // Load projects_id_list.json to get project information
      const projectsListPath = path.join(userDir, 'projects_id_list.json');
      
      if (!fs.existsSync(projectsListPath)) {
        return NextResponse.json([]);
      }

      const projectsListContent = fs.readFileSync(projectsListPath, 'utf-8');
      const projectsList = JSON.parse(projectsListContent);

      // Search through all project folders using project IDs
      for (const [projectId, projectInfo] of Object.entries(projectsList)) {
        const projectPath = path.join(userDir, projectId);
        
        // Check if project folder exists
        if (!fs.existsSync(projectPath)) {
          continue;
        }
        
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
            url: `${apiBaseUrl}/user-files/${uid}/${projectId}/${filename}`,
            size: stats.size,
            createdAt: stats.birthtime.toISOString(),
            modifiedAt: stats.mtime.toISOString(),
            projectName: (projectInfo as any).project_name, // Include project name for reference
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