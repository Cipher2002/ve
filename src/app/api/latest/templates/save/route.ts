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
    
    // Create user/project folder structure
    const projectPath = path.join('/home/zanopyai/htdocs/data/video_editor_data', uid, projectName);
    
    // Ensure the directory exists
    if (!fs.existsSync(projectPath)) {
      fs.mkdirSync(projectPath, { recursive: true });
    }

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