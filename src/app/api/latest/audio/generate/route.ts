import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Get the form data from the request
    const formData = await request.formData();
    
    console.log('Proxying audio generation request to Zanopy...');
    
    // Log form data contents for debugging
    console.log('FormData contents:');
    for (const [key, value] of formData.entries()) {
      console.log(`${key}:`, value instanceof File ? `File: ${value.name} (${value.size} bytes)` : value);
    }

    // Forward the request to Zanopy API
    const response = await fetch('https://zanopy.ai/ocadmin/zanopy_process_100v.php', {
      method: 'POST',
      body: formData,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
    });

    console.log('Zanopy API Response:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
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
    console.log('Raw Zanopy Response:', responseText);

    // Check if response is empty
    if (!responseText || responseText.trim().length === 0) {
      console.log('Empty response from Zanopy - might be normal');
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