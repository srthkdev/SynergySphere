import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { notification } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth, AuthenticatedUser } from "@/lib/auth/auth-middleware";

// GET /api/notifications - Get user notifications
export const GET = requireAuth(async (req: NextRequest, user: AuthenticatedUser) => {
  try {
    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get("unread") === "true";

    const conditions = [eq(notification.userId, user.id)];
    if (unreadOnly) {
      conditions.push(eq(notification.isRead, false));
    }

    const notifications = await db
      .select()
      .from(notification)
      .where(and(...conditions))
      .orderBy(desc(notification.createdAt))
      .limit(50); // Limit to recent 50 notifications

    return NextResponse.json(notifications);

  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
});

// POST /api/notifications - Create a notification (for testing purposes)
export const POST = requireAuth(async (req: NextRequest, user: AuthenticatedUser) => {
  try {
    const { message, type, projectId, taskId, testNotifications } = await req.json();

    // If testNotifications flag is set, create multiple test notifications
    if (testNotifications) {
      const testNotificationData = [
        {
          message: "Welcome to SynergySphere! You've been added to your first project.",
          type: "project_member_added",
        },
        {
          message: "You have been assigned a new task: 'Update user interface design'",
          type: "task_assigned",
        },
        {
          message: "Someone mentioned you in project chat: @" + user.name + " can you review this?",
          type: "chat_mention",
        },
        {
          message: "New message in Project Alpha chat: 'Meeting scheduled for tomorrow at 2 PM'",
          type: "project_message",
        },
        {
          message: "Task 'Database optimization' status updated to IN_PROGRESS",
          type: "task_update",
        },
        {
          message: "Project milestone 'Phase 1' has been completed",
          type: "project_update",
        }
      ];

      const createdNotifications = [];
      for (const notifData of testNotificationData) {
        const [newNotification] = await db
          .insert(notification)
          .values({
            userId: user.id,
            message: notifData.message,
            type: notifData.type,
            projectId: projectId || null,
            taskId: taskId || null,
          })
          .returning();
        createdNotifications.push(newNotification);
      }

      return NextResponse.json({ 
        message: "Test notifications created",
        notifications: createdNotifications 
      }, { status: 201 });
    }

    if (!message || !type) {
      return NextResponse.json({ error: "Message and type are required" }, { status: 400 });
    }

    const [newNotification] = await db
      .insert(notification)
      .values({
        userId: user.id,
        message,
        type,
        projectId: projectId || null,
        taskId: taskId || null,
      })
      .returning();

    return NextResponse.json(newNotification, { status: 201 });

  } catch (error) {
    console.error("Error creating notification:", error);
    return NextResponse.json({ error: "Failed to create notification" }, { status: 500 });
  }
}); 