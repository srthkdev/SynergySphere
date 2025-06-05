import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }
    
    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "File type not allowed. Only JPG, PNG, and GIF are supported." },
        { status: 400 }
      );
    }
    
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size too large. Maximum size is 5MB." },
        { status: 400 }
      );
    }
    
    // Generate a unique ID for the file
    const fileId = uuidv4();
    
    // Convert the file to base64
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString('base64');
    
    // Create a data URL that can be used directly in img tags
    const dataUrl = `data:${file.type};base64,${base64Data}`;
    
    console.log(`File converted to base64 successfully: ${file.name}`);
    
    return NextResponse.json({ 
      imageUrl: dataUrl,
      base64Data: base64Data,
      success: true,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    }, { status: 201 });
  } catch (error) {
    console.error("Error processing file:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
} 