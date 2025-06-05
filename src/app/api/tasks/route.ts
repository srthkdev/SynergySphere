import { db } from "@/lib/db";
import { task, project, projectMember, user } from "@/lib/db/schema";
import { NextRequest, NextResponse } from "next/server";
import { eq, and, inArray } from "drizzle-orm";
import { requireAuth, AuthenticatedUser } from "@/lib/auth/auth-middleware";
import { validateRequestBody, createTaskSchema, updateTaskSchema } from "@/lib/validation";
import { canAccessProject } from "@/lib/project-auth";
import { createNotification } from "@/lib/notifications";
import { Task } from '@/types';
import { getTaskPriorityInfo } from '@/lib/task-prioritization';

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
      estimatedHours: task.estimatedHours
    })
    .from(task)
    .leftJoin(project, eq(task.projectId, project.id))
    .where(inArray(task.projectId, projectIds))
    .orderBy(task.createdAt);

    // Convert dates to ISO strings and calculate priority info
    const tasksWithPriority = tasks.map(dbTask => {
      // Convert DB task to our Task type
      const taskWithDates: Task = {
        id: dbTask.id,
        title: dbTask.title,
        description: dbTask.description || undefined,
        status: dbTask.status,
        priority: dbTask.priority as Task['priority'],
        dueDate: dbTask.dueDate?.toISOString() || null,
        estimatedHours: dbTask.estimatedHours ? parseFloat(dbTask.estimatedHours) : null,
        projectId: dbTask.projectId,
        createdAt: dbTask.createdAt.toISOString(),
        updatedAt: dbTask.updatedAt.toISOString(),
        createdById: dbTask.createdById
      };

      // Convert all tasks
      const allTasksConverted: Task[] = tasks.map(t => ({
        id: t.id,
        title: t.title,
        description: t.description || undefined,
        status: t.status,
        priority: t.priority as Task['priority'],
        dueDate: t.dueDate?.toISOString() || null,
        estimatedHours: t.estimatedHours ? parseFloat(t.estimatedHours) : null,
        projectId: t.projectId,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
        createdById: t.createdById
      }));

      return {
        ...taskWithDates,
        projectName: dbTask.projectName,
        assigneeId: dbTask.assigneeId,
        attachmentUrl: dbTask.attachmentUrl,
        priorityInfo: getTaskPriorityInfo(taskWithDates, allTasksConverted)
      };
    });

    return NextResponse.json(tasksWithPriority);
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

    // Create notification for task assignment
    if (assigneeId && assigneeId !== user.id) {
      // Get project and assignee details
      const [projectInfo] = await db
        .select({ name: project.name })
        .from(project)
        .where(eq(project.id, projectId));

      await createNotification({
        userId: assigneeId,
        message: `You have been assigned a new task "${title}" in project "${projectInfo?.name || 'Unknown Project'}"`,
        type: "task_assigned",
        projectId,
        taskId: newTask.id,
      });
    }

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

    // Get the task to check project access and current assignee
    const [existingTask] = await db
      .select({ 
        projectId: task.projectId, 
        assigneeId: task.assigneeId,
        title: task.title 
      })
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

    // Create notification for assignee change
    if (validation.data.assigneeId && 
        validation.data.assigneeId !== existingTask.assigneeId && 
        validation.data.assigneeId !== user.id) {
      
      // Get project details
      const [projectInfo] = await db
        .select({ name: project.name })
        .from(project)
        .where(eq(project.id, existingTask.projectId));

      await createNotification({
        userId: validation.data.assigneeId,
        message: `You have been assigned to task "${existingTask.title}" in project "${projectInfo?.name || 'Unknown Project'}"`,
        type: "task_assigned",
        projectId: existingTask.projectId,
        taskId: id,
      });
    }

    // Create notification for task status change (for assignee if different from updater)
    if (validation.data.status && existingTask.assigneeId && existingTask.assigneeId !== user.id) {
      await createNotification({
        userId: existingTask.assigneeId,
        message: `Task "${existingTask.title}" status has been updated to "${validation.data.status}"`,
        type: "task_update",
        projectId: existingTask.projectId,
        taskId: id,
      });
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