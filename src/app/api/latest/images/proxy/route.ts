import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { imageUrl } = await request.json();
    
    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }
    // Fetch the file from the external URL (this bypasses CORS since it's server-side)
    const response = await fetch(imageUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch file:', response.status, response.statusText);
      return NextResponse.json(
        { error: `Failed to fetch file: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    // Get the file data as ArrayBuffer
    const arrayBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    // Return the file data with appropriate headers
    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': arrayBuffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });

  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}