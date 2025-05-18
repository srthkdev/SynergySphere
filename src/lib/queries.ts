import { Project, Task, TaskStatus, ProjectMember, Comment } from "@/types";

export const fetchProjects = async (): Promise<Project[]> => {
  const response = await fetch('/api/projects');
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to fetch projects');
  }
  return response.json();
};

export const fetchProjectById = async (projectId: string): Promise<Project> => {
  const response = await fetch(`/api/projects/${projectId}`);
  if (!response.ok) {
    const errorData = await response.json();
    if (response.status === 404) {
      throw new Error(errorData.error || 'Project not found');
    }
    throw new Error(errorData.error || 'Failed to fetch project');
  }
  return response.json();
};

export const fetchTasksByProjectId = async (projectId: string): Promise<Task[]> => {
  const response = await fetch(`/api/projects/${projectId}/tasks`);
  if (!response.ok) {
    const errorData = await response.json();
    console.error(`Error fetching tasks (status ${response.status}):`, errorData);
    throw new Error(errorData.error || `Failed to fetch tasks for project (status: ${response.status})`);
  }
  return response.json();
};

export const createTask = async (
  projectId: string, 
  taskData: Omit<Task, 'id' | 'projectId' | 'createdAt' | 'updatedAt' | 'createdById'>
): Promise<Task> => {
  const response = await fetch(`/api/projects/${projectId}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(taskData),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to create task');
  }
  return response.json();
};

export const updateTask = async (
  projectId: string, 
  taskId: string, 
  taskData: Partial<Omit<Task, 'id' | 'projectId' | 'createdAt' | 'updatedAt' | 'createdById'>>
): Promise<Task> => {
  const response = await fetch(`/api/projects/${projectId}/tasks/${taskId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(taskData),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to update task');
  }
  return response.json();
};

export const deleteTask = async (projectId: string, taskId: string): Promise<{ success: boolean, deletedTaskId: string }> => {
  const response = await fetch(`/api/projects/${projectId}/tasks/${taskId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to delete task');
  }
  return response.json();
};

export const fetchProjectMembers = async (projectId: string): Promise<ProjectMember[]> => {
  const response = await fetch(`/api/projects/${projectId}/members`);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to fetch project members');
  }
  return response.json();
};

export const addProjectMember = async (
  projectId: string, 
  memberData: { email: string; role?: 'admin' | 'member' }
): Promise<ProjectMember> => {
  const response = await fetch(`/api/projects/${projectId}/members`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(memberData),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to add member');
  }
  return response.json();
};

export const removeProjectMember = async (
  projectId: string, 
  memberId: string
): Promise<{ success: boolean, removedUserId: string }> => {
  const response = await fetch(`/api/projects/${projectId}/members/${memberId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to remove member');
  }
  return response.json();
};

export const updateMemberRole = async (
  projectId: string, 
  memberId: string, 
  role: 'admin' | 'member'
): Promise<ProjectMember> => {
  const response = await fetch(`/api/projects/${projectId}/members/${memberId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role }),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to update member role');
  }
  return response.json();
};

export const fetchComments = async (projectId: string, taskId?: string): Promise<Comment[]> => {
  let url = `/api/projects/${projectId}/comments`;
  if (taskId) {
    url += `?taskId=${taskId}`;
  }
  const response = await fetch(url);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to fetch comments');
  }
  return response.json();
};

export const createComment = async (
  projectId: string, 
  commentData: { content: string; taskId?: string | null }
): Promise<Comment> => {
  const response = await fetch(`/api/projects/${projectId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(commentData),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to create comment');
  }
  return response.json();
};

export const updateComment = async (
  commentId: string, 
  content: string
): Promise<Comment> => {
  const response = await fetch(`/api/comments/${commentId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to update comment');
  }
  return response.json();
};

export const deleteComment = async (commentId: string): Promise<{ success: boolean, deletedCommentId: string }> => {
  const response = await fetch(`/api/comments/${commentId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to delete comment');
  }
  return response.json();
};

// We can add more query functions here for other data types (tasks, members, etc.) 