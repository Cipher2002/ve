import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Helper function to format timestamp to project_id
function formatTimestampToProjectId(timestamp: string): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

export async function POST(request: NextRequest) {
  try {
    const { uid, projectName, type, data, timestamp } = await request.json();

    if (!uid || !projectName || !type || !data) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create the user directory path
    const userBasePath = path.join('/home/zanopyai/htdocs/data/video_editor_data', uid);
    fs.mkdirSync(userBasePath, { recursive: true });

    // Load or create projects_id_list.json
    const projectsListPath = path.join(userBasePath, 'projects_id_list.json');
    let projectsList: any = {};

    if (fs.existsSync(projectsListPath)) {
      const projectsListContent = fs.readFileSync(projectsListPath, 'utf-8');
      projectsList = JSON.parse(projectsListContent);
    }

    let projectId: string;
    let userFolderPath: string;

    if (type === 'project') {
      // Check if project name already exists
      const existingProject = Object.values(projectsList).find((project: any) => 
        project.project_name === projectName
      );
      
      if (existingProject) {
        return NextResponse.json(
          { error: 'Project name already exists' },
          { status: 400 }
        );
      }

      // Generate new project_id
      projectId = formatTimestampToProjectId(timestamp);
      
      // Add to projects list
      projectsList[projectId] = {
        project_id: projectId,
        project_name: projectName,
        time_created_at: timestamp
      };

      // Save updated projects list
      fs.writeFileSync(projectsListPath, JSON.stringify(projectsList, null, 2));
      
      // Create folder structure: /home/zanopyai/htdocs/data/video_editor_data/{uid}/{project_id}
      userFolderPath = path.join(userBasePath, projectId);
    } else if (type === 'render') {
      // Look up project_id by projectName
      const existingProject = Object.values(projectsList).find((project: any) => 
        project.project_name === projectName
      );
      
      if (!existingProject) {
        return NextResponse.json(
          { error: 'Project not found for render operation' },
          { status: 404 }
        );
      }
      
      projectId = (existingProject as any).project_id;
      userFolderPath = path.join(userBasePath, projectId);
    } else {
      return NextResponse.json(
        { error: 'Invalid type' },
        { status: 400 }
      );
    }
    
    // Ensure the directory exists
    fs.mkdirSync(userFolderPath, { recursive: true });

    // Update or create project index file
    const indexPath = path.join(userFolderPath, 'project-index.json');
    let projectIndex: any = {};
    let isUpdate = false;

    if (fs.existsSync(indexPath)) {
      const indexContent = fs.readFileSync(indexPath, 'utf-8');
      projectIndex = JSON.parse(indexContent);
      isUpdate = true;
    } else {
      projectIndex = {
        uid,
        projectName,
        createdAt: timestamp,
        status: 'active',
        saves: [],
        renders: [],
      };
    }

    let fileName: string;
    let fileData: any;

    if (type === 'project') {
      // For project saves, remove old saves to avoid duplicates
      const existingSaves = projectIndex.saves || [];
      
      // Remove old save files
      existingSaves.forEach((save: any) => {
        if (save.fileName) {
          const oldSaveFile = path.join(userFolderPath, save.fileName);
          if (fs.existsSync(oldSaveFile)) {
            try {
              fs.unlinkSync(oldSaveFile);
            } catch (error) {
              console.error('Error removing old save file:', error);
            }
          }
        }
      });
      
      // Clear old saves from index
      projectIndex.saves = [];
      
      fileName = `project-${Date.now()}.json`;
      fileData = {
        ...data,
        uid,
        projectName,
        savedAt: timestamp,
      };
    } else if (type === 'render') {
      fileName = `${data.renderId}.${data.format}`;
      fileData = {
        ...data,
        uid,
        projectName,
        renderedAt: timestamp,
      };
    } else {
      return NextResponse.json(
        { error: 'Invalid type' },
        { status: 400 }
      );
    }

    // Write the file
    const filePath = path.join(userFolderPath, fileName);
    fs.writeFileSync(filePath, JSON.stringify(fileData, null, 2));

    // Update the index
    projectIndex.lastUpdated = timestamp;
    
    if (type === 'project') {
      projectIndex.saves.push({
        fileName,
        timestamp,
        ...data,
      });
      projectIndex.lastSaved = timestamp;
    } else if (type === 'render') {
      projectIndex.renders.push({
        fileName,
        timestamp,
        status: data.status,
        url: data.url,
        error: data.error,
        fileSize: data.fileSize,
        renderId: data.renderId,
        format: data.format,
        mediaType: data.mediaType || 'video',
      });
      projectIndex.lastRender = timestamp;
    }

    // Write updated index
    fs.writeFileSync(indexPath, JSON.stringify(projectIndex, null, 2));

    return NextResponse.json({
      success: true,
      filePath: fileName,
      projectPath: userFolderPath,
      isUpdate,
    });

  } catch (error) {
    console.error('Error saving to user folder:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}