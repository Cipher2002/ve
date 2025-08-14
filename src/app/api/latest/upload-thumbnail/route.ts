import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const thumbnailFile = formData.get('thumbnail') as File;
    const renderId = formData.get('renderId') as string;
    const projectName = formData.get('projectName') as string;
    const uid = formData.get('uid') as string;
    
    if (!thumbnailFile || !renderId || !projectName || !uid) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Find project path (same logic as render-complete)
    const userBasePath = path.join('/home/zanopyai/htdocs/data/video_editor_data', uid);
    const projectsListPath = path.join(userBasePath, 'projects_id_list.json');
    
    if (!fs.existsSync(projectsListPath)) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    const projectsListContent = fs.readFileSync(projectsListPath, 'utf-8');
    const projectsList = JSON.parse(projectsListContent);
    
    const projectEntry = Object.values(projectsList).find((project: any) => 
      project.project_name === projectName
    );
    
    if (!projectEntry) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    const projectId = (projectEntry as any).project_id;
    const projectPath = path.join(userBasePath, projectId);
    
    // Ensure project directory exists
    if (!fs.existsSync(projectPath)) {
      fs.mkdirSync(projectPath, { recursive: true });
    }
    
    // Save thumbnail
    const thumbnailFileName = `thumbnail-${renderId}.png`;
    const thumbnailPath = path.join(projectPath, thumbnailFileName);
    
    const arrayBuffer = await thumbnailFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    fs.writeFileSync(thumbnailPath, buffer);
    
    return NextResponse.json({ 
      success: true, 
      thumbnailPath: thumbnailFileName 
    });
    
  } catch (error) {
    console.error('Error uploading thumbnail:', error);
    return NextResponse.json({ error: 'Failed to save thumbnail' }, { status: 500 });
  }
}