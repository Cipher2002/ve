import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Get the form data from the request
    const formData = await request.formData();
    // Forward the request to the different Zanopy API endpoint for prompt-based generation
    const response = await fetch('https://zanopy.ai/process_request.php', {
      method: 'POST',
      body: formData,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Zanopy API error:', response.status, errorText);
      return NextResponse.json(
        { error: `Zanopy API error: ${response.status} ${response.statusText}`, details: errorText },
        { status: response.status }
      );
    }

    const responseText = await response.text();
    // Check if response is empty
    if (!responseText || responseText.trim().length === 0) {
      return NextResponse.json({
        RESULT: 'SUCCESS',
        MESSAGE: 'Request submitted successfully (empty response)',
        RESPONSE: `proxy_${Date.now()}` // Generate a mock code for tracking
      });
    }

    // Try to parse as JSON
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse JSON response:', responseText);
      return NextResponse.json(
        { error: 'Invalid JSON response from Zanopy API', rawResponse: responseText },
        { status: 500 }
      );
    }

    // Return the parsed result
    return NextResponse.json(result);

  } catch (error) {
    console.error('Audio generation proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}