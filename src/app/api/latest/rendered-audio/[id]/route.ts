import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const renderedAudioDir = path.join(process.cwd(), "public", "rendered-audio");
    
    // Try to find the file with different extensions
    const possibleExtensions = ['wav', 'mp3', 'aac'];
    let filePath: string | null = null;

    // Find the actual file
    for (const ext of possibleExtensions) {
      const testPath = path.join(renderedAudioDir, `${id}.${ext}`);
      if (fs.existsSync(testPath)) {
        filePath = testPath;
        break;
      }
    }

    // Check if file was found
    if (!filePath) {
      return NextResponse.json(
        { error: "Audio file not found" },
        { status: 404 }
      );
    }

    // Delete the file
    fs.unlinkSync(filePath);

    return NextResponse.json({ success: true, message: "Audio file deleted successfully" });
  } catch (error) {
    console.error("Error deleting audio file:", error);
    return NextResponse.json(
      { error: "Failed to delete audio file" },
      { status: 500 }
    );
  }
}