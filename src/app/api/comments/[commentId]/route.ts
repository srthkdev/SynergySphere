import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { comment, user } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { getUser } from "@/lib/auth-utils";

// PATCH /api/comments/[commentId] - Update a comment
export async function PATCH(
  req: NextRequest,
  { params }: { params: { commentId: string } }
) {
  try {
    await Promise.resolve();
    const currentUser = await getUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const commentId = (await params).commentId;
    const { content } = await req.json();

    if (!content || content.trim() === "") {
      return NextResponse.json({ error: "Comment content cannot be empty" }, { status: 400 });
    }

    const [existingComment] = await db.select().from(comment).where(eq(comment.id, commentId));

    if (!existingComment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    if (existingComment.authorId !== currentUser.id) {
      return NextResponse.json({ error: "Forbidden: You can only edit your own comments" }, { status: 403 });
    }

    const [updatedCommentData] = await db
      .update(comment)
      .set({ content: content.trim(), updatedAt: new Date() })
      .where(eq(comment.id, commentId))
      .returning();
      
    // Join with user to return author info
    const [result] = await db.select({
        id: comment.id,
        content: comment.content,
        projectId: comment.projectId,
        taskId: comment.taskId,
        authorId: comment.authorId,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        authorName: user.name,
        authorImage: user.image,
    }).from(comment).innerJoin(user, eq(comment.authorId, user.id)).where(eq(comment.id, updatedCommentData.id));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error updating comment:", error);
    return NextResponse.json({ error: "Failed to update comment" }, { status: 500 });
  }
}

// DELETE /api/comments/[commentId] - Delete a comment
export async function DELETE(
  req: NextRequest,
  { params }: { params: { commentId: string } }
) {
  try {
    await Promise.resolve();
    const currentUser = await getUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const commentId = (await params).commentId;

    const [existingComment] = await db.select().from(comment).where(eq(comment.id, commentId));

    if (!existingComment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // Allow deleting own comment or if user is project admin (more complex check needed for admin)
    // For now, only allow deleting own comment.
    // TODO: Extend to allow project admins to delete any comment in their project.
    if (existingComment.authorId !== currentUser.id) {
      return NextResponse.json({ error: "Forbidden: You can only delete your own comments" }, { status: 403 });
    }

    await db.delete(comment).where(eq(comment.id, commentId));

    return NextResponse.json({ success: true, deletedCommentId: commentId });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 });
  }
} 