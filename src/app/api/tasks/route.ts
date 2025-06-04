import { db } from "@/lib/db";
import { task, project, projectMember } from "@/lib/db/schema";
import { NextRequest, NextResponse } from "next/server";
import { eq, and, inArray } from "drizzle-orm";
import { requireAuth, AuthenticatedUser } from "@/lib/auth/auth-middleware";
import { validateRequestBody, createTaskSchema, updateTaskSchema } from "@/lib/validation";
import { canAccessProject } from "@/lib/project-auth";

// GET /api/tasks - Get all tasks for projects the user has access to
export const GET = requireAuth(async (request: NextRequest, user: AuthenticatedUser) => {
  try {
    // Get all project IDs the user has access to
    const userProjectMembers = await db
      .select({ projectId: projectMember.projectId })
      .from(projectMember)
      .where(eq(projectMember.userId, user.id));
    
    const projectIds = userProjectMembers.map(pm => pm.projectId);
    
    if (projectIds.length === 0) {
      return NextResponse.json([]);
    }

    const tasks = await db.select({
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
      projectName: project.name,
    })
    .from(task)
    .leftJoin(project, eq(task.projectId, project.id))
    .where(inArray(task.projectId, projectIds))
    .orderBy(task.createdAt);

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
});

// POST /api/tasks - Create a new task
export const POST = requireAuth(async (request: NextRequest, user: AuthenticatedUser) => {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = validateRequestBody(createTaskSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { title, description, projectId, assigneeId, priority, dueDate } = validation.data;

    // Check if user has access to the project
    const hasAccess = await canAccessProject(user.id, projectId);
    if (!hasAccess) {
      return NextResponse.json({ error: "You don't have access to this project" }, { status: 403 });
    }

    const [newTask] = await db.insert(task).values({
      title,
      description,
      projectId,
      assigneeId,
      createdById: user.id,
      priority: priority || "MEDIUM",
      dueDate: dueDate ? new Date(dueDate) : null,
    }).returning();

    return NextResponse.json(newTask, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
});

// PUT /api/tasks - Update a task
export const PUT = requireAuth(async (request: NextRequest, user: AuthenticatedUser) => {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    // Validate input
    const validation = validateRequestBody(updateTaskSchema, updates);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Get the task to check project access
    const [existingTask] = await db
      .select({ projectId: task.projectId })
      .from(task)
      .where(eq(task.id, id));

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Check if user has access to the project
    const hasAccess = await canAccessProject(user.id, existingTask.projectId);
    if (!hasAccess) {
      return NextResponse.json({ error: "You don't have access to this project" }, { status: 403 });
    }

    // Prepare update data with proper type conversion
    const updateData: any = {
      ...validation.data,
      updatedAt: new Date(),
    };

    // Convert dueDate string to Date if provided
    if (updateData.dueDate && typeof updateData.dueDate === 'string') {
      updateData.dueDate = new Date(updateData.dueDate);
    }
    
    const [updatedTask] = await db
      .update(task)
      .set(updateData)
      .where(eq(task.id, id))
      .returning();

    if (!updatedTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    
    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
});

// DELETE /api/tasks - Delete a task
export const DELETE = requireAuth(async (request: NextRequest, user: AuthenticatedUser) => {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    // Get the task to check project access
    const [existingTask] = await db
      .select({ projectId: task.projectId })
      .from(task)
      .where(eq(task.id, id));

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Check if user has access to the project
    const hasAccess = await canAccessProject(user.id, existingTask.projectId);
    if (!hasAccess) {
      return NextResponse.json({ error: "You don't have access to this project" }, { status: 403 });
    }
    
    const [deletedTask] = await db
      .delete(task)
      .where(eq(task.id, id))
      .returning();

    if (!deletedTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}); 