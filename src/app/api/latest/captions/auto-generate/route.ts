import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { audioDataWithOverlays } = await request.json();
    
    // Extract URL parameters
    const searchParams = request.nextUrl.searchParams;
    const uid = searchParams.get('uid');
    const email = searchParams.get('email');
    
    if (!uid || !email) {
      return NextResponse.json({ error: 'Missing uid or email parameters' }, { status: 400 });
    }

    if (!audioDataWithOverlays || audioDataWithOverlays.length === 0) {
      return NextResponse.json({ error: 'No audio data provided' }, { status: 400 });
    }

    // Process each audio file sequentially
    const results = [];
    for (const audioData of audioDataWithOverlays) {
      try {
        const genaiCode = await requestCaptionGeneration(audioData.audioUrl, uid, email);
        results.push({
          ...audioData,
          genaiCode,
          status: 'started'
        });
      } catch (error: any) {
        console.error(`Failed to start generation for overlay ${audioData.overlayId}:`, error);
        results.push({
          ...audioData,
          status: 'failed',
          error: error.message
        });
      }
    }

    return NextResponse.json({ 
      success: true, 
      results,
      message: 'Caption generation started for all audio files'
    });

  } catch (error) {
    console.error('Auto caption generation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function requestCaptionGeneration(audioUrl: string, userId: string, userRef: string): Promise<string> {
  const formData = new URLSearchParams();
  formData.append('do_action', 'BLYNKK_ADD_GENAI_SUBTITLES_REQUEST');
  formData.append('audio', audioUrl);
  formData.append('user_id', userId);
  formData.append('user_ref', userRef);
  
  const response = await fetch('https://zanopy.ai/ocadmin/zanopy_process_100v.php', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData,
  });
  
  const result = await response.json();
  
  if (result.RESULT !== 'SUCCESS') {
    throw new Error('Failed to start caption generation');
  }
  
  return result.RESPONSE;
}