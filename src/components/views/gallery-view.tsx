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
  Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'in-review' | 'completed';
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
  progress: number;
  startDate: string;
  endDate?: string;
  budget: number;
  spent: number;
  teamSize: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface GalleryViewProps {
  items: Task[] | Project[];
  type: 'tasks' | 'projects';
  onItemUpdate?: (itemId: string, updates: any) => void;
  onItemClick?: (item: Task | Project) => void;
  className?: string;
}

function getPriorityColor(priority: string) {
  switch (priority) {
    case 'urgent': return 'bg-red-500';
    case 'high': return 'bg-orange-500';
    case 'medium': return 'bg-yellow-500';
    case 'low': return 'bg-green-500';
    default: return 'bg-gray-500';
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'completed': return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800';
    case 'in-progress': return 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800';
    case 'in-review': return 'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800';
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

function TaskCard({ task, onUpdate, onClick }: { 
  task: Task; 
  onUpdate?: (updates: Partial<Task>) => void;
  onClick?: (task: Task) => void;
}) {
  return (
    <Card 
      className={cn(
        "hover:shadow-lg transition-all duration-200 cursor-pointer group",
        task.dueDate && isOverdue(task.dueDate, task.status) && "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/20"
      )}
      onClick={() => onClick?.(task)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base font-semibold line-clamp-2 group-hover:text-primary">
              {task.title}
            </CardTitle>
            {task.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {task.description}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-2 ml-2">
            <div className={`w-3 h-3 rounded-full ${getPriorityColor(task.priority)}`} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Task
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-600">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Status and Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Badge className={getStatusColor(task.status)}>
              {task.status.replace('-', ' ')}
            </Badge>
            <span className="text-sm text-muted-foreground">{task.progress}%</span>
          </div>
          <Progress value={task.progress} className="h-2" />
        </div>

        {/* Tags */}
        {task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {task.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {task.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{task.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Project Info */}
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <FolderOpen className="h-4 w-4" />
          <span className="truncate">{task.project}</span>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center space-x-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={task.assignedByAvatar} />
              <AvatarFallback className="text-xs">
                {task.assignedBy.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground truncate">
              {task.assignedBy}
            </span>
          </div>
          
          {task.dueDate && (
            <div className={cn(
              "flex items-center space-x-1 text-sm",
              isOverdue(task.dueDate, task.status) ? "text-red-600 dark:text-red-400" : "text-muted-foreground"
            )}>
              <Calendar className="h-4 w-4" />
              <span>{new Date(task.dueDate).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {/* Time tracking */}
        {(task.estimatedHours > 0 || task.loggedHours > 0) && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>Time</span>
            </div>
            <span>{task.loggedHours}h / {task.estimatedHours}h</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ProjectCard({ project, onUpdate, onClick }: { 
  project: Project; 
  onUpdate?: (updates: Partial<Project>) => void;
  onClick?: (project: Project) => void;
}) {
  const budgetUsage = project.budget > 0 ? (project.spent / project.budget) * 100 : 0;
  const isOverBudget = budgetUsage > 100;

  return (
    <Card 
      className={cn(
        "hover:shadow-lg transition-all duration-200 cursor-pointer group",
        isOverBudget && "border-red-200 bg-red-50"
      )}
      onClick={() => onClick?.(project)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base font-semibold line-clamp-1 group-hover:text-primary">
              {project.name}
            </CardTitle>
            {project.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {project.description}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-2 ml-2">
            <div className={`w-3 h-3 rounded-full ${getPriorityColor(project.priority)}`} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Eye className="mr-2 h-4 w-4" />
                  View Project
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Project
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-600">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Status and Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Badge className={getStatusColor(project.status)}>
              {project.status ? project.status.replace('-', ' ') : 'N/A'}
            </Badge>
            <span className="text-sm text-muted-foreground">{project.progress}%</span>
          </div>
          <Progress value={project.progress} className="h-2" />
        </div>

        {/* Budget */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-1">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Budget</span>
            </div>
            <span className={cn(
              "font-medium",
              isOverBudget ? "text-red-600" : "text-muted-foreground"
            )}>
              {formatCurrency(project.spent)} / {formatCurrency(project.budget)}
            </span>
          </div>
          <Progress 
            value={Math.min(budgetUsage, 100)} 
            className={cn("h-2", isOverBudget && "bg-red-100")}
          />
        </div>

        {/* Tags */}
        {project.tags && Array.isArray(project.tags) && project.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {project.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {project.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{project.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Team and Timeline */}
        <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Users className="h-4 w-4" />
            <span>{project.teamSize} members</span>
          </div>
          <div className="flex items-center space-x-1">
            <Calendar className="h-4 w-4" />
            <span>
              {project.endDate 
                ? new Date(project.endDate).toLocaleDateString()
                : 'No deadline'
              }
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="text-sm text-muted-foreground">
            Started {new Date(project.startDate).toLocaleDateString()}
          </div>
          <Link href={`/projects/${project.id}`}>
            <Button variant="outline" size="sm" className="opacity-0 group-hover:opacity-100">
              <Eye className="h-4 w-4 mr-1" />
              View
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export function GalleryView({ items, type, onItemUpdate, onItemClick, className }: GalleryViewProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {items.map((item) => {
          if (type === 'tasks') {
            return (
              <TaskCard
                key={item.id}
                task={item as Task}
                onUpdate={(updates) => onItemUpdate?.(item.id, updates)}
                onClick={(task) => onItemClick?.(task)}
              />
            );
          } else {
            return (
              <ProjectCard
                key={item.id}
                project={item as Project}
                onUpdate={(updates) => onItemUpdate?.(item.id, updates)}
                onClick={(project) => onItemClick?.(project)}
              />
            );
          }
        })}
      </div>
      
      {items.length === 0 && (
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
  );
} 