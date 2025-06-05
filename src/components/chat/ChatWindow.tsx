"use client";

import { useEffect, useRef, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessage } from '@/types';
import { useChat } from './ChatProvider';
import { useSession } from '@/lib/auth/auth-client';
import { format } from 'date-fns';
import { Smile, MoreHorizontal, Reply } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ChatWindowProps {
  projectId: string;
  taskId?: string | null;
  height?: string;
  className?: string;
}

export function ChatWindow({ projectId, taskId, height = "h-[500px]", className = "" }: ChatWindowProps) {
  const { messages, isLoading, hasMoreMessages, loadMoreMessages } = useChat();
  const { data: session } = useSession();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  // Format message content to render user mentions
  const formatMessageContent = (content: string) => {
    // Regex to match @username-style mentions
    const mentionRegex = /@([a-zA-Z0-9_-]+)/g;
    
    // Split content by mentions
    const parts = content.split(mentionRegex);
    
    if (parts.length <= 1) {
      return <span>{content}</span>;
    }
    
    // Create array of JSX elements with mentions highlighted
    const formattedContent: React.ReactNode[] = [];
    let i = 0;
    
    content.replace(mentionRegex, (match, username) => {
      formattedContent.push(parts[i]);
      formattedContent.push(
        <Badge key={`mention-${i}`} variant="secondary" className="font-normal py-0.5 px-1.5 mx-0.5">
          @{username}
        </Badge>
      );
      i += 2;
      return match;
    });
    
    // Add any remaining text
    if (i < parts.length) {
      formattedContent.push(parts[parts.length - 1]);
    }
    
    return <>{formattedContent}</>;
  };

  // Auto-scroll to bottom when new messages come in
  useEffect(() => {
    if (autoScroll && lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, autoScroll]);

  // Handle scroll events to detect when user scrolls up
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    
    // Check if scrolled to top (for loading more messages)
    if (scrollTop === 0 && hasMoreMessages && !isLoading) {
      loadMoreMessages();
    }
    
    // Auto-scroll control logic
    const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100;
    setAutoScroll(isNearBottom);
    setShowScrollToBottom(!isNearBottom);
  };

  // Scroll to bottom button handler
  const scrollToBottom = () => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: 'smooth' });
      setAutoScroll(true);
      setShowScrollToBottom(false);
    }
  };

  // Group messages by date
  const groupedMessages: { [date: string]: ChatMessage[] } = {};
  messages.forEach(message => {
    const date = new Date(message.createdAt).toLocaleDateString();
    if (!groupedMessages[date]) {
      groupedMessages[date] = [];
    }
    groupedMessages[date].push(message);
  });

  return (
    <div className={`flex flex-col ${height} ${className}`}>
      {/* Message Area */}
      <ScrollArea 
        ref={scrollAreaRef}
        className="flex-1 p-4"
        onScroll={handleScroll}
      >
        {/* Loading indicator for older messages */}
        {isLoading && hasMoreMessages && (
          <div className="flex justify-center py-2">
            <div className="loader w-6 h-6 border-2 border-primary rounded-full border-t-transparent animate-spin"></div>
          </div>
        )}
        
        {/* Empty state */}
        {messages.length === 0 && !isLoading && (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <Smile className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-lg mb-1">No messages yet</h3>
            <p className="text-muted-foreground text-sm">
              Be the first to start the conversation!
            </p>
          </div>
        )}
        
        {/* Messages by date groups */}
        {Object.entries(groupedMessages).map(([date, dateMessages]) => (
          <div key={date} className="space-y-4 mb-6">
            {/* Date separator */}
            <div className="flex items-center justify-center my-4">
              <div className="bg-muted text-muted-foreground text-xs px-2 py-1 rounded">
                {new Date(date).toLocaleDateString(undefined, { 
                  weekday: 'long',
                  month: 'short', 
                  day: 'numeric',
                  year: new Date(date).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                })}
              </div>
            </div>
            
            {/* Messages for this date */}
            {dateMessages.map((message, i) => {
              const isCurrentUser = message.authorId === session?.user?.id;
              const showAvatar = i === 0 || dateMessages[i - 1].authorId !== message.authorId;
              
              return (
                <div 
                  key={message.id} 
                  className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} gap-2 group`}
                  ref={i === dateMessages.length - 1 && date === Object.keys(groupedMessages)[Object.keys(groupedMessages).length - 1] ? lastMessageRef : undefined}
                >
                  {/* Avatar - only show if different from previous sender */}
                  {!isCurrentUser && showAvatar && (
                    <Avatar className="h-8 w-8 mt-1">
                      <AvatarImage src={message.authorImage || undefined} />
                      <AvatarFallback>
                        {message.authorName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  {/* Spacer for consistent alignment when avatar is hidden */}
                  {!isCurrentUser && !showAvatar && <div className="w-8" />}
                  
                  {/* Message bubble */}
                  <div className={`max-w-[75%] ${isCurrentUser ? 'bg-primary text-primary-foreground' : 'bg-muted'} px-3 py-2 rounded-lg`}>
                    {/* Sender name - only show if different from previous sender */}
                    {showAvatar && !isCurrentUser && (
                      <div className="flex items-center mb-1">
                        <span className="text-xs font-medium">{message.authorName}</span>
                        <span className="text-[10px] text-muted-foreground ml-2">
                          {format(new Date(message.createdAt), 'HH:mm')}
                        </span>
                      </div>
                    )}
                    
                    {/* Message content with formatted mentions */}
                    <div className="text-sm whitespace-pre-wrap break-words">
                      {formatMessageContent(message.content)}
                    </div>
                    
                    {/* Timestamp for current user's messages */}
                    {isCurrentUser && (
                      <div className="text-[10px] opacity-70 text-right mt-1">
                        {format(new Date(message.createdAt), 'HH:mm')}
                      </div>
                    )}
                  </div>
                  
                  {/* Message actions */}
                  <div className={`opacity-0 group-hover:opacity-100 transition-opacity flex items-center ${isCurrentUser ? 'order-first' : 'order-last'}`}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align={isCurrentUser ? "end" : "start"}>
                        <DropdownMenuItem>
                          <Reply className="h-4 w-4 mr-2" />
                          Reply
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Smile className="h-4 w-4 mr-2" />
                          React
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </ScrollArea>
      
      {/* Scroll to bottom button */}
      {showScrollToBottom && (
        <Button
          variant="outline"
          size="icon"
          className="absolute bottom-20 right-6 h-10 w-10 rounded-full shadow-md border border-border"
          onClick={scrollToBottom}
        >
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7.5 2C7.77614 2 8 2.22386 8 2.5L8 11.2929L11.1464 8.14645C11.3417 7.95118 11.6583 7.95118 11.8536 8.14645C12.0488 8.34171 12.0488 8.65829 11.8536 8.85355L7.85355 12.8536C7.75979 12.9473 7.63261 13 7.5 13C7.36739 13 7.24021 12.9473 7.14645 12.8536L3.14645 8.85355C2.95118 8.65829 2.95118 8.34171 3.14645 8.14645C3.34171 7.95118 3.65829 7.95118 3.85355 8.14645L7 11.2929L7 2.5C7 2.22386 7.22386 2 7.5 2Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
          </svg>
        </Button>
      )}
    </div>
  );
} 