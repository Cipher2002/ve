import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const videoUrl = searchParams.get('url');

    if (!videoUrl) {
      return new NextResponse('Missing video URL', { status: 400 });
    }

    // Validate that it's from the expected domain
    if (!videoUrl.startsWith('https://d3tcauhkcmkqe0.cloudfront.net/')) {
      return new NextResponse('Invalid video URL', { status: 400 });
    }

    const response = await fetch(videoUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Referer': 'https://zanopy.ai/',
            'Origin': 'https://zanopy.ai',
            'Accept': 'video/webm,video/ogg,video/*;q=0.9,application/octet-stream;q=0.7,*/*;q=0.5',
        },
    });

    if (!response.ok) {
        console.error(`Failed to fetch video: ${response.status} - ${videoUrl}`);
        if (response.status === 403) {
            return new NextResponse('Video access forbidden - may be expired or private', { status: 403 });
        }
        return new NextResponse('Failed to fetch video', { status: response.status });
    }

    const videoBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'video/mp4';

    return new NextResponse(videoBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
        'Access-Control-Allow-Origin': '*',
        'Accept-Ranges': 'bytes',
      },
    });

  } catch (error) {
    console.error('Video proxy error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}