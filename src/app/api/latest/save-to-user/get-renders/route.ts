import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');
    const projectId = searchParams.get('projectId');

    if (!uid || !projectId) {
      return NextResponse.json(
        { error: 'UID and projectId are required' },
        { status: 400 }
      );
    }

    const projectPath = path.join('/home/zanopyai/htdocs/data/video_editor_data', uid, projectId);
    const rendersJsonPath = path.join(projectPath, 'renders.json');

    if (!fs.existsSync(rendersJsonPath)) {
      return NextResponse.json({ renders: [] });
    }

    const rendersContent = fs.readFileSync(rendersJsonPath, 'utf-8');
    const renders = JSON.parse(rendersContent);

    return NextResponse.json({ renders });
  } catch (error) {
    console.error('Error fetching renders:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}