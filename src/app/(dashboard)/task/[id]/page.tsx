'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  User, 
  MessageSquare, 
  Send,
  AlertCircle,
  CheckCircle2,
  Circle,
  Timer,
  Smile,
  Paperclip,
  MoreHorizontal,
  RefreshCw
} from 'lucide-react';
import { Task, ProjectMember } from "@/types";
import { fetchProjectMembers } from '@/lib/queries';
import { useSession } from '@/lib/auth/auth-client';

interface Comment {
  id: string;
  taskId: string;
  text: string;
  authorName: string;
  authorAvatar: string;
  createdAt: string;
}

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;
  const chatEndRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();
  const currentUser = session?.user;
  
  const [task, setTask] = useState<Task | null>(null);
  const [assignee, setAssignee] = useState<ProjectMember | null>(null);
  const [isLoadingAssignee, setIsLoadingAssignee] = useState<boolean>(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [refreshingComments, setRefreshingComments] = useState(false);

  // Function to fetch task comments
  const fetchTaskComments = async () => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/comments`);
      if (response.ok) {
        const commentsData = await response.json();
        setComments(commentsData);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  useEffect(() => {
    const fetchTaskAndAssignee = async () => {
      try {
        setLoading(true);
        const taskResponse = await fetch(`/api/tasks/${taskId}`);
        if (!taskResponse.ok) {
          throw new Error('Failed to fetch task');
        }
        const taskData: Task = await taskResponse.json();
        setTask(taskData);

        if (taskData.assigneeId && taskData.projectId) {
          setIsLoadingAssignee(true);
          try {
            const members = await fetchProjectMembers(taskData.projectId);
            const foundAssignee = members.find(member => member.userId === taskData.assigneeId);
            setAssignee(foundAssignee || null);
          } catch (assigneeError) {
            console.error('Error fetching assignee:', assigneeError);
            setAssignee(null); // Clear assignee if fetch fails
          } finally {
            setIsLoadingAssignee(false);
          }
        } else {
          setAssignee(null); // No assigneeId or projectId
          setIsLoadingAssignee(false);
        }

      } catch (error) {
        console.error('Error fetching task details:', error);
        setTask(null); // Clear task on error
      } finally {
        // setLoading(false); // Moved this setLoading to the combined promise below
      }
    };

    if (taskId) {
      // Promise.all([fetchTask(), fetchComments()]).finally(() => { // Original
      Promise.all([fetchTaskAndAssignee(), fetchTaskComments()]).finally(() => {
        setLoading(false); // Combined loading state
      });
    }
  }, [taskId]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  // Simulate typing indicator
  useEffect(() => {
    if (newComment.length > 0) {
      setIsTyping(true);
      const timer = setTimeout(() => setIsTyping(false), 1000);
      return () => clearTimeout(timer);
    } else {
      setIsTyping(false);
    }
  }, [newComment]);

  const handleAddComment = async () => {
    if (!newComment.trim() || !currentUser) return;

    setSubmittingComment(true);
    try {
      const response = await fetch(`/api/tasks/${taskId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: newComment,
          authorName: currentUser.name || currentUser.email || 'Unknown User',
        }),
      });

      if (response.ok) {
        const comment = await response.json();
        setComments(prev => [...prev, comment]);
        setNewComment('');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddComment();
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toUpperCase()) {
      case 'HIGH': return 'bg-red-100 text-red-800 border-red-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DONE': return 'bg-green-100 text-green-800 border-green-200';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'TODO': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DONE': return <CheckCircle2 className="h-4 w-4" />;
      case 'IN_PROGRESS': return <Timer className="h-4 w-4" />;
      case 'TODO': return <Circle className="h-4 w-4" />;
      default: return <Circle className="h-4 w-4" />;
    }
  };

  const isOverdue = (dueDate: string | null | undefined) => {
    return dueDate && new Date(dueDate) < new Date() && task?.status !== 'DONE';
  };

  // Get user's initials for avatar fallback
  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  // Check if the current user is the author of a comment
  const isCurrentUserAuthor = (authorName: string) => {
    if (!currentUser) return false;
    const currentUserName = currentUser.name || currentUser.email || '';
    return authorName === currentUserName;
  };

  const handleRefreshComments = async () => {
    setRefreshingComments(true);
    await fetchTaskComments();
    setRefreshingComments(false);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Task Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The task you're looking for doesn't exist or has been deleted.
            </p>
            <Button onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{task.title}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <div className="space-y-6">
            {/* Task Details Section */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed">
                    {task.description || 'No description provided.'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Progress</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Completion</span>
                      <span>Status: {task.status}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Estimated Hours</p>
                      <p className="font-medium">Not tracked</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Logged Hours</p>
                      <p className="font-medium">Not tracked</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    <p className="text-sm text-muted-foreground">No tags assigned</p>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Team Chatter Section */}
            <div className="space-y-4">
              {/* Chat Container */}
              <Card className="h-[500px] flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      Team Chatter ({comments.length})
                    </CardTitle>
                    
                    <div className="flex items-center gap-4">
                      {/* Refresh button */}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 px-2"
                        onClick={handleRefreshComments}
                        disabled={refreshingComments}
                      >
                        <RefreshCw className={`h-4 w-4 ${refreshingComments ? 'animate-spin' : ''}`} />
                        <span className="sr-only">Refresh comments</span>
                      </Button>

                      {/* User info - show who's posting */}
                      {currentUser && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Posting as:</span>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={currentUser.image || undefined} />
                              <AvatarFallback className="text-xs">
                                {getUserInitials(currentUser.name || currentUser.email || 'U')}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{currentUser.name || currentUser.email}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                {/* Chat Messages Area */}
                <CardContent className="flex-1 overflow-y-auto space-y-4 pb-4">
                  {comments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="font-medium mb-2">Start the conversation</h3>
                      <p className="text-sm text-muted-foreground">
                        Share updates, ask questions, or collaborate with your team
                      </p>
                    </div>
                  ) : (
                    <>
                      {comments.map((comment, index) => {
                        const isAuthor = isCurrentUserAuthor(comment.authorName);
                        const showAvatar = index === 0 || comments[index - 1].authorName !== comment.authorName;
                        
                        return (
                          <div key={comment.id} className={`flex gap-3 ${isAuthor ? 'flex-row-reverse' : ''}`}>
                            {/* Always show avatar for other users */}
                            <div className={`flex-shrink-0 ${!isAuthor || showAvatar ? '' : 'invisible'}`}>
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={comment.authorAvatar} />
                                <AvatarFallback className="text-xs">
                                  {getUserInitials(comment.authorName)}
                                </AvatarFallback>
                              </Avatar>
                            </div>
                            
                            <div className={`max-w-[70%] ${isAuthor ? 'text-right' : ''}`}>
                              {/* Always show name for other users or first message in a group */}
                              {(!isAuthor || showAvatar) && (
                                <div className={`flex items-center gap-2 mb-1 ${isAuthor ? 'flex-row-reverse' : ''}`}>
                                  <span className="text-xs font-medium">{comment.authorName}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {formatTime(comment.createdAt)}
                                  </span>
                                </div>
                              )}
                              
                              <div className={`
                                rounded-2xl px-3 py-2 text-sm
                                ${isAuthor 
                                  ? 'bg-primary text-primary-foreground' 
                                  : 'bg-muted'
                                }
                              `}>
                                {comment.text}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      
                      {/* Typing indicator */}
                      {isTyping && currentUser && (
                        <div className="flex gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={currentUser.image || undefined} />
                            <AvatarFallback className="text-xs">
                              {getUserInitials(currentUser.name || currentUser.email || 'U')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="bg-muted rounded-2xl px-3 py-2">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </>
                  )}
                </CardContent>
                
                {/* Chat Input */}
                <div className="border-t p-4">
                  {currentUser ? (
                    <>
                      <div className="flex items-end gap-2">
                        <div className="flex-1 relative">
                          <Textarea
                            placeholder="Type your message..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            onKeyPress={handleKeyPress}
                            rows={1}
                            className="resize-none min-h-[40px] max-h-[120px] pr-20"
                          />
                          <div className="absolute right-2 top-2 flex items-center gap-1">
                          </div>
                        </div>
                        <Button 
                          onClick={handleAddComment}
                          disabled={!newComment.trim() || submittingComment}
                          size="sm"
                          className="h-10"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="text-xs text-muted-foreground mt-2">
                        Press Enter to send, Shift+Enter for new line
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-4">
                      <p className="text-sm text-muted-foreground">Please sign in to post messages</p>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Task Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status</span>
                <Badge className={getStatusColor(task.status)}>
                  {getStatusIcon(task.status)}
                  <span className="ml-1 capitalize">{task.status.replace('-', ' ')}</span>
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Priority</span>
                <Badge className={getPriorityColor(task.priority || 'MEDIUM')}>
                  <span className="capitalize">{task.priority?.toLowerCase() || 'medium'}</span>
                </Badge>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Due Date</p>
                    <p className={`text-sm ${task.dueDate && isOverdue(task.dueDate) ? 'text-red-600' : 'text-muted-foreground'}`}>
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date set'}
                      {task.dueDate && isOverdue(task.dueDate) && (
                        <span className="ml-1 text-red-600">(Overdue)</span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Assigned To</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={assignee?.image || undefined} />
                        <AvatarFallback className="text-xs">
                          {isLoadingAssignee
                            ? '...'
                            : assignee
                            ? (assignee.name || assignee.email || 'N/A').substring(0, 2).toUpperCase()
                            : 'UN'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-muted-foreground">
                        {isLoadingAssignee
                          ? 'Loading...'
                          : assignee
                          ? assignee.name || assignee.email || 'Unknown Assignee'
                          : 'Unassigned'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="text-xs text-muted-foreground space-y-1">
                <p>Created: {new Date(task.createdAt).toLocaleDateString()}</p>
                <p>Updated: {new Date(task.updatedAt).toLocaleDateString()}</p>
              </div>
            </CardContent>
          </Card>

          {/* Team Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Team Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-muted-foreground">{currentUser ? '1 member online' : '0 members online'}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-muted-foreground">Last activity: {comments.length > 0 ? formatTime(comments[comments.length - 1].createdAt) : 'None'}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <MessageSquare className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">{comments.length} messages total</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 