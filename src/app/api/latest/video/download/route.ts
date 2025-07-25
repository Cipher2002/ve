import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const videoUrl = searchParams.get('url');

    if (!videoUrl) {
      return new NextResponse('Missing video URL', { status: 400 });
    }

    console.log('Downloading video via proxy:', videoUrl);

    const response = await fetch(videoUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; VideoDownloader/1.0)',
        'Accept': 'video/mp4,video/*;q=0.9,*/*;q=0.8',
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch video: ${response.status} - ${videoUrl}`);
      return new NextResponse(`Failed to fetch video: ${response.status}`, { 
        status: response.status 
      });
    }

    // Get the video blob
    const videoBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'video/mp4';

    // Check if it's actually a video file
    if (videoBuffer.byteLength < 1000) { // Less than 1KB is suspicious
      return new NextResponse('Invalid video data', { status: 404 });
    }

    return new NextResponse(videoBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': videoBuffer.byteLength.toString(),
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error) {
    console.error('Video download proxy error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}