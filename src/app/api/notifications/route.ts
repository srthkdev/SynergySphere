import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { notification } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getUser } from "@/lib/auth/auth-utils";

// GET /api/notifications - Get user notifications
export async function GET(req: NextRequest) {
  try {
    await Promise.resolve();
    const currentUser = await getUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get("unread") === "true";

    const conditions = [eq(notification.userId, currentUser.id)];
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
}

// POST /api/notifications - Create a notification (for testing purposes)
export async function POST(req: NextRequest) {
  try {
    const { message, type, projectId, taskId } = await req.json();
    const currentUser = await getUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!message || !type) {
      return NextResponse.json({ error: "Message and type are required" }, { status: 400 });
    }

    const [newNotification] = await db
      .insert(notification)
      .values({
        userId: currentUser.id,
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
} 