import { Project, Task, TaskStatus, ProjectMember, Comment, ChatMessage, ChatRoom } from "@/types";

export const fetchProjects = async (): Promise<Project[]> => {
  try {
    const response = await fetch('/api/projects', { credentials: 'include' });
    console.log('fetchProjects response status:', response.status);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Failed to parse error JSON" }));
      console.error('fetchProjects errorData:', errorData);
      throw new Error(errorData.error || 'Failed to fetch projects');
    }
    const projects = await response.json();
    console.log('fetchProjects data:', projects);
    return projects;
  } catch (error) {
    console.error('Exception in fetchProjects:', error);
    throw error;
  }
};

export const createProject = async (
  projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'memberCount'>
): Promise<Project> => {
  const response = await fetch('/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(projectData),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to create project');
  }
  return response.json();
};

export const updateProject = async (
  projectId: string,
  projectData: Partial<Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'memberCount'>>
): Promise<Project> => {
  const response = await fetch(`/api/projects/${projectId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(projectData),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to update project');
  }
  return response.json();
};

export const deleteProject = async (projectId: string): Promise<{ message: string }> => {
  const response = await fetch(`/api/projects/${projectId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to delete project');
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
  console.log(`Updating task ${taskId} with data:`, taskData);
  
  const response = await fetch(`/api/projects/${projectId}/tasks/${taskId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(taskData),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    console.error('Task update failed:', errorData);
    throw new Error(errorData.error || 'Failed to update task');
  }
  
  const updatedTask = await response.json();
  console.log('Task updated successfully:', updatedTask);
  return updatedTask;
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

export const fetchComments = async (projectId: string, taskId?: string, parentId?: string | null): Promise<Comment[]> => {
  let url = `/api/projects/${projectId}/comments`;
  const params = new URLSearchParams();
  if (taskId) params.append('taskId', taskId);
  if (parentId !== undefined) params.append('parentId', parentId ?? '');
  if ([...params].length > 0) url += `?${params.toString()}`;
  const response = await fetch(url);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to fetch comments');
  }
  return response.json();
};

export const createComment = async (
  projectId: string, 
  commentData: { content: string; taskId?: string | null; parentId?: string | null }
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

export const fetchBudgets = async () => {
  const response = await fetch('/api/budgets', { credentials: 'include' });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Failed to parse error JSON" }));
    throw new Error(errorData.error || 'Failed to fetch budgets');
  }
  return response.json();
};

// Chat API functions
export const fetchMessages = async (
  projectId: string, 
  taskId?: string | null,
  limit: number = 50,
  before?: string
): Promise<ChatMessage[]> => {
  let url = `/api/chat/messages?projectId=${projectId}`;
  if (taskId) url += `&taskId=${taskId}`;
  if (limit) url += `&limit=${limit}`;
  if (before) url += `&before=${before}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to fetch chat messages');
  }
  return response.json();
};

export const sendMessage = async (
  projectId: string,
  content: string,
  taskId?: string | null
): Promise<ChatMessage> => {
  const response = await fetch(`/api/chat/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId, content, taskId }),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to send message');
  }
  return response.json();
};

export const fetchChatRooms = async (): Promise<ChatRoom[]> => {
  const response = await fetch('/api/chat/rooms');
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to fetch chat rooms');
  }
  return response.json();
};

export const markMessagesAsRead = async (
  messageIds: string[]
): Promise<{ success: boolean }> => {
  const response = await fetch(`/api/chat/messages/read`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messageIds }),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to mark messages as read');
  }
  return response.json();
};

export const addReactionToMessage = async (
  messageId: string,
  reaction: string
): Promise<ChatMessage> => {
  const response = await fetch(`/api/chat/messages/${messageId}/reactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reaction }),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to add reaction');
  }
  return response.json();
};

export const removeReactionFromMessage = async (
  messageId: string,
  reaction: string
): Promise<ChatMessage> => {
  const response = await fetch(`/api/chat/messages/${messageId}/reactions`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reaction }),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to remove reaction');
  }
  return response.json();
};

// We can add more query functions here for other data types (tasks, members, etc.) 