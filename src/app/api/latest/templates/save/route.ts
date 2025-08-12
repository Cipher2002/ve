import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";

export async function POST(request: NextRequest) {
  try {
    const templateData = await request.json();
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid') || 'default';
    
    // Get project name from template data
    const projectName = templateData.name;
    
    // Create user directory path
    const userBasePath = path.join('/home/zanopyai/htdocs/data/video_editor_data', uid);
    fs.mkdirSync(userBasePath, { recursive: true });

    // Load or create projects_id_list.json
    const projectsListPath = path.join(userBasePath, 'projects_id_list.json');
    let projectsList: any = {};

    if (fs.existsSync(projectsListPath)) {
      const projectsListContent = fs.readFileSync(projectsListPath, 'utf-8');
      projectsList = JSON.parse(projectsListContent);
    }

    // Check if project name already exists
    const existingProject = Object.values(projectsList).find((project: any) => 
      project.project_name === projectName
    );
    
    if (existingProject) {
      return NextResponse.json(
        { error: 'Project name already exists' },
        { status: 400 }
      );
    }

    // Generate new project_id using current timestamp
    const timestamp = new Date().toISOString();
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const projectId = `${year}${month}${day}${hours}${minutes}${seconds}`;
    
    // Add to projects list
    projectsList[projectId] = {
      project_id: projectId,
      project_name: projectName,
      time_created_at: timestamp
    };

    // Save updated projects list
    fs.writeFileSync(projectsListPath, JSON.stringify(projectsList, null, 2));
    
    // Create folder structure: users/{uid}/{project_id}/{projectName}
    const projectPath = path.join(userBasePath, projectId, projectName);
    
    // Ensure the directory exists
    fs.mkdirSync(projectPath, { recursive: true });

    // Check if project index exists
    const indexPath = path.join(projectPath, 'project-index.json');
    let projectIndex: any;
    let isUpdate = false;

    if (fs.existsSync(indexPath)) {
      const indexContent = fs.readFileSync(indexPath, 'utf-8');
      projectIndex = JSON.parse(indexContent);
      isUpdate = true;
    } else {
      projectIndex = {
        uid,
        projectName,
        createdAt: new Date().toISOString(),
        status: 'active',
        saves: [],
        renders: [],
      };
    }

    // Create save file
    const saveFileName = `project-${Date.now()}.json`;
    const saveFilePath = path.join(projectPath, saveFileName);
    
    const saveData = {
      ...templateData,
      uid,
      projectName,
      savedAt: new Date().toISOString(),
      type: 'project_save'
    };

    // Write the save file
    fs.writeFileSync(saveFilePath, JSON.stringify(saveData, null, 2));

    // Update project index
    projectIndex.lastUpdated = new Date().toISOString();
    projectIndex.lastSaved = new Date().toISOString();
    projectIndex.saves.unshift({
      fileName: saveFileName,
      timestamp: new Date().toISOString(),
      ...saveData,
    });

    // Write updated index
    fs.writeFileSync(indexPath, JSON.stringify(projectIndex, null, 2));

    return NextResponse.json({ 
      success: true, 
      message: isUpdate ? "Template updated successfully" : "Template saved successfully",
      filename: saveFileName,
      isUpdate
    });
  } catch (error) {
    console.error("Error saving template:", error);
    return NextResponse.json(
      { success: false, message: "Failed to save template" },
      { status: 500 }
    );
  }
}