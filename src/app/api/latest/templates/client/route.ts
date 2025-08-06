import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid') || 'default';

    const userFolderPath = path.join(process.cwd(), 'users', uid);

    // Check if user directory exists
    if (!fs.existsSync(userFolderPath)) {
      return NextResponse.json([]);
    }

    const templates: any[] = [];

    // Read all project folders for this user
    const projectFolders = fs.readdirSync(userFolderPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    for (const projectName of projectFolders) {
      const projectPath = path.join(userFolderPath, projectName);
      const projectIndexPath = path.join(projectPath, 'project-index.json');

      // Check if project has saves (templates)
      if (fs.existsSync(projectIndexPath)) {
        try {
          const indexContent = fs.readFileSync(projectIndexPath, 'utf-8');
          const projectIndex = JSON.parse(indexContent);
          
          // Look for project save files (templates)
          if (projectIndex.saves && projectIndex.saves.length > 0) {
            // Get the most recent save as the template
            const latestSave = projectIndex.saves[0]; // They should be sorted by newest first
            const saveFilePath = path.join(projectPath, latestSave.fileName);
            
            if (fs.existsSync(saveFilePath)) {
              const saveContent = fs.readFileSync(saveFilePath, 'utf-8');
              const saveData = JSON.parse(saveContent);
              
              // Convert save data to template format
              const template = {
                id: `${uid}-${projectName}`,
                name: projectIndex.projectName || projectName,
                description: `Template from ${projectIndex.projectName || projectName}`,
                createdAt: projectIndex.createdAt,
                updatedAt: projectIndex.lastUpdated || projectIndex.createdAt,
                createdBy: { id: uid, name: "User" },
                category: "Custom",
                tags: ["user-created", "project-template"],
                duration: saveData.duration || 30,
                aspectRatio: saveData.aspectRatio || "16:9",
                overlays: saveData.overlays || [],
                status: projectIndex.status || 'active'
              };
              
              templates.push(template);
            }
          }
        } catch (error) {
          console.error(`Error reading project ${projectName}:`, error);
        }
      }
    }

    // Sort by newest first
    templates.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    return NextResponse.json(templates);
  } catch (error) {
    console.error("Error fetching user templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}