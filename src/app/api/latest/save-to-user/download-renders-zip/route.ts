import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import { Readable } from 'stream';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');
    const projectId = searchParams.get('projectId');

    if (!uid || !projectId) {
      return NextResponse.json(
        { error: 'UID and projectId are required' },
        { status: 400 }
      );
    }

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

    // Get project name for zip filename
    const projectsListPath = path.join(userBasePath, 'projects_id_list.json');
    let projectName = `Project_${projectId}`;
    
    if (fs.existsSync(projectsListPath)) {
      const projectsListContent = fs.readFileSync(projectsListPath, 'utf-8');
      const projectsList = JSON.parse(projectsListContent);
      if (projectsList[projectId] && projectsList[projectId].project_name) {
        projectName = projectsList[projectId].project_name;
      }
    }

    // Create a zip archive
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });

    // Create a readable stream from the archive
    const chunks: Buffer[] = [];
    
    archive.on('data', (chunk) => {
      chunks.push(chunk);
    });

    archive.on('error', (err) => {
      console.error('Archive error:', err);
      throw err;
    });

    // Download and add each render file to the zip
    for (const render of renders) {
      try {
        if (render.s3Url && render.renderId && render.format) {
          // Download file from S3 URL
          const response = await fetch(render.s3Url);
          
          if (response.ok) {
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            
            // Add file to zip with proper name
            const fileName = `${render.renderId}.${render.format}`;
            archive.append(buffer, { name: fileName });
          } else {
            console.error(`Failed to download render ${render.renderId}:`, response.statusText);
          }
        }
      } catch (error) {
        console.error(`Error downloading render ${render.renderId}:`, error);
        // Continue with other files even if one fails
      }
    }

    // Finalize the archive
    await new Promise<void>((resolve, reject) => {
      archive.on('end', resolve);
      archive.on('error', reject);
      archive.finalize();
    });

    // Combine all chunks into a single buffer
    const zipBuffer = Buffer.concat(chunks);

    // Clean project name for filename (remove invalid characters)
    const safeProjectName = projectName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const zipFileName = `${safeProjectName}_renders.zip`;

    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Length': zipBuffer.length.toString(),
        'Content-Disposition': `attachment; filename="${zipFileName}"`,
      },
    });

  } catch (error) {
    console.error('Error creating renders zip:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}