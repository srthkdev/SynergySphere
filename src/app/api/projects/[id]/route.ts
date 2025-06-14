import { db } from "@/lib/db";
import { project } from "@/lib/db/schema";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getUserProjects, canModifyProject } from "@/lib/project-auth";
import { requireAuth, AuthenticatedUser } from "@/lib/auth/auth-middleware";
import { validateRequestBody, updateProjectSchema } from "@/lib/validation";

// GET /api/projects/:id - Get project by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requireAuth(request, async (user: AuthenticatedUser) => {
    try {
      const { id } = await params;
      
      // Check if user has access to this project
      const userProjects = await getUserProjects(user.id);
      const hasAccess = userProjects.some(p => p.id === id);
      
      if (!hasAccess) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }

      const [projectData] = await db
        .select()
        .from(project)
        .where(eq(project.id, id));

      if (!projectData) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
      }

      return NextResponse.json(projectData);
    } catch (error) {
      console.error("Error fetching project:", error);
      return NextResponse.json({ error: "Failed to fetch project" }, { status: 500 });
    }
  });
}

// PUT /api/projects/:id - Update project
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requireAuth(request, async (user: AuthenticatedUser) => {
    try {
      const { id } = await params;
      const body = await request.json();

      // Check if user can modify this project
      const canModify = await canModifyProject(user.id, id);
      if (!canModify) {
        return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
      }

      // Validate input using the updateProjectSchema
      const validation = validateRequestBody(updateProjectSchema, body);
      if (!validation.success) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }

      // Prepare update data
      const updateData: any = {
        ...validation.data,
        updatedAt: new Date(),
      };

      // Convert deadline string to Date if provided
      if (validation.data.deadline !== undefined) {
        updateData.deadline = validation.data.deadline ? new Date(validation.data.deadline) : null;
      }

      const [updatedProject] = await db
        .update(project)
        .set(updateData)
        .where(eq(project.id, id))
        .returning();

      return NextResponse.json(updatedProject);
    } catch (error) {
      console.error("Error updating project:", error);
      return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
    }
  });
}

// DELETE /api/projects/:id - Delete project
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requireAuth(request, async (user: AuthenticatedUser) => {
    try {
      const { id } = await params;
      console.log(`DELETE /api/projects/${id} - User: ${user.id}`);

      // Check if user can modify this project
      const canModify = await canModifyProject(user.id, id);
      console.log(`Can modify project ${id}: ${canModify}`);
      
      if (!canModify) {
        console.log(`Access denied for user ${user.id} to delete project ${id}`);
        return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
      }

      console.log(`Attempting to delete project ${id}...`);
      const result = await db.delete(project).where(eq(project.id, id));
      console.log(`Delete result:`, result);

      console.log(`Project ${id} deleted successfully`);
      return NextResponse.json({ message: "Project deleted successfully" });
    } catch (error) {
      console.error("Error deleting project:", error);
      console.error("Error stack:", error instanceof Error ? error.stack : error);
      return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
    }
  });
} 