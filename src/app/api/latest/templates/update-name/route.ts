import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";

export async function PUT(request: NextRequest) {
  try {
    const { templateId, newName } = await request.json();
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid') || 'default';
    
    if (!templateId || !newName) {
      return NextResponse.json(
        { error: "Template ID and new name are required" },
        { status: 400 }
      );
    }

    // Load projects_id_list.json to find project
    const userBasePath = path.join('/home/zanopyai/htdocs/data/video_editor_data', uid);
    const projectsListPath = path.join(userBasePath, 'projects_id_list.json');
    
    if (!fs.existsSync(projectsListPath)) {
      return NextResponse.json(
        { error: "No projects found for this user" },
        { status: 404 }
      );
    }

    const projectsListContent = fs.readFileSync(projectsListPath, 'utf-8');
    let projectsList = JSON.parse(projectsListContent);
    
    let actualProjectId = templateId;
    
    // Handle old format projectId (uid-projectName) - backward compatibility
    if (templateId.includes('-') && !projectsList[templateId]) {
      // Try to find project by name for backward compatibility
      const projectName = templateId.split('-').slice(1).join('-'); // Remove uid part
      const foundProject = Object.entries(projectsList).find(([id, project]: [string, any]) => 
        project.project_name === projectName
      );
      
      if (foundProject) {
        actualProjectId = foundProject[0];
      }
    }
    
    if (!projectsList[actualProjectId]) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }
    
    // Check if new name already exists in any other project
    const existingProject = Object.values(projectsList).find((project: any) => 
      project.project_name === newName && project.project_id !== templateId
    );
    
    if (existingProject) {
      return NextResponse.json(
        { error: "Project with this name already exists" },
        { status: 409 }
      );
    }
    
    const projectPath = path.join(userBasePath, actualProjectId);

    // Check if project exists
    if (!fs.existsSync(projectPath)) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Note: No folder renaming needed since we're not using project name in folder structure

    // Update projects_id_list.json
    projectsList[actualProjectId].project_name = newName;
    fs.writeFileSync(projectsListPath, JSON.stringify(projectsList, null, 2));

    // Update project index
    const indexPath = path.join(projectPath, 'project-index.json');
    if (fs.existsSync(indexPath)) {
      const indexContent = fs.readFileSync(indexPath, 'utf-8');
      const projectIndex = JSON.parse(indexContent);
      
      projectIndex.projectName = newName;
      projectIndex.lastUpdated = new Date().toISOString();
      
      fs.writeFileSync(indexPath, JSON.stringify(projectIndex, null, 2));
    }

    return NextResponse.json({ 
      success: true, 
      message: "Template name updated successfully",
      template: {
        id: actualProjectId,
        name: newName,
        updatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("Error updating template name:", error);
    return NextResponse.json(
      { error: "Failed to update template name" },
      { status: 500 }
    );
  }
}