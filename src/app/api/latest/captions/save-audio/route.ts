import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// const BASE_AUDIO_URL = '/api/latest/files/tmp_audio/'; // Make this configurable later

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    
    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    // Create tmp_audio directory if it doesn't exist
    const tmpDir = path.join(process.cwd(), 'public', 'tmp_audio');
    await fs.mkdir(tmpDir, { recursive: true });
    
    // Generate unique filename
    const audioFileName = `audio_${Date.now()}.wav`;
    const audioPath = path.join(tmpDir, audioFileName);
    
    // Save the file
    const arrayBuffer = await audioFile.arrayBuffer();
    await fs.writeFile(audioPath, Buffer.from(arrayBuffer));

    const audioUrl = `http://zanopy.ai:3001/api/latest/files/tmp_audio/${audioFileName}`;

    return NextResponse.json({
      success: true,
      audioUrl
    });

  } catch (error) {
    console.error('Save audio error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}