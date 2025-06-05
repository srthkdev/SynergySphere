import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthenticatedUser } from "@/lib/auth/auth-middleware";
import { createNotification } from "@/lib/notifications";
import { db } from "@/lib/db";
import { project, task } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// POST /api/notifications/test - Create test notifications for the current user
export const POST = requireAuth(async (req: NextRequest, user: AuthenticatedUser) => {
  try {
    const body = await req.json();
    const { type = "all" } = body;

    // Get user's first project for realistic notifications
    const [userProject] = await db
      .select({ id: project.id, name: project.name })
      .from(project)
      .where(eq(project.createdById, user.id))
      .limit(1);

    // Get user's first task for realistic notifications
    const [userTask] = await db
      .select({ id: task.id, title: task.title })
      .from(task)
      .where(eq(task.createdById, user.id))
      .limit(1);

    const notifications = [];

    if (type === "all" || type === "project") {
      // Project-related notifications
      notifications.push(
        {
          userId: user.id,
          message: `Welcome to SynergySphere! You've been added to the project "${userProject?.name || 'Demo Project'}"`,
          type: "project_member_added",
          projectId: userProject?.id,
        },
        {
          userId: user.id,
          message: `New message in project "${userProject?.name || 'Demo Project'}": "Meeting scheduled for tomorrow at 2 PM"`,
          type: "project_message",
          projectId: userProject?.id,
        },
        {
          userId: user.id,
          message: `Project "${userProject?.name || 'Demo Project'}" milestone 'Phase 1' has been completed`,
          type: "project_update",
          projectId: userProject?.id,
        }
      );
    }

    if (type === "all" || type === "task") {
      // Task-related notifications
      notifications.push(
        {
          userId: user.id,
          message: `You have been assigned a new task: "${userTask?.title || 'Update user interface design'}"`,
          type: "task_assigned",
          projectId: userProject?.id,
          taskId: userTask?.id,
        },
        {
          userId: user.id,
          message: `Task "${userTask?.title || 'Database optimization'}" status updated to IN_PROGRESS`,
          type: "task_update",
          projectId: userProject?.id,
          taskId: userTask?.id,
        },
        {
          userId: user.id,
          message: `Task "${userTask?.title || 'Code Review'}" is due in 2 days`,
          type: "task_due_soon",
          projectId: userProject?.id,
          taskId: userTask?.id,
        },
        {
          userId: user.id,
          message: `Task "Fix critical bug" is due today in project "${userProject?.name || 'Demo Project'}"`,
          type: "task_due_soon",
          projectId: userProject?.id,
          taskId: userTask?.id,
        },
        {
          userId: user.id,
          message: `Task "Submit report" is due tomorrow in project "${userProject?.name || 'Demo Project'}"`,
          type: "task_due_soon",
          projectId: userProject?.id,
          taskId: userTask?.id,
        }
      );
    }

    if (type === "all" || type === "chat") {
      // Chat/mention notifications
      notifications.push(
        {
          userId: user.id,
          message: `Someone mentioned you in project chat: "@${user.name} can you review this?"`,
          type: "chat_mention",
          projectId: userProject?.id,
        },
        {
          userId: user.id,
          message: `You have been mentioned in a team discussion about project planning`,
          type: "mention",
          projectId: userProject?.id,
        }
      );
    }

    if (type === "all" || type === "system") {
      // System notifications
      notifications.push(
        {
          userId: user.id,
          message: "System maintenance scheduled for this weekend. No downtime expected.",
          type: "info",
        },
        {
          userId: user.id,
          message: "Your profile has been successfully updated",
          type: "success",
        },
        {
          userId: user.id,
          message: "Please update your password for security",
          type: "warning",
        }
      );
    }

    // Create all notifications
    const createdNotifications = [];
    for (const notifData of notifications) {
      const newNotification = await createNotification(notifData);
      createdNotifications.push(newNotification);
    }

    return NextResponse.json({
      message: `Created ${createdNotifications.length} test notifications`,
      notifications: createdNotifications
    }, { status: 201 });

  } catch (error) {
    console.error("Error creating test notifications:", error);
    return NextResponse.json({ error: "Failed to create test notifications" }, { status: 500 });
  }
}); 