import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('id');
    const uid = searchParams.get('uid') || 'default';
    
    if (!templateId) {
      return NextResponse.json(
        { error: "Template ID is required" },
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
    
    if (!projectsList[templateId]) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }
    
    const projectName = projectsList[templateId].project_name;
    const projectPath = path.join(userBasePath, templateId, projectName);

    // Check if project exists
    if (!fs.existsSync(projectPath)) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Delete the entire project folder
    fs.rmSync(projectPath, { recursive: true, force: true });
    
    // Remove from projects_id_list.json
    delete projectsList[templateId];
    fs.writeFileSync(projectsListPath, JSON.stringify(projectsList, null, 2));

    return NextResponse.json({ 
      success: true, 
      message: "Template deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting template:", error);
    return NextResponse.json(
      { error: "Failed to delete template" },
      { status: 500 }
    );
  }
}