import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { chatMessages, projectMember, project, user, notification } from "@/lib/db/schema";
import { and, eq, lt, desc } from "drizzle-orm";
import { z } from "zod";

// Schema for GET request
const GetMessagesSchema = z.object({
  projectId: z.string(),
  taskId: z.string().optional(),
  limit: z.coerce.number().default(50),
  before: z.string().optional(),
});

// Schema for POST request
const SendMessageSchema = z.object({
  projectId: z.string(),
  content: z.string().min(1),
  taskId: z.string().nullable().optional(),
});

export async function GET(req: NextRequest) {
  try {
    // Authenticate user
    const session = await auth.api.getSession({
      headers: await headers()
    });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get query parameters
    const url = new URL(req.url);
    const params = Object.fromEntries(url.searchParams.entries());
    
    // Validate parameters
    const result = GetMessagesSchema.safeParse(params);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid parameters", details: result.error.format() },
        { status: 400 }
      );
    }
    
    const { projectId, taskId, limit, before } = result.data;
    
    // Check if user is a member of the project
    const projectMemberResult = await db
      .select()
      .from(projectMember)
      .where(and(
        eq(projectMember.projectId, projectId),
        eq(projectMember.userId, session.user.id)
      ))
      .limit(1);
    
    if (projectMemberResult.length === 0) {
      return NextResponse.json(
        { error: "You are not a member of this project" },
        { status: 403 }
      );
    }
    
    // Build where conditions for messages
    const conditions = [eq(chatMessages.projectId, projectId)];
    
    if (taskId !== undefined) {
      conditions.push(eq(chatMessages.taskId, taskId));
    }
    
    if (before) {
      conditions.push(lt(chatMessages.createdAt, new Date(before)));
    }
    
    // Fetch messages with author info
    const messages = await db
      .select({
        id: chatMessages.id,
        content: chatMessages.content,
        projectId: chatMessages.projectId,
        taskId: chatMessages.taskId,
        authorId: chatMessages.authorId,
        createdAt: chatMessages.createdAt,
        updatedAt: chatMessages.updatedAt,
        readBy: chatMessages.readBy,
        reactions: chatMessages.reactions,
        authorName: user.name,
        authorImage: user.image,
      })
      .from(chatMessages)
      .innerJoin(user, eq(chatMessages.authorId, user.id))
      .where(and(...conditions))
      .orderBy(desc(chatMessages.createdAt))
      .limit(limit);
    
    // Map to response format
    const formattedMessages = messages.map((message) => ({
      id: message.id,
      content: message.content,
      projectId: message.projectId,
      taskId: message.taskId,
      authorId: message.authorId,
      authorName: message.authorName,
      authorImage: message.authorImage,
      createdAt: message.createdAt.toISOString(),
      updatedAt: message.updatedAt.toISOString(),
      readBy: message.readBy || [],
      reactions: message.reactions || {},
    }));
    
    return NextResponse.json(formattedMessages);
    
  } catch (error) {
    console.error("Error fetching chat messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const session = await auth.api.getSession({
      headers: await headers()
    });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Parse request body
    const body = await req.json();
    
    // Validate request body
    const result = SendMessageSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: result.error.format() },
        { status: 400 }
      );
    }
    
    const { projectId, content, taskId } = result.data;
    
    // Check if user is a member of the project
    const projectMemberResult = await db
      .select()
      .from(projectMember)
      .where(and(
        eq(projectMember.projectId, projectId),
        eq(projectMember.userId, session.user.id)
      ))
      .limit(1);
    
    if (projectMemberResult.length === 0) {
      return NextResponse.json(
        { error: "You are not a member of this project" },
        { status: 403 }
      );
    }
    
    // Create the message
    const [newMessage] = await db
      .insert(chatMessages)
      .values({
        content,
        projectId,
        taskId: taskId || null,
        authorId: session.user.id,
        readBy: [session.user.id], // Mark as read by the author
      })
      .returning();
    
    // Get author info
    const [authorInfo] = await db
      .select({ name: user.name, image: user.image })
      .from(user)
      .where(eq(user.id, session.user.id));
    
    // Check for mentions in the message
    const mentionRegex = /@([a-zA-Z0-9_-]+)/g;
    const mentions = content.match(mentionRegex);
    
    // Get project members for notifications
    const members = await db
      .select({
        userId: projectMember.userId,
        userName: user.name,
      })
      .from(projectMember)
      .innerJoin(user, eq(projectMember.userId, user.id))
      .where(eq(projectMember.projectId, projectId));
    
    // Get project info
    const [projectInfo] = await db
      .select({ name: project.name })
      .from(project)
      .where(eq(project.id, projectId));
    
    if (mentions) {
      // Process each mention
      for (const mention of mentions) {
        const username = mention.substring(1).toLowerCase().trim();
        
        // Find member by normalized name
        const mentionedMember = members.find((member) => 
          member.userName.toLowerCase().replace(/\s+/g, '-') === username
        );
        
        if (mentionedMember && mentionedMember.userId !== session.user.id) {
          // Create notification for mentioned user using correct schema
          await db.insert(notification).values({
            userId: mentionedMember.userId,
            message: `${session.user.name} mentioned you in ${taskId ? 'a task chat' : 'the project chat'}: "${content.substring(0, 100)}${content.length > 100 ? '...' : ''}"`,
            type: "chat_mention",
            projectId,
            taskId: taskId || null,
          });
        }
      }
    }
    
    // Create notifications for all other project members about new messages (except the author and mentioned users)
    const mentionedUserIds = mentions ? members
      .filter(member => mentions.some(mention => 
        member.userName.toLowerCase().replace(/\s+/g, '-') === mention.substring(1).toLowerCase().trim()
      ))
      .map(member => member.userId) : [];
    
    for (const member of members) {
      // Skip the author and already mentioned users
      if (member.userId !== session.user.id && !mentionedUserIds.includes(member.userId)) {
        await db.insert(notification).values({
          userId: member.userId,
          message: `${session.user.name} posted in ${projectInfo?.name || 'project'} ${taskId ? 'task chat' : 'chat'}: "${content.substring(0, 100)}${content.length > 100 ? '...' : ''}"`,
          type: "project_message",
          projectId,
          taskId: taskId || null,
        });
      }
    }
    
    // Format response
    const formattedMessage = {
      id: newMessage.id,
      content: newMessage.content,
      projectId: newMessage.projectId,
      taskId: newMessage.taskId,
      authorId: newMessage.authorId,
      authorName: authorInfo.name,
      authorImage: authorInfo.image,
      createdAt: newMessage.createdAt.toISOString(),
      updatedAt: newMessage.updatedAt.toISOString(),
      readBy: newMessage.readBy || [],
      reactions: newMessage.reactions || {},
    };
    
    return NextResponse.json(formattedMessage);
    
  } catch (error) {
    console.error("Error sending chat message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
} 