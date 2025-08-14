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

    // If no projectId, return projects with render counts from projects_id_list.json
    const projectsListPath = path.join(userBasePath, 'projects_id_list.json');
    
    if (!fs.existsSync(projectsListPath)) {
      return NextResponse.json({ projects: [] });
    }

    const projectsListContent = fs.readFileSync(projectsListPath, 'utf-8');
    const projectsList = JSON.parse(projectsListContent);

    // Filter projects that have renders (render_count > 0)
    const projectsWithRenders = Object.values(projectsList).filter(
      (project: any) => (project.render_count || 0) > 0
    );

    return NextResponse.json({ projects: projectsWithRenders });

  } catch (error) {
    console.error('Error fetching renders:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}