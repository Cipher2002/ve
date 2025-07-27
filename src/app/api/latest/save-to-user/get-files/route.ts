import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');
    const projectId = searchParams.get('projectId');

    if (!uid || !projectId) {
      return NextResponse.json(
        { error: 'UID and projectId are required' },
        { status: 400 }
      );
    }

    // Extract project name from projectId (format: uid-projectName)
    const projectName = projectId.replace(`${uid}-`, '');
    const projectPath = path.join(process.cwd(), 'users', uid, projectName);

    if (!fs.existsSync(projectPath)) {
      return NextResponse.json({ files: [] });
    }

    const files: any[] = [];
    
    // Define supported media file extensions
    const videoExtensions = ['.mp4', '.mov', '.mkv', '.webm', '.avi', '.gif'];
    const audioExtensions = ['.mp3', '.wav', '.aac', '.m4a', '.ogg'];
    const mediaExtensions = [...videoExtensions, ...audioExtensions];

    // Read all files in the project directory
    const dirContents = fs.readdirSync(projectPath);
    
    for (const fileName of dirContents) {
      // Skip JSON files and directories
      if (fileName.endsWith('.json') || fileName === 'project-index.json') continue;
      
      const filePath = path.join(projectPath, fileName);
      const stats = fs.statSync(filePath);
      
      if (stats.isFile()) {
        const fileExtension = path.extname(fileName).toLowerCase();
        
        // Only include media files
        if (mediaExtensions.includes(fileExtension)) {
          const isVideo = videoExtensions.includes(fileExtension);
          const isAudio = audioExtensions.includes(fileExtension);
          
          files.push({
            fileName,
            timestamp: stats.mtime.toISOString(),
            type: isVideo ? 'video' : isAudio ? 'audio' : 'media',
            fileSize: stats.size,
            fileExtension: fileExtension.replace('.', ''),
            filePath: `/users/${uid}/${projectName}/${fileName}`, // Relative path for download
          });
        }
      }
    }

    // Also check if there's a project index with render info
    const indexPath = path.join(projectPath, 'project-index.json');
    if (fs.existsSync(indexPath)) {
      try {
        const indexContent = fs.readFileSync(indexPath, 'utf-8');
        const projectIndex = JSON.parse(indexContent);
        
        // Add renders from the index that might not be physical files yet
        if (projectIndex.renders && Array.isArray(projectIndex.renders)) {
          projectIndex.renders.forEach((render: any) => {
            // Check if this render file already exists in our files array
            const existingFile = files.find(f => f.fileName === render.fileName);
            if (!existingFile && render.fileName) {
              // Check if the file actually exists
              const renderFilePath = path.join(projectPath, render.fileName);
              if (fs.existsSync(renderFilePath)) {
                const stats = fs.statSync(renderFilePath);
                const fileExtension = path.extname(render.fileName).toLowerCase();
                const isVideo = videoExtensions.includes(fileExtension);
                const isAudio = audioExtensions.includes(fileExtension);
                
                files.push({
                  fileName: render.fileName,
                  timestamp: render.timestamp || stats.mtime.toISOString(),
                  type: isVideo ? 'video' : isAudio ? 'audio' : 'media',
                  fileSize: render.fileSize || stats.size,
                  fileExtension: fileExtension.replace('.', ''),
                  filePath: `/users/${uid}/${projectName}/${render.fileName}`,
                });
              }
            }
          });
        }
      } catch (error) {
        console.error('Error reading project index:', error);
      }
    }

    // Sort by timestamp (newest first)
    files.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Remove duplicates based on fileName
    const uniqueFiles = files.filter((file, index, self) => 
      index === self.findIndex(f => f.fileName === file.fileName)
    );

    return NextResponse.json({ files: uniqueFiles });

  } catch (error) {
    console.error('Error fetching project files:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}