import { Attachment } from "@/types";

export const convertFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};

export const uploadAttachment = async (
  file: File,
  projectId?: string,
  taskId?: string
): Promise<Attachment> => {
  const base64Data = await convertFileToBase64(file);
  
  const response = await fetch('/api/attachments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      base64Data,
      projectId,
      taskId,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to upload attachment');
  }

  return response.json();
};

export const uploadMultipleAttachments = async (
  files: File[],
  projectId?: string,
  taskId?: string
): Promise<Attachment[]> => {
  const uploadPromises = files.map(file => uploadAttachment(file, projectId, taskId));
  return Promise.all(uploadPromises);
};

export const fetchAttachments = async (
  projectId?: string,
  taskId?: string
): Promise<Attachment[]> => {
  const params = new URLSearchParams();
  if (projectId) params.append('projectId', projectId);
  if (taskId) params.append('taskId', taskId);

  const response = await fetch(`/api/attachments?${params.toString()}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch attachments');
  }

  return response.json();
};

export const deleteAttachment = async (attachmentId: string): Promise<void> => {
  const response = await fetch(`/api/attachments/${attachmentId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete attachment');
  }
};

export const getFileTypeIcon = (fileType: string): string => {
  if (fileType.startsWith('image/')) return '🖼️';
  if (fileType === 'application/pdf') return '📄';
  if (fileType.includes('word') || fileType.includes('document')) return '📝';
  if (fileType.includes('spreadsheet') || fileType.includes('excel')) return '📊';
  if (fileType.includes('presentation') || fileType.includes('powerpoint')) return '📽️';
  if (fileType.startsWith('video/')) return '🎥';
  if (fileType.startsWith('audio/')) return '🎵';
  return '📎';
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const isImageFile = (fileType: string): boolean => {
  return fileType.startsWith('image/');
};

export const createImageThumbnail = (base64Data: string, fileType: string): string => {
  return `data:${fileType};base64,${base64Data}`;
}; 