import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { comment, projectMember, user } from "@/lib/db/schema";
import { and, desc, eq, asc, sql } from "drizzle-orm";
import { getUser } from "@/lib/auth-utils";
import { v4 as uuidv4 } from "uuid";

// GET /api/projects/[id]/comments
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await Promise.resolve();
    const currentUser = await getUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projectId = params.id;
    const taskId = req.nextUrl.searchParams.get("taskId");

    // Verify user is a member of the project
    const [member] = await db
      .select()
      .from(projectMember)
      .where(and(eq(projectMember.projectId, projectId), eq(projectMember.userId, currentUser.id)));
    if (!member) {
      return NextResponse.json({ error: "Forbidden: Not a project member" }, { status: 403 });
    }

    const conditions = [eq(comment.projectId, projectId)];
    if (taskId) {
      conditions.push(eq(comment.taskId, taskId));
    } else {
      // If no taskId is provided, fetch only project-level comments (taskId is null)
      conditions.push(sql`${comment.taskId} IS NULL`);
    }

    const commentsData = await db
      .select({
        id: comment.id,
        content: comment.content,
        projectId: comment.projectId,
        taskId: comment.taskId,
        authorId: comment.authorId,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        authorName: user.name,
        authorImage: user.image,
      })
      .from(comment)
      .innerJoin(user, eq(comment.authorId, user.id))
      .where(and(...conditions))
      .orderBy(asc(comment.createdAt)); // Show oldest first for typical discussion flow

    return NextResponse.json(commentsData);
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }
}

// POST /api/projects/[id]/comments
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { content, taskId } = await req.json();
    const currentUser = await getUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projectId = params.id;

    if (!content || content.trim() === "") {
      return NextResponse.json({ error: "Comment content cannot be empty" }, { status: 400 });
    }

    // Verify user is a member of the project
    const [member] = await db
      .select()
      .from(projectMember)
      .where(and(eq(projectMember.projectId, projectId), eq(projectMember.userId, currentUser.id)));
    if (!member) {
      return NextResponse.json({ error: "Forbidden: Not a project member" }, { status: 403 });
    }

    const commentId = uuidv4();
    const now = new Date();

    const newCommentData = {
      id: commentId,
      content: content.trim(),
      projectId,
      taskId: taskId || null, // Ensure taskId is null if not provided
      authorId: currentUser.id,
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(comment).values(newCommentData);
    
    // Return the created comment with author info
    const [createdCommentWithAuthor] = await db
      .select({
        id: comment.id,
        content: comment.content,
        projectId: comment.projectId,
        taskId: comment.taskId,
        authorId: comment.authorId,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        authorName: user.name,
        authorImage: user.image,
      })
      .from(comment)
      .innerJoin(user, eq(comment.authorId, user.id))
      .where(eq(comment.id, commentId));

    return NextResponse.json(createdCommentWithAuthor, { status: 201 });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
  }
} 