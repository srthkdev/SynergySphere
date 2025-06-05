"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Mail,
  Search,
  Filter,
  MoreHorizontal,
  Star,
  Archive,
  Trash2,
  Reply,
  Forward,
  Clock,
  Bell,
  MessageSquare,
  Users,
  CheckCircle,
  AlertCircle,
  Info,
  Calendar,
  FileText,
  User,
  Check,
  X,
  Paperclip,
  AtSign,
  Loader2,
  RefreshCw
} from "lucide-react"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useChat } from "@/components/chat/ChatProvider"
import { toast } from "sonner"

interface Notification {
  id: string;
  userId: string;
  message: string;
  type: string;
  projectId?: string;
  taskId?: string;
  isRead: boolean;
  createdAt: string;
}

interface ChatMessage {
  id: string;
  content: string;
  projectId: string;
  taskId?: string;
  authorId: string;
  authorName: string;
  authorImage?: string;
  createdAt: string;
  updatedAt: string;
  readBy: string[];
  reactions: Record<string, any>;
}

interface Project {
  id: string;
  name: string;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'task_assigned':
    case 'task_update':
      return <CheckCircle className="h-5 w-5 text-blue-600" />
    case 'comment':
    case 'chat_mention':
      return <MessageSquare className="h-5 w-5 text-green-600" />
    case 'deadline':
    case 'task_due_soon':
      return <AlertCircle className="h-5 w-5 text-red-600" />
    case 'project_update':
    case 'project_message':
      return <Info className="h-5 w-5 text-purple-600" />
    case 'project_member_added':
      return <Users className="h-5 w-5 text-blue-600" />
    case 'team_mention':
    case 'mention':
      return <Users className="h-5 w-5 text-orange-600" />
    case 'info':
      return <Info className="h-5 w-5 text-blue-600" />
    case 'success':
      return <CheckCircle className="h-5 w-5 text-green-600" />
    case 'warning':
      return <AlertCircle className="h-5 w-5 text-yellow-600" />
    case 'error':
      return <AlertCircle className="h-5 w-5 text-red-600" />
    default:
      return <Bell className="h-5 w-5 text-gray-600" />
  }
}

const getNotificationPriority = (type: string) => {
  switch (type) {
    case 'deadline':
    case 'task_due_soon':
    case 'error':
      return 'high';
    case 'task_assigned':
    case 'chat_mention':
    case 'project_member_added':
    case 'warning':
      return 'medium';
    case 'project_message':
    case 'task_update':
    case 'project_update':
    case 'info':
    case 'success':
    default:
      return 'low';
  }
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high':
      return 'bg-red-100 text-red-800'
    case 'medium':
      return 'bg-yellow-100 text-yellow-800'
    case 'low':
      return 'bg-green-100 text-green-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const formatTime = (timestamp: string) => {
  const now = new Date()
  const time = new Date(timestamp)
  const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60))
  
  if (diffInHours < 1) return 'Just now'
  if (diffInHours < 24) return `${diffInHours}h ago`
  if (diffInHours < 48) return 'Yesterday'
  return time.toLocaleDateString()
}

