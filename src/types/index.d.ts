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
  tags?: string[];
  projectManager?: string;
  deadline?: string;
  priority?: "Low" | "Medium" | "High";
  imageUrl?: string;
  status?: 'planning' | 'active' | 'on-hold' | 'completed';
  role?: string; // user's role in the project
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
  id: string; // This is the member ID
  userId: string; // This is the User ID of the member
  name: string;
  email: string;
  image?: string | null;
  role: 'owner' | 'admin' | 'member';
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
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
}

export interface Budget {
  id: string;
  projectId: string;
  totalBudget: number;
  spentAmount: number;
  currency: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetEntry {
  id: string;
  budgetId: string;
  amount: number;
  description: string;
  category: string;
  taskId?: string;
  createdById: string;
  createdAt: string;
}

export interface Attachment {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  base64Data: string;
  projectId?: string;
  taskId?: string;
  uploadedById: string;
  createdAt: string;
}

// Chat Message type for real-time communication
export interface ChatMessage {
  id: string;
  content: string;
  projectId: string;
  taskId?: string | null;
  authorId: string;
  authorName: string;
  authorImage?: string | null;
  createdAt: string;
  updatedAt: string;
  readBy: string[]; // Array of user IDs who have read the message
  reactions?: {
    [reaction: string]: string[]; // reaction type -> array of user IDs
  };
}

// Chat Room type
export interface ChatRoom {
  id: string;
  name: string;
  projectId: string;
  taskId?: string | null;
  participants: string[]; // Array of user IDs
  lastMessage?: ChatMessage;
  lastActivity: string;
  createdAt: string;
  updatedAt: string;
}
