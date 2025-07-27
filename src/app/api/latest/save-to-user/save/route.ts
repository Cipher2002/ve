import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { uid, projectName, type, data, timestamp } = await request.json();

    if (!uid || !projectName || !type || !data) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create the folder structure: users/{uid}/{projectName}
    const userFolderPath = path.join(process.cwd(), 'users', uid, projectName);
    
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