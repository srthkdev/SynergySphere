export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority?: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
  dueDate?: string | null;
  estimatedHours?: number | null;
  projectId?: string;
  createdAt: string;
  updatedAt: string;
  createdById: string;
  priorityInfo?: {
    priorityLevel: string;
  };
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