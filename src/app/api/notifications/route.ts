import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { notification, project } from "@/lib/db/schema"; // Assuming project might be needed for context
import { and, desc, eq, isNull, or, inArray } from "drizzle-orm";
import { getUser } from "@/lib/auth-utils";

// GET /api/notifications - Get (optionally unread) notifications for the current user
export async function GET(req: NextRequest) {
  try {
    const currentUser = await getUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const unreadOnly = search(await params).get("unread") === "true";

    const conditions = [eq(notification.userId, currentUser.id)];
    if (unreadOnly) {
      conditions.push(eq(notification.isRead, false));
    }

    const userNotifications = await db
      .select()
      .from(notification)
      .where(and(...conditions))
      .orderBy(desc(notification.createdAt))
      .limit(50); // Add a limit for performance

    return NextResponse.json(userNotifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

// POST /api/notifications/mark-read - Mark notifications as read
export async function POST(req: NextRequest) {
  try {
    const currentUser = await getUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { notificationIds, markAllAsRead } = await req.json();

    if (markAllAsRead) {
      await db
        .update(notification)
        .set({ isRead: true })
        .where(and(eq(notification.userId, currentUser.id), eq(notification.isRead, false)));
      return NextResponse.json({ success: true, message: "All unread notifications marked as read." });
    }

    if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
      return NextResponse.json({ error: "Notification IDs are required" }, { status: 400 });
    }

    // Ensure all provided IDs belong to the current user before updating
    await db
      .update(notification)
      .set({ isRead: true })
      .where(and(
        eq(notification.userId, currentUser.id),
        inArray(notification.id, notificationIds)
      ));

    return NextResponse.json({ success: true, markedIds: notificationIds });
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    return NextResponse.json({ error: "Failed to mark notifications as read" }, { status: 500 });
  }
} 