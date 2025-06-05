'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  CheckSquare,
  Square,
  Calendar,
  Clock,
  User,
  Flag,
  Plus,
  Filter,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  AlertCircle,
  CheckCircle,
  Timer,
  FolderOpen,
  AlertTriangle,
  Target,
  Tag,
  BarChart3
} from "lucide-react"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from 'next/navigation';
import { Project as ProjectType, Task as ImportedTask } from '@/types';

// Import the new view components
import { ViewSwitcher, ViewMode } from '@/components/ui/view-switcher';
import { KanbanView } from '@/components/views/kanban-view';
import { GalleryView } from '@/components/views/gallery-view';
import { ListView } from '@/components/views/list-view';
import { CreateEditTaskDialog } from "@/components/projects/task/CreateEditTaskDialog"

interface LocalProject {
  id: string;
  name: string;
  description: string;
  status: 'planning' | 'active' | 'on-hold' | 'completed';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
  role: string; // user's role in the project
}

const taskStats = [
  {
    title: "Total Tasks",
    value: "0",
    icon: CheckSquare,
    description: "All assigned tasks"
  },
  {
    title: "In Progress", 
    value: "0",
    icon: Clock,
    description: "Currently working on"
  },
  {
    title: "Completed",
    value: "0",
    icon: Target,
    description: "Successfully finished"
  },
  {
    title: "Overdue",
    value: "0",
    icon: AlertTriangle,
    description: "Past due date"
  }
];

function getPriorityColor(priority: string) {
  const normalizedPriority = priority?.toLowerCase() || 'medium';
  switch (normalizedPriority) {
    case 'urgent':
    case 'high': return 'bg-red-500';
    case 'medium': return 'bg-yellow-500';
    case 'low': return 'bg-green-500';
    default: return 'bg-gray-500';
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'completed': return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300';
    case 'in-progress': return 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300';
    case 'todo': return 'bg-gray-100 dark:bg-gray-800/20 text-gray-800 dark:text-gray-300';
    default: return 'bg-gray-100 dark:bg-gray-800/20 text-gray-800 dark:text-gray-300';
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'completed':
      return <CheckSquare className="h-4 w-4 text-green-600" />
    case 'in-progress':
      return <Timer className="h-4 w-4 text-blue-600" />
    case 'todo':
      return <Square className="h-4 w-4 text-gray-600" />
    default:
      return <Square className="h-4 w-4 text-gray-600" />
  }
}

const isOverdue = (dueDate: string, status: string) => {
  return new Date(dueDate) < new Date() && status !== "completed"
}

// Transform ImportedTask to view-compatible Task
const transformTaskForViews = (task: ImportedTask): any => ({
  ...task,
  status: task.status === 'TODO' ? 'todo' : 
          task.status === 'IN_PROGRESS' ? 'in-progress' : 
          task.status === 'DONE' ? 'completed' : 'todo',
  priority: task.priority?.toLowerCase() as 'low' | 'medium' | 'high' || 'medium',
  assignedBy: 'Project Manager',
  assignedByAvatar: '',
  tags: [],
  progress: task.status === 'DONE' ? 100 : task.status === 'IN_PROGRESS' ? 50 : 0,
  estimatedHours: 8,
  loggedHours: task.status === 'DONE' ? 8 : task.status === 'IN_PROGRESS' ? 4 : 0,
  project: 'Project',
  description: task.description || ''
});

