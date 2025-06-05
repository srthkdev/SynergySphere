'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Calendar, 
  Clock, 
  User, 
  Flag, 
  MoreHorizontal, 
  Plus,
  AlertTriangle,
  CheckCircle,
  Timer,
  Square,
  Users,
  DollarSign,
  Target,
  TrendingUp,
  FolderOpen,
  Star,
  Eye,
  Edit,
  Trash2,
  CheckSquare,
  Tag,
  Paperclip
} from "lucide-react";
import { cn, isTaskCompleted } from "@/lib/utils";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect, useMemo } from "react";
import { Project, Task as ImportedTask } from "@/types";
import { EditProjectDialog } from "@/components/projects/EditProjectDialog";
import { DeleteProjectDialog } from "@/components/projects/DeleteProjectDialog";
import { AttachmentCount } from "@/components/ui/attachment-thumbnail";
import { EditTaskButton } from "@/components/projects/task/EditTaskButton";
import { useTaskPriority } from "@/hooks/use-task-priority";

// Extended Task interface for the view components that includes additional UI-specific fields
interface Task extends ImportedTask {
  assignedBy: string;
  assignedByAvatar: string;
  tags: string[];
  progress: number;
  estimatedHours: number;
  loggedHours: number;
  project: string;
  priorityInfo?: {
    priorityLevel: string;
  };
}

interface GalleryViewProps {
  items: Task[] | Project[];
  type: 'tasks' | 'projects';
  onItemUpdate?: (itemId: string, updates: any) => void;
  onItemClick?: (item: Task | Project) => void;
  onEdit?: (item: Task | Project) => void;
  onDelete?: (item: Task | Project) => void;
  className?: string;
}

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
    case 'completed': return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800';
    case 'in-progress': return 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800';
    case 'todo': return 'bg-gray-100 dark:bg-gray-800/20 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700';
    case 'active': return 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800';
    case 'on-hold': return 'bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-800';
    case 'planning': return 'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800';
    default: return 'bg-gray-100 dark:bg-gray-800/20 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700';
  }
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function isOverdue(dueDate: string, status: string) {
  return new Date(dueDate) < new Date() && status !== "completed";
}

