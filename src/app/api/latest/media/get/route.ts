import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, user_ref, start_from = '0', max_results = '20' } = body;

    const response = await fetch('https://zanopy.ai/ai-images/process_request.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        do_action: 'ZA_GET_USER_MEDIA',
        start_from,
        max_results,
        user_id,
        user_ref,
      }),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching user media:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user media' },
      { status: 500 }
    );
  }
}