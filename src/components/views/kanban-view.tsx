'use client';

import { useState } from 'react';
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
  Square
} from "lucide-react";
import { cn } from "@/lib/utils";

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

interface KanbanViewProps {
  tasks: Task[];
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => void;
  onTaskCreate?: (status: Task['status']) => void;
  onTaskClick?: (task: Task) => void;
  className?: string;
}

const columns = [
  {
    id: 'todo',
    title: 'To Do',
    status: 'todo' as const,
    color: 'bg-muted/40 dark:bg-muted/20',
    icon: Square,
    iconColor: 'text-muted-foreground'
  },
  {
    id: 'in-progress',
    title: 'In Progress',
    status: 'in-progress' as const,
    color: 'bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/30',
    icon: Timer,
    iconColor: 'text-blue-600 dark:text-blue-400'
  },
  {
    id: 'in-review',
    title: 'In Review',
    status: 'in-review' as const,
    color: 'bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/30',
    icon: AlertTriangle,
    iconColor: 'text-purple-600 dark:text-purple-400'
  },
  {
    id: 'completed',
    title: 'Completed',
    status: 'completed' as const,
    color: 'bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800/30',
    icon: CheckCircle,
    iconColor: 'text-green-600 dark:text-green-400'
  }
];

function getPriorityColor(priority: string) {
  switch (priority) {
    case 'urgent': return 'bg-red-500';
    case 'high': return 'bg-orange-500';
    case 'medium': return 'bg-yellow-500';
    case 'low': return 'bg-green-500';
    default: return 'bg-gray-500';
  }
}

function isOverdue(dueDate: string, status: string) {
  return new Date(dueDate) < new Date() && status !== "completed";
}

function TaskCard({ task, onUpdate, onTaskClick }: { task: Task; onUpdate?: (updates: Partial<Task>) => void; onTaskClick?: (task: Task) => void }) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.setData('text/plain', task.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onTaskClick?.(task);
  };

  return (
    <Card 
      className={cn(
        "cursor-move transition-all duration-200 hover:shadow-md dark:hover:shadow-lg",
        isDragging && "opacity-50 rotate-2",
        task.dueDate && isOverdue(task.dueDate, task.status) && "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/20",
        onTaskClick && "cursor-pointer"
      )}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-sm font-medium line-clamp-2">
            {task.title}
          </CardTitle>
          <div className="flex items-center space-x-1">
            <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`} />
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </div>
        </div>
        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {task.description}
          </p>
        )}
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {/* Progress */}
        {task.progress > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span>Progress</span>
              <span>{task.progress}%</span>
            </div>
            <Progress value={task.progress} className="h-1" />
          </div>
        )}

        {/* Tags */}
        {task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {task.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs px-1 py-0">
                {tag}
              </Badge>
            ))}
            {task.tags.length > 2 && (
              <Badge variant="secondary" className="text-xs px-1 py-0">
                +{task.tags.length - 2}
              </Badge>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Avatar className="h-4 w-4">
              <AvatarImage src={task.assignedByAvatar} />
              <AvatarFallback className="text-[8px]">
                {task.assignedBy.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <span className="truncate max-w-[60px]">{task.assignedBy}</span>
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
        </div>

        {/* Time tracking */}
        {(task.estimatedHours > 0 || task.loggedHours > 0) && (
          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{task.loggedHours}h / {task.estimatedHours}h</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function KanbanColumn({ 
  column, 
  tasks, 
  onTaskUpdate, 
  onTaskCreate,
  onTaskClick
}: { 
  column: typeof columns[0]; 
  tasks: Task[]; 
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => void;
  onTaskCreate?: (status: Task['status']) => void;
  onTaskClick?: (task: Task) => void;
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const Icon = column.icon;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId && onTaskUpdate) {
      onTaskUpdate(taskId, { status: column.status });
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className={cn("rounded-lg p-3 mb-4", column.color)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Icon className={cn("h-4 w-4", column.iconColor)} />
            <h3 className="font-medium text-sm text-foreground">{column.title}</h3>
            <Badge variant="secondary" className="text-xs">
              {tasks.length}
            </Badge>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 w-6 p-0 hover:bg-background/50"
            onClick={() => onTaskCreate?.(column.status)}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <div 
        className={cn(
          "flex-1 space-y-3 p-2 rounded-lg border-2 border-dashed transition-colors",
          isDragOver 
            ? "border-primary bg-primary/5 dark:bg-primary/10" 
            : "border-transparent hover:border-muted-foreground/20"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {tasks.map((task) => (
          <TaskCard 
            key={task.id} 
            task={task} 
            onUpdate={(updates) => onTaskUpdate?.(task.id, updates)}
            onTaskClick={onTaskClick}
          />
        ))}
        
        {tasks.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <div className="text-sm">No tasks</div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="mt-2 hover:bg-background/50"
              onClick={() => onTaskCreate?.(column.status)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add task
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export function KanbanView({ tasks, onTaskUpdate, onTaskCreate, onTaskClick, className }: KanbanViewProps) {
  return (
    <div className={cn("h-full", className)}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 h-full">
        {columns.map((column) => {
          const columnTasks = tasks.filter(task => task.status === column.status);
          
          return (
            <KanbanColumn
              key={column.id}
              column={column}
              tasks={columnTasks}
              onTaskUpdate={onTaskUpdate}
              onTaskCreate={onTaskCreate}
              onTaskClick={onTaskClick}
            />
          );
        })}
      </div>
    </div>
  );
} 