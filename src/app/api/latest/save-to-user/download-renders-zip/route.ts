import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import archiver from 'archiver';

// In-memory progress tracking (in production, use Redis or database)
const zipProgress = new Map<string, {
  status: 'preparing' | 'downloading' | 'zipping' | 'completed' | 'error';
  current: number;
  total: number;
  message: string;
  zipFilePath?: string;
  error?: string;
}>();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');
    const projectId = searchParams.get('projectId');
    const action = searchParams.get('action'); // 'start' or 'progress' or 'download'

    if (!uid || !projectId) {
      return NextResponse.json(
        { error: 'UID and projectId are required' },
        { status: 400 }
      );
    }

    const jobId = `${uid}_${projectId}`;

    // Handle different actions
    if (action === 'progress') {
      const progress = zipProgress.get(jobId);
      if (!progress) {
        return NextResponse.json({ error: 'Job not found' }, { status: 404 });
      }
      return NextResponse.json(progress);
    }

    if (action === 'download') {
      const progress = zipProgress.get(jobId);
      if (!progress || progress.status !== 'completed' || !progress.zipFilePath) {
        return NextResponse.json({ error: 'Zip file not ready' }, { status: 404 });
      }

      const zipBuffer = fs.readFileSync(progress.zipFilePath);
      
      // Clean up after download
      setTimeout(() => {
        try {
          if (progress.zipFilePath && fs.existsSync(progress.zipFilePath)) {
            fs.unlinkSync(progress.zipFilePath);
            console.log(`Cleaned up zip file: ${progress.zipFilePath}`);
          }
          zipProgress.delete(jobId);
        } catch (error) {
          console.error(`Error cleaning up zip file:`, error);
        }
      }, 5000);

      const fileName = path.basename(progress.zipFilePath).replace(/^.*_renders_\d+\.zip$/, 'renders.zip');
      
      return new NextResponse(zipBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/zip',
          'Content-Length': zipBuffer.length.toString(),
          'Content-Disposition': `attachment; filename="${fileName}"`,
        },
      });
    }

    // Default action: start the zip creation process
    const userBasePath = path.join('/home/zanopyai/htdocs/data/video_editor_data', uid);
    const projectPath = path.join(userBasePath, projectId);
    const rendersJsonPath = path.join(projectPath, 'renders.json');

    // Check if renders.json exists
    if (!fs.existsSync(rendersJsonPath)) {
      return NextResponse.json(
        { error: 'No renders found for this project' },
        { status: 404 }
      );
    }

    // Read renders.json
    const rendersContent = fs.readFileSync(rendersJsonPath, 'utf-8');
    const renders = JSON.parse(rendersContent);

    if (!Array.isArray(renders) || renders.length === 0) {
      return NextResponse.json(
        { error: 'No renders found in the project' },
        { status: 404 }
      );
    }

    // Initialize progress
    zipProgress.set(jobId, {
      status: 'preparing',
      current: 0,
      total: renders.length,
      message: 'Preparing download...'
    });

    // Start background processing
    processZipInBackground(jobId, uid, projectId, renders, userBasePath, projectPath);

    return NextResponse.json({ 
      jobId,
      message: 'Zip creation started',
      total: renders.length 
    });

  } catch (error) {
    console.error('Error in zip endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function processZipInBackground(
  jobId: string, 
  uid: string, 
  projectId: string, 
  renders: any[], 
  userBasePath: string, 
  projectPath: string
) {
  try {
    // Get project name
    const projectsListPath = path.join(userBasePath, 'projects_id_list.json');
    let projectName = `Project_${projectId}`;
    
    if (fs.existsSync(projectsListPath)) {
      const projectsListContent = fs.readFileSync(projectsListPath, 'utf-8');
      const projectsList = JSON.parse(projectsListContent);
      if (projectsList[projectId] && projectsList[projectId].project_name) {
        projectName = projectsList[projectId].project_name;
      }
    }

    const safeProjectName = projectName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const zipFileName = `${safeProjectName}_renders_${Date.now()}.zip`;
    const zipFilePath = path.join(projectPath, zipFileName);

    // Update progress: Start downloading
    zipProgress.set(jobId, {
      status: 'downloading',
      current: 0,
      total: renders.length,
      message: 'Downloading renders...'
    });

    // Create zip file
    const output = fs.createWriteStream(zipFilePath);
    const archive = archiver('zip', { zlib: { level: 6 } });

    archive.pipe(output);

    // Download and add each render file
    for (let i = 0; i < renders.length; i++) {
      const render = renders[i];
      
      // Update progress
      zipProgress.set(jobId, {
        status: 'downloading',
        current: i + 1,
        total: renders.length,
        message: `Downloading ${i + 1}/${renders.length}...`
      });

      try {
        if (render.s3Url && render.renderId && render.format) {
          console.log(`Processing ${i + 1}/${renders.length}: ${render.renderId}`);
          
          const response = await fetch(render.s3Url);
          
          if (response.ok) {
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            
            const fileName = `${render.renderId}.${render.format}`;
            archive.append(buffer, { name: fileName });
          } else {
            console.error(`Failed to download render ${render.renderId}:`, response.statusText);
          }
        }
      } catch (error) {
        console.error(`Error processing render ${render.renderId}:`, error);
      }
    }

    // Update progress: Start zipping
    zipProgress.set(jobId, {
      status: 'zipping',
      current: renders.length,
      total: renders.length,
      message: 'Creating zip file...'
    });

    // Finalize the archive
    await new Promise<void>((resolve, reject) => {
      output.on('close', () => {
        console.log(`Zip file created: ${zipFilePath}`);
        resolve();
      });
      
      output.on('error', reject);
      archive.on('error', reject);
      
      archive.finalize();
    });

    // Update progress: Completed
    zipProgress.set(jobId, {
      status: 'completed',
      current: renders.length,
      total: renders.length,
      message: 'Zip file ready for download',
      zipFilePath
    });

  } catch (error) {
    console.error('Error in background zip processing:', error);
    zipProgress.set(jobId, {
      status: 'error',
      current: 0,
      total: renders.length,
      message: 'Error creating zip file'
    });
  }
}