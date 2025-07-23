import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";

export async function GET() {
  try {
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

    // Check if directory exists
    if (!fs.existsSync(templatesPath)) {
      return NextResponse.json([]);
    }

    // Read all JSON files from the directory
    const files = fs.readdirSync(templatesPath)
      .filter(file => file.endsWith('.json'))
      .map(file => {
        const filePath = path.join(templatesPath, file);
        const content = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(content);
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()); // Sort by newest first

    return NextResponse.json(files);
  } catch (error) {
    console.error("Error fetching client templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}