export default function MyTasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<ImportedTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');
  const [currentView, setCurrentView] = useState<ViewMode>('list');
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState('all'); // For priority filter dropdown
  const [showFilters, setShowFilters] = useState(false); // To toggle filter panel

  
  // Fetch tasks from API
  useEffect(() => {
    fetchTasks();
  }, []);

  async function fetchTasks() {
    try {
      setLoading(true);
      const response = await fetch('/api/tasks');
      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }
      const data = await response.json();
      setTasks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  // Calculate task statistics
  const totalTasks = tasks.length;
  const inProgressTasks = tasks.filter(task => task.status === 'IN_PROGRESS').length;
  const completedTasks = tasks.filter(task => task.status === 'DONE').length;
  const overdueTasks = tasks.filter(task => {
    if (!task.dueDate) return false;
    return new Date(task.dueDate) < new Date() && task.status !== 'DONE';
  }).length;

  // Update task stats
  taskStats[0].value = totalTasks.toString();
  taskStats[1].value = inProgressTasks.toString();
  taskStats[2].value = completedTasks.toString();
  taskStats[3].value = overdueTasks.toString();

  // Filter tasks based on search, tab, and priority filter
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.projectId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const priorityFilter = selectedPriorityFilter as ImportedTask['priority'] | 'all';
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;

    let matchesTab = false;
    switch (selectedTab) {
      case 'active':
        matchesTab = ['TODO', 'IN_PROGRESS'].includes(task.status);
        break;
      case 'completed':
        matchesTab = task.status === 'DONE';
        break;
      case 'overdue':
        matchesTab = !!(task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE');
        break;
      default: // 'all' tab
        matchesTab = true;
        break;
    }
    return matchesSearch && matchesPriority && matchesTab;
  });

  // Update task status
  const updateTaskStatus = async (taskId: string, newStatus: ImportedTask['status']) => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: taskId,
          status: newStatus,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update task');
      }

      const updatedTask = await response.json();
      setTasks(tasks.map(task => task.id === taskId ? updatedTask : task));
    } catch (err) {
      console.error('Error updating task:', err);
    }
  };

  // Handle task updates from views
  const handleTaskUpdate = async (taskId: string, updates: Partial<ImportedTask>) => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: taskId,
          ...updates,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update task');
      }

      const updatedTask = await response.json();
      setTasks(tasks.map(task => task.id === taskId ? updatedTask : task));
    } catch (err) {
      console.error('Error updating task:', err);
    }
  };

  // Handle task creation
  const handleTaskCreate = async (status?: ImportedTask['status']) => {
    try {
      const newTask = {
        title: 'New Task',
        description: 'Task description',
        status: status || 'todo',
        priority: 'medium' as const,
        assignedBy: 'Current User',
        assignedByAvatar: '',
        tags: [],
        progress: 0,
        estimatedHours: 0,
        loggedHours: 0,
        project: 'Default Project',
        projectId: '1',
      };

      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTask),
      });

      if (!response.ok) {
        throw new Error('Failed to create task');
      }

      const createdTask = await response.json();
      setTasks([...tasks, createdTask]);
    } catch (err) {
      console.error('Error creating task:', err);
    }
  };

  // Handle task click - navigate to task detail page
  const handleTaskClick = (task: any) => {
    router.push(`/task/${task.id}`);
  };

  // Handle item update (for compatibility with views)
  const handleItemUpdate = (itemId: string, updates: any) => {
    // Since we're only dealing with tasks, delegate to task update
    return handleTaskUpdate(itemId, updates);
  };

  // Get current user ID for task edit permissions (replace with your actual auth method)
  const currentUserId = ''; // This should come from your authentication context

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading tasks...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-600">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Tasks</h1>
          <p className="text-muted-foreground">
            Manage your assigned tasks and track your progress
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button onClick={() => setIsCreateTaskModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Task
          </Button>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <Card className="p-4 mb-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">Priority:</label>
              <Select value={selectedPriorityFilter} onValueChange={setSelectedPriorityFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="sm" onClick={() => {
              setSelectedPriorityFilter('all');
              // Potentially reset other filters here if added in the future
            }}>
              Clear Filters
            </Button>
          </div>
        </Card>
      )}

      {/* Task Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {taskStats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="all">All Tasks</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="overdue">Overdue</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search tasks..." className="pl-8 w-[250px]" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
            </div>
            
            <ViewSwitcher 
              currentView={currentView} 
              onViewChange={setCurrentView}
              availableViews={['list', 'kanban', 'gallery']}
            />
          </div>
        </div>

        <TabsContent value={selectedTab} className="space-y-4">
          {filteredTasks.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <CheckSquare className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No tasks found</h3>
                <p className="text-sm text-muted-foreground text-center">
                  {tasks.length === 0 
                    ? "You don't have any tasks assigned yet."
                    : "No tasks match your current filter criteria."
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className={currentView === 'kanban' ? 'h-[600px]' : ''}>
              {currentView === 'kanban' && (
                <KanbanView 
                  tasks={filteredTasks.map(transformTaskForViews)}
                  onTaskUpdate={(taskId, updates) => {
                    const convertedUpdates: Partial<ImportedTask> = {
                      ...updates,
                      status: updates.status === 'todo' ? 'TODO' : 
                              updates.status === 'in-progress' ? 'IN_PROGRESS' : 
                              updates.status === 'completed' ? 'DONE' : undefined,
                      priority: updates.priority ? updates.priority.toUpperCase() as ImportedTask['priority'] : undefined
                    };
                    handleTaskUpdate(taskId, convertedUpdates);
                  }}
                  onTaskCreate={(status) => {
                    const convertedStatus = status === 'todo' ? 'TODO' : 
                                          status === 'in-progress' ? 'IN_PROGRESS' : 
                                          status === 'completed' ? 'DONE' : 'TODO';
                    handleTaskCreate(convertedStatus);
                  }}
                  onTaskClick={handleTaskClick}
                />
              )}
              
              {currentView === 'gallery' && (
                <GalleryView 
                  items={filteredTasks.map(transformTaskForViews)}
                  type="tasks"
                  onItemUpdate={handleItemUpdate}
                  onItemClick={handleTaskClick}
                  currentUserId={currentUserId}
                />
              )}
              
              {currentView === 'list' && (
                <ListView 
                  items={filteredTasks.map(transformTaskForViews)}
                  type="tasks"
                  onItemUpdate={handleItemUpdate}
                  onItemClick={handleTaskClick}
                />
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create New Task Dialog */}
      <CreateEditTaskDialog
        open={isCreateTaskModalOpen}
        onOpenChange={(open) => {
          setIsCreateTaskModalOpen(open);
          if (!open) {
            fetchTasks();
          }
        }}
        projectId="" // Empty string - the dialog will show project selector
        taskToEdit={null}
      />

    </div>
  )
} 