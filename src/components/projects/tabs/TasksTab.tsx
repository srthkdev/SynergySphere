import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PlusCircle, Edit3, Trash2, Loader2, ArrowUpCircle, CheckCircle, Filter, MoreHorizontal, ChevronDown, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { fetchTasksByProjectId, updateTask, deleteTask, fetchProjectMembers } from "@/lib/queries";
import { Task as BackendTask, TaskStatus, ProjectMember, TaskPriority } from "@/types";
import { CreateEditTaskDialog } from "../task/CreateEditTaskDialog";
import { useSession } from "@/lib/auth/auth-client";
import { useRouter } from "next/navigation";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AttachmentViewer } from "@/components/ui/attachment-viewer";

// Import the new view components
import { ViewSwitcher, ViewMode } from "@/components/ui/view-switcher";
import { KanbanView } from "@/components/views/kanban-view";
import { GalleryView } from "@/components/views/gallery-view";
import { ListView } from "@/components/views/list-view";

// Frontend Task interface for views
interface FrontendTask {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  priorityLevel: string;
  dueDate: string | null | undefined;
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
  createdById: string;
}

// Task status options with badge colors
export const taskStatusOptions: { value: TaskStatus; label: string; color: string }[] = [
  { value: 'TODO', label: 'To Do', color: 'bg-slate-200 text-slate-800' },
  { value: 'IN_PROGRESS', label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
  { value: 'DONE', label: 'Done', color: 'bg-green-100 text-green-800' },
];

// Priority options with badge colors
export const priorityOptions: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'LOW', label: 'Low', color: 'bg-zinc-100 text-zinc-800' },
  { value: 'MEDIUM', label: 'Medium', color: 'bg-amber-100 text-amber-800' },
  { value: 'HIGH', label: 'High', color: 'bg-red-100 text-red-800' },
];

interface OptimisticTaskContext {
  previousTasks?: BackendTask[];
}

