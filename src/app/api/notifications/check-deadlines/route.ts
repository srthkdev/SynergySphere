import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthenticatedUser } from "@/lib/auth/auth-middleware";
import { createNotification, NotificationTypes } from "@/lib/notifications";
import { db } from "@/lib/db";
import { task, project, notification } from "@/lib/db/schema";
import { and, eq, lt, gte, not, inArray } from "drizzle-orm";

// POST /api/notifications/check-deadlines - Check for tasks with approaching deadlines
export const POST = requireAuth(async (req: NextRequest, user: AuthenticatedUser) => {
  try {
    const body = await req.json();
    const { daysAhead = 3, forAllUsers = false } = body;

    // Calculate the date range for deadline checking
    const now = new Date();
    const checkDate = new Date();
    checkDate.setDate(now.getDate() + daysAhead);

    // Build the query conditions
    const conditions = [
      gte(task.dueDate, now), // Due date is in the future
      lt(task.dueDate, checkDate), // Due date is within the specified days
      not(eq(task.status, 'DONE')) // Task is not completed
    ];

    // If not checking for all users, only check tasks assigned to current user
    if (!forAllUsers) {
      conditions.push(eq(task.assigneeId, user.id));
    }

    // Get tasks with approaching deadlines
    const upcomingTasks = await db
      .select({
        id: task.id,
        title: task.title,
        dueDate: task.dueDate,
        assigneeId: task.assigneeId,
        projectId: task.projectId,
        projectName: project.name
      })
      .from(task)
      .leftJoin(project, eq(task.projectId, project.id))
      .where(and(...conditions));

    if (upcomingTasks.length === 0) {
      return NextResponse.json({
        message: "No tasks with approaching deadlines found",
        count: 0
      });
    }

    const createdNotifications = [];

    for (const taskItem of upcomingTasks) {
      if (!taskItem.assigneeId || !taskItem.dueDate) continue;

      // Check if we already sent a deadline notification for this task recently
      const existingNotification = await db
        .select()
        .from(notification)
        .where(and(
          eq(notification.userId, taskItem.assigneeId),
          eq(notification.taskId, taskItem.id),
          eq(notification.type, NotificationTypes.TASK_DUE_SOON)
        ))
        .limit(1);

      // Skip if notification already exists (to avoid spam)
      if (existingNotification.length > 0) {
        continue;
      }

      // Calculate days until due
      const daysUntilDue = Math.ceil(
        (new Date(taskItem.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      const message = daysUntilDue <= 1 
        ? `Task "${taskItem.title}" is due ${daysUntilDue === 0 ? 'today' : 'tomorrow'}${taskItem.projectName ? ` in project "${taskItem.projectName}"` : ''}`
        : `Task "${taskItem.title}" is due in ${daysUntilDue} days${taskItem.projectName ? ` in project "${taskItem.projectName}"` : ''}`;

      const newNotification = await createNotification({
        userId: taskItem.assigneeId,
        message,
        type: NotificationTypes.TASK_DUE_SOON,
        projectId: taskItem.projectId,
        taskId: taskItem.id,
      });

      createdNotifications.push(newNotification);
    }

    return NextResponse.json({
      message: `Created ${createdNotifications.length} deadline notifications`,
      count: createdNotifications.length,
      notifications: createdNotifications
    });

  } catch (error) {
    console.error("Error checking deadlines:", error);
    return NextResponse.json({ error: "Failed to check deadlines" }, { status: 500 });
  }
});

// GET /api/notifications/check-deadlines - Get tasks with approaching deadlines (read-only)
export const GET = requireAuth(async (req: NextRequest, user: AuthenticatedUser) => {
  try {
    const { searchParams } = new URL(req.url);
    const daysAhead = parseInt(searchParams.get('days') || '3');

    const now = new Date();
    const checkDate = new Date();
    checkDate.setDate(now.getDate() + daysAhead);

    // Get tasks with approaching deadlines for current user
    const upcomingTasks = await db
      .select({
        id: task.id,
        title: task.title,
        dueDate: task.dueDate,
        assigneeId: task.assigneeId,
        projectId: task.projectId,
        projectName: project.name,
        status: task.status
      })
      .from(task)
      .leftJoin(project, eq(task.projectId, project.id))
      .where(and(
        eq(task.assigneeId, user.id),
        gte(task.dueDate, now),
        lt(task.dueDate, checkDate),
        not(eq(task.status, 'DONE'))
      ));

    const tasksWithDaysLeft = upcomingTasks.map(taskItem => {
      const daysUntilDue = Math.ceil(
        (new Date(taskItem.dueDate!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      return {
        ...taskItem,
        daysUntilDue
      };
    });

    return NextResponse.json({
      tasks: tasksWithDaysLeft,
      count: tasksWithDaysLeft.length
    });

  } catch (error) {
    console.error("Error getting upcoming deadlines:", error);
    return NextResponse.json({ error: "Failed to get upcoming deadlines" }, { status: 500 });
  }
}); 