import { db } from "@/lib/db";
import { notification } from "@/lib/db/schema";

/**
 * Creates a notification in the database
 */
export async function createNotification({
  userId,
  message,
  type,
  projectId,
  taskId
}: {
  userId: string;
  message: string;
  type: string;
  projectId?: string;
  taskId?: string;
}) {
  try {
    const [newNotification] = await db
      .insert(notification)
      .values({
        userId,
        message,
        type,
        projectId,
        taskId,
        isRead: false
      })
      .returning();
    
    return newNotification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw new Error("Failed to create notification");
  }
} 