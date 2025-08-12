import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');
    const projectName = searchParams.get('projectName');

    if (!uid || !projectName) {
      return NextResponse.json(
        { error: 'UID and projectName are required' },
        { status: 400 }
      );
    }

    // Load projects_id_list.json to find project_id
    const userBasePath = path.join('/home/zanopyai/htdocs/data/video_editor_data', uid);
    const projectsListPath = path.join(userBasePath, 'projects_id_list.json');
    
    if (!fs.existsSync(projectsListPath)) {
      return NextResponse.json(
        { error: 'No projects found for this user' },
        { status: 404 }
      );
    }

    const projectsListContent = fs.readFileSync(projectsListPath, 'utf-8');
    const projectsList = JSON.parse(projectsListContent);
    
    // Find project_id by projectName
    const projectEntry = Object.values(projectsList).find((project: any) => 
      project.project_name === projectName
    );
    
    if (!projectEntry) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }
    
    const projectId = (projectEntry as any).project_id;
    const userFolderPath = path.join(userBasePath, projectId, projectName);
    const indexPath = path.join(userFolderPath, 'project-index.json');

    // Check if project index exists
    if (!fs.existsSync(indexPath)) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Read the project index
    const indexContent = fs.readFileSync(indexPath, 'utf-8');
    const projectIndex = JSON.parse(indexContent);

    // Get the latest save file
    if (projectIndex.saves && projectIndex.saves.length > 0) {
      const latestSave = projectIndex.saves[projectIndex.saves.length - 1];
      const saveFilePath = path.join(userFolderPath, latestSave.fileName);
      
      if (fs.existsSync(saveFilePath)) {
        const saveContent = fs.readFileSync(saveFilePath, 'utf-8');
        const projectData = JSON.parse(saveContent);

        return NextResponse.json({
          success: true,
          projectData: projectData,
          projectInfo: {
            name: projectIndex.projectName,
            uid: projectIndex.uid,
            createdAt: projectIndex.createdAt,
            lastSaved: projectIndex.lastSaved,
            lastUpdated: projectIndex.lastUpdated,
            saveCount: projectIndex.saves.length,
            renderCount: (projectIndex.renders || []).length,
          }
        });
      }
    }

    return NextResponse.json(
      { error: 'No project data found' },
      { status: 404 }
    );

  } catch (error) {
    console.error('Error fetching project data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}