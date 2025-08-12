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

    // Check if user folder exists
    if (!fs.existsSync(userFolderPath)) {
      return NextResponse.json({ projects: [] });
    }

    const projects: any[] = [];
    
    // Read all project folders for this user
    const projectFolders = fs.readdirSync(userFolderPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    for (const projectName of projectFolders) {
      const projectPath = path.join(userFolderPath, projectName);
      const indexPath = path.join(projectPath, 'project-index.json');

      if (fs.existsSync(indexPath)) {
        try {
          const indexContent = fs.readFileSync(indexPath, 'utf-8');
          const projectIndex = JSON.parse(indexContent);
          
          projects.push({
            id: `${uid}-${projectName}`,
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