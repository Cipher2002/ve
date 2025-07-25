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
    
    const renderedVideosDir = path.join(process.cwd(), 'public', 'rendered-videos');
    
    // Try to find the file with different extensions
    const possibleExtensions = ['mp4', 'mov', 'mkv', 'gif', 'webm'];
    let videoPath: string | null = null;

    // Find the actual file
    for (const ext of possibleExtensions) {
      const testPath = path.join(renderedVideosDir, `${videoId}.${ext}`);
      if (existsSync(testPath)) {
        videoPath = testPath;
        break;
      }
    }
    
    // Check if file was found
    if (!videoPath) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }
    
    // Delete the video file
    await unlink(videoPath);
    
    // Also try to delete thumbnail if it exists
    const thumbnailPath = path.join(renderedVideosDir, `${videoId}_thumbnail.jpg`);
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