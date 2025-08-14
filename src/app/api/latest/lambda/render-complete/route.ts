import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

interface RenderCompleteData {
  uid: string;
  projectName: string;
  renderId: string;
  s3Url: string;
  fileSize: number;
  format: string;
  codec: string;
  mediaType: 'video' | 'audio';
  duration?: number;
  dimensions?: { width: number; height: number };
}

// Helper function to generate thumbnail from video using FFmpeg
async function generateThumbnail(videoUrl: string, renderId: string, outputPath: string): Promise<string> {
  
  try {
    const thumbnailFileName = `thumbnail-${renderId}.webp`;
    const thumbnailPath = path.join(outputPath, thumbnailFileName);
    
    // Initialize FFmpeg
    const ffmpeg = new FFmpeg();
    await ffmpeg.load();
    
    // Download video to memory
    const videoData = await new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const request = videoUrl.startsWith('https:') ? https : http;
      
      request.get(videoUrl, (response: any) => {
        response.on('data', (chunk: any) => chunks.push(chunk));
        response.on('end', () => resolve(Buffer.concat(chunks)));
        response.on('error', reject);
      }).on('error', reject);
    });
    
    // Write video data to FFmpeg filesystem
    await ffmpeg.writeFile('input.mp4', new Uint8Array(videoData as Buffer));
    
    // Extract thumbnail at 1 second mark, resize to 320x180, convert to WebP
    await ffmpeg.exec([
      '-i', 'input.mp4',
      '-ss', '1',
      '-vframes', '1',
      '-s', '320x180',
      '-f', 'webp',
      '-quality', '50',
      'output.webp'
    ]);
    
    // Read the generated thumbnail
    const thumbnailData = await ffmpeg.readFile('output.webp');
    
    // Write thumbnail to disk
    fs.writeFileSync(thumbnailPath, thumbnailData);
    
    // Clean up FFmpeg filesystem
    await ffmpeg.deleteFile('input.mp4');
    await ffmpeg.deleteFile('output.webp');
    
    return thumbnailFileName;
  } catch (error) {
    console.error('Error generating thumbnail with FFmpeg:', error);
    
    // Create better placeholder thumbnail
    const thumbnailFileName = `thumbnail-${renderId}.webp`;
    const placeholderPath = path.join(outputPath, thumbnailFileName);
    
    try {
      // Initialize a new FFmpeg instance for placeholder
      const placeholderFFmpeg = new FFmpeg();
      await placeholderFFmpeg.load();
      
      // Create a solid color image as placeholder
      await placeholderFFmpeg.exec([
        '-f', 'lavfi',
        '-i', 'color=c=gray:size=320x180:duration=1',
        '-vframes', '1',
        '-f', 'webp',
        '-quality', '50',
        'placeholder.webp'
      ]);
      
      // Read and save the placeholder
      const placeholderData = await placeholderFFmpeg.readFile('placeholder.webp');
      fs.writeFileSync(placeholderPath, placeholderData);
      
      // Clean up
      await placeholderFFmpeg.deleteFile('placeholder.webp');
    } catch (placeholderError) {
      console.error('Failed to create placeholder thumbnail:', placeholderError);
      // Create minimal gray WebP manually
      const minimalWebP = Buffer.from([
        0x52, 0x49, 0x46, 0x46, 0x3E, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
        0x56, 0x50, 0x38, 0x20, 0x32, 0x00, 0x00, 0x00, 0x40, 0x01, 0x00, 0x9D,
        0x01, 0x2A, 0x40, 0x01, 0xB4, 0x00, 0x02, 0x00, 0x34, 0x25, 0xA4, 0x00,
        0x03, 0x70, 0x00, 0xFE, 0xFC, 0xFD, 0x50, 0x00
      ]);
      fs.writeFileSync(placeholderPath, minimalWebP);
    }
    
    return thumbnailFileName;
  }
}