function TaskCard({ task, onUpdate, onClick, currentUserId }: { 
  task: Task; 
  onUpdate?: (updates: Partial<Task>) => void;
  onClick?: (task: Task) => void;
  currentUserId?: string;
}) {
  return (
    <Card 
      className={cn(
        "hover:shadow-xl transition-all duration-300 cursor-pointer group h-full flex flex-col",
        task.dueDate && isOverdue(task.dueDate, task.status) && "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/20"
      )}
      onClick={() => onClick?.(task)}
    >
      <CardHeader className="pb-4 flex-shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              {!isTaskCompleted(task.status) && (
                <Badge variant="outline" className="text-xs">
                  {task.priorityInfo?.priorityLevel || 'P-?'}
                </Badge>
              )}
              <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`} />
            </div>
            <CardTitle className="text-lg font-bold line-clamp-2 group-hover:text-primary transition-colors">
              {task.title}
            </CardTitle>
            {task.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mt-2 leading-relaxed">
                {task.description}
              </p>
            )}
          </div>
          {/* Edit button visible if user created the task */}
          {currentUserId && task.createdById === currentUserId && (
            <EditTaskButton 
              task={task}
              className="h-8 w-8 p-0"
              icon={<Edit className="h-4 w-4" />}
              iconOnly
            />
          )}
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col justify-between space-y-4 pt-0">
        <div className="space-y-3">
          {/* Status and Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Badge className={getStatusColor(task.status)}>
                {task.status.replace('-', ' ')}
              </Badge>
              <span className="text-sm font-medium text-muted-foreground">{task.progress || 0}%</span>
            </div>
            <Progress value={task.progress || 0} className="h-2" />
          </div>

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {task.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs px-2 py-1">
                  {tag}
                </Badge>
              ))}
              {task.tags.length > 3 && (
                <Badge variant="outline" className="text-xs px-2 py-1">
                  +{task.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Project Info */}
          <div className="flex items-center space-x-2 text-sm text-muted-foreground bg-gray-50 dark:bg-gray-800/50 px-3 py-2 rounded-lg">
            <FolderOpen className="h-4 w-4 flex-shrink-0" />
            <span className="truncate font-medium">{task.project || 'No Project'}</span>
          </div>

          {/* Time tracking */}
          {(task.estimatedHours && task.estimatedHours > 0) || (task.loggedHours && task.loggedHours > 0) && (
            <div className="flex items-center justify-between text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950/20 px-3 py-2 rounded-lg">
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span className="font-medium">Time</span>
              </div>
              <span className="font-medium">{task.loggedHours || 0}h / {task.estimatedHours || 0}h</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800 mt-auto">
          <div className="flex items-center space-x-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={task.assignedByAvatar || ''} />
              <AvatarFallback className="text-xs">
                {task.assignedBy ? task.assignedBy.split(' ').map(n => n[0]).join('') : 'UN'}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground truncate">
              {task.assignedBy || 'Unassigned'}
            </span>
          </div>
          
          {task.dueDate && (
            <div className={cn(
              "flex items-center space-x-1 text-xs",
              isOverdue(task.dueDate, task.status) ? "text-red-600 dark:text-red-400 font-medium" : "text-muted-foreground"
            )}>
              <Calendar className="h-3 w-3" />
              <span>{new Date(task.dueDate).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric'
              })}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ProjectCard({ project, onUpdate, onClick, onEdit, onDelete }: { 
  project: Project; 
  onUpdate?: (updates: Partial<Project>) => void;
  onClick?: (project: Project) => void;
  onEdit?: (project: Project) => void;
  onDelete?: (project: Project) => void;
}) {
  const [taskCount, setTaskCount] = useState<number>(0);
  const [completedTasks, setCompletedTasks] = useState<number>(0);
  const [attachmentCount, setAttachmentCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Fetch task count and attachment count for this project
  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        // Fetch task count and completion data
        const tasksResponse = await fetch(`/api/projects/${project.id}/tasks`);
        if (tasksResponse.ok) {
          const tasks = await tasksResponse.json();
          setTaskCount(tasks.length);
          setCompletedTasks(tasks.filter((task: any) => task.status === 'completed').length);
        }

        // Fetch attachment count
        const attachmentsResponse = await fetch(`/api/attachments?projectId=${project.id}`);
        if (attachmentsResponse.ok) {
          const attachments = await attachmentsResponse.json();
          setAttachmentCount(attachments.length);
        }
      } catch (error) {
        console.error('Failed to fetch project data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjectData();
  }, [project.id]);

  const isOverdue = project.deadline && new Date(project.deadline) < new Date();
  const daysUntilDeadline = project.deadline 
    ? Math.ceil((new Date(project.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const completionPercentage = taskCount > 0 ? Math.round((completedTasks / taskCount) * 100) : 0;

  const getProjectStatusIcon = () => {
    switch (project.status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'active': return <Timer className="h-4 w-4 text-blue-500" />;
      case 'on-hold': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'planning': return <Target className="h-4 w-4 text-purple-500" />;
      default: return <Square className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <Card 
      className="hover:shadow-xl transition-all duration-300 cursor-pointer group relative flex flex-col min-h-[320px] max-h-[540px]"
      onClick={() => onClick?.(project)}
    >
      {/* Priority indicator bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${getPriorityColor(project.priority || 'Medium')}`} />
      
      <CardHeader className="pb-4 flex-shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              {project.imageUrl && (
                <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border-2 border-white shadow-sm">
                  <img 
                    src={project.imageUrl} 
                    alt={project.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg font-bold line-clamp-1 group-hover:text-primary transition-colors">
                  {project.name}
                </CardTitle>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge className={cn("text-xs", getStatusColor(project.status || 'planning'))}>
                    {(project.status || 'planning').replace('-', ' ')}
                  </Badge>
                  {getProjectStatusIcon()}
                </div>
              </div>
            </div>
            {project.description && (
              <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed break-words">
                {project.description}
              </p>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                onClick?.(project);
              }}>
                <Eye className="mr-2 h-4 w-4" />
                View Project
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                onEdit?.(project);
              }}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Project
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-red-600"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.(project);
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col justify-between space-y-4 pt-0 min-h-0">
        {/* Progress Section */}
        <div className="space-y-3">
          {/* Task Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Progress</span>
              <span className="text-sm font-medium text-muted-foreground">{completionPercentage}%</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{loading ? '...' : completedTasks} completed</span>
              <span>{loading ? '...' : taskCount} total tasks</span>
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <CheckSquare className="h-4 w-4" />
                <span className="font-medium">{loading ? '...' : taskCount}</span>
                <span>tasks</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span className="font-medium">{project.memberCount}</span>
                <span>members</span>
              </div>
              {attachmentCount > 0 && (
                <AttachmentCount count={attachmentCount} />
              )}
            </div>
            <Badge 
              variant="outline" 
              className={cn(
                "text-xs font-semibold px-2 py-1",
                project.priority === 'High' && "border-red-300 text-red-700 bg-red-50 dark:bg-red-950/20",
                project.priority === 'Medium' && "border-yellow-300 text-yellow-700 bg-yellow-50 dark:bg-yellow-950/20",
                project.priority === 'Low' && "border-green-300 text-green-700 bg-green-50 dark:bg-green-950/20"
              )}
            >
              {project.priority || 'Medium'}
            </Badge>
          </div>

          {/* Deadline Info */}
          {project.deadline && (
            <div className={cn(
              "flex items-center gap-2 text-sm px-3 py-2 rounded-lg border flex-wrap",
              isOverdue 
                ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:border-red-800" 
                : daysUntilDeadline && daysUntilDeadline <= 7
                  ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800"
                  : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800"
            )}>
              <Calendar className="h-4 w-4 flex-shrink-0" />
              <span className="font-medium">
                {isOverdue 
                  ? `Overdue by ${Math.abs(daysUntilDeadline || 0)} days`
                  : daysUntilDeadline === 0
                    ? "Due today"
                    : daysUntilDeadline === 1
                      ? "Due tomorrow"
                      : `Due in ${daysUntilDeadline} days`
                }
              </span>
            </div>
          )}

          {/* Project Manager */}
          {project.projectManager && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-gray-50 dark:bg-gray-800/50 px-3 py-2 rounded-lg flex-wrap">
              <User className="h-4 w-4 flex-shrink-0" />
              <span className="font-medium">Manager:</span>
              <span className="truncate max-w-[120px]">{project.projectManager}</span>
            </div>
          )}

          {/* Tags */}
          {project.tags && project.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 max-h-[48px] overflow-y-auto">
              {project.tags.slice(0, 6).map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                  {tag}
                </Badge>
              ))}
              {project.tags.length > 6 && (
                <Badge variant="secondary" className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-500">
                  +{project.tags.length - 6} more
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800 mt-auto">
          <div className="text-xs text-muted-foreground">
            Created {new Date(project.createdAt).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric',
              year: 'numeric'
            })}
          </div>
          <Link href={`/projects/${project.id}`} onClick={(e) => e.stopPropagation()}>
            <Button 
              variant="outline" 
              size="sm" 
              className="opacity-0 group-hover:opacity-100 transition-all duration-200 text-xs px-3 py-1 h-7"
            >
              <Eye className="h-3 w-3 mr-1" />
              View
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

