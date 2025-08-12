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

    // Extract project name from templateId (format: uid-projectName)
    const projectName = templateId.replace(`${uid}-`, '');
    const projectPath = path.join('/home/zanopyai/htdocs/data/video_editor_data', uid, projectName);

    // Check if project exists
    if (!fs.existsSync(projectPath)) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Delete the entire project folder
    fs.rmSync(projectPath, { recursive: true, force: true });

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