import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { task, project, user, projectMember } from "@/lib/db/schema";
import { and, eq, isNull, or, desc, inArray } from "drizzle-orm";
import { requireAuth, AuthenticatedUser } from "@/lib/auth/auth-middleware";

// GET /api/tasks/my-tasks - Get all tasks assigned to the current user across all projects they have access to
export const GET = requireAuth(async (req: NextRequest, user: AuthenticatedUser) => {
  try {
    // Check if we should include tasks created by the user
    const url = new URL(req.url);
    const includeCreated = url.searchParams.get("includeCreated") === "true";

    // Get all project IDs the user has access to
    const userProjectMembers = await db
      .select({ projectId: projectMember.projectId })
      .from(projectMember)
      .where(eq(projectMember.userId, user.id));
    
    const projectIds = userProjectMembers.map(pm => pm.projectId);
    
    if (projectIds.length === 0) {
      return NextResponse.json([]);
    }

    // Base query conditions
    let conditions = [];
    
    // Always include tasks assigned to the user
    conditions.push(and(
      eq(task.assigneeId, user.id),
      inArray(task.projectId, projectIds)
    ));
    
    // Optionally include tasks created by the user
    if (includeCreated) {
      conditions.push(and(
        eq(task.createdById, user.id),
        inArray(task.projectId, projectIds)
      ));
    }

    // Get tasks based on the conditions
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
        // Use the conditions array with OR operator
        or(...conditions)
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
}); 