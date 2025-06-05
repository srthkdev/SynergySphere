import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

// Schema for POST request
const MarkAsReadSchema = z.object({
  messageIds: z.array(z.string()),
});

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Parse request body
    const body = await req.json();
    
    // Validate request body
    const result = MarkAsReadSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: result.error.format() },
        { status: 400 }
      );
    }
    
    const { messageIds } = result.data;
    
    if (messageIds.length === 0) {
      return NextResponse.json({ success: true, count: 0 });
    }
    
    // Update each message to mark as read by the current user
    // Note: In a real implementation, this would use a more efficient batch update
    // depending on your database schema
    let updatedCount = 0;
    
    for (const messageId of messageIds) {
      try {
        // Get the current message to check existing readBy array
        const message = await db.chatMessage.findUnique({
          where: { id: messageId },
          select: { readBy: true },
        });
        
        if (message) {
          // Check if the user has already read this message
          const readBy = message.readBy || [];
          if (!readBy.includes(session.user.id)) {
            // Update the message to add the current user to readBy
            await db.chatMessage.update({
              where: { id: messageId },
              data: {
                readBy: [...readBy, session.user.id],
              },
            });
            updatedCount++;
          }
        }
      } catch (err) {
        console.error(`Error marking message ${messageId} as read:`, err);
        // Continue with other messages
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      count: updatedCount 
    });
    
  } catch (error) {
    console.error("Error marking messages as read:", error);
    return NextResponse.json(
      { error: "Failed to mark messages as read" },
      { status: 500 }
    );
  }
} 