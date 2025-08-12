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

    const userBasePath = path.join('/home/zanopyai/htdocs/data/video_editor_data', uid);
    const projectsListPath = path.join(userBasePath, 'projects_id_list.json');
    
    if (!fs.existsSync(projectsListPath)) {
      return NextResponse.json(
        { error: 'No projects found for this user' },
        { status: 404 }
      );
    }

    const projectsListContent = fs.readFileSync(projectsListPath, 'utf-8');
    let projectsList = JSON.parse(projectsListContent);
    
    // Find project entry by projectId
    if (!projectsList[projectId]) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }
    
    // Check if new name already exists in any project
    const existingProject = Object.values(projectsList).find((project: any) => 
      project.project_name === sanitizedNewName && project.project_id !== projectId
    );
    
    if (existingProject) {
      return NextResponse.json(
        { error: 'Project with this name already exists' },
        { status: 409 }
      );
    }
    
    const oldProjectPath = path.join(userBasePath, projectId, oldName);
    const newProjectPath = path.join(userBasePath, projectId, sanitizedNewName);

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

    // Update projects_id_list.json
    projectsList[projectId].project_name = sanitizedNewName;
    fs.writeFileSync(projectsListPath, JSON.stringify(projectsList, null, 2));

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