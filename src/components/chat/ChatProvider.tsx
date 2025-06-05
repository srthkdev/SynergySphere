"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import { ChatMessage, ProjectMember } from '@/types';
import { useSession } from '@/lib/auth/auth-client';
import { fetchMessages, fetchProjectMembers, sendMessage } from '@/lib/queries';
import { toast } from 'sonner';

// Define a regex pattern for user mentions
const MENTION_REGEX = /@([a-zA-Z0-9_-]+)/g;

interface ChatContextType {
  messages: ChatMessage[];
  isLoading: boolean;
  error: Error | null;
  sendChatMessage: (content: string, projectId: string, taskId?: string | null) => Promise<void>;
  getMentionSuggestions: (text: string, projectId: string) => Promise<ProjectMember[]>;
  joinChatRoom: (projectId: string, taskId?: string | null) => void;
  leaveChatRoom: (projectId: string, taskId?: string | null) => void;
  currentProjectId: string | null;
  currentTaskId: string | null;
  hasMoreMessages: boolean;
  loadMoreMessages: () => Promise<void>;
  unreadCount: number;
}

const ChatContext = createContext<ChatContextType | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
  const messageCache = useRef<Map<string, ChatMessage[]>>(new Map());
  const olderMessagesIdRef = useRef<string | null>(null);

  // Helper for constructing cache keys
  const getCacheKey = (projectId: string, taskId?: string | null): string => {
    return `${projectId}:${taskId || 'project-level'}`;
  };

  // Join a specific chat room and load its messages
  const joinChatRoom = useCallback(async (projectId: string, taskId?: string | null) => {
    if (!session?.user?.id) return;
    
    setCurrentProjectId(projectId);
    setCurrentTaskId(taskId || null);
    setIsLoading(true);
    setError(null);
    olderMessagesIdRef.current = null;
    
    try {
      // Try to get messages from cache first
      const cacheKey = getCacheKey(projectId, taskId);
      let roomMessages = messageCache.current.get(cacheKey);
      
      // If not in cache or we need to refresh, fetch from API
      if (!roomMessages) {
        roomMessages = await fetchMessages(projectId, taskId);
        messageCache.current.set(cacheKey, roomMessages);
      }
      
      setMessages(roomMessages);
      setHasMoreMessages(roomMessages.length >= 50); // Assuming 50 is the page size
      
      // Get the oldest message ID for pagination
      if (roomMessages.length > 0) {
        olderMessagesIdRef.current = roomMessages[0].id;
      }
      
      // Load project members for @mentions
      const members = await fetchProjectMembers(projectId);
      setProjectMembers(members);
      
    } catch (err) {
      console.error('Error joining chat room:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
      toast.error('Failed to load chat messages');
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  // Leave the current chat room
  const leaveChatRoom = useCallback(() => {
    if (currentProjectId) {
      setCurrentProjectId(null);
      setCurrentTaskId(null);
      setMessages([]);
    }
  }, [currentProjectId, currentTaskId]);

  // Load older messages for infinite scrolling
  const loadMoreMessages = useCallback(async () => {
    if (!currentProjectId || !olderMessagesIdRef.current || isLoading) return;
    
    setIsLoading(true);
    try {
      const olderMessages = await fetchMessages(
        currentProjectId, 
        currentTaskId, 
        50, // page size
        olderMessagesIdRef.current
      );
      
      if (olderMessages.length > 0) {
        // Update the oldest message ID for next pagination
        olderMessagesIdRef.current = olderMessages[0].id;
        
        // Merge with existing messages, avoiding duplicates
        setMessages(prevMessages => {
          const newMessages = olderMessages.filter(
            newMsg => !prevMessages.some(existingMsg => existingMsg.id === newMsg.id)
          );
          return [...newMessages, ...prevMessages].sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        });
        
        // Update cache
        const cacheKey = getCacheKey(currentProjectId, currentTaskId);
        const cachedMessages = messageCache.current.get(cacheKey) || [];
        messageCache.current.set(cacheKey, [...olderMessages, ...cachedMessages]);
        
        setHasMoreMessages(olderMessages.length >= 50);
      } else {
        setHasMoreMessages(false);
      }
    } catch (err) {
      console.error('Error loading more messages:', err);
      toast.error('Failed to load older messages');
    } finally {
      setIsLoading(false);
    }
  }, [currentProjectId, currentTaskId, isLoading]);

  // Process message text to find @mentions and notify users
  const processMessageForMentions = (content: string, projectId: string): string[] => {
    const mentions: string[] = [];
    const matches = content.match(MENTION_REGEX);
    
    if (matches) {
      matches.forEach(match => {
        const username = match.substring(1); // Remove the @ symbol
        const member = projectMembers.find(m => 
          m.name.toLowerCase().replace(/\s+/g, '-') === username.toLowerCase()
        );
        
        if (member) {
          mentions.push(member.userId);
        }
      });
    }
    
    return mentions;
  };

  // Send a chat message
  const sendChatMessage = useCallback(async (content: string, projectId: string, taskId?: string | null) => {
    if (!session?.user?.id) {
      toast.error('You must be logged in to send messages');
      return;
    }
    
    try {
      // Process mentions in the message
      const mentions = processMessageForMentions(content, projectId);
      
      // Call API to send message
      const newMessage = await sendMessage(projectId, content, taskId);
      
      // Add to local state immediately for optimistic UI update
      setMessages(prev => [...prev, newMessage].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      ));
      
      // Update cache
      const cacheKey = getCacheKey(projectId, taskId);
      const cachedMessages = messageCache.current.get(cacheKey) || [];
      messageCache.current.set(cacheKey, [...cachedMessages, newMessage]);
      
    } catch (err) {
      console.error('Error sending message:', err);
      toast.error('Failed to send message');
    }
  }, [session, projectMembers]);

  // Get user mention suggestions based on input text
  const getMentionSuggestions = useCallback(async (text: string, projectId: string): Promise<ProjectMember[]> => {
    if (!text.includes('@')) return [];
    
    try {
      // If we don't have project members yet, fetch them
      let members = projectMembers;
      if (members.length === 0 || currentProjectId !== projectId) {
        members = await fetchProjectMembers(projectId);
        setProjectMembers(members);
      }
      
      // Get the last mention in the text
      const lastMentionIndex = text.lastIndexOf('@');
      const mentionQuery = text.substring(lastMentionIndex + 1).toLowerCase();
      
      // Filter members by the query
      return members.filter(member => 
        member.name.toLowerCase().includes(mentionQuery) || 
        member.email.toLowerCase().includes(mentionQuery)
      );
    } catch (err) {
      console.error('Error getting mention suggestions:', err);
      return [];
    }
  }, [projectMembers, currentProjectId]);

  // The context value
  const contextValue: ChatContextType = {
    messages,
    isLoading,
    error,
    sendChatMessage,
    getMentionSuggestions,
    joinChatRoom,
    leaveChatRoom,
    currentProjectId,
    currentTaskId,
    hasMoreMessages,
    loadMoreMessages,
    unreadCount
  };

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
}

// Custom hook to use the chat context
export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
} 