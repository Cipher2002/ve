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
    const filePath = path.join(renderedAudioDir, `${id}.wav`);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
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