export async function POST(request: NextRequest) {
  try {
    const data: RenderCompleteData = await request.json();
    
    const { uid, projectName, renderId, s3Url, fileSize, format, codec, mediaType, duration, dimensions } = data;

    if (!uid || !projectName || !renderId || !s3Url) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Load projects_id_list.json to find project_id
    const userBasePath = path.join('/home/zanopyai/htdocs/data/video_editor_data', uid);
    const projectsListPath = path.join(userBasePath, 'projects_id_list.json');
    
    if (!fs.existsSync(projectsListPath)) {
      return NextResponse.json(
        { error: 'No projects found for this user' },
        { status: 404 }
      );
    }

    const projectsListContent = fs.readFileSync(projectsListPath, 'utf-8');
    const projectsList = JSON.parse(projectsListContent);
    
    // Find project_id by projectName
    const projectEntry = Object.values(projectsList).find((project: any) => 
      project.project_name === projectName
    );
    
    if (!projectEntry) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }
    
    const projectId = (projectEntry as any).project_id;
    const projectPath = path.join(userBasePath, projectId);

    // Ensure project directory exists
    if (!fs.existsSync(projectPath)) {
      fs.mkdirSync(projectPath, { recursive: true });
    }

    // Load or create renders.json
    const rendersJsonPath = path.join(projectPath, 'renders.json');
    let rendersData: any[] = [];

    if (fs.existsSync(rendersJsonPath)) {
      const rendersContent = fs.readFileSync(rendersJsonPath, 'utf-8');
      rendersData = JSON.parse(rendersContent);
    }

    // Generate thumbnail
    const thumbnailFileName = await generateThumbnail(s3Url, renderId, projectPath);
    
    // Create render entry
    const renderEntry = {
      renderId,
      s3Url,
      thumbnailPath: thumbnailFileName,
      timestamp: new Date().toISOString(),
      format,
      codec,
      mediaType,
      duration: duration || null,
      dimensions: dimensions || null,
      fileSize,
      status: 'completed'
    };

    // Add to renders data (newest first)
    rendersData.unshift(renderEntry);

    // Save renders.json
    fs.writeFileSync(rendersJsonPath, JSON.stringify(rendersData, null, 2));

    // Update projects_id_list.json with render count and last render timestamp
    const updateProjectsList = async (retries = 2) => {
      try {
        // Re-read the projects list to get the latest data
        const currentProjectsListContent = fs.readFileSync(projectsListPath, 'utf-8');
        const currentProjectsList = JSON.parse(currentProjectsListContent);
        
        if (currentProjectsList[projectId]) {
          currentProjectsList[projectId].render_count = rendersData.length;
          currentProjectsList[projectId].last_render_timestamp = renderEntry.timestamp;
          
          fs.writeFileSync(projectsListPath, JSON.stringify(currentProjectsList, null, 2));
        }
      } catch (error) {
        console.error('Error updating projects list:', error);
        if (retries > 0) {
          console.log(`Retrying projects list update. Retries left: ${retries}`);
          setTimeout(() => updateProjectsList(retries - 1), 100);
        } else {
          console.error('Failed to update projects list after all retries');
        }
      }
    };

    await updateProjectsList();

    // Also update project-index.json for compatibility
    const indexPath = path.join(projectPath, 'project-index.json');
    if (fs.existsSync(indexPath)) {
      const indexContent = fs.readFileSync(indexPath, 'utf-8');
      const projectIndex = JSON.parse(indexContent);
      
      if (!projectIndex.renders) {
        projectIndex.renders = [];
      }
      
      projectIndex.renders.unshift({
        fileName: `${renderId}.${format}`,
        timestamp: renderEntry.timestamp,
        status: 'completed',
        url: s3Url,
        fileSize,
        renderId,
        format,
        mediaType
      });
      
      projectIndex.lastRender = renderEntry.timestamp;
      projectIndex.lastUpdated = renderEntry.timestamp;
      
      fs.writeFileSync(indexPath, JSON.stringify(projectIndex, null, 2));
    }

    return NextResponse.json({
      success: true,
      renderId,
      message: 'Render completed and stored successfully'
    });

  } catch (error) {
    console.error('Error in render-complete API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}