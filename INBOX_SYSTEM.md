# SynergySphere Inbox System

## Overview

The SynergySphere Inbox System is a comprehensive notification and messaging system that keeps users informed about project activities, task assignments, and team communications. It consists of both backend API endpoints and a modern frontend interface.

## Database Schema

### Notification Table
```sql
CREATE TABLE notification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  projectId UUID REFERENCES project(id) ON DELETE CASCADE,
  taskId UUID REFERENCES task(id) ON DELETE CASCADE,
  isRead BOOLEAN NOT NULL DEFAULT false,
  createdAt TIMESTAMP NOT NULL DEFAULT NOW()
);
```

## Notification Types

The system supports various notification types with different priority levels:

### High Priority
- `task_due_soon` - Task is approaching deadline
- `deadline` - General deadline notifications
- `error` - System error notifications

### Medium Priority
- `task_assigned` - User assigned to a task
- `chat_mention` - User mentioned in chat
- `project_member_added` - User added to project
- `warning` - Warning notifications

### Low Priority
- `project_message` - New message in project chat
- `task_update` - Task status/details updated
- `project_update` - Project information updated
- `info` - General information
- `success` - Success notifications

## Backend API Endpoints

### 1. Get Notifications
```
GET /api/notifications
Query params:
- unread=true (optional) - Get only unread notifications
```

### 2. Mark Notifications as Read
```
POST /api/notifications/mark-read
Body:
{
  "notificationIds": ["id1", "id2"], // Optional: specific IDs
  "markAllAsRead": true // Optional: mark all unread as read
}
```

### 3. Create Test Notifications
```
POST /api/notifications/test
Body:
{
  "type": "all" | "project" | "task" | "chat" | "system"
}
```

## Notification Triggers

### Automatic Notification Creation

1. **Project Member Addition**
   - When: User is added to a project
   - Recipient: The newly added user
   - Type: `project_member_added`
   - Location: `/api/projects/[id]/members` (POST)

2. **Task Assignment**
   - When: Task is assigned to a user
   - Recipient: The assigned user (if different from creator)
   - Type: `task_assigned`
   - Locations:
     - `/api/tasks` (POST, PUT)
     - `/api/projects/[id]/tasks` (POST)
     - `/api/projects/[id]/tasks/[taskId]` (PUT)
     - `/api/tasks/[id]` (PUT)

3. **Task Status Updates**
   - When: Task status is changed
   - Recipient: Task assignee (if different from updater)
   - Type: `task_update`
   - Locations: Same as task assignment

4. **Chat Mentions**
   - When: User is mentioned in project chat
   - Recipient: Mentioned user
   - Type: `chat_mention`
   - Location: `/api/chat/messages` (POST)

5. **Project Messages**
   - When: New message posted in project chat
   - Recipient: All project members (except author and mentioned users)
   - Type: `project_message`
   - Location: `/api/chat/messages` (POST)

## Frontend Interface

### Location
`/src/app/(dashboard)/inbox/page.tsx`

### Features

1. **Statistics Dashboard**
   - Total notifications count
   - Unread notifications count
   - High priority notifications
   - This week's notifications

2. **Tabbed Interface**
   - Notifications tab with unread badge
   - Chat Messages tab with mention badge

3. **Filtering Options**
   - Search by content
   - Filter by status (All, Unread, High Priority)

4. **Notification Management**
   - Mark individual notifications as read
   - Mark all notifications as read
   - Refresh notifications
   - Add test notifications (development)

5. **Visual Indicators**
   - Priority badges (High, Medium, Low)
   - Notification type icons
   - Unread status indicators
   - Time stamps

## Utility Functions

### Core Functions
Located in `/src/lib/notifications.ts`:

```typescript
// Basic notification creation
createNotification({ userId, message, type, projectId?, taskId? })

// Bulk notification creation
createNotifications([...notifications])

// Helper functions for common scenarios
createTaskAssignmentNotification({ assigneeId, taskTitle, projectName, projectId, taskId })
createTaskUpdateNotification({ userId, taskTitle, newStatus, projectName, projectId, taskId })
createProjectMemberNotification({ userId, projectName, role, projectId })
```

### Notification Types Constants
```typescript
export const NotificationTypes = {
  PROJECT_MEMBER_ADDED: 'project_member_added',
  PROJECT_MESSAGE: 'project_message',
  PROJECT_UPDATE: 'project_update',
  TASK_ASSIGNED: 'task_assigned',
  TASK_UPDATE: 'task_update',
  TASK_DUE_SOON: 'task_due_soon',
  TASK_COMPLETED: 'task_completed',
  CHAT_MENTION: 'chat_mention',
  MENTION: 'mention',
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error'
}
```

## Testing

### Manual Testing
1. Navigate to `/inbox` in the dashboard
2. Click "Add Test Notifications" to generate sample notifications
3. Test filtering, searching, and marking as read
4. Verify different notification types display correctly

### Integration Testing
1. Create a new project and add members → Check for `project_member_added` notifications
2. Create and assign tasks → Check for `task_assigned` notifications
3. Update task status → Check for `task_update` notifications
4. Send chat messages with mentions → Check for `chat_mention` and `project_message` notifications

## Future Enhancements

1. **Real-time Updates**
   - WebSocket integration for live notifications
   - Browser push notifications

2. **Email Notifications**
   - Digest emails for important notifications
   - Configurable email preferences

3. **Advanced Filtering**
   - Filter by date range
   - Filter by project
   - Custom notification preferences

4. **Notification Templates**
   - Customizable message templates
   - Rich text notifications with links

5. **Analytics**
   - Notification engagement metrics
   - User notification preferences

## Architecture Notes

- All notification creation is handled server-side for security and consistency
- Notifications are automatically linked to projects and tasks when relevant
- The system uses optimistic updates on the frontend for better UX
- Database queries are optimized with proper indexing on userId and createdAt
- The frontend gracefully handles loading states and errors 