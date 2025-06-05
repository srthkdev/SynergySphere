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
import { cn } from "@/lib/utils";
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

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
  assignedBy: string;
  assignedByAvatar: string;
  tags: string[];
  progress: number;
  estimatedHours: number;
  loggedHours: number;
  project: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  status: 'planning' | 'active' | 'on-hold' | 'completed';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
  role: string; // user's role in the project
  memberCount: number;
}

interface ListViewProps {
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

function TaskListItem({ task, onUpdate, onClick }: { 
  task: Task; 
  onUpdate?: (updates: Partial<Task>) => void;
  onClick?: (task: Task) => void;
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
        {/* Priority indicator */}
        <div className={`w-3 h-3 rounded-full ${getPriorityColor(task.priority)} flex-shrink-0`} />
        
        {/* Task info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="font-medium text-sm truncate group-hover:text-primary">
              {task.title}
            </h3>
            <Badge className={cn("text-xs", getStatusColor(task.status))}>
              {task.status.replace('-', ' ')}
            </Badge>
          </div>
          
          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
            <div className="flex items-center space-x-1">
              <FolderOpen className="h-3 w-3" />
              <span className="truncate max-w-[100px]">{task.project}</span>
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
        <div className={`w-3 h-3 rounded-full ${getPriorityColor(project.priority)} flex-shrink-0`} />
        
        {/* Project info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="font-medium text-sm truncate group-hover:text-primary">
              {project.name}
            </h3>
            <Badge className={cn("text-xs", getStatusColor(project.status))}>
              {project.status.replace('-', ' ')}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {project.role}
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
            
            <div className="flex items-center space-x-1">
              <Clock className="h-3 w-3" />
              <span>Updated {new Date(project.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex items-center space-x-4">
        <div className="text-xs text-muted-foreground">
          Priority: {project.priority}
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

export function ListView({ items, type, onItemUpdate, onItemClick, onEdit, onDelete, className }: ListViewProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="border rounded-lg bg-background">
        {items.length > 0 ? (
          items.map((item, index) => {
            if (type === 'tasks') {
              return (
                <TaskListItem
                  key={item.id}
                  task={item as Task}
                  onUpdate={(updates) => onItemUpdate?.(item.id, updates)}
                  onClick={(task) => onItemClick?.(task)}
                />
              );
            } else {
              return (
                <ProjectListItem
                  key={item.id}
                  project={item as Project}
                  onUpdate={(updates) => onItemUpdate?.(item.id, updates)}
                  onClick={(project) => onItemClick?.(project)}
                  onEdit={(project) => onEdit?.(project)}
                  onDelete={(project) => onDelete?.(project)}
                />
              );
            }
          })
        ) : (
          <div className="text-center py-12">
            <div className="text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No {type} found</h3>
              <p className="text-sm">
                {type === 'tasks' 
                  ? "Create your first task to get started" 
                  : "Create your first project to get started"
                }
              </p>
            </div>
            <Button className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Create {type === 'tasks' ? 'Task' : 'Project'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
} 