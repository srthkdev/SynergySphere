"use client";

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Smile, Paperclip, AtSign } from 'lucide-react';
import { useChat } from './ChatProvider';
import { ProjectMember } from '@/types';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { useTheme } from 'next-themes';

interface ChatInputProps {
  projectId: string;
  taskId?: string | null;
  placeholder?: string;
  disabled?: boolean;
}

export function ChatInput({ projectId, taskId, placeholder = 'Type a message...', disabled = false }: ChatInputProps) {
  const { sendChatMessage, getMentionSuggestions } = useChat();
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mentionSuggestions, setMentionSuggestions] = useState<ProjectMember[]>([]);
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionIndex, setMentionIndex] = useState(-1);
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { theme } = useTheme();

  // Handle message submission
  const handleSendMessage = async () => {
    if (!message.trim() || disabled || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await sendChatMessage(message, projectId, taskId);
      setMessage('');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle key press events
  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter key sends the message (unless Shift is pressed for new line)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
    
    // @ key triggers mention suggestions
    if (e.key === '@') {
      setCursorPosition(e.currentTarget.selectionStart + 1);
      setTimeout(() => setShowMentionSuggestions(true), 100);
    }
    
    // Handle navigation in mention suggestions
    if (showMentionSuggestions) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionIndex(prev => Math.min(prev + 1, mentionSuggestions.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowMentionSuggestions(false);
      } else if (e.key === 'Tab' || e.key === 'Enter') {
        if (mentionIndex >= 0 && mentionSuggestions.length > 0) {
          e.preventDefault();
          handleMentionSelect(mentionSuggestions[mentionIndex]);
        }
      }
    }
  };

  // Monitor message changes to look for mentions
  useEffect(() => {
    const fetchMentionSuggestions = async () => {
      if (!message.includes('@')) {
        setShowMentionSuggestions(false);
        return;
      }
      
      const cursorPos = textareaRef.current?.selectionStart || 0;
      
      // Find the @ symbol before the cursor
      const textBeforeCursor = message.substring(0, cursorPos);
      const lastAtIndex = textBeforeCursor.lastIndexOf('@');
      
      if (lastAtIndex >= 0) {
        const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
        
        // Only show suggestions if we're right after the @ or in the middle of typing a name
        if (textAfterAt.length === 0 || !/\s/.test(textAfterAt)) {
          const suggestions = await getMentionSuggestions(textBeforeCursor, projectId);
          setMentionSuggestions(suggestions);
          setShowMentionSuggestions(suggestions.length > 0);
          setMentionIndex(suggestions.length > 0 ? 0 : -1);
          return;
        }
      }
      
      setShowMentionSuggestions(false);
    };
    
    fetchMentionSuggestions();
  }, [message, cursorPosition, projectId, getMentionSuggestions]);

  // Handle selection of a mention suggestion
  const handleMentionSelect = (member: ProjectMember) => {
    const cursorPos = textareaRef.current?.selectionStart || 0;
    
    // Find the @ symbol before the cursor
    const textBeforeCursor = message.substring(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex >= 0) {
      // Create mention slug from user name (e.g., "John Doe" -> "john-doe")
      const mentionSlug = member.name.toLowerCase().replace(/\s+/g, '-');
      
      // Replace the @partial with @complete-name
      const newMessage = 
        message.substring(0, lastAtIndex) + 
        `@${mentionSlug} ` + 
        message.substring(cursorPos);
      
      setMessage(newMessage);
      
      // Reset mention UI
      setShowMentionSuggestions(false);
      
      // Focus back to textarea and set cursor after the inserted mention
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          const newCursorPos = lastAtIndex + mentionSlug.length + 2; // +2 for @ and space
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
          setCursorPosition(newCursorPos);
        }
      }, 0);
    }
  };

  // Add emoji to message
  const handleEmojiSelect = (emoji: { native: string }) => {
    const cursorPos = textareaRef.current?.selectionStart || message.length;
    const newMessage = 
      message.substring(0, cursorPos) + 
      emoji.native + 
      message.substring(cursorPos);
    
    setMessage(newMessage);
    
    // Focus back to textarea and set cursor after the inserted emoji
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newCursorPos = cursorPos + emoji.native.length;
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  return (
    <div className="border-t p-4 bg-background">
      {/* Mention suggestions */}
      {showMentionSuggestions && (
        <div className="absolute bottom-full mb-2 bg-background border rounded-md shadow-md max-h-[200px] overflow-y-auto z-10 w-[250px]">
          {mentionSuggestions.map((member, index) => (
            <div
              key={member.id}
              className={`flex items-center gap-2 p-2 hover:bg-accent cursor-pointer ${index === mentionIndex ? 'bg-accent' : ''}`}
              onClick={() => handleMentionSelect(member)}
            >
              <Avatar className="h-6 w-6">
                <AvatarImage src={member.image || undefined} />
                <AvatarFallback>{member.name.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{member.name}</p>
                <p className="text-xs text-muted-foreground truncate">{member.role}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="flex items-end gap-2">
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              setCursorPosition(e.target.selectionStart);
            }}
            onKeyDown={handleKeyPress}
            onClick={() => setCursorPosition(textareaRef.current?.selectionStart || 0)}
            placeholder={placeholder}
            className="min-h-[80px] resize-none pr-12"
            disabled={disabled || isSubmitting}
          />
          <div className="absolute bottom-2 right-2 flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              type="button"
              className="h-8 w-8 rounded-full"
              onClick={() => setShowMentionSuggestions(true)}
              title="Mention someone"
            >
              <AtSign className="h-4 w-4" />
            </Button>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  type="button"
                  className="h-8 w-8 rounded-full"
                  title="Add emoji"
                >
                  <Smile className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0 border-none bg-transparent" align="end">
                <Picker 
                  data={data} 
                  onEmojiSelect={handleEmojiSelect}
                  theme={theme === 'dark' ? 'dark' : 'light'}
                  emojiSize={20}
                  emojiButtonSize={28}
                  perLine={8}
                />
              </PopoverContent>
            </Popover>
            
            <Button
              variant="ghost"
              size="icon"
              type="button"
              className="h-8 w-8 rounded-full"
              title="Attach file"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <Button
          onClick={handleSendMessage}
          disabled={!message.trim() || disabled || isSubmitting}
          className="h-10 w-10 rounded-full p-0 flex-shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
} 