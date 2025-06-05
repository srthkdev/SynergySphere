import { db } from "@/lib/db";
import { task, project } from "@/lib/db/schema";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireAuth, AuthenticatedUser } from "@/lib/auth/auth-middleware";
import { canAccessProject, canModifyProject } from "@/lib/project-auth";
import { validateRequestBody, updateTaskSchema } from "@/lib/validation";
import { createNotification } from "@/lib/notifications";

// GET /api/tasks/:id - Get task by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requireAuth(request, async (user: AuthenticatedUser) => {
    try {
      const { id } = await params;
      const [foundTask] = await db.select().from(task).where(eq(task.id, id));
      
      if (!foundTask) {
        return NextResponse.json({ error: "Task not found" }, { status: 404 });
      }

      // Check if user can access the project
      const hasAccess = await canAccessProject(user.id, foundTask.projectId);
      if (!hasAccess) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }

      return NextResponse.json(foundTask);
    } catch (error) {
      console.error("Error fetching task:", error);
      return NextResponse.json({ error: "Failed to fetch task" }, { status: 500 });
    }
  });
}

// PUT /api/tasks/:id - Update task
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requireAuth(request, async (user: AuthenticatedUser) => {
    try {
      const { id } = await params;
      const body = await request.json();
      
      // Get the task to check project access - get more details for notifications
      const [existingTask] = await db
        .select({
          id: task.id,
          title: task.title,
          assigneeId: task.assigneeId,
          status: task.status,
          projectId: task.projectId
        })
        .from(task)
        .where(eq(task.id, id));
        
      if (!existingTask) {
        return NextResponse.json({ error: "Task not found" }, { status: 404 });
      }

      // Check if user can access the project
      const hasAccess = await canAccessProject(user.id, existingTask.projectId);
      if (!hasAccess) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }

      // Validate input
      const validation = validateRequestBody(updateTaskSchema, body);
      if (!validation.success) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }

      const updateData: any = {
        updatedAt: new Date(),
      };

      if (validation.data.title !== undefined) updateData.title = validation.data.title;
      if (validation.data.description !== undefined) updateData.description = validation.data.description;
      if (validation.data.status !== undefined) updateData.status = validation.data.status;
      if (validation.data.priority !== undefined) updateData.priority = validation.data.priority;
      if (validation.data.dueDate !== undefined) updateData.dueDate = validation.data.dueDate ? new Date(validation.data.dueDate) : null;
      if (validation.data.assigneeId !== undefined) updateData.assigneeId = validation.data.assigneeId;

      const [updatedTask] = await db
        .update(task)
        .set(updateData)
        .where(eq(task.id, id))
        .returning();

      // Create notifications for task changes
      // Get project details for notifications
      const [projectInfo] = await db
        .select({ name: project.name })
        .from(project)
        .where(eq(project.id, existingTask.projectId));

      // Notification for assignee change
      if (validation.data.assigneeId !== undefined && 
          validation.data.assigneeId !== existingTask.assigneeId && 
          validation.data.assigneeId && 
          validation.data.assigneeId !== user.id) {
        
        await createNotification({
          userId: validation.data.assigneeId,
          message: `You have been assigned to task "${existingTask.title}" in project "${projectInfo?.name || 'Unknown Project'}"`,
          type: "task_assigned",
          projectId: existingTask.projectId,
          taskId: id,
        });
      }

      // Notification for status change (for assignee if different from updater)
      if (validation.data.status !== undefined && 
          validation.data.status !== existingTask.status && 
          existingTask.assigneeId && 
          existingTask.assigneeId !== user.id) {
        
        await createNotification({
          userId: existingTask.assigneeId,
          message: `Task "${existingTask.title}" status has been updated to "${validation.data.status}" in project "${projectInfo?.name || 'Unknown Project'}"`,
          type: "task_update",
          projectId: existingTask.projectId,
          taskId: id,
        });
      }

      return NextResponse.json(updatedTask);
    } catch (error) {
      console.error("Error updating task:", error);
      return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
    }
  });
}

// DELETE /api/tasks/:id - Delete task
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requireAuth(request, async (user: AuthenticatedUser) => {
    try {
      const { id } = await params;
      
      // Get the task to check project access
      const [existingTask] = await db.select().from(task).where(eq(task.id, id));
      if (!existingTask) {
        return NextResponse.json({ error: "Task not found" }, { status: 404 });
      }

      // Check if user can modify the project (only owners/admins can delete tasks)
      const canModify = await canModifyProject(user.id, existingTask.projectId);
      if (!canModify) {
        return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
      }

      const [deletedTask] = await db
        .delete(task)
        .where(eq(task.id, id))
        .returning();

      return NextResponse.json({ message: "Task deleted successfully" });
    } catch (error) {
      console.error("Error deleting task:", error);
      return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
    }
  });
} 