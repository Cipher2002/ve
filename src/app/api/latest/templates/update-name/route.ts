import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";

export async function PUT(request: NextRequest) {
  try {
    const { templateId, newName } = await request.json();
    
    if (!templateId || !newName) {
      return NextResponse.json(
        { error: "Template ID and new name are required" },
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

    // Find and update the template file
    const files = fs.readdirSync(templatesPath).filter(file => file.endsWith('.json'));
    
    for (const file of files) {
      const filePath = path.join(templatesPath, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const template = JSON.parse(content);
      
      if (template.id === templateId) {
        // Update the name and updatedAt timestamp
        template.name = newName;
        template.updatedAt = new Date().toISOString();
        
        // Write back to file
        fs.writeFileSync(filePath, JSON.stringify(template, null, 2));
        
        return NextResponse.json({ 
          success: true, 
          message: "Template name updated successfully",
          template 
        });
      }
    }

    return NextResponse.json(
      { error: "Template not found" },
      { status: 404 }
    );
  } catch (error) {
    console.error("Error updating template name:", error);
    return NextResponse.json(
      { error: "Failed to update template name" },
      { status: 500 }
    );
  }
}