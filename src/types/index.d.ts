export type SiteConfig = {
  name: string;
  title: string;
  description: string;
  origin: string;
  og: string;
  keywords: string[];
  creator: {
    name: string;
    url: string;
  }
  socials: {
    github: string;
    x: string;
  }
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  memberCount: number;
  createdAt: string;
  updatedAt?: string;
}

// Define Task status enum type (mirroring db schema)
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

// Define Task priority type
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

// Add Task type
export interface Task {
  id: string;
  title: string;
  description?: string | null; // Match schema where description can be null
  status: TaskStatus;
  dueDate?: string | null; // Match schema
  projectId: string;
  assigneeId?: string | null; // Match schema
  createdById: string;
  createdAt: string;
  updatedAt: string;
  priority?: TaskPriority | null; // Task priority
  attachmentUrl?: string | null; // URL to attached image
  // Optionally, include assignee details if fetched/joined
  // assignee?: { id: string; name: string; image?: string | null };
}

// Add ProjectMember type
export interface ProjectMember {
  id: string; // This is the User ID of the member
  name: string;
  email: string;
  image?: string | null;
  role: 'admin' | 'member';
  joinedAt: string; // ISO date string
}

// Add Comment type
export interface Comment {
  id: string;
  content: string;
  projectId: string;
  taskId?: string | null;
  parentId?: string | null; // For threaded comments
  authorId: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  authorName?: string; // Joined from user table
  authorImage?: string | null; // Joined from user table
}

// Add Notification type
export interface Notification {
  id: string;
  userId: string;
  message: string;
  type: string; // e.g., "task_assigned", "comment_added", "project_invite"
  projectId?: string | null;
  taskId?: string | null;
  isRead: boolean;
  createdAt: string; // ISO date string
  // Optional: Add a URL or link for navigation when notification is clicked
  link?: string;
}
