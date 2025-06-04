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
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    await Promise.resolve();
    const currentUser = await getUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId, taskId } = await params;

    // Check if the current user is a member of the project
    const [member] = await db
      .select()
      .from(projectMember)
      .where(and(eq(projectMember.projectId, projectId), eq(projectMember.userId, currentUser.id)));

    if (!member) {
      return NextResponse.json({ error: "Forbidden: You are not a member of this project" }, { status: 403 });
    }

    // Fetch the specific task
    const [taskData] = await db
      .select()
      .from(task)
      .where(and(eq(task.id, taskId), eq(task.projectId, projectId)));

    if (!taskData) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json(taskData);

  } catch (error) {
    console.error("Error fetching task:", error);
    return NextResponse.json({ error: "Failed to fetch task" }, { status: 500 });
  }
}

// PUT /api/projects/[id]/tasks/[taskId] - Update a specific task
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const { title, description, status, priority, dueDate, assigneeId } = await req.json();
    const currentUser = await getUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId, taskId } = await params;

    // Check if the current user is a member of the project
    const [member] = await db
      .select()
      .from(projectMember)
      .where(and(eq(projectMember.projectId, projectId), eq(projectMember.userId, currentUser.id)));

    if (!member) {
      return NextResponse.json({ error: "Forbidden: You are not a member of this project" }, { status: 403 });
    }

    // Check if task exists and belongs to the project
    const [existingTask] = await db
      .select()
      .from(task)
      .where(and(eq(task.id, taskId), eq(task.projectId, projectId)));

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Update the task
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (assigneeId !== undefined) updateData.assigneeId = assigneeId;

    const [updatedTask] = await db
      .update(task)
      .set(updateData)
      .where(eq(task.id, taskId))
      .returning();

    return NextResponse.json(updatedTask);

  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

// DELETE /api/projects/[id]/tasks/[taskId] - Delete a specific task
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    await Promise.resolve();
    const currentUser = await getUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId, taskId } = await params;

    // Check if the current user is a member of the project (at least member role)
    const [member] = await db
      .select()
      .from(projectMember)
      .where(and(eq(projectMember.projectId, projectId), eq(projectMember.userId, currentUser.id)));

    if (!member) {
      return NextResponse.json({ error: "Forbidden: You are not a member of this project" }, { status: 403 });
    }

    // Check if task exists and belongs to the project
    const [existingTask] = await db
      .select()
      .from(task)
      .where(and(eq(task.id, taskId), eq(task.projectId, projectId)));

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Delete the task
    await db
      .delete(task)
      .where(eq(task.id, taskId));

    return NextResponse.json({ success: true, message: "Task deleted successfully" });

  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
} 