export function TasksTab({ projectId, projectName }: { projectId: string; projectName?: string }) {
  const queryClient = useQueryClient();
  const [isCreateTaskDialogOpen, setIsCreateTaskDialogOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<BackendTask | null>(null);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | 'ALL'>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<TaskPriority | 'ALL'>('ALL');
  const [currentView, setCurrentView] = useState<ViewMode>('kanban');
  const router = useRouter();

  // Convert backend task format to frontend format
  const convertTaskFormat = (backendTask: BackendTask, userId?: string): FrontendTask => {
    return {
      id: backendTask.id,
      title: backendTask.title,
      description: backendTask.description || '',
      status: backendTask.status === 'TODO' ? 'todo' : 
              backendTask.status === 'IN_PROGRESS' ? 'in-progress' : 
              backendTask.status === 'DONE' ? 'completed' : 'todo',
      priority: backendTask.priority?.toLowerCase() as 'low' | 'medium' | 'high' || 'medium',
      priorityLevel: 'P-0', // Placeholder - will be set by priority system
      dueDate: backendTask.dueDate || null,
      assignedBy: backendTask.assigneeId ? 'Project Manager' : 'Unassigned',
      assignedByAvatar: 'https://ui-avatars.com/api/?name=Project+Manager&background=3b82f6',
      tags: [],
      progress: backendTask.status === 'DONE' ? 100 : 
                backendTask.status === 'IN_PROGRESS' ? 50 : 0,
      estimatedHours: 8,
      loggedHours: backendTask.status === 'DONE' ? 8 : 
                   backendTask.status === 'IN_PROGRESS' ? 4 : 0,
      project: projectName || 'Current Project',
      projectId: backendTask.projectId || '',
      createdAt: backendTask.createdAt,
      updatedAt: backendTask.updatedAt,
      createdById: backendTask.createdById || userId || 'unknown'
    };
  };

  const { data: backendTasks = [], isLoading, error: tasksError } = useQuery<BackendTask[], Error>({
    queryKey: ['tasks', projectId],
    queryFn: () => fetchTasksByProjectId(projectId),
    enabled: !!projectId,
  });

  // Convert backend tasks to frontend format
  const tasks = backendTasks.map(task => convertTaskFormat(task, currentUserId));

  // Fetch project members to display assignee info and get current user's role
  const { data: members = [] } = useQuery<ProjectMember[], Error>({
    queryKey: ['projectMembers', projectId],
    queryFn: () => fetchProjectMembers(projectId),
    enabled: !!projectId,
  });

  // Create a lookup map for member data by userId
  const memberMap = members.reduce((map, member) => {
    map[member.userId] = member;
    return map;
  }, {} as Record<string, ProjectMember>);
  
  // Check if current user is an admin or owner
  const isAdminOrOwner = currentUserId ? (memberMap[currentUserId]?.role === 'admin' || memberMap[currentUserId]?.role === 'owner') : false;
  
  // Check if current user can create tasks (admin, owner, or member)
  const canCreateTasks = currentUserId ? ['admin', 'owner', 'member'].includes(memberMap[currentUserId]?.role) : false;

  // Check if task is assigned to current user
  const isTaskAssignee = (task: FrontendTask) => {
    const backendTask = backendTasks.find(bt => bt.id === task.id);
    return backendTask?.assigneeId === currentUserId;
  };

  // Filter tasks by selected status and priority
  const filteredTasks = tasks.filter(task => {
    const backendTask = backendTasks.find(bt => bt.id === task.id);
    const statusMatch = selectedStatus === 'ALL' || backendTask?.status === selectedStatus;
    const priorityMatch = selectedPriority === 'ALL' || backendTask?.priority === selectedPriority;
    return statusMatch && priorityMatch;
  });

  const deleteTaskMutation = useMutation<
    { success: boolean, deletedTaskId: string }, 
    Error, 
    string, // taskId
    OptimisticTaskContext 
  >({
    mutationFn: (taskId) => deleteTask(projectId, taskId),
    onMutate: async (deletedTaskId) => {
      await queryClient.cancelQueries({ queryKey: ['tasks', projectId] });
      const previousTasks = queryClient.getQueryData<BackendTask[]>(['tasks', projectId]);
      queryClient.setQueryData<BackendTask[]>(['tasks', projectId], (old = []) => 
        old.filter(task => task.id !== deletedTaskId)
      );
      return { previousTasks };
    },
    onError: (err, deletedTaskId, context) => {
      toast.error(err.message || "Failed to delete task");
      if (context?.previousTasks) {
        queryClient.setQueryData<BackendTask[]>(['tasks', projectId], context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
    }
  });

  const updateTaskStatusMutation = useMutation<
    BackendTask, 
    Error, 
    { taskId: string; status: TaskStatus },
    OptimisticTaskContext
  >({
    mutationFn: ({ taskId, status }) => updateTask(projectId, taskId, { status }),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ['tasks', projectId] });
      const previousTasks = queryClient.getQueryData<BackendTask[]>(['tasks', projectId]);
      queryClient.setQueryData<BackendTask[]>(['tasks', projectId], (oldTasks = []) => 
        oldTasks.map(task => 
          task.id === variables.taskId ? { ...task, status: variables.status, updatedAt: new Date().toISOString() } : task
        )
      );
      return { previousTasks }; 
    },
    onError: (err, variables, context) => {
      toast.error(err.message || "Failed to update task status");
      if (context?.previousTasks) {
        queryClient.setQueryData<BackendTask[]>(['tasks', projectId], context.previousTasks);
      }
    },
    onSuccess: (updatedTask) => {
      toast.success(`Task moved to ${updatedTask.status.toLowerCase().replace(/_/g, ' ')}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({queryKey: ['tasks', projectId]}); 
    }
  });

  const handleEditTask = (task: FrontendTask) => {
    // Find the corresponding backend task
    const backendTask = backendTasks.find(bt => bt.id === task.id);
    if (backendTask) {
      setTaskToEdit({...backendTask});
      setTimeout(() => {
        setIsCreateTaskDialogOpen(true);
      }, 0);
    }
  }

  const handleAddNewTask = () => {
    // Clear any existing task to edit
    setTaskToEdit(null);
    // Open the dialog
    setIsCreateTaskDialogOpen(true);
  }
  
  const handleUpdateTaskStatus = (task: FrontendTask, newStatus: TaskStatus) => {
    updateTaskStatusMutation.mutate({
      taskId: task.id,
      status: newStatus
    });
  };
  
  const openImagePreview = (url: string) => {
    setCurrentImageUrl(url);
    setImageDialogOpen(true);
  };

  // Handle task updates from views
  const handleTaskUpdate = async (taskId: string, updates: Partial<FrontendTask>) => {
    try {
      // Convert frontend status back to backend format
      let backendUpdates: any = { ...updates };
      if (updates.status) {
        backendUpdates.status = updates.status === 'todo' ? 'TODO' : 
                               updates.status === 'in-progress' ? 'IN_PROGRESS' : 
                               updates.status === 'completed' ? 'DONE' : 'TODO';
      }
      
      const response = await updateTask(projectId, taskId, backendUpdates);
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      toast.success('Task updated successfully');
    } catch (err) {
      console.error('Error updating task:', err);
      toast.error('Failed to update task');
    }
  };

  // Handle task click
  const handleTaskClick = (item: FrontendTask) => {
    router.push(`/task/${item.id}`);
  };

  const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    return 'Unknown error';
  };

  if (isLoading) return <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (tasksError) return <div className="text-red-500 text-center py-10">Error loading tasks: {getErrorMessage(tasksError)}</div>;

  return (
    <>
      <div className="space-y-4">
        {/* Header with actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b mb-4">
          <div className="flex flex-wrap gap-2 items-center">
            {/* Status filter */}
            <Select value={selectedStatus} onValueChange={(value: TaskStatus | 'ALL') => setSelectedStatus(value)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                {taskStatusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Priority filter */}
            <Select value={selectedPriority} onValueChange={(value: TaskPriority | 'ALL') => setSelectedPriority(value)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Priorities</SelectItem>
                {priorityOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 items-center">
            {/* View switcher */}
            <ViewSwitcher currentView={currentView} onViewChange={setCurrentView} />
            {/* Create task button */}
            <Button onClick={handleAddNewTask} size="sm" className="ml-2">
              <PlusCircle className="h-4 w-4 mr-2" />
              Create Task
            </Button>
          </div>
        </div>

        {/* Main content */}
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : tasksError ? (
          <div className="text-red-500 text-center py-10">
            Error loading tasks: {getErrorMessage(tasksError)}
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 space-y-4">
            <div className="text-center space-y-2">
              <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground" />
              <h3 className="text-lg font-medium">No tasks yet</h3>
              <p className="text-sm text-muted-foreground">Get started by creating a new task for this project.</p>
            </div>
            {canCreateTasks && (
              <Button onClick={handleAddNewTask}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Create Task
              </Button>
            )}
          </div>
        ) : (
          <div>
            {currentView === 'kanban' && (
              <KanbanView 
                tasks={filteredTasks}
                onTaskUpdate={(taskId: string, updates: any) => handleTaskUpdate(taskId, updates)}
                onTaskCreate={(status) => {
                  // Create a new task with the specified status
                  setTaskToEdit(null); // Ensure we're creating a new task
                  setIsCreateTaskDialogOpen(true);
                  // Note: The dialog will need to be enhanced to accept initial status
                }}
                onTaskClick={(task: any) => handleTaskClick(task as FrontendTask)}
              />
            )}
            
            {currentView === 'gallery' && (
              <GalleryView 
                items={filteredTasks as any}
                type="tasks"
                onItemUpdate={(itemId: string, updates: any) => handleTaskUpdate(itemId, updates)}
                onItemClick={(item: any) => handleTaskClick(item as FrontendTask)}
              />
            )}
            
            {currentView === 'list' && (
              <ListView 
                items={filteredTasks as any}
                type="tasks"
                onItemUpdate={(itemId: string, updates: any) => handleTaskUpdate(itemId, updates)}
                onItemClick={(item: any) => handleTaskClick(item as FrontendTask)}
              />
            )}
          </div>
        )}

        <CreateEditTaskDialog 
          key={taskToEdit ? taskToEdit.id : `new-${projectId}`}
          open={isCreateTaskDialogOpen} 
          onOpenChange={(isOpen) => {
            setIsCreateTaskDialogOpen(isOpen);
            if (!isOpen) {
              setTimeout(() => {
                setTaskToEdit(null);
              }, 300);
            }
          }} 
          projectId={projectId} 
          taskToEdit={taskToEdit}
        />
      </div>

      {/* Replace the separate image preview dialog with AttachmentViewer */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className="max-w-3xl p-0 bg-transparent border-none">
          {currentImageUrl && (
            <AttachmentViewer 
              url={currentImageUrl} 
              alt="Task attachment"
              className="max-h-[70vh] max-w-full" 
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
} 