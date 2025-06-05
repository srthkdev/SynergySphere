import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { attachment } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth, AuthenticatedUser } from "@/lib/auth/auth-middleware";

// DELETE - Remove an attachment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requireAuth(request, async (user: AuthenticatedUser) => {
    try {
      const { id: attachmentId } = await params;

      if (!attachmentId) {
        return NextResponse.json(
          { error: "Attachment ID is required" },
          { status: 400 }
        );
      }

      // Check if the attachment exists and belongs to the user
      const existingAttachment = await db
        .select()
        .from(attachment)
        .where(eq(attachment.id, attachmentId))
        .limit(1);

      if (existingAttachment.length === 0) {
        return NextResponse.json(
          { error: "Attachment not found" },
          { status: 404 }
        );
      }

      // Check if the user has permission to delete this attachment
      if (existingAttachment[0].uploadedById !== user.id) {
        return NextResponse.json(
          { error: "Unauthorized: You can only delete your own attachments" },
          { status: 403 }
        );
      }

      // Delete the attachment
      await db
        .delete(attachment)
        .where(eq(attachment.id, attachmentId));

      return NextResponse.json(
        { message: "Attachment deleted successfully" },
        { status: 200 }
      );
    } catch (error) {
      console.error("Error deleting attachment:", error);
      return NextResponse.json(
        { error: "Failed to delete attachment" },
        { status: 500 }
      );
    }
  });
} 