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
  Paperclip
} from "lucide-react"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const notifications = [
  {
    id: 1,
    type: "task_assigned",
    title: "New task assigned: Update user documentation",
    description: "Alice Johnson assigned you a new task in the Website Redesign project",
    timestamp: "2024-01-15T10:30:00Z",
    isRead: false,
    priority: "medium",
    sender: "Alice Johnson",
    avatar: "/avatars/alice.jpg",
    project: "Website Redesign"
  },
  {
    id: 2,
    type: "comment",
    title: "New comment on your task",
    description: "Bob Smith commented on 'Design landing page wireframes'",
    timestamp: "2024-01-15T09:15:00Z",
    isRead: false,
    priority: "low",
    sender: "Bob Smith",
    avatar: "/avatars/bob.jpg",
    project: "Mobile App"
  },
  {
    id: 3,
    type: "deadline",
    title: "Deadline reminder",
    description: "Task 'API Integration' is due tomorrow",
    timestamp: "2024-01-15T08:00:00Z",
    isRead: true,
    priority: "high",
    sender: "System",
    avatar: "/avatars/system.jpg",
    project: "Backend Development"
  },
  {
    id: 4,
    type: "project_update",
    title: "Project milestone completed",
    description: "Design phase completed for Marketing Campaign project",
    timestamp: "2024-01-14T16:45:00Z",
    isRead: true,
    priority: "medium",
    sender: "Carol Davis",
    avatar: "/avatars/carol.jpg",
    project: "Marketing Campaign"
  },
  {
    id: 5,
    type: "team_mention",
    title: "You were mentioned in a discussion",
    description: "David Wilson mentioned you in team chat about budget planning",
    timestamp: "2024-01-14T14:20:00Z",
    isRead: false,
    priority: "medium",
    sender: "David Wilson",
    avatar: "/avatars/david.jpg",
    project: "Budget Planning"
  }
]

