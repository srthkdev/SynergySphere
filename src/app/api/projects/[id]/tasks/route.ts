import db from "@/lib/db";
import { task, project, projectMember } from "@/lib/db/schema";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireAuth, AuthenticatedUser } from "@/lib/auth/auth-middleware";
import { canAccessProject } from "@/lib/project-auth";
import { validateRequestBody, createTaskSchema } from "@/lib/validation";

// GET /api/projects/:id/tasks - Get all tasks for a specific project
export const GET = async (request: NextRequest) => {
  return requireAuth(request, async (user: AuthenticatedUser) => {
    try {
      // Extract the project ID from the URL
      const url = new URL(request.url);
      const segments = url.pathname.split('/');
      const projectId = segments[segments.indexOf('projects') + 1];

      // Check if user can access this project
      const hasAccess = await canAccessProject(user.id, projectId);
      if (!hasAccess) {
        return NextResponse.json({ error: "Access denied to project" }, { status: 403 });
      }

      const projectTasks = await db
        .select({
          id: task.id,
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          dueDate: task.dueDate,
          projectId: task.projectId,
          assigneeId: task.assigneeId,
          createdById: task.createdById,
          createdAt: task.createdAt,
          updatedAt: task.updatedAt,
          attachmentUrl: task.attachmentUrl,
        })
        .from(task)
        .where(eq(task.projectId, projectId))
        .orderBy(task.createdAt);

      return NextResponse.json(projectTasks);
    } catch (error) {
      console.error("Error fetching project tasks:", error);
      return NextResponse.json({ error: "Failed to fetch project tasks" }, { status: 500 });
    }
  });
};

// POST /api/projects/:id/tasks - Create a new task for a specific project
export const POST = async (request: NextRequest) => {
  return requireAuth(request, async (user: AuthenticatedUser) => {
    try {
      // Extract the project ID from the URL
      const url = new URL(request.url);
      const segments = url.pathname.split('/');
      const projectId = segments[segments.indexOf('projects') + 1];
      
      const body = await request.json();

      // Check if user can access this project
      const hasAccess = await canAccessProject(user.id, projectId);
      if (!hasAccess) {
        return NextResponse.json({ error: "Access denied to project" }, { status: 403 });
      }

      // Validate input
      const validation = validateRequestBody(createTaskSchema, { ...body, projectId });
      if (!validation.success) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }

      const { title, description, assigneeId, priority, dueDate } = validation.data;

      // Create the task without checking if assignee is a project member
      // This allows assigning to any valid user ID
      const [newTask] = await db.insert(task).values({
        title,
        description,
        projectId,
        assigneeId: assigneeId || null, // Ensure null if undefined
        createdById: user.id,
        priority,
        dueDate: dueDate ? new Date(dueDate) : null,
      }).returning();

      return NextResponse.json(newTask, { status: 201 });
    } catch (error: any) {
      console.error("Error creating task:", error);
      return NextResponse.json({ 
        error: `Failed to create task: ${error?.message || "Unknown error"}` 
      }, { status: 500 });
    }
  });
}; 