import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { uid, projectId, status } = await request.json();

    if (!uid || !projectId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate status
    if (!['active', 'inactive'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be "active" or "inactive"' },
        { status: 400 }
      );
    }

    // Extract project name from projectId (format: uid-projectName)
    const projectName = projectId.replace(`${uid}-`, '');
    const projectPath = path.join(process.cwd(), 'users', uid, projectName);
    const indexPath = path.join(projectPath, 'project-index.json');

    // Check if project folder exists
    if (!fs.existsSync(projectPath)) {
      return NextResponse.json(
        { error: 'Project folder not found' },
        { status: 404 }
      );
    }

    // Check if index file exists
    if (!fs.existsSync(indexPath)) {
      return NextResponse.json(
        { error: 'Project index not found' },
        { status: 404 }
      );
    }

    // Read and update the project index
    const indexContent = fs.readFileSync(indexPath, 'utf-8');
    const projectIndex = JSON.parse(indexContent);
    
    // Update status
    projectIndex.status = status;
    projectIndex.lastUpdated = new Date().toISOString();
    
    // Write updated index
    fs.writeFileSync(indexPath, JSON.stringify(projectIndex, null, 2));

    return NextResponse.json({
      success: true,
      projectId,
      status,
      message: `Project status updated to ${status}`,
    });

  } catch (error) {
    console.error('Error updating project status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}