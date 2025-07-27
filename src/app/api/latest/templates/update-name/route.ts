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

    // Extract project name from templateId (format: uid-projectName)
    const oldProjectName = templateId.replace(`${uid}-`, '');
    const oldProjectPath = path.join(process.cwd(), 'users', uid, oldProjectName);
    const newProjectPath = path.join(process.cwd(), 'users', uid, newName);

    // Check if old project exists
    if (!fs.existsSync(oldProjectPath)) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Rename the project folder if name changed
    if (oldProjectName !== newName) {
      if (fs.existsSync(newProjectPath)) {
        return NextResponse.json(
          { error: "Project with this name already exists" },
          { status: 409 }
        );
      }
      fs.renameSync(oldProjectPath, newProjectPath);
    }

    // Update project index
    const indexPath = path.join(newProjectPath, 'project-index.json');
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
        id: `${uid}-${newName}`,
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