export default function InboxPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [recentMessages, setRecentMessages] = useState<ChatMessage[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { unreadCount: unreadMentions } = useChat();

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      } else {
        console.error('Failed to fetch notifications');
        toast.error('Failed to load notifications');
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    }
  };

  // Fetch recent chat messages from all projects
  const fetchRecentMessages = async () => {
    try {
      // First get user's projects
      const projectsResponse = await fetch('/api/projects');
      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json();
        setProjects(projectsData);
        
        // Fetch recent messages from all projects
        const allMessages: ChatMessage[] = [];
        
        for (const project of projectsData.slice(0, 5)) { // Limit to 5 projects for performance
          try {
            const messagesResponse = await fetch(`/api/chat/messages?projectId=${project.id}&limit=10`);
            if (messagesResponse.ok) {
              const messages = await messagesResponse.json();
              allMessages.push(...messages.map((msg: any) => ({
                ...msg,
                projectName: project.name
              })));
            }
          } catch (err) {
            console.error(`Error fetching messages for project ${project.id}:`, err);
          }
        }
        
        // Sort by creation time and get the most recent
        allMessages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setRecentMessages(allMessages.slice(0, 20)); // Keep only 20 most recent
      }
    } catch (error) {
      console.error('Error fetching recent messages:', error);
    }
  };

  // Mark notification as read
  const markNotificationAsRead = async (notificationId: string) => {
    try {
      // Optimistically update UI first
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, isRead: true } : n
      ));

      const response = await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds: [notificationId] }),
      });
      
      if (!response.ok) {
        // Revert the optimistic update on error
        setNotifications(notifications.map(n => 
          n.id === notificationId ? { ...n, isRead: false } : n
        ));
        toast.error('Failed to mark notification as read');
      } else {
        toast.success('Notification marked as read');
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      // Revert the optimistic update on error
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, isRead: false } : n
      ));
      toast.error('Failed to mark notification as read');
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.isRead);
      if (unreadNotifications.length === 0) {
        toast.info('No unread notifications to mark');
        return;
      }

      // Optimistically update UI first
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));

      const response = await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllAsRead: true }),
      });
      
      if (!response.ok) {
        // Revert the optimistic update on error
        setNotifications(notifications.map(n => {
          const wasUnread = unreadNotifications.find(unread => unread.id === n.id);
          return wasUnread ? { ...n, isRead: false } : n;
        }));
        toast.error('Failed to mark all notifications as read');
      } else {
        toast.success(`Marked ${unreadNotifications.length} notifications as read`);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to mark all notifications as read');
    }
  };

  // Refresh data
  const refreshData = async () => {
    setLoading(true);
    await Promise.all([
      fetchNotifications(),
      fetchRecentMessages()
    ]);
    setLoading(false);
  };

  // Check for upcoming deadlines automatically
  const checkDeadlines = async () => {
    try {
      const response = await fetch('/api/notifications/check-deadlines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ daysAhead: 3 })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.count > 0) {
          console.log(`Created ${data.count} deadline notifications`);
        }
      }
    } catch (error) {
      console.error('Error checking deadlines:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await checkDeadlines(); // Check deadlines first
      await refreshData(); // Then refresh notifications
    };
    loadData();
  }, []);

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread' && notification.isRead) return false;
    if (filter === 'high' && getNotificationPriority(notification.type) !== 'high') return false;
    if (searchQuery && !notification.message.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Filter messages
  const filteredMessages = recentMessages.filter(message => {
    if (filter === 'unread' && message.readBy.includes(message.authorId)) return false;
    if (searchQuery && !message.content.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const unreadNotifications = notifications.filter(n => !n.isRead).length;
  const unreadMessages = recentMessages.filter(m => !m.readBy.includes(m.authorId)).length;
  const highPriorityNotifications = notifications.filter(n => getNotificationPriority(n.type) === 'high').length;
  const thisWeekNotifications = notifications.filter(n => {
    const notifDate = new Date(n.createdAt);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return notifDate > weekAgo;
  }).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inbox</h1>
          <p className="text-muted-foreground">
            Stay updated with notifications and messages
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refreshData} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={markAllAsRead} disabled={unreadNotifications === 0}>
            <Check className="mr-2 h-4 w-4" />
            Mark All Read
          </Button>
          <Button 
            variant="outline" 
            onClick={async () => {
              try {
                const response = await fetch('/api/notifications/check-deadlines', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ daysAhead: 3 })
                });
                if (response.ok) {
                  const data = await response.json();
                  toast.success(`Created ${data.count} deadline notifications`);
                  await refreshData();
                } else {
                  toast.error('Failed to check deadlines');
                }
              } catch (error) {
                toast.error('Failed to check deadlines');
              }
            }}
          >
            <Clock className="mr-2 h-4 w-4" />
            Check Deadlines
          </Button>
          <Button 
            variant="outline" 
            onClick={async () => {
              try {
                const response = await fetch('/api/notifications/test', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ type: 'all' })
                });
                if (response.ok) {
                  toast.success('Test notifications created');
                  await refreshData();
                } else {
                  toast.error('Failed to create test notifications');
                }
              } catch (error) {
                toast.error('Failed to create test notifications');
              }
            }}
          >
            <Bell className="mr-2 h-4 w-4" />
            Add Test Notifications
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Notifications</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notifications.length}</div>
            <p className="text-xs text-muted-foreground">
              {unreadNotifications} unread
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentMessages.length}</div>
            <p className="text-xs text-muted-foreground">
              From {projects.length} projects
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{highPriorityNotifications}</div>
            <p className="text-xs text-muted-foreground">
              Require attention
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{thisWeekNotifications}</div>
            <p className="text-xs text-muted-foreground">
              New notifications
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="notifications" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="notifications" className="relative">
              Notifications
              {unreadNotifications > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                  {unreadNotifications}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="messages" className="relative">
              Chat Messages
              {unreadMentions > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                  {unreadMentions}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search inbox..." 
                className="pl-8 w-[250px]" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
                <SelectItem value="high">High Priority</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value="notifications" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No notifications</h3>
                <p className="text-muted-foreground">
                  {filter === 'all' ? 'You have no notifications yet' : `No ${filter} notifications`}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredNotifications.map((notification) => {
                const priority = getNotificationPriority(notification.type);
                return (
                  <Card 
                    key={notification.id} 
                    className={`cursor-pointer transition-colors hover:bg-accent/50 ${!notification.isRead ? 'bg-blue-50/50 border-blue-200' : ''}`}
                    onClick={() => !notification.isRead && markNotificationAsRead(notification.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <h3 className={`font-medium text-sm ${!notification.isRead ? 'font-semibold' : ''}`}>
                                {notification.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </h3>
                              {notification.type === 'task_due_soon' && (
                                <Badge variant="destructive" className="text-xs animate-pulse">
                                  URGENT
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge className={getPriorityColor(priority)}>
                                {priority}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {formatTime(notification.createdAt)}
                              </span>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                  <Button variant="ghost" size="icon" className="h-6 w-6">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                                                  <DropdownMenuContent align="end">
                                    {!notification.isRead && (
                                      <DropdownMenuItem 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          markNotificationAsRead(notification.id);
                                        }}
                                      >
                                        <Check className="mr-2 h-4 w-4" />
                                        Mark as read
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">{notification.message}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-muted-foreground">System</span>
                              {notification.projectId && (
                                <>
                                  <span className="text-xs text-muted-foreground">•</span>
                                  <Badge variant="outline" className="text-xs">
                                    Project Activity
                                  </Badge>
                                </>
                              )}
                              {notification.taskId && (
                                <>
                                  <span className="text-xs text-muted-foreground">•</span>
                                  <Badge variant="outline" className="text-xs">
                                    Task Activity
                                  </Badge>
                                </>
                              )}
                            </div>
                            {!notification.isRead && (
                              <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="messages" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : filteredMessages.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No recent messages</h3>
                <p className="text-muted-foreground">
                  No recent chat messages found
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredMessages.map((message) => (
                <Card key={message.id} className="cursor-pointer transition-colors hover:bg-accent/50">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={message.authorImage} />
                        <AvatarFallback>
                          {message.authorName ? message.authorName.split(' ').map(n => n[0]).join('') : 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium text-sm">
                              {message.authorName || 'Unknown User'}
                            </h3>
                            {message.content.includes('@') && <AtSign className="h-3 w-3 text-orange-500" />}
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-muted-foreground">
                              {formatTime(message.createdAt)}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {message.content}
                        </p>
                        <div className="flex items-center justify-between pt-1">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs">
                              {(message as any).projectName || 'Project Chat'}
                            </Badge>
                            {message.taskId && (
                              <Badge variant="outline" className="text-xs">
                                Task Chat
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
} 