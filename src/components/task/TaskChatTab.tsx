"use client";

import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useChat } from "@/components/chat/ChatProvider";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchProjectMembers } from "@/lib/queries";
import { Task } from "@/types";

interface TaskChatTabProps {
  task: Task;
}

export function TaskChatTab({ task }: TaskChatTabProps) {
  const { joinChatRoom, leaveChatRoom } = useChat();
  
  // Fetch project members to show who's in the chat
  const { data: members = [] } = useQuery({
    queryKey: ['projectMembers', task.projectId],
    queryFn: () => fetchProjectMembers(task.projectId),
    enabled: !!task.projectId,
  });

  // Join task chat room on component mount, leave on unmount
  useEffect(() => {
    joinChatRoom(task.projectId, task.id);
    
    return () => {
      leaveChatRoom(task.projectId, task.id);
    };
  }, [task.projectId, task.id, joinChatRoom, leaveChatRoom]);

  return (
    <Card className="h-[500px] flex flex-col">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Team Chat
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {/* Show active team members (first 3) */}
              {members.slice(0, 3).map((member) => (
                <Avatar key={member.id} className="h-6 w-6 border-2 border-white">
                  <AvatarImage src={member.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}`} />
                  <AvatarFallback className="text-xs">
                    {member.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ))}
              
              {/* Show +X if there are more members */}
              {members.length > 3 && (
                <div className="h-6 w-6 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center">
                  <span className="text-xs text-gray-600">+{members.length - 3}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      
      {/* Chat messages */}
      <ChatWindow 
        projectId={task.projectId} 
        taskId={task.id}
        height="h-[350px]"
      />
      
      {/* Chat input */}
      <ChatInput 
        projectId={task.projectId}
        taskId={task.id}
        placeholder="Type a message about this task, use @ to mention team members..."
      />
    </Card>
  );
} 