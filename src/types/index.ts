export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority?: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
  dueDate?: string | null;
  estimatedHours?: number | null;
  projectId?: string;
  assigneeId?: string | null;
  createdAt: string;
  updatedAt: string;
  createdById: string;
  priorityInfo?: {
    priorityLevel: string;
  };
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



export type TaskStatus = Task['status'];
export type TaskPriority = NonNullable<Task['priority']>;

export interface ViewTask {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  priorityLevel: string;
  assignedBy: string;
  assignedByAvatar: string;
  tags: string[];
  progress: number;
  estimatedHours: number;
  loggedHours: number;
  project: string;
  projectId: string;
  dueDate: string | null | undefined;
  createdAt: string;
  updatedAt: string;
  createdById: string;
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

export interface ProjectMember {
  id: string; // This is the member ID
  userId: string; // This is the User ID of the member
  name: string;
  email: string;
  image?: string | null;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string; // ISO date string
}

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