const messages = [
  {
    id: 1,
    sender: "Alice Johnson",
    subject: "Project Timeline Review",
    preview: "Hi team, I wanted to discuss the upcoming project timeline and see if we need to adjust any deadlines...",
    timestamp: "2024-01-15T11:30:00Z",
    isRead: false,
    isStarred: true,
    hasAttachment: true,
    avatar: "/avatars/alice.jpg"
  },
  {
    id: 2,
    sender: "Bob Smith",
    subject: "Code Review Request",
    preview: "Could you please review the new API endpoints I've implemented? The code is ready for testing...",
    timestamp: "2024-01-15T10:15:00Z",
    isRead: false,
    isStarred: false,
    hasAttachment: false,
    avatar: "/avatars/bob.jpg"
  },
  {
    id: 3,
    sender: "Carol Davis",
    subject: "Design System Updates",
    preview: "I've updated our design system with new components and color palette. Please review the changes...",
    timestamp: "2024-01-14T15:30:00Z",
    isRead: true,
    isStarred: false,
    hasAttachment: true,
    avatar: "/avatars/carol.jpg"
  },
  {
    id: 4,
    sender: "David Wilson",
    subject: "Weekly Analytics Report",
    preview: "Here's the weekly analytics report showing our progress and key metrics for this week...",
    timestamp: "2024-01-14T09:00:00Z",
    isRead: true,
    isStarred: true,
    hasAttachment: true,
    avatar: "/avatars/david.jpg"
  }
]

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'task_assigned':
      return <CheckCircle className="h-5 w-5 text-blue-600" />
    case 'comment':
      return <MessageSquare className="h-5 w-5 text-green-600" />
    case 'deadline':
      return <AlertCircle className="h-5 w-5 text-red-600" />
    case 'project_update':
      return <Info className="h-5 w-5 text-purple-600" />
    case 'team_mention':
      return <Users className="h-5 w-5 text-orange-600" />
    default:
      return <Bell className="h-5 w-5 text-gray-600" />
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
  const unreadNotifications = notifications.filter(n => !n.isRead).length
  const unreadMessages = messages.filter(m => !m.isRead).length

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
          <Button variant="outline">
            <Archive className="mr-2 h-4 w-4" />
            Archive All
          </Button>
          <Button>
            <Check className="mr-2 h-4 w-4" />
            Mark All Read
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
            <CardTitle className="text-sm font-medium">Messages</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{messages.length}</div>
            <p className="text-xs text-muted-foreground">
              {unreadMessages} unread
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {notifications.filter(n => n.priority === 'high').length}
            </div>
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
            <div className="text-2xl font-bold">
              {notifications.filter(n => {
                const notifDate = new Date(n.timestamp)
                const weekAgo = new Date()
                weekAgo.setDate(weekAgo.getDate() - 7)
                return notifDate > weekAgo
              }).length}
            </div>
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
              Messages
              {unreadMessages > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                  {unreadMessages}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="archived">Archived</TabsTrigger>
          </TabsList>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search inbox..." className="pl-8 w-[250px]" />
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
                <SelectItem value="starred">Starred</SelectItem>
                <SelectItem value="high">High Priority</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value="notifications" className="space-y-4">
          <div className="space-y-2">
            {notifications.map((notification) => (
              <Card key={notification.id} className={`cursor-pointer transition-colors hover:bg-accent/50 ${!notification.isRead ? 'bg-blue-50/50 border-blue-200' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <h3 className={`font-medium text-sm ${!notification.isRead ? 'font-semibold' : ''}`}>
                          {notification.title}
                        </h3>
                        <div className="flex items-center space-x-2">
                          <Badge className={getPriorityColor(notification.priority)}>
                            {notification.priority}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatTime(notification.timestamp)}
                          </span>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Check className="mr-2 h-4 w-4" />
                                Mark as read
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Star className="mr-2 h-4 w-4" />
                                Star
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Archive className="mr-2 h-4 w-4" />
                                Archive
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{notification.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={notification.avatar} />
                            <AvatarFallback className="text-xs">
                              {notification.sender.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-muted-foreground">{notification.sender}</span>
                          {notification.project && (
                            <>
                              <span className="text-xs text-muted-foreground">•</span>
                              <Badge variant="outline" className="text-xs">
                                {notification.project}
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
            ))}
          </div>
        </TabsContent>

        <TabsContent value="messages" className="space-y-4">
          <div className="space-y-2">
            {messages.map((message) => (
              <Card key={message.id} className={`cursor-pointer transition-colors hover:bg-accent/50 ${!message.isRead ? 'bg-blue-50/50 border-blue-200' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={message.avatar} />
                      <AvatarFallback>
                        {message.sender.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <h3 className={`font-medium text-sm ${!message.isRead ? 'font-semibold' : ''}`}>
                            {message.sender}
                          </h3>
                          {message.isStarred && <Star className="h-3 w-3 text-yellow-500 fill-current" />}
                          {message.hasAttachment && <Paperclip className="h-3 w-3 text-muted-foreground" />}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-muted-foreground">
                            {formatTime(message.timestamp)}
                          </span>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Reply className="mr-2 h-4 w-4" />
                                Reply
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Forward className="mr-2 h-4 w-4" />
                                Forward
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Star className="mr-2 h-4 w-4" />
                                Star
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Archive className="mr-2 h-4 w-4" />
                                Archive
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      <h4 className={`text-sm ${!message.isRead ? 'font-medium' : ''}`}>
                        {message.subject}
                      </h4>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {message.preview}
                      </p>
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm">
                            <Reply className="mr-2 h-3 w-3" />
                            Reply
                          </Button>
                          {message.hasAttachment && (
                            <Badge variant="outline" className="text-xs">
                              <Paperclip className="mr-1 h-2 w-2" />
                              Attachment
                            </Badge>
                          )}
                        </div>
                        {!message.isRead && (
                          <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="archived" className="space-y-4">
          <Card>
            <CardContent className="p-8 text-center">
              <Archive className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No archived items</h3>
              <p className="text-muted-foreground">
                Archived notifications and messages will appear here
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 