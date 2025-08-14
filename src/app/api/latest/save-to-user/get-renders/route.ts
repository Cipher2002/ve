import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');
    const projectId = searchParams.get('projectId');

    if (!uid) {
      return NextResponse.json(
        { error: 'UID is required' },
        { status: 400 }
      );
    }

    const userBasePath = path.join('/home/zanopyai/htdocs/data/video_editor_data', uid);

    // If projectId is provided, return renders for that specific project
    if (projectId) {
      const projectPath = path.join(userBasePath, projectId);
      const rendersJsonPath = path.join(projectPath, 'renders.json');

      if (!fs.existsSync(rendersJsonPath)) {
        return NextResponse.json({ renders: [] });
      }

      const rendersContent = fs.readFileSync(rendersJsonPath, 'utf-8');
      const renders = JSON.parse(rendersContent);

      return NextResponse.json({ renders });
    }

    // If no projectId, return all renders from all projects that have renders
    const projectsListPath = path.join(userBasePath, 'projects_id_list.json');
    
    if (!fs.existsSync(projectsListPath)) {
      return NextResponse.json({ renders: [] });
    }

    const projectsListContent = fs.readFileSync(projectsListPath, 'utf-8');
    const projectsList = JSON.parse(projectsListContent);

    // Get projects that have renders (render_count > 0)
    const projectsWithRenders = Object.values(projectsList).filter(
      (project: any) => (project.render_count || 0) > 0
    );

    // Collect all renders from all projects
    const allRenders: any[] = [];
    
    for (const project of projectsWithRenders) {
      const projectPath = path.join(userBasePath, (project as any).project_id);
      const rendersJsonPath = path.join(projectPath, 'renders.json');
      
      if (fs.existsSync(rendersJsonPath)) {
        try {
          const rendersContent = fs.readFileSync(rendersJsonPath, 'utf-8');
          const renders = JSON.parse(rendersContent);
          
          // Add project_id to each render for reference
          const rendersWithProjectId = renders.map((render: any) => ({
            ...render,
            projectId: (project as any).project_id
          }));
          
          allRenders.push(...rendersWithProjectId);
        } catch (error) {
          console.error(`Error reading renders for project ${(project as any).project_id}:`, error);
        }
      }
    }

    return NextResponse.json({ renders: allRenders });

  } catch (error) {
    console.error('Error fetching renders:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}