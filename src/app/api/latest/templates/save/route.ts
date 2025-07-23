import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";

export async function POST(request: NextRequest) {
  try {
    const templateData = await request.json();
    
    // Construct the path to the client templates folder
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

    // Ensure the directory exists
    if (!fs.existsSync(templatesPath)) {
      fs.mkdirSync(templatesPath, { recursive: true });
    }

    // Check if a template with the same name already exists
    let existingFilePath = null;
    let isUpdate = false;

    if (fs.existsSync(templatesPath)) {
      const files = fs.readdirSync(templatesPath).filter(file => file.endsWith('.json'));
      
      for (const file of files) {
        const filePath = path.join(templatesPath, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const existingTemplate = JSON.parse(content);
        
        // Check if template with same name exists
        if (existingTemplate.name === templateData.name) {
          existingFilePath = filePath;
          isUpdate = true;
          // Keep the original ID and creation date for updates
          templateData.id = existingTemplate.id;
          templateData.createdAt = existingTemplate.createdAt;
          // Update the updatedAt timestamp
          templateData.updatedAt = new Date().toISOString();
          break;
        }
      }
    }

    let filename;
    let filePath;

    if (isUpdate && existingFilePath) {
      // Update existing template
      filePath = existingFilePath;
      filename = path.basename(existingFilePath);
    } else {
      // Create new template with project name + timestamp
      const sanitizedName = templateData.name
        .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters
        .replace(/\s+/g, '_') // Replace spaces with underscores
        .toLowerCase(); // Convert to lowercase
      
      filename = `${sanitizedName}_${Date.now()}.json`;
      filePath = path.join(templatesPath, filename);
    }

    // Write the template data to file
    fs.writeFileSync(filePath, JSON.stringify(templateData, null, 2));

    return NextResponse.json({ 
      success: true, 
      message: isUpdate ? "Template updated successfully" : "Template saved successfully",
      filename,
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