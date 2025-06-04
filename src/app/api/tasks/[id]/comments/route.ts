import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface Comment {
  id: string;
  taskId: string;
  text: string;
  authorName: string;
  authorAvatar: string;
  createdAt: string;
  messageType?: 'text' | 'system' | 'file';
  edited?: boolean;
  editedAt?: string;
}

const commentsFilePath = path.join(process.cwd(), 'data', 'comments.json');

// Ensure data directory exists
const dataDir = path.dirname(commentsFilePath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize comments file if it doesn't exist
if (!fs.existsSync(commentsFilePath)) {
  fs.writeFileSync(commentsFilePath, JSON.stringify([], null, 2));
}

function getComments(): Comment[] {
  try {
    const data = fs.readFileSync(commentsFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading comments:', error);
    return [];
  }
}

function saveComments(comments: Comment[]): void {
  try {
    fs.writeFileSync(commentsFilePath, JSON.stringify(comments, null, 2));
  } catch (error) {
    console.error('Error saving comments:', error);
  }
}

function generateAvatarUrl(name: string): string {
  const colors = ['3b82f6', '10b981', 'f59e0b', 'ef4444', '8b5cf6', 'ec4899'];
  const colorIndex = name.length % colors.length;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${colors[colorIndex]}&color=ffffff`;
}

// GET /api/tasks/:id/comments - Get comments for a task
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params;
    const comments = getComments();
    const taskComments = comments
      .filter(comment => comment.taskId === taskId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    
    return NextResponse.json(taskComments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

// POST /api/tasks/:id/comments - Add a new comment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params;
    const body = await request.json();
    const { text, authorName, messageType = 'text' } = body;
    
    if (!text || !authorName) {
      return NextResponse.json({ error: 'Text and author name are required' }, { status: 400 });
    }

    const comments = getComments();
    
    const newComment: Comment = {
      id: Date.now().toString(),
      taskId,
      text: text.trim(),
      authorName,
      authorAvatar: generateAvatarUrl(authorName),
      createdAt: new Date().toISOString(),
      messageType,
      edited: false
    };

    comments.push(newComment);
    saveComments(comments);
    
    return NextResponse.json(newComment, { status: 201 });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}

// PUT /api/tasks/:id/comments - Update a comment (for editing messages)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params;
    const body = await request.json();
    const { commentId, text } = body;
    
    if (!commentId || !text) {
      return NextResponse.json({ error: 'Comment ID and text are required' }, { status: 400 });
    }

    const comments = getComments();
    const commentIndex = comments.findIndex(c => c.id === commentId && c.taskId === taskId);
    
    if (commentIndex === -1) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    comments[commentIndex] = {
      ...comments[commentIndex],
      text: text.trim(),
      edited: true,
      editedAt: new Date().toISOString()
    };
    
    saveComments(comments);
    
    return NextResponse.json(comments[commentIndex]);
  } catch (error) {
    console.error('Error updating comment:', error);
    return NextResponse.json({ error: 'Failed to update comment' }, { status: 500 });
  }
}

// DELETE /api/tasks/:id/comments - Delete a comment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params;
    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('commentId');
    
    if (!commentId) {
      return NextResponse.json({ error: 'Comment ID is required' }, { status: 400 });
    }

    const comments = getComments();
    const filteredComments = comments.filter(c => !(c.id === commentId && c.taskId === taskId));
    
    if (filteredComments.length === comments.length) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }
    
    saveComments(filteredComments);
    
    return NextResponse.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
  }
} 