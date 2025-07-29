import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathParams } = await params;
    const [uid, projectName, filename] = pathParams;
    
    if (!uid || !projectName || !filename) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    const filePath = path.join(process.cwd(), 'users', uid, projectName, filename);
    
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);
    const fileExtension = path.extname(filename).toLowerCase();
    
    let contentType = 'application/octet-stream';
    if (fileExtension === '.mp4') contentType = 'video/mp4';
    else if (fileExtension === '.mov') contentType = 'video/quicktime';
    else if (fileExtension === '.webm') contentType = 'video/webm';
    else if (fileExtension === '.mp3') contentType = 'audio/mpeg';
    else if (fileExtension === '.wav') contentType = 'audio/wav';
    else if (fileExtension === '.aac') contentType = 'audio/aac';

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error serving user file:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}