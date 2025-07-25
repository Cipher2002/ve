import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Try to find the file with different extensions
  const renderedVideosDir = path.join(process.cwd(), "public", "rendered-videos");
  const possibleExtensions = ['mp4', 'mov', 'mkv', 'gif', 'webm'];
  
  let videoPath: string | null = null;
  let fileExtension: string | null = null;
  let contentType: string = 'video/mp4';

  // Find the actual file
  for (const ext of possibleExtensions) {
    const testPath = path.join(renderedVideosDir, `${id}.${ext}`);
    if (fs.existsSync(testPath)) {
      videoPath = testPath;
      fileExtension = ext;
      break;
    }
  }

  // Check if file was found
  if (!videoPath || !fileExtension) {
    return new NextResponse("Video not found", { status: 404 });
  }

  // Set appropriate content type based on file extension
  const contentTypeMap: Record<string, string> = {
    'mp4': 'video/mp4',
    'mov': 'video/quicktime',
    'mkv': 'video/x-matroska',
    'gif': 'image/gif',
    'webm': 'video/webm'
  };

  contentType = contentTypeMap[fileExtension] || 'application/octet-stream';

  // Read the file
  const videoBuffer = fs.readFileSync(videoPath);

  // Return the video with appropriate headers for download
  return new NextResponse(videoBuffer, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="rendered-video.${fileExtension}"`,
    },
  });
}