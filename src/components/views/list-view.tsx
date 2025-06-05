'use client';

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
  ChevronRight
} from "lucide-react";
import { cn, isTaskCompleted } from "@/lib/utils";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect } from "react";
import { Project as ProjectType } from "@/types";
import { EditProjectDialog } from "@/components/projects/EditProjectDialog";
import { DeleteProjectDialog } from "@/components/projects/DeleteProjectDialog";
import { AttachmentCount } from "@/components/ui/attachment-thumbnail";
import { EditTaskButton } from "@/components/projects/task/EditTaskButton";
import { useTaskPriority } from "@/hooks/use-task-priority";
import { ViewTask, Task, Project } from "@/types";

interface ListViewProps {
  items: ViewTask[] | Project[];
  type: 'tasks' | 'projects';
  onItemUpdate?: (itemId: string, updates: any) => void;
  onItemClick?: (item: ViewTask | Project) => void;
  onEdit?: (item: ViewTask | Project) => void;
  onDelete?: (item: ViewTask | Project) => void;
  className?: string;
}

function getPriorityColor(priority: string) {
  const normalizedPriority = priority?.toLowerCase() || 'medium';
  switch (normalizedPriority) {
    case 'urgent': return 'bg-red-600';
    case 'high': return 'bg-red-500';
    case 'medium': return 'bg-yellow-500';
    case 'low': return 'bg-green-500';
    default: return 'bg-gray-400';
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

function TaskListItem({ task, onUpdate, onClick }: { 
  task: ViewTask; 
  onUpdate?: (updates: Partial<ViewTask>) => void;
  onClick?: (task: ViewTask) => void;
}) {
  return (
    <div 
      className={cn(
        "flex items-center justify-between p-4 border-b hover:bg-muted/50 transition-colors cursor-pointer group",
        task.dueDate && isOverdue(task.dueDate, task.status) && "bg-red-50 dark:bg-red-950/20 border-red-300 dark:border-red-700"
      )}
      onClick={() => onClick?.(task)}
    >
      <div className="flex items-center space-x-4 flex-1 min-w-0">
        {/* Priority indicator and P-level */}
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${getPriorityColor(task.priority)} flex-shrink-0 ring-1 ring-white dark:ring-gray-800 shadow-sm`} />
          {!isTaskCompleted(task.status) && (
            <Badge variant="outline" className="text-xs">
              {task.priorityLevel || 'P-?'}
            </Badge>
          )}
        </div>
        
        {/* Task info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="font-medium text-sm truncate group-hover:text-primary">
              {task.title}
            </h3>
            <Badge className={cn("text-xs", getStatusColor(task.status))}>
              {task.status?.replace('-', ' ') || 'unknown'}
            </Badge>
          </div>
          
          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
            <div className="flex items-center space-x-1 bg-muted/30 rounded px-2 py-0.5">
              <FolderOpen className="h-3 w-3 text-blue-600 dark:text-blue-400" />
              <span className="truncate max-w-[180px] font-medium text-blue-800 dark:text-blue-300">{task.project || 'No Project'}</span>
            </div>
            
            <div className="flex items-center space-x-1">
              <Avatar className="h-4 w-4">
                <AvatarImage src={task.assignedByAvatar} />
                <AvatarFallback className="text-[8px]">
                  {task.assignedBy?.split(' ').map(n => n[0]).join('') || 'U'}
                </AvatarFallback>
              </Avatar>
              <span className="truncate max-w-[80px]">{task.assignedBy || 'Unassigned'}</span>
            </div>
            
            {task.dueDate && (
              <div className={cn(
                "flex items-center space-x-1",
                isOverdue(task.dueDate, task.status) && "text-red-600 dark:text-red-400"
              )}>
                <Calendar className="h-3 w-3" />
                <span>{new Date(task.dueDate).toLocaleDateString()}</span>
              </div>
            )}
            
            {(task.estimatedHours > 0 || task.loggedHours > 0) && (
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>{task.loggedHours}h / {task.estimatedHours}h</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Progress and actions */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 min-w-[100px]">
          <Progress value={task.progress} className="h-2 w-16" />
          <span className="text-xs text-muted-foreground w-8">{task.progress}%</span>
        </div>
        
        <EditTaskButton 
          task={task}
          className="opacity-0 group-hover:opacity-100 h-8 w-8 p-0"
          icon={<Edit className="h-4 w-4" />}
          iconOnly
        />
        
        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100" />
      </div>
    </div>
  );
}

function ProjectListItem({ project, onUpdate, onClick, onEdit, onDelete }: { 
  project: Project; 
  onUpdate?: (updates: Partial<Project>) => void;
  onClick?: (project: Project) => void;
  onEdit?: (project: Project) => void;
  onDelete?: (project: Project) => void;
}) {
  const [attachmentCount, setAttachmentCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Fetch attachment count for this project
  useEffect(() => {
    const fetchAttachmentCount = async () => {
      try {
        const response = await fetch(`/api/attachments?projectId=${project.id}`);
        if (response.ok) {
          const attachments = await response.json();
          setAttachmentCount(attachments.length);
        }
      } catch (error) {
        console.error('Failed to fetch attachment count:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAttachmentCount();
  }, [project.id]);

  return (
    <div 
      className="flex items-center justify-between p-4 border-b hover:bg-muted/50 transition-colors cursor-pointer group"
      onClick={() => onClick?.(project)}
    >
      <div className="flex items-center space-x-4 flex-1 min-w-0">
        {/* Priority indicator */}
        <div className={`w-3 h-3 rounded-full ${getPriorityColor(project.priority || 'medium')} flex-shrink-0 ring-1 ring-white dark:ring-gray-800 shadow-sm`} />
        
        {/* Project info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="font-medium text-sm truncate group-hover:text-primary">
              {project.name}
            </h3>
            <Badge className={cn("text-xs", getStatusColor(project.status || 'active'))}>
              {(project.status || 'active').replace('-', ' ')}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {project.role || 'member'}
            </Badge>
            {attachmentCount > 0 && (
              <AttachmentCount count={attachmentCount} />
            )}
          </div>
          
          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Users className="h-3 w-3" />
              <span>{project.memberCount} members</span>
            </div>
            
            <div className="flex items-center space-x-1">
              <Calendar className="h-3 w-3" />
              <span>Created {new Date(project.createdAt).toLocaleDateString()}</span>
            </div>
            
            {project.updatedAt && (
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>Updated {new Date(project.updatedAt).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex items-center space-x-4">
        <div className="text-xs text-muted-foreground">
          Priority: {project.priority || 'medium'}
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100"
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
        
        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100" />
      </div>
    </div>
  );
}

// Add sorting function
const sortByPriorityLevel = (items: any[]) => {
  return [...items].sort((a, b) => {
    const aLevel = parseInt(a.priorityLevel?.replace('P-', '') || '999');
    const bLevel = parseInt(b.priorityLevel?.replace('P-', '') || '999');
    return aLevel - bLevel;
  });
};

export function ListView({ items, type, onItemUpdate, onItemClick, onEdit, onDelete, className }: ListViewProps) {
  if (type === 'tasks') {
    const taskItems = items as ViewTask[];
    
    // Convert ViewTask to Task for the priority hook
    const tasksForPriority: Task[] = taskItems.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description || '',
      status: task.status === 'todo' ? 'TODO' : task.status === 'in-progress' ? 'IN_PROGRESS' : 'DONE',
      priority: task.priority?.toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' || 'MEDIUM',
      dueDate: task.dueDate || null,
      estimatedHours: task.estimatedHours || null,
      projectId: task.projectId || '',
      assigneeId: null,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      createdById: task.createdById,
      priorityInfo: {
        priorityLevel: task.priorityLevel
      }
    }));

    // Filter out completed tasks before prioritization
    const activeItems = tasksForPriority.filter(task => 
      task.status !== 'DONE'
    );
    
    const { tasks: prioritizedTasks, updateTask } = useTaskPriority(activeItems);

    // Convert back to ViewTask format
    const viewTasks: ViewTask[] = prioritizedTasks.map(task => {
      const originalTask = taskItems.find(t => t.id === task.id);
      return {
        ...originalTask!,
        priorityLevel: task.priorityInfo?.priorityLevel || originalTask!.priorityLevel
      };
    });

    // Handle task updates
    const handleTaskUpdate = (taskId: string, updates: Partial<ViewTask>) => {
      // Convert updates to Task format for the hook
      const taskUpdates: Partial<Task> = {
        ...updates,
        status: updates.status ? 
          (updates.status === 'todo' ? 'TODO' : 
           updates.status === 'in-progress' ? 'IN_PROGRESS' : 'DONE') : undefined,
        priority: updates.priority?.toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | undefined
      };
      
      updateTask(taskId, taskUpdates);
      onItemUpdate?.(taskId, updates);
    };

    // Separate completed tasks to show at the bottom without priority numbers
    const completedItems = taskItems.filter(task => 
      task.status === 'completed'
    );

    return (
      <div className={cn("w-full", className)}>
        <div className="border rounded-lg bg-background">
          {/* Active Tasks */}
          {viewTasks.map((item) => (
            <TaskListItem
              key={item.id}
              task={item}
              onUpdate={(updates) => handleTaskUpdate(item.id, updates)}
              onClick={(task) => onItemClick?.(task)}
            />
          ))}

          {/* Completed Tasks */}
          {completedItems.length > 0 && (
            <>
              <div className="px-4 py-2 bg-muted/30 border-t">
                <h3 className="text-sm font-medium text-muted-foreground">Completed Tasks</h3>
              </div>
              {completedItems.map((item) => (
                <TaskListItem
                  key={item.id}
                  task={item}
                  onUpdate={(updates) => onItemUpdate?.(item.id, updates)}
                  onClick={(task) => onItemClick?.(task)}
                />
              ))}
            </>
          )}

          {/* Empty State */}
          {taskItems.length === 0 && (
            <div className="text-center py-12">
              <div className="text-muted-foreground">
                <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No tasks found</h3>
                <p className="text-sm">Create your first task to get started</p>
              </div>
              <Button className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Create Task
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  } else {
    // Handle projects
    const projectItems = items as Project[];
    
    return (
      <div className={cn("w-full", className)}>
        <div className="border rounded-lg bg-background">
          {projectItems.map((item) => (
            <ProjectListItem
              key={item.id}
              project={item}
              onUpdate={(updates) => onItemUpdate?.(item.id, updates)}
              onClick={(project) => onItemClick?.(project)}
              onEdit={(project) => onEdit?.(project)}
              onDelete={(project) => onDelete?.(project)}
            />
          ))}

          {/* Empty State */}
          {projectItems.length === 0 && (
            <div className="text-center py-12">
              <div className="text-muted-foreground">
                <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No projects found</h3>
                <p className="text-sm">Create your first project to get started</p>
              </div>
              <Button className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Create Project
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }
} 