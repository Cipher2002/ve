import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const doAction = searchParams.get('do_action');
    const imageStatus = searchParams.get('imageStatus') || '';

    if (!userId || !doAction) {
      return NextResponse.json(
        { error: 'Missing required parameters: user_id and do_action' },
        { status: 400 }
      );
    }

    // Construct the API URL
    const apiUrl = `https://zanopy.ai/process_request.php?do_action=${doAction}&user_id=${userId}&imageStatus=${imageStatus}`;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Add cache control
      next: { revalidate: 300 } // Cache for 5 minutes
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
    const transformedProjects = Array.isArray(data.RESPONSE) ? data.RESPONSE.map((item: any) => ({
      id: item.project_id,
      title: `${getProjectTypeFromAction(doAction).replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} - ${item.project_id}`,
      thumbnail: item.thumbnail,
      video_url: `https://d3tcauhkcmkqe0.cloudfront.net/video/${item.output}`,
      created_at: item.create_date,
      status: item.status || 'completed',
      type: getProjectTypeFromAction(doAction),
      ratio: item.ratio,
      category: item.category,
      output: item.output,
      user_prompt: item.user_prompt
    })) : [];

    return NextResponse.json({
      success: true,
      projects: transformedProjects,
      total: data.TOTAL_RECORDS || transformedProjects.length
    });

  } catch (error) {
    console.error('Error fetching video projects:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch video projects',
        projects: []
      },
      { status: 500 }
    );
  }
}

// Helper function to determine project type from action
function getProjectTypeFromAction(doAction: string): string {
  switch (doAction) {
    case 'GET_TEXT_TO_VIDEO_PROJECT':
      return 'text-to-video';
    case 'GET_IMAGE_TO_VIDEO_PROJECT':
      return 'image-to-video';
    case 'GET_PANOUT_VIDEO_PROJECT':
      return 'video-effects';
    case 'GET_TALKING_IMAGE_PROJECT':
      return 'talking-video';
    default:
      return 'unknown';
  }
}