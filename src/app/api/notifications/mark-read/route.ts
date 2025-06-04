import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { notification } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { getUser } from "@/lib/auth-utils";

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