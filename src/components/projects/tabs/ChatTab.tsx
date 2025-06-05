"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useChat } from "@/components/chat/ChatProvider";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { Users, Clock } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { fetchProjectMembers } from "@/lib/queries";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export function ChatTab({ projectId }: { projectId: string }) {
  const { joinChatRoom, leaveChatRoom } = useChat();
  const [onlineCount, setOnlineCount] = useState(0);
  
  // Fetch project members
  const { data: members = [], isLoading: isMembersLoading } = useQuery({
    queryKey: ['projectMembers', projectId],
    queryFn: () => fetchProjectMembers(projectId),
    enabled: !!projectId,
  });

  // Join project chat room on component mount, leave on unmount
  useEffect(() => {
    joinChatRoom(projectId);
    
    // For demonstration, set random online count
    setOnlineCount(Math.floor(Math.random() * members.length) + 1);
    
    return () => {
      leaveChatRoom(projectId);
    };
  }, [projectId, joinChatRoom, leaveChatRoom, members.length]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Main Chat Area */}
      <div className="md:col-span-2 flex flex-col">
        <Card className="flex-1 shadow-md">
          <CardHeader className="border-b">
            <CardTitle className="text-lg">Team Chat</CardTitle>
          </CardHeader>
          <CardContent className="p-0 h-[600px] flex flex-col">
            {/* Chat messages */}
            <ChatWindow 
              projectId={projectId} 
              height="h-[500px]"
            />
            
            {/* Chat input */}
            <ChatInput 
              projectId={projectId}
              placeholder="Type a message, use @ to mention team members..."
            />
          </CardContent>
        </Card>
      </div>
      
      {/* Sidebar */}
      <div className="space-y-6">
        {/* Team Members */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Team Members
              </CardTitle>
              <Badge variant="outline" className="text-xs">
                {onlineCount} online
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4">
            {isMembersLoading ? (
              // Loading skeletons
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-3.5 w-24" />
                    <Skeleton className="h-2.5 w-16" />
                  </div>
                </div>
              ))
            ) : (
              // Member list
              members.map((member) => {
                const isOnline = Math.random() > 0.5; // Random online status for demo
                return (
                  <div key={member.id} className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar>
                        <AvatarImage src={member.image || undefined} />
                        <AvatarFallback>{member.name.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      {isOnline && (
                        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-white" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium leading-none">{member.name}</p>
                      <p className="text-xs text-muted-foreground">{member.role}</p>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
        
        {/* Recent Activity */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Avatar className="h-7 w-7">
                  <AvatarImage src="https://ui-avatars.com/api/?name=Alice+Johnson&background=3b82f6" />
                  <AvatarFallback>AJ</AvatarFallback>
                </Avatar>
                <div>
                  <p><span className="font-medium">Alice Johnson</span> mentioned you in a message</p>
                  <p className="text-xs text-muted-foreground">10 minutes ago</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Avatar className="h-7 w-7">
                  <AvatarImage src="https://ui-avatars.com/api/?name=Bob+Smith&background=10b981" />
                  <AvatarFallback>BS</AvatarFallback>
                </Avatar>
                <div>
                  <p><span className="font-medium">Bob Smith</span> shared a file in the chat</p>
                  <p className="text-xs text-muted-foreground">1 hour ago</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Avatar className="h-7 w-7">
                  <AvatarImage src="https://ui-avatars.com/api/?name=Carol+Davis&background=ec4899" />
                  <AvatarFallback>CD</AvatarFallback>
                </Avatar>
                <div>
                  <p><span className="font-medium">Carol Davis</span> joined the conversation</p>
                  <p className="text-xs text-muted-foreground">3 hours ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 