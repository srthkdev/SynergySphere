import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PlusCircle, Edit3, Trash2, Loader2, ArrowUpCircle, CheckCircle, Filter, MoreHorizontal, ChevronDown, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { fetchTasksByProjectId, updateTask, deleteTask, fetchProjectMembers } from "@/lib/queries";
import { Task, TaskStatus, ProjectMember, TaskPriority } from "@/types";
import { CreateEditTaskDialog } from "../task/CreateEditTaskDialog";
import { useSession } from "@/lib/auth-client";
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
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  previousTasks?: Task[];
}

export function TasksTab({ projectId }: { projectId: string }) {
  const queryClient = useQueryClient();
  const [isCreateTaskDialogOpen, setIsCreateTaskDialogOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | 'ALL'>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<TaskPriority | 'ALL'>('ALL');

  const { data: tasks = [], isLoading, error: tasksError } = useQuery<Task[], Error>({
    queryKey: ['tasks', projectId],
    queryFn: () => fetchTasksByProjectId(projectId),
    enabled: !!projectId,
  });

  // Fetch project members to display assignee info and get current user's role
  const { data: members = [] } = useQuery<ProjectMember[], Error>({
    queryKey: ['projectMembers', projectId],
    queryFn: () => fetchProjectMembers(projectId),
    enabled: !!projectId,
  });

  // Create a lookup map for member data
  const memberMap = members.reduce((map, member) => {
    map[member.id] = member;
    return map;
  }, {} as Record<string, ProjectMember>);
  
  // Check if current user is an admin
  const isAdmin = currentUserId ? memberMap[currentUserId]?.role === 'admin' : false;

  // Check if task is assigned to current user
  const isTaskAssignee = (task: Task) => {
    return task.assigneeId === currentUserId;
  };

  // Filter tasks by selected status and priority
  const filteredTasks = tasks.filter(task => {
    const statusMatch = selectedStatus === 'ALL' || task.status === selectedStatus;
    const priorityMatch = selectedPriority === 'ALL' || task.priority === selectedPriority;
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
      const previousTasks = queryClient.getQueryData<Task[]>(['tasks', projectId]);
      queryClient.setQueryData<Task[]>(['tasks', projectId], (old = []) => 
        old.filter(task => task.id !== deletedTaskId)
      );
      return { previousTasks };
    },
    onError: (err, deletedTaskId, context) => {
      toast.error(err.message || "Failed to delete task");
      if (context?.previousTasks) {
        queryClient.setQueryData<Task[]>(['tasks', projectId], context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
    }
  });

  const updateTaskStatusMutation = useMutation<
    Task, 
    Error, 
    { taskId: string; status: TaskStatus },
    OptimisticTaskContext
  >({
    mutationFn: ({ taskId, status }) => updateTask(projectId, taskId, { status }),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ['tasks', projectId] });
      const previousTasks = queryClient.getQueryData<Task[]>(['tasks', projectId]);
      queryClient.setQueryData<Task[]>(['tasks', projectId], (oldTasks = []) => 
        oldTasks.map(task => 
          task.id === variables.taskId ? { ...task, status: variables.status, updatedAt: new Date().toISOString() } : task
        )
      );
      return { previousTasks }; 
    },
    onError: (err, variables, context) => {
      toast.error(err.message || "Failed to update task status");
      if (context?.previousTasks) {
        queryClient.setQueryData<Task[]>(['tasks', projectId], context.previousTasks);
      }
    },
    onSuccess: (updatedTask) => {
      toast.success(`Task moved to ${updatedTask.status.toLowerCase().replace(/_/g, ' ')}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({queryKey: ['tasks', projectId]}); 
    }
  });

  const handleEditTask = (task: Task) => {
    // Make a clean copy of the task to prevent reference issues
    setTaskToEdit({...task});
    // Open the dialog after setting the task
    setTimeout(() => {
      setIsCreateTaskDialogOpen(true);
    }, 0);
  }

  const handleAddNewTask = () => {
    // Clear any existing task to edit
    setTaskToEdit(null);
    // Open the dialog
    setIsCreateTaskDialogOpen(true);
  }
  
  const handleUpdateTaskStatus = (task: Task, newStatus: TaskStatus) => {
    updateTaskStatusMutation.mutate({
      taskId: task.id,
      status: newStatus
    });
  };
  
  const openImagePreview = (url: string) => {
    setCurrentImageUrl(url);
    setImageDialogOpen(true);
  };

  const getStatusBadge = (status: TaskStatus) => {
    const option = taskStatusOptions.find(opt => opt.value === status);
    
    return (
      <Badge className={cn("rounded-full px-2.5 py-0.5", option?.color)}>
        {option?.label}
      </Badge>
    );
  };
  
  const getPriorityBadge = (priority?: TaskPriority | null) => {
    // Default to MEDIUM if priority is not set
    const priorityValue = priority || 'MEDIUM';
    const option = priorityOptions.find(opt => opt.value === priorityValue);
    
    return (
      <Badge className={cn("rounded-full px-2.5 py-0.5", option?.color)}>
        {option?.label}
      </Badge>
    );
  };

  if (isLoading) return <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (tasksError) return <div className="text-red-500 text-center py-10">Error loading tasks: {tasksError.message}</div>;

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Tasks</h2>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select 
                value={selectedStatus} 
                onValueChange={(value) => setSelectedStatus(value as TaskStatus | 'ALL')}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
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
            </div>
            
            <div className="flex items-center gap-2">
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
              <Select 
                value={selectedPriority} 
                onValueChange={(value) => setSelectedPriority(value as TaskPriority | 'ALL')}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Priority" />
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
            
            {isAdmin && (
              <Button onClick={handleAddNewTask} className="flex items-center gap-2">
                <PlusCircle className="h-4 w-4" /> Add Task
              </Button>
            )}
          </div>
        </div>

        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[280px]">Task name</TableHead>
                <TableHead className="w-[110px]">Status</TableHead>
                <TableHead className="w-[250px]">Description</TableHead>
                <TableHead className="w-[130px]">Assignee</TableHead>
                <TableHead className="w-[100px]">Due date</TableHead>
                <TableHead className="w-[80px]">Priority</TableHead>
                <TableHead className="w-[60px]">Attachment</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTasks.length > 0 ? (
                filteredTasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell 
                      className={cn(
                        "font-medium",
                        (isAdmin || isTaskAssignee(task)) && "cursor-pointer hover:text-primary"
                      )}
                      onClick={() => {
                        if (isAdmin) {
                          handleEditTask(task);
                        }
                      }}
                    >
                      {task.title}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(task.status)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground line-clamp-1">
                      {task.description || "-"}
                    </TableCell>
                    <TableCell>
                      {task.assigneeId && memberMap[task.assigneeId] ? (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={memberMap[task.assigneeId].image || undefined} />
                            <AvatarFallback className="text-[10px]">
                              {memberMap[task.assigneeId].name?.charAt(0).toUpperCase() || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm truncate max-w-[80px]">
                            {memberMap[task.assigneeId].name || memberMap[task.assigneeId].email}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "-"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {getPriorityBadge(task.priority)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {task.attachmentUrl ? (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 px-2 flex items-center gap-1 border-blue-200 text-blue-600 hover:bg-blue-50"
                          onClick={() => openImagePreview(task.attachmentUrl as string)}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          <span>View</span>
                        </Button>
                      ) : (
                        <span className="text-muted-foreground">None</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        {isAdmin && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditTask(task)}>
                                <Edit3 className="h-4 w-4 mr-2" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => deleteTaskMutation.mutate(task.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                        
                        {/* Status update buttons for assignees */}
                        {isTaskAssignee(task) && !isAdmin && (
                          <>
                            {task.status === 'TODO' && (
                              <Button
                                variant="outline" 
                                size="sm"
                                onClick={() => handleUpdateTaskStatus(task, 'IN_PROGRESS')}
                                className="h-7 text-xs text-blue-500 hover:bg-blue-50"
                              >
                                Start
                              </Button>
                            )}
                            {task.status === 'IN_PROGRESS' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUpdateTaskStatus(task, 'DONE')}
                                className="h-7 text-xs text-green-500 hover:bg-green-50"
                              >
                                Complete
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    <p className="text-muted-foreground">
                      {selectedStatus === 'ALL' && selectedPriority === 'ALL'
                        ? 'No tasks found' 
                        : `No tasks found for the selected filters`}
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {isAdmin && (
          <CreateEditTaskDialog 
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
        )}
      </div>

      {/* Separate image preview dialog */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Image Attachment</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center p-2">
            {currentImageUrl && (
              <img 
                src={currentImageUrl} 
                alt="Task attachment" 
                className="max-h-[70vh] object-contain rounded-md"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 