import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid') || 'default';

    const userFolderPath = path.join('/home/zanopyai/htdocs/data/video_editor_data', uid);
    const projectsListPath = path.join(userFolderPath, 'projects_id_list.json');

    // Check if user directory exists
    if (!fs.existsSync(userFolderPath)) {
      return NextResponse.json([]);
    }

    const templates: any[] = [];

    // Check if projects_id_list.json exists
    if (!fs.existsSync(projectsListPath)) {
      return NextResponse.json([]);
    }

    // Read projects list
    const projectsListContent = fs.readFileSync(projectsListPath, 'utf-8');
    const projectsList = JSON.parse(projectsListContent);

    // Iterate through each project in the list
    for (const [projectId, projectInfo] of Object.entries(projectsList)) {
      const projectPath = path.join(userFolderPath, projectId);
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
                id: projectId,
                name: projectIndex.projectName || (projectInfo as any).project_name,
                description: `Template from ${projectIndex.projectName || (projectInfo as any).project_name}`,
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
          console.error(`Error reading project ${(projectInfo as any).project_name}:`, error);
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