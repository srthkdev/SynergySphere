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

/**
 * Creates multiple notifications in a single transaction
 */
export async function createNotifications(
  notifications: Array<{
    userId: string;
    message: string;
    type: string;
    projectId?: string;
    taskId?: string;
  }>
) {
  try {
    const newNotifications = await db
      .insert(notification)
      .values(notifications.map(notif => ({
        ...notif,
        isRead: false
      })))
      .returning();
    
    return newNotifications;
  } catch (error) {
    console.error("Error creating notifications:", error);
    throw new Error("Failed to create notifications");
  }
}

/**
 * Common notification types and their message templates
 */
export const NotificationTypes = {
  // Project notifications
  PROJECT_MEMBER_ADDED: 'project_member_added',
  PROJECT_MESSAGE: 'project_message',
  PROJECT_UPDATE: 'project_update',
  
  // Task notifications
  TASK_ASSIGNED: 'task_assigned',
  TASK_UPDATE: 'task_update',
  TASK_DUE_SOON: 'task_due_soon',
  TASK_COMPLETED: 'task_completed',
  
  // Chat notifications
  CHAT_MENTION: 'chat_mention',
  MENTION: 'mention',
  
  // System notifications
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error'
} as const;

/**
 * Helper function to create a task assignment notification
 */
export async function createTaskAssignmentNotification({
  assigneeId,
  taskTitle,
  projectName,
  projectId,
  taskId
}: {
  assigneeId: string;
  taskTitle: string;
  projectName: string;
  projectId: string;
  taskId: string;
}) {
  return createNotification({
    userId: assigneeId,
    message: `You have been assigned to task "${taskTitle}" in project "${projectName}"`,
    type: NotificationTypes.TASK_ASSIGNED,
    projectId,
    taskId,
  });
}

/**
 * Helper function to create a task status update notification
 */
export async function createTaskUpdateNotification({
  userId,
  taskTitle,
  newStatus,
  projectName,
  projectId,
  taskId
}: {
  userId: string;
  taskTitle: string;
  newStatus: string;
  projectName: string;
  projectId: string;
  taskId: string;
}) {
  return createNotification({
    userId,
    message: `Task "${taskTitle}" status has been updated to "${newStatus}" in project "${projectName}"`,
    type: NotificationTypes.TASK_UPDATE,
    projectId,
    taskId,
  });
}

/**
 * Helper function to create a project member added notification
 */
export async function createProjectMemberNotification({
  userId,
  projectName,
  role,
  projectId
}: {
  userId: string;
  projectName: string;
  role: string;
  projectId: string;
}) {
  return createNotification({
    userId,
    message: `You have been added to the project "${projectName}" as a ${role}`,
    type: NotificationTypes.PROJECT_MEMBER_ADDED,
    projectId,
  });
} 