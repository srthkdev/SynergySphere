'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Bot, 
  User, 
  Send, 
  Loader2, 
  Database, 
  Copy, 
  ThumbsUp, 
  ThumbsDown,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  id: string;
  timestamp?: Date;
  liked?: boolean | null;
  copied?: boolean;
}

export default function AIAgentDBChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m **Synergy Pro**, your AI Project Management Assistant with access to your project data. I can analyze your projects, tasks, team performance, and provide data-driven insights.\n\n🎯 What would you like to explore today?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        setTimeout(() => {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }, 100);
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Listen for quick questions from the sidebar
  useEffect(() => {
    const handleQuickQuestion = (event: CustomEvent) => {
      setInput(event.detail);
      setIsExpanded(true);
      setTimeout(() => textareaRef.current?.focus(), 100);
    };

    window.addEventListener('quickQuestion', handleQuickQuestion as EventListener);
    return () => window.removeEventListener('quickQuestion', handleQuickQuestion as EventListener);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setIsExpanded(false);

    try {
      const response = await fetch('/api/ai-agent-db', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response');
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';

      const assistantId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, {
        id: assistantId,
        role: 'assistant',
        content: '',
        timestamp: new Date()
      }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        assistantMessage += chunk;

        setMessages(prev => prev.map(msg => 
          msg.id === assistantId 
            ? { ...msg, content: assistantMessage }
            : msg
        ));
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `❌ **Error occurred**\n\n${error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.'}`,
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = (messageId: string, liked: boolean) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, liked: msg.liked === liked ? null : liked }
        : msg
    ));
    toast.success(liked ? 'Feedback recorded! 👍' : 'Feedback recorded! 👎');
  };

  const handleCopy = (content: string, messageId: string) => {
    navigator.clipboard.writeText(content);
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, copied: true }
        : msg
    ));
    toast.success('Message copied to clipboard! 📋');
    setTimeout(() => {
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, copied: false }
          : msg
      ));
    }, 2000);
  };

  const formatContent = (content: string) => {
    // Simple markdown-like formatting
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm">$1</code>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <Card className="w-full h-[700px] flex flex-col">
      <CardHeader className="pb-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">AI Assistant</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Natural language queries with database access
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="flex items-center gap-1.5 text-xs">
            <Database className="h-3 w-3" />
            Connected
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 px-4" ref={scrollAreaRef}>
          <div className="space-y-6 py-4">
            {messages.map((message) => (
              <div key={message.id} className="group">
                <div className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0 mt-1">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                  )}
                  
                  <div className={`flex-1 max-w-[85%] md:max-w-[80%] ${message.role === 'user' ? 'ml-8 md:ml-12' : 'mr-8 md:mr-12'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium text-gray-600">
                        {message.role === 'assistant' ? 'Assistant' : 'You'}
                      </span>
                      <span className="text-xs text-gray-400">
                        {message.timestamp?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    
                    <div className={`rounded-2xl px-4 py-3 relative ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white ml-auto'
                        : 'bg-gray-50 text-gray-900 border'
                    }`}>
                      <div 
                        className="text-sm leading-relaxed"
                        dangerouslySetInnerHTML={{ 
                          __html: message.role === 'assistant' ? formatContent(message.content) : message.content 
                        }}
                      />
                    </div>

                    {/* Message Actions */}
                    {message.role === 'assistant' && message.content && (
                      <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => handleCopy(message.content, message.id)}
                        >
                          {message.copied ? <CheckCircle2 className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-7 px-2 text-xs ${message.liked === true ? 'text-green-600' : ''}`}
                          onClick={() => handleLike(message.id, true)}
                        >
                          <ThumbsUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-7 px-2 text-xs ${message.liked === false ? 'text-red-600' : ''}`}
                          onClick={() => handleLike(message.id, false)}
                        >
                          <ThumbsDown className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0 mt-1">
                      <User className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-4 justify-start">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium text-gray-600">Assistant</span>
                    <span className="text-xs text-gray-400">now</span>
                  </div>
                  <div className="bg-gray-50 rounded-2xl px-4 py-3 border">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                      <div className="flex-1">
                        <span className="text-sm text-gray-700 font-medium">Analyzing your project data...</span>
                        <div className="flex items-center gap-1 mt-1">
                          <div className="flex gap-1">
                            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce"></div>
                            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                          <span className="text-xs text-gray-500 ml-2">Processing natural language query</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        
        {/* Input Area */}
        <div className="p-4 border-t">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              {isExpanded ? (
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about your projects, tasks, team performance, or get data-driven insights..."
                  disabled={isLoading}
                  className="min-h-[80px] resize-none pr-12 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                    if (e.key === 'Escape') {
                      setIsExpanded(false);
                    }
                  }}
                />
              ) : (
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me anything about your projects..."
                  disabled={isLoading}
                  className="pr-20 text-sm"
                  onFocus={() => setIsExpanded(true)}
                />
              )}
              
              <div className="absolute right-2 top-2 flex items-center gap-1">
                {isExpanded && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsExpanded(false)}
                    className="h-7 px-2 text-xs"
                  >
                    Collapse
                  </Button>
                )}
                <Button 
                  type="submit" 
                  disabled={isLoading || !input.trim()}
                  size="sm"
                  className="h-7 w-7 p-0"
                >
                  <Send className="h-3 w-3" />
                </Button>
              </div>
            </div>
            
            {isExpanded && (
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Press Shift+Enter for new line, Enter to send</span>
                <span>{input.length}/2000</span>
              </div>
            )}
          </form>
        </div>
      </CardContent>
    </Card>
  );
} 