import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startFrom = searchParams.get('start_from') || '0';
    const maxResults = searchParams.get('max_results') || '20';
    const ratio = searchParams.get('ratio') || '1%3A1';
    const tags = searchParams.get('tags') || '';

    const apiUrl = `https://zanopy.ai/ai-images/process_request.php?do_action=BLYNKK_AI_PUBLIC_IMAGE_LIBRARY&start_from=${startFrom}&max_results=${maxResults}&type=image&image_category=&user_ref=&tags=${tags}&ratio=${ratio}`;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Add cache control to avoid too many requests
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error(`API request failed with status: ${response.status}`);
    }

    const data = await response.json();
    
    // Check if the API response is successful
    if (data.RESULT !== 'SUCCESS') {
      throw new Error('API returned unsuccessful result');
    }

    // Transform the API response to match your expected format
    const transformedImages = data.RESPONSE.map((item: any) => ({
      id: item.image_id,
      url: item.image_url,
      thumbnail: item.image_url, // Same as url since no separate thumbnail provided
      tags: item.image_tags,
      title: item.user_prompt,
      width: parseInt(item.width),
      height: parseInt(item.height),
      timestamp: item.image_timestamp,
      license: item.image_license
    }));

    return NextResponse.json({
      success: true,
      images: transformedImages,
      total: parseInt(data.TOTAL_RECORDS),
      pageRecords: parseInt(data.PAGE_RECORDS)
    });

  } catch (error) {
    console.error('Error fetching images:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch images',
        images: []
      },
      { status: 500 }
    );
  }
}