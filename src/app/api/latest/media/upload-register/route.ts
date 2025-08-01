import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      file_url,
      file_cdn_url,
      file_thumbnail_url,
      file_category = 'edit_video',
      file_type,
      user_id,
      user_ref,
    } = body;

    const response = await fetch('https://zanopy.ai/ai-images/process_request.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        do_action: 'ZA_UPLOAD_USER_MEDIA',
        file_url,
        file_cdn_url,
        file_thumbnail_url,
        file_category,
        file_type,
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
        user_ip: '',
        user_id,
        user_ref,
      }),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error registering media upload:', error);
    return NextResponse.json(
      { error: 'Failed to register media upload' },
      { status: 500 }
    );
  }
}