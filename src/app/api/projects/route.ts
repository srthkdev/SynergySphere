import { db } from "@/lib/db";
import { project, projectMember } from "@/lib/db/schema";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireAuth, AuthenticatedUser } from "@/lib/auth-middleware";
import { getUserProjects, canModifyProject } from "@/lib/project-auth";
import { validateRequestBody, createProjectSchema, updateProjectSchema } from "@/lib/validation";

// GET /api/projects - Get all projects for the authenticated user
export const GET = requireAuth(async (request: NextRequest, user: AuthenticatedUser) => {
  try {
    const projects = await getUserProjects(user.id);
    return NextResponse.json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
});

// POST /api/projects - Create a new project
export const POST = requireAuth(async (request: NextRequest, user: AuthenticatedUser) => {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = validateRequestBody(createProjectSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { name, description } = validation.data;

    const [newProject] = await db.insert(project).values({
      name,
      description,
      createdById: user.id,
    }).returning();

    // Add the creator as the project owner
    await db.insert(projectMember).values({
      projectId: newProject.id,
      userId: user.id,
      role: "owner",
    });

    return NextResponse.json(newProject, { status: 201 });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
});

// PUT /api/projects - Update a project
export const PUT = requireAuth(async (request: NextRequest, user: AuthenticatedUser) => {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Check if user can modify this project
    const canModify = await canModifyProject(user.id, id);
    if (!canModify) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Validate input
    const validation = validateRequestBody(updateProjectSchema, updates);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    
    const [updatedProject] = await db
      .update(project)
      .set({
        ...validation.data,
        updatedAt: new Date(),
      })
      .where(eq(project.id, id))
      .returning();

    if (!updatedProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
});

// DELETE /api/projects - Delete a project
export const DELETE = requireAuth(async (request: NextRequest, user: AuthenticatedUser) => {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Check if user can modify this project
    const canModify = await canModifyProject(user.id, id);
    if (!canModify) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    
    const [deletedProject] = await db
      .delete(project)
      .where(eq(project.id, id))
      .returning();

    if (!deletedProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}); 