import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathParams } = await params;
    const [uid, projectId, filename] = pathParams;
    
    if (!uid || !projectId || !filename) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    const filePath = path.join('/home/zanopyai/htdocs/data/video_editor_data', uid, projectId, filename);
    
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);
    const fileExtension = path.extname(filename).toLowerCase();
    
    let contentType = 'application/octet-stream';
    let disposition = `attachment; filename="${filename}"`; // Default to download
    
    // Handle different file types
    if (fileExtension === '.mp4') contentType = 'video/mp4';
    else if (fileExtension === '.mov') contentType = 'video/quicktime';
    else if (fileExtension === '.webm') contentType = 'video/webm';
    else if (fileExtension === '.mp3') contentType = 'audio/mpeg';
    else if (fileExtension === '.wav') contentType = 'audio/wav';
    else if (fileExtension === '.aac') contentType = 'audio/aac';
    else if (fileExtension === '.webp') {
      contentType = 'image/webp';
      disposition = 'inline';
    }
    else if (fileExtension === '.jpg' || fileExtension === '.jpeg') {
      contentType = 'image/jpeg';
      disposition = 'inline';
    }
    else if (fileExtension === '.png') {
      contentType = 'image/png';
      disposition = 'inline';
    }

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': disposition,
        'Cache-Control': 'public, max-age=86400', // Cache images for 24 hours
      },
    });
  } catch (error) {
    console.error('Error serving user file:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}