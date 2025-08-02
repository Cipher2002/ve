import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathSegments } = await params;
  try {
    const filePath = path.join(process.cwd(), 'public', ...pathSegments);
    
    if (!existsSync(filePath)) {
      return new NextResponse('File not found', { status: 404 });
    }
    
    const file = await readFile(filePath);
    
    // Determine content type based on file extension
    const ext = path.extname(filePath).toLowerCase();
    const contentTypes: { [key: string]: string } = {
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.wav': 'audio/wav',
      '.mp3': 'audio/mpeg',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
    };
    
    const contentType = contentTypes[ext] || 'application/octet-stream';
    
    return new NextResponse(file, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (error) {
    console.error('File serving error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}