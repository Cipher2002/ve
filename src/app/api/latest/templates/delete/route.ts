import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('id');
    
    if (!templateId) {
      return NextResponse.json(
        { error: "Template ID is required" },
        { status: 400 }
      );
    }

    const templatesPath = path.join(
      process.cwd(),
      "src",
      "app", 
      "versions",
      "7.0.0",
      "templates",
      "full-templates",
      "client-templates"
    );
    
    // Find and delete the template file - try both by ID and by filename
    const files = fs.readdirSync(templatesPath).filter(file => file.endsWith('.json'));

    for (const file of files) {
    const filePath = path.join(templatesPath, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const template = JSON.parse(content);
    
    // Check both the internal ID and if the filename matches the pattern
    const filenameId = file.replace('.json', '');
    
    if (template.id === templateId || filenameId === templateId) {
        fs.unlinkSync(filePath);
        return NextResponse.json({ success: true, message: "Template deleted successfully" });
    }
    }
  } catch (error) {
    console.error("Error deleting template:", error);
    return NextResponse.json(
      { error: "Failed to delete template" },
      { status: 500 }
    );
  }
}