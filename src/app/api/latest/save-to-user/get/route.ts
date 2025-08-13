import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');

    if (!uid) {
      return NextResponse.json(
        { error: 'UID is required' },
        { status: 400 }
      );
    }

    const userFolderPath = path.join('/home/zanopyai/htdocs/data/video_editor_data', uid);
    const projectsListPath = path.join(userFolderPath, 'projects_id_list.json');

    // Check if user folder exists
    if (!fs.existsSync(userFolderPath)) {
      return NextResponse.json({ projects: [] });
    }

    const projects: any[] = [];
    
    // Check if projects_id_list.json exists
    if (!fs.existsSync(projectsListPath)) {
      return NextResponse.json({ projects: [] });
    }

    // Read projects list
    const projectsListContent = fs.readFileSync(projectsListPath, 'utf-8');
    const projectsList = JSON.parse(projectsListContent);

    // Iterate through each project in the list
    for (const [projectId, projectInfo] of Object.entries(projectsList)) {
      const projectName = (projectInfo as any).project_name;
      const projectPath = path.join(userFolderPath, projectId);
      const indexPath = path.join(projectPath, 'project-index.json');

      if (fs.existsSync(indexPath)) {
        try {
          const indexContent = fs.readFileSync(indexPath, 'utf-8');
          const projectIndex = JSON.parse(indexContent);
          
          projects.push({
            id: projectId,
            name: projectIndex.projectName || projectName,
            uid: projectIndex.uid,
            status: projectIndex.status || 'active',
            createdAt: projectIndex.createdAt,
            lastUpdated: projectIndex.lastUpdated,
            lastSaved: projectIndex.lastSaved,
            lastRender: projectIndex.lastRender,
            saves: projectIndex.saves || [],
            renders: projectIndex.renders || [],
            saveCount: (projectIndex.saves || []).length,
            renderCount: (projectIndex.renders || []).length,
            folderPath: projectPath,
          });
        } catch (error) {
          console.error(`Error reading project index for ${projectName}:`, error);
        }
      }
    }

    // Sort projects by last updated (most recent first)
    projects.sort((a, b) => {
      const dateA = new Date(a.lastUpdated || a.createdAt || 0);
      const dateB = new Date(b.lastUpdated || b.createdAt || 0);
      return dateB.getTime() - dateA.getTime();
    });

    return NextResponse.json({ projects });

  } catch (error) {
    console.error('Error fetching user projects:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}