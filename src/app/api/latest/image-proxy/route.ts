import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');

    if (!imageUrl) {
      return new NextResponse('Missing image URL', { status: 400 });
    }

    // Allow local assets or validate external URLs
    if (!imageUrl.startsWith('https://d3tcauhkcmkqe0.cloudfront.net/') && !imageUrl.startsWith('assets/')) {
    return new NextResponse('Invalid image URL', { status: 400 });
    }

    // Handle local assets
    if (imageUrl.startsWith('assets/')) {
    return new NextResponse('Local asset not found', { status: 404 });
    }

    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ImageProxy/1.0)',
      },
    });

    if (!response.ok) {
      return new NextResponse('Failed to fetch image', { status: response.status });
    }

    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/png';

    // Check if it's actually an image by validating the buffer
    if (imageBuffer.byteLength < 100) {
      return new NextResponse('Invalid image data', { status: 404 });
    }

    // Basic image format validation
    const uint8Array = new Uint8Array(imageBuffer);
    const isValidImage = 
      // PNG signature
      (uint8Array[0] === 0x89 && uint8Array[1] === 0x50 && uint8Array[2] === 0x4E && uint8Array[3] === 0x47) ||
      // JPEG signature
      (uint8Array[0] === 0xFF && uint8Array[1] === 0xD8 && uint8Array[2] === 0xFF) ||
      // WebP signature
      (uint8Array[8] === 0x57 && uint8Array[9] === 0x45 && uint8Array[10] === 0x42 && uint8Array[11] === 0x50);

    if (!isValidImage) {
      return new NextResponse('Invalid image format', { status: 404 });
    }

    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error) {
    console.error('Error proxying image:', error);
    
    return new NextResponse('Failed to proxy image', { status: 500 });
  }
}