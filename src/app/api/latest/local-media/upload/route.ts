import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

//SETTING THE API BASE URL
const apiBaseUrl = 'https://zanopy.ai/vedit/api/latest';

/**
 * Handles media file uploads
 * 
 * This API endpoint:
 * 1. Receives a file and user ID
 * 2. Creates a user directory if it doesn't exist
 * 3. Saves the file to the user's directory
 * 4. Returns the file path and ID
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;
    
    if (!file || !userId) {
      return NextResponse.json(
        { error: 'File and userId are required' },
        { status: 400 }
      );
    }
    
    // Create user directory if it doesn't exist
    const userDir = path.join('/home/zanopyai/htdocs/data/video_editor_data', userId, 'uploaded-media');
    if (!existsSync(userDir)) {
      await mkdir(userDir, { recursive: true });
    }
    
    // Generate a unique filename
    const fileId = uuidv4();
    const fileExtension = file.name.split('.').pop();
    const fileName = `${fileId}.${fileExtension}`;
    const filePath = path.join(userDir, fileName);
    
    // Convert file to buffer and save it
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);
    
    // Return the file information
    const publicPath = `https://zanopy.ai/data/video_editor_data/${userId}/uploaded-media/${fileName}`;

    return NextResponse.json({
      success: true,
      id: fileId,
      fileName: fileName, // Use the generated filename instead of original
      originalName: file.name,
      serverPath: publicPath,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
