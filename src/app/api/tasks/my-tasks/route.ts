import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { task, project, user } from "@/lib/db/schema";
import { and, eq, isNull, or, desc } from "drizzle-orm";
import { getUser } from "@/lib/auth-utils";

// GET /api/tasks/my-tasks - Get all tasks assigned to the current user across all projects
export async function GET(req: NextRequest) {
  try {
    const currentUser = await getUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all tasks assigned to the current user
    const myTasks = await db
      .select({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        dueDate: task.dueDate,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        projectId: task.projectId,
        assigneeId: task.assigneeId,
        createdById: task.createdById,
        priority: task.priority,
        attachmentUrl: task.attachmentUrl,
        projectName: project.name,
      })
      .from(task)
      .innerJoin(project, eq(task.projectId, project.id))
      .where(
        // Tasks where the user is explicitly assigned OR created by the user
        or(
          eq(task.assigneeId, currentUser.id),
          eq(task.createdById, currentUser.id)
        )
      )
      .orderBy(desc(task.createdAt));

    return NextResponse.json(myTasks);
  } catch (error) {
    console.error("Error fetching user tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
} 