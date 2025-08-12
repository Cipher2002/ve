import { NextRequest, NextResponse } from 'next/server';
import { unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { userId, fileName, thumbnailFileName } = await request.json();
    
    if (!userId || !fileName) {
      return NextResponse.json(
        { error: 'userId and fileName are required' },
        { status: 400 }
      );
    }
    
    const userDir = path.join(process.cwd(), 'public', 'users', userId);
    
    // Delete main file
    const mainFilePath = path.join(userDir, fileName);
    if (existsSync(mainFilePath)) {
      await unlink(mainFilePath);
      console.log(`Deleted local file: ${fileName}`);
    }
    
    // Delete thumbnail file if it exists
    if (thumbnailFileName) {
      const thumbFilePath = path.join(userDir, thumbnailFileName);
      if (existsSync(thumbFilePath)) {
        await unlink(thumbFilePath);
        console.log(`Deleted thumbnail file: ${thumbnailFileName}`);
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Local files cleaned up successfully',
    });
  } catch (error) {
    console.error('Error cleaning up local files:', error);
    return NextResponse.json(
      { error: 'Failed to cleanup local files' },
      { status: 500 }
    );
  }
}