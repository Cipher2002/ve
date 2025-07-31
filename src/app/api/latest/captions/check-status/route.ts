import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { genaiCode } = await request.json();
    
    if (!genaiCode) {
      return NextResponse.json({ error: 'Missing genaiCode' }, { status: 400 });
    }

    const formData = new URLSearchParams();
    formData.append('do_action', 'BLYNKK_CHECK_GENAI_SUBTITLES_REQUEST');
    formData.append('request_type', '');
    formData.append('genai_code', genaiCode);
    
    const response = await fetch('https://zanopy.ai/ocadmin/zanopy_process_100v.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });
    
    const result = await response.json();
    
    if (result.RESULT !== 'SUCCESS') {
      return NextResponse.json({ error: 'Failed to check status' }, { status: 500 });
    }
    
    // Check if response is a URL (completion) or progress object
    if (typeof result.RESPONSE === 'string' && result.RESPONSE.startsWith('http')) {
      // Process completed, clean up temp files
      await cleanupTempAudio();
      
      return NextResponse.json({ 
        completed: true, 
        subtitlesUrl: result.RESPONSE 
      });
    } else {
      // Still in progress
      return NextResponse.json({ 
        completed: false, 
        progress: result.RESPONSE.progress || 0,
        message: result.RESPONSE.progress_msg || 'Processing...'
      });
    }

  } catch (error) {
    console.error('Check status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function cleanupTempAudio() {
  try {
    const tmpDir = path.join(process.cwd(), 'public', 'tmp_audio');
    const files = await fs.readdir(tmpDir);
    
    for (const file of files) {
      await fs.unlink(path.join(tmpDir, file));
    }
  } catch (error) {
    console.error('Failed to cleanup temp audio files:', error);
  }
}