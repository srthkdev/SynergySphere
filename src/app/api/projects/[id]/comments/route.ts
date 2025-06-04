import { db } from "@/lib/db";
import { comment } from "@/lib/db/schema";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireAuth, AuthenticatedUser } from "@/lib/auth/auth-middleware";
import { canAccessProject } from "@/lib/project-auth";
import { v4 as uuidv4 } from "uuid";

// GET /api/projects/:id/comments - Get all comments for a specific project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requireAuth(request, async (user: AuthenticatedUser) => {
    try {
      const { id: projectId } = await params;

      // Check if user can access this project
      const hasAccess = await canAccessProject(user.id, projectId);
      if (!hasAccess) {
        return NextResponse.json({ error: "Access denied to project" }, { status: 403 });
      }

      const projectComments = await db
        .select()
        .from(comment)
        .where(eq(comment.projectId, projectId))
        .orderBy(comment.createdAt);

      return NextResponse.json(projectComments);
    } catch (error) {
      console.error("Error fetching project comments:", error);
      return NextResponse.json({ error: "Failed to fetch project comments" }, { status: 500 });
    }
  });
}

// POST /api/projects/:id/comments - Create a new comment for a specific project
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requireAuth(request, async (user: AuthenticatedUser) => {
    try {
      const { id: projectId } = await params;
      const { content } = await request.json();

      // Check if user can access this project
      const hasAccess = await canAccessProject(user.id, projectId);
      if (!hasAccess) {
        return NextResponse.json({ error: "Access denied to project" }, { status: 403 });
      }

      if (!content?.trim()) {
        return NextResponse.json({ error: "Comment content is required" }, { status: 400 });
      }

      const [newComment] = await db.insert(comment).values({
        content,
        projectId,
        authorId: user.id,
      }).returning();

      return NextResponse.json(newComment, { status: 201 });
    } catch (error) {
      console.error("Error creating comment:", error);
      return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
    }
  });
} 