// Add sorting function
const sortByPriorityLevel = (items: any[]) => {
  return [...items].sort((a, b) => {
    const aLevel = parseInt(a.priorityInfo?.priorityLevel?.replace('P-', '') || '999');
    const bLevel = parseInt(b.priorityInfo?.priorityLevel?.replace('P-', '') || '999');
    return aLevel - bLevel;
  });
};

export function GalleryView({ items, type, onItemUpdate, onItemClick, onEdit, onDelete, className, currentUserId }: GalleryViewProps & { currentUserId?: string }) {
  // Filter out completed tasks before prioritization
  const activeItems = items.filter(item => 
    type === 'tasks' ? 
      (item as Task).status !== 'DONE' && (item as Task).status !== 'completed' : 
      true
  );
  
  const { tasks: prioritizedTasks, updateTask } = useTaskPriority(activeItems as Task[]);

  // Handle task updates
  const handleTaskUpdate = (taskId: string, updates: Partial<Task>) => {
    updateTask(taskId, updates);
    onItemUpdate?.(taskId, updates);
  };

  // Separate completed tasks
  const completedItems = items.filter(item => 
    type === 'tasks' ? 
      (item as Task).status === 'DONE' || (item as Task).status === 'completed' : 
      false
  );

  return (
    <div className={cn("w-full", className)}>
      {/* Active Tasks */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 auto-rows-fr">
        {prioritizedTasks.map((item) => {
          if (type === 'tasks') {
            return (
              <TaskCard
                key={item.id}
                task={item as Task}
                onUpdate={(updates) => handleTaskUpdate(item.id, updates)}
                onClick={(task) => onItemClick?.(task)}
                currentUserId={currentUserId}
              />
            );
          } else {
            return (
              <ProjectCard
                key={item.id}
                project={item as Project}
                onUpdate={(updates) => onItemUpdate?.(item.id, updates)}
                onClick={(project) => onItemClick?.(project)}
                onEdit={(project) => onEdit?.(project)}
                onDelete={(project) => onDelete?.(project)}
              />
            );
          }
        })}
      </div>

      {/* Completed Tasks Section */}
      {completedItems.length > 0 && type === 'tasks' && (
        <>
          <div className="mt-8 mb-4">
            <h3 className="text-lg font-medium text-muted-foreground">Completed Tasks</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 auto-rows-fr opacity-75">
            {completedItems.map((item) => (
              <TaskCard
                key={item.id}
                task={item as Task}
                onUpdate={(updates) => onItemUpdate?.(item.id, updates)}
                onClick={(task) => onItemClick?.(task)}
                currentUserId={currentUserId}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
} 