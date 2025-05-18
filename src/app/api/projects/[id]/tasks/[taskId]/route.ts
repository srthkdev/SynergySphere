import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { task, projectMember, taskStatusEnum } from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { getUser } from "@/lib/auth-utils";

// Helper function to check project membership
async function verifyProjectMembership(projectId: string, userId: string) {
  const [member] = await db
    .select()
    .from(projectMember)
    .where(and(eq(projectMember.projectId, projectId), eq(projectMember.userId, userId)));
  return !!member;
}

// GET /api/projects/[id]/tasks/[taskId] - Get a specific task
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; taskId: string } }
) {
  try {
    await Promise.resolve();
    const currentUser = await getUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!await verifyProjectMembership((await params).id, currentUser.id)) {
      return NextResponse.json({ error: "Forbidden: Not a project member" }, { status: 403 });
    }

    const [taskData] = await db
      .select()
      .from(task)
      .where(and(eq(task.id, (await params).taskId), eq(task.projectId, (await params).id)));

    if (!taskData) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    return NextResponse.json(taskData);
  } catch (error) {
    console.error("Error fetching task:", error);
    return NextResponse.json({ error: "Failed to fetch task" }, { status: 500 });
  }
}

// PATCH /api/projects/[id]/tasks/[taskId] - Update a task
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; taskId: string } }
) {
  try {
    const { title, description, status, dueDate, assigneeId } = await req.json();
    const currentUser = await getUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!await verifyProjectMembership((await params).id, currentUser.id)) {
      return NextResponse.json({ error: "Forbidden: Not a project member" }, { status: 403 });
    }

    // Basic validation (more can be added)
    if (status && !taskStatusEnum.enumValues.includes(status)) {
        return NextResponse.json({ error: "Invalid task status" }, { status: 400 });
    }

    const updateValues: Partial<typeof task.$inferInsert> = {};
    if (title !== undefined) updateValues.title = title;
    if (description !== undefined) updateValues.description = description;
    if (status !== undefined) updateValues.status = status;
    if (dueDate !== undefined) updateValues.dueDate = dueDate ? new Date(dueDate) : null;
    if (assigneeId !== undefined) updateValues.assigneeId = assigneeId;
    updateValues.updatedAt = new Date();

    if (Object.keys(updateValues).length === 1 && updateValues.updatedAt) { // Only updatedAt means no actual changes
        return NextResponse.json({ error: "No values to update" }, { status: 400 });
    }

    const [updatedTask] = await db
      .update(task)
      .set(updateValues)
      .where(and(eq(task.id, (await params).taskId), eq(task.projectId, (await params).id)))
      .returning();

    if (!updatedTask) {
      return NextResponse.json({ error: "Task not found or update failed" }, { status: 404 });
    }
    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

// DELETE /api/projects/[id]/tasks/[taskId] - Delete a task
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; taskId: string } }
) {
  try {
    await Promise.resolve();
    const currentUser = await getUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!await verifyProjectMembership((await params).id, currentUser.id)) {
      return NextResponse.json({ error: "Forbidden: Not a project member" }, { status: 403 });
    }
    
    // For now, any project member can delete a task. Could be restricted to assignee/creator/admin.
    const [deletedTask] = await db
      .delete(task)
      .where(and(eq(task.id, (await params).taskId), eq(task.projectId, (await params).id)))
      .returning({ id: task.id });

    if (!deletedTask) {
      return NextResponse.json({ error: "Task not found or delete failed" }, { status: 404 });
    }
    return NextResponse.json({ success: true, deletedTaskId: deletedTask.id });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
} 