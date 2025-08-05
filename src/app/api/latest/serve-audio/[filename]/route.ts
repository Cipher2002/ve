import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const filename = params.filename;

    const filePath = path.join(process.cwd(), 'tmp_audio', filename);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);
    const fileExtension = path.extname(filename).toLowerCase();

    let contentType = 'application/octet-stream';
    if (fileExtension === '.mp3') contentType = 'audio/mpeg';
    else if (fileExtension === '.wav') contentType = 'audio/wav';
    else if (fileExtension === '.aac') contentType = 'audio/aac';

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Serve file error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}