import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract all query parameters
    const do_action = searchParams.get('do_action');
    const start_from = searchParams.get('start_from') || '0';
    const max_results = searchParams.get('max_results') || '1000';
    const type = searchParams.get('type') || 'image';
    const image_category = searchParams.get('image_category') || '';
    const user_ref = searchParams.get('user_ref') || '';
    const user_id = searchParams.get('user_id') || '';
    const tags = searchParams.get('tags') || '';
    const ratio = searchParams.get('ratio') || '';
    const imageStatus = searchParams.get('imageStatus') || '';

    if (!do_action) {
      return NextResponse.json(
        { error: 'Missing required parameter: do_action' },
        { status: 400 }
      );
    }

    // Determine the base URL based on the action
    let baseUrl = '';
    if (do_action === 'GET_AI_AMBASSADOR_IMAGE_PROJECT') {
      baseUrl = 'https://zanopy.ai/process_request.php';
    } else {
      baseUrl = 'https://zanopy.ai/ai-images/process_request.php';
    }

    // Build query parameters
    const queryParams = new URLSearchParams();
    queryParams.append('do_action', do_action);
    
    if (do_action === 'GET_AI_AMBASSADOR_IMAGE_PROJECT') {
      // Product Influencer specific parameters
      if (user_id) queryParams.append('user_id', user_id);
      if (imageStatus) queryParams.append('imageStatus', imageStatus);
    } else {
      // Other image types parameters
      queryParams.append('start_from', start_from);
      queryParams.append('max_results', max_results);
      queryParams.append('type', type);
      queryParams.append('image_category', image_category);
      if (user_ref) queryParams.append('user_ref', user_ref);
      if (tags) queryParams.append('tags', tags);
      if (ratio) queryParams.append('ratio', ratio);
    }

    const fullUrl = `${baseUrl}?${queryParams.toString()}`;
    
    console.log('Fetching from Zanopy:', fullUrl);

    // Make the request to Zanopy
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        // Add any additional headers if required by Zanopy
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
    });

    if (!response.ok) {
      console.error('Zanopy API error:', response.status, response.statusText);
      return NextResponse.json(
        { error: `Zanopy API error: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    console.log('Zanopy response:', {
      action: do_action,
      dataKeys: Object.keys(data),
      itemCount: data.images?.length || data.projects?.length || 0
    });

    // Return the data as-is, let the frontend handle transformation
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error in Zanopy images API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}