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
  Square,
  FolderOpen
} from "lucide-react";
import { cn, isTaskCompleted } from "@/lib/utils";
import { EditTaskButton } from "@/components/projects/task/EditTaskButton";
import { useTaskPriority } from "@/hooks/use-task-priority";
import { ViewTask, Task } from "@/types";

interface KanbanViewProps {
  tasks: ViewTask[];
  onTaskUpdate?: (taskId: string, updates: Partial<ViewTask>) => void;
  onTaskCreate?: (status: ViewTask['status']) => void;
  onTaskClick?: (task: ViewTask) => void;
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
    id: 'completed',
    title: 'Completed',
    status: 'completed' as const,
    color: 'bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800/30',
    icon: CheckCircle,
    iconColor: 'text-green-600 dark:text-green-400'
  }
];

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

function getPriorityTextColor(priority: string) {
  const normalizedPriority = priority?.toLowerCase() || 'medium';
  switch (normalizedPriority) {
    case 'urgent': return 'text-red-600 dark:text-red-400';
    case 'high': return 'text-red-500 dark:text-red-400';
    case 'medium': return 'text-yellow-600 dark:text-yellow-400';
    case 'low': return 'text-green-600 dark:text-green-400';
    default: return 'text-gray-600 dark:text-gray-400';
  }
}

function isOverdue(dueDate: string, status: string) {
  return new Date(dueDate) < new Date() && status !== "completed";
}

function TaskCard({ task, onUpdate, onTaskClick }: { 
  task: ViewTask; 
  onUpdate?: (updates: Partial<ViewTask>) => void;
  onTaskClick?: (task: ViewTask) => void;
}) {
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
          <div className="flex items-center space-x-2">
            {!isTaskCompleted(task.status) && (
              <Badge variant="outline" className="text-xs">
                {task.priorityLevel || 'P-?'}
              </Badge>
            )}
            <div className={`w-3 h-3 rounded-full ${getPriorityColor(task.priority)} ring-1 ring-white dark:ring-gray-800`} />
            {task.createdById && (
              <EditTaskButton 
                task={task} 
                icon={<MoreHorizontal className="h-3 w-3" />}
                size="sm"
                className="h-6 w-6 p-0"
                iconOnly
              />
            )}
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

        {/* Project Name */}
        {task.project && (
          <div className="flex items-center space-x-1 text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1">
            <FolderOpen className="h-3 w-3" />
            <span className="truncate font-medium">{task.project}</span>
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

// Add sorting function
const sortByPriorityLevel = (items: ViewTask[]) => {
  return [...items].sort((a, b) => {
    const aLevel = parseInt(a.priorityLevel?.replace('P-', '') || '999');
    const bLevel = parseInt(b.priorityLevel?.replace('P-', '') || '999');
    return aLevel - bLevel;
  });
};

function KanbanColumn({ 
  column, 
  tasks, 
  onTaskUpdate, 
  onTaskCreate,
  onTaskClick
}: { 
  column: typeof columns[0]; 
  tasks: ViewTask[]; 
  onTaskUpdate?: (taskId: string, updates: Partial<ViewTask>) => void;
  onTaskCreate?: (status: ViewTask['status']) => void;
  onTaskClick?: (task: ViewTask) => void;
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const Icon = column.icon;

  // Sort tasks by priority level
  const sortedTasks = sortByPriorityLevel(tasks);

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
    <div className={cn("flex flex-col h-full rounded-lg p-3", column.color)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Icon className={cn("h-4 w-4", column.iconColor)} />
          <h3 className="text-sm font-medium">{column.title}</h3>
          <Badge variant="outline" className="text-xs">
            {sortedTasks.length}
          </Badge>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-7 w-7 p-0" 
          onClick={() => onTaskCreate?.(column.status)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      
      <div 
        className={cn(
          "flex-1 overflow-y-auto space-y-3 min-h-[300px] pb-2",
          isDragOver && "bg-muted/50 rounded-md"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {sortedTasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onUpdate={(updates) => onTaskUpdate?.(task.id, updates)}
            onTaskClick={onTaskClick}
          />
        ))}
      </div>
    </div>
  );
}

export function KanbanView({ tasks: initialTasks, onTaskUpdate, onTaskCreate, onTaskClick, className }: KanbanViewProps) {
  // Convert ViewTask to Task for the priority hook
  const tasksForPriority: Task[] = initialTasks.map(task => ({
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
  const activeTasks = tasksForPriority.filter(task => 
    task.status !== 'DONE'
  );
  
  const { tasks: prioritizedTasks, updateTask } = useTaskPriority(activeTasks);

  // Convert back to ViewTask format
  const viewTasks: ViewTask[] = prioritizedTasks.map(task => {
    const originalTask = initialTasks.find(t => t.id === task.id);
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
    onTaskUpdate?.(taskId, updates);
  };

  // Get completed tasks for the "Completed" column
  const completedTasks = initialTasks.filter(task => 
    task.status === 'completed'
  );

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-4 h-full", className)}>
      {columns.map((column) => {
        // For completed column, use completedTasks directly
        const tasksForColumn = column.status === 'completed' 
          ? completedTasks 
          : viewTasks.filter(task => task.status === column.status);
        
        return (
          <KanbanColumn
            key={column.id}
            column={column}
            tasks={tasksForColumn}
            onTaskUpdate={handleTaskUpdate}
            onTaskCreate={onTaskCreate}
            onTaskClick={onTaskClick}
          />
        );
      })}
    </div>
  );
} 