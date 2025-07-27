import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { uid, oldName, newName, projectId } = await request.json();

    if (!uid || !oldName || !newName || !projectId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Sanitize the new name (remove invalid characters for folder names)
    const sanitizedNewName = newName.replace(/[<>:"/\\|?*]/g, '').trim();
    
    if (!sanitizedNewName) {
      return NextResponse.json(
        { error: 'Invalid project name' },
        { status: 400 }
      );
    }

    const userFolderPath = path.join(process.cwd(), 'users', uid);
    const oldProjectPath = path.join(userFolderPath, oldName);
    const newProjectPath = path.join(userFolderPath, sanitizedNewName);

    // Check if old project folder exists
    if (!fs.existsSync(oldProjectPath)) {
      return NextResponse.json(
        { error: 'Project folder not found' },
        { status: 404 }
      );
    }

    // Check if new name already exists (and it's not the same folder)
    if (fs.existsSync(newProjectPath) && oldProjectPath !== newProjectPath) {
      return NextResponse.json(
        { error: 'Project with this name already exists' },
        { status: 409 }
      );
    }

    // Rename the folder if names are different
    if (oldProjectPath !== newProjectPath) {
      fs.renameSync(oldProjectPath, newProjectPath);
    }

    // Update the project index file
    const indexPath = path.join(newProjectPath, 'project-index.json');
    if (fs.existsSync(indexPath)) {
      const indexContent = fs.readFileSync(indexPath, 'utf-8');
      const projectIndex = JSON.parse(indexContent);
      
      // Update project name in index
      projectIndex.projectName = sanitizedNewName;
      projectIndex.lastUpdated = new Date().toISOString();
      
      // Write updated index
      fs.writeFileSync(indexPath, JSON.stringify(projectIndex, null, 2));
    }

    return NextResponse.json({
      success: true,
      oldName,
      newName: sanitizedNewName,
      message: 'Project name updated successfully',
    });

  } catch (error) {
    console.error('Error updating project name:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}