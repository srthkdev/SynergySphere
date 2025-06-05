import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { attachment } from "@/lib/db/schema";
import { eq, or } from "drizzle-orm";
import { requireAuth, AuthenticatedUser } from "@/lib/auth/auth-middleware";

// GET - Fetch attachments for a project or task
export const GET = requireAuth(async (request: NextRequest, user: AuthenticatedUser) => {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const taskId = searchParams.get("taskId");

    if (!projectId && !taskId) {
      return NextResponse.json(
        { error: "Either projectId or taskId is required" },
        { status: 400 }
      );
    }

    let whereClause;
    if (projectId && taskId) {
      whereClause = or(
        eq(attachment.projectId, projectId),
        eq(attachment.taskId, taskId)
      );
    } else if (projectId) {
      whereClause = eq(attachment.projectId, projectId);
    } else if (taskId) {
      whereClause = eq(attachment.taskId, taskId);
    }

    const attachments = await db
      .select()
      .from(attachment)
      .where(whereClause);

    return NextResponse.json(attachments);
  } catch (error) {
    console.error("Error fetching attachments:", error);
    return NextResponse.json(
      { error: "Failed to fetch attachments" },
      { status: 500 }
    );
  }
});

// POST - Upload a new attachment
export const POST = requireAuth(async (request: NextRequest, user: AuthenticatedUser) => {
  try {
    const body = await request.json();
    const { fileName, fileType, fileSize, base64Data, projectId, taskId } = body;

    // Validate required fields
    if (!fileName || !fileType || !fileSize || !base64Data) {
      return NextResponse.json(
        { error: "Missing required fields: fileName, fileType, fileSize, base64Data" },
        { status: 400 }
      );
    }

    if (!projectId && !taskId) {
      return NextResponse.json(
        { error: "Either projectId or taskId is required" },
        { status: 400 }
      );
    }

    // Check file size limit (10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (fileSize > maxSize) {
      return NextResponse.json(
        { error: "File size exceeds 10MB limit" },
        { status: 400 }
      );
    }

    const newAttachment = await db
      .insert(attachment)
      .values({
        fileName,
        fileType,
        fileSize,
        base64Data,
        projectId: projectId || undefined,
        taskId: taskId || undefined,
        uploadedById: user.id,
      })
      .returning();

    return NextResponse.json(newAttachment[0], { status: 201 });
  } catch (error) {
    console.error("Error uploading attachment:", error);
    return NextResponse.json(
      { error: "Failed to upload attachment" },
      { status: 500 }
    );
  }
}); 