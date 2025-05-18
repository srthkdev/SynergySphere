import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

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
        { error: "File too large. Maximum size is 5MB." },
        { status: 400 }
      );
    }
    
    // Generate a unique file name with proper extension
    const fileExtension = file.name.split(".").pop() || "";
    const sanitizedExtension = fileExtension.toLowerCase().replace(/[^a-z0-9]/g, "");
    const fileName = `${uuidv4()}.${sanitizedExtension || "png"}`;
    
    // Ensure the uploads directory exists in public folder
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });
    
    // Convert the file to an ArrayBuffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Write the file to the uploads directory
    const filePath = path.join(uploadsDir, fileName);
    await writeFile(filePath, buffer);
    
    // Create a URL path that will work in both development and production
    const fileUrl = `/uploads/${fileName}`;
    
    console.log(`File saved successfully: ${filePath}`);
    console.log(`File URL: ${fileUrl}`);
    
    return NextResponse.json({ 
      imageUrl: fileUrl,
      success: true,
      fileName: fileName,
      fileSize: file.size,
      fileType: file.type
    }, { status: 201 });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
} 