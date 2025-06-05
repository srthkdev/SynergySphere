import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { notification } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { requireAuth, AuthenticatedUser } from "@/lib/auth/auth-middleware";

// POST /api/notifications/archive - Archive or unarchive notifications
export const POST = requireAuth(async (req: NextRequest, user: AuthenticatedUser) => {
  try {
    const { notificationIds, archive = true, archiveAll = false, unarchiveAll = false } = await req.json();

    if (archiveAll) {
      // Archive all unarchived notifications for the user
      await db
        .update(notification)
        .set({ isArchived: true })
        .where(and(
          eq(notification.userId, user.id),
          eq(notification.isArchived, false)
        ));
      
      return NextResponse.json({ 
        success: true, 
        message: "All notifications archived successfully" 
      });
    }

    if (unarchiveAll) {
      // Unarchive all archived notifications for the user
      await db
        .update(notification)
        .set({ isArchived: false })
        .where(and(
          eq(notification.userId, user.id),
          eq(notification.isArchived, true)
        ));
      
      return NextResponse.json({ 
        success: true, 
        message: "All notifications unarchived successfully" 
      });
    }

    if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
      return NextResponse.json({ error: "Notification IDs are required" }, { status: 400 });
    }

    // Archive/unarchive specific notifications
    await db
      .update(notification)
      .set({ isArchived: archive })
      .where(and(
        eq(notification.userId, user.id),
        inArray(notification.id, notificationIds)
      ));

    return NextResponse.json({ 
      success: true, 
      message: `Notifications ${archive ? 'archived' : 'unarchived'} successfully`,
      archivedIds: notificationIds,
      archived: archive
    });

  } catch (error) {
    console.error("Error archiving notifications:", error);
    return NextResponse.json({ error: "Failed to archive notifications" }, { status: 500 });
  }
}); 