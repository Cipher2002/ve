import { NextRequest, NextResponse } from 'next/server';
import { unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

/**
 * Handles rendered video deletion
 */
export async function POST(request: NextRequest) {
  try {
    const { videoId } = await request.json();
    
    if (!videoId) {
      return NextResponse.json(
        { error: 'VideoId is required' },
        { status: 400 }
      );
    }
    
    // Construct the path to the video file
    const videoPath = path.join(process.cwd(), 'public', 'rendered-videos', `${videoId}.mp4`);
    
    // Check if file exists
    if (!existsSync(videoPath)) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }
    
    // Delete the video file
    await unlink(videoPath);
    
    // Also try to delete thumbnail if it exists
    const thumbnailPath = path.join(process.cwd(), 'public', 'rendered-videos', `${videoId}_thumbnail.jpg`);
    if (existsSync(thumbnailPath)) {
      await unlink(thumbnailPath);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Video deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting video:', error);
    return NextResponse.json(
      { error: 'Failed to delete video' },
      { status: 500 }
    );
  }
}