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

    // Thumbnail will be generated and uploaded from client-side
    const thumbnailFileName = `thumbnail-${renderId}.png`;
    const thumbnailSuccess = false; // Will be updated when client uploads
    
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
      message: 'Render completed and stored successfully',
      thumbnailGenerated: thumbnailSuccess,
      thumbnailPath: thumbnailFileName,
      debugInfo: {
        mediaType,
        format,
        s3Url,
        projectPath
      }
    });

  } catch (error) {
    console.error('Error in render-complete API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}