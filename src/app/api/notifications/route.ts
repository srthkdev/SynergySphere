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
    const { message, type, projectId, taskId } = await req.json();

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