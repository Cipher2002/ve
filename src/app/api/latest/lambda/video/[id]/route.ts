// import { NextRequest, NextResponse } from "next/server";
// import path from "path";
// import fs from "fs";

// export async function GET(
//   request: NextRequest,
//   { params }: { params: Promise<{ id: string }> }
// ) {
//   const { id } = await params;

//   // Get UID from query parameters
//   const { searchParams } = new URL(request.url);
//   const uid = searchParams.get('uid') || 'default-user';

//   // Search in user's directory
//   const userDir = path.join("/home/zanopyai/htdocs/data/video_editor_data", uid);
  
//   // Check if user directory exists
//   if (!fs.existsSync(userDir)) {
//     return new NextResponse("User directory not found", { status: 404 });
//   }

//   const possibleExtensions = ['mp4', 'mov', 'mkv', 'gif', 'webm', 'wav', 'mp3', 'aac'];
  
//   let filePath: string | null = null;
//   let fileExtension: string | null = null;
//   let contentType: string = 'video/mp4';

//   // Search through all project folders for the file
//   try {
//     const projectFolders = fs.readdirSync(userDir, { withFileTypes: true })
//       .filter(dirent => dirent.isDirectory())
//       .map(dirent => dirent.name);

//     // Search in each project folder
//     for (const projectFolder of projectFolders) {
//       const projectPath = path.join(userDir, projectFolder);
      
//       // Check each possible extension
//       for (const ext of possibleExtensions) {
//         const testPath = path.join(projectPath, `${id}.${ext}`);
//         if (fs.existsSync(testPath)) {
//           filePath = testPath;
//           fileExtension = ext;
//           break;
//         }
//       }
      
//       // If file found, break out of project loop
//       if (filePath) break;
//     }
//   } catch (error) {
//     console.error('Error reading user directory:', error);
//     return new NextResponse("Error accessing user files", { status: 500 });
//   }

//   // Check if file was found
//   if (!filePath || !fileExtension) {
//     return new NextResponse("File not found in user projects", { status: 404 });
//   }

//   // Set appropriate content type based on file extension
//   const contentTypeMap: Record<string, string> = {
//     'mp4': 'video/mp4',
//     'mov': 'video/quicktime',
//     'mkv': 'video/x-matroska',
//     'gif': 'image/gif',
//     'webm': 'video/webm',
//     'wav': 'audio/wav',
//     'mp3': 'audio/mpeg',
//     'aac': 'audio/aac'
//   };

//   contentType = contentTypeMap[fileExtension] || 'application/octet-stream';

//   try {
//     // Read the file
//     const fileBuffer = fs.readFileSync(filePath);

//     // Return the file with appropriate headers
//     return new NextResponse(fileBuffer, {
//       headers: {
//         "Content-Type": contentType,
//         "Content-Disposition": `attachment; filename="${id}.${fileExtension}"`,
//       },
//     });
//   } catch (error) {
//     console.error('Error reading file:', error);
//     return new NextResponse("Error reading file", { status: 500 });
//   }
// }