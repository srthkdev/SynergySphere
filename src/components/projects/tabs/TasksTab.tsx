import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { PlusCircle, Edit3, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { fetchTasksByProjectId, updateTask, deleteTask, fetchProjectMembers } from "@/lib/queries";
import { Task, TaskStatus, ProjectMember } from "@/types";
import { CreateEditTaskDialog } from "../task/CreateEditTaskDialog";

// Task status enum for UI
export const taskStatusOptions: { value: TaskStatus; label: string }[] = [
  { value: 'TODO', label: 'To Do' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'DONE', label: 'Done' },
];

interface OptimisticTaskContext {
  previousTasks?: Task[];
}

export function TasksTab({ projectId }: { projectId: string }) {
  const queryClient = useQueryClient();
  const [isCreateTaskDialogOpen, setIsCreateTaskDialogOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);

  const { data: tasks = [], isLoading, error: tasksError } = useQuery<Task[], Error>({
    queryKey: ['tasks', projectId],
    queryFn: () => fetchTasksByProjectId(projectId),
    enabled: !!projectId,
  });

  // Fetch project members to display assignee info
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

  // Group tasks by status
  const tasksByStatus = tasks.reduce((acc, task) => {
    if (!acc[task.status]) {
      acc[task.status] = [];
    }
    acc[task.status].push(task);
    return acc;
  }, {} as Record<TaskStatus, Task[]>);

  const handleDragEnd = (result: any) => {
    const { destination, source, draggableId } = result;

    // If dropped outside a valid droppable area
    if (!destination) return;

    // If dropped in the same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Find the task that was dragged
    const task = tasks.find(t => t.id === draggableId);
    if (!task) return;

    // Update task status if column changed
    if (destination.droppableId !== source.droppableId) {
      const newStatus = destination.droppableId as TaskStatus;
      updateTaskStatusMutation.mutate({ 
        taskId: task.id, 
        status: newStatus 
      });
    }
  };

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
    setTaskToEdit(task);
    setIsCreateTaskDialogOpen(true);
  }

  const handleAddNewTask = () => {
    setTaskToEdit(null);
    setIsCreateTaskDialogOpen(true);
  }

  if (isLoading) return <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (tasksError) return <div className="text-red-500 text-center py-10">Error loading tasks: {tasksError.message}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Tasks</h2>
        <Button onClick={handleAddNewTask} className="flex items-center gap-2">
          <PlusCircle className="h-4 w-4" /> Add Task
        </Button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {taskStatusOptions.map((statusOption) => (
            <div key={statusOption.value} className="flex flex-col gap-3">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <h3 className="font-medium">{statusOption.label}</h3>
                <span className="text-sm text-muted-foreground">
                  {tasksByStatus[statusOption.value]?.length || 0}
                </span>
              </div>
              
              <Droppable droppableId={statusOption.value}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      "space-y-3 min-h-[200px] p-1 rounded-lg transition-colors",
                      snapshot.isDraggingOver && "bg-muted/50"
                    )}
                  >
                    {tasksByStatus[statusOption.value]?.map((taskItem, index) => (
                      <Draggable 
                        key={taskItem.id} 
                        draggableId={taskItem.id} 
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <Card 
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={cn(
                              "hover:shadow-md transition-shadow group",
                              snapshot.isDragging && "shadow-lg rotate-2"
                            )}
                          >
                            <CardContent className="p-4">
                              <h3 
                                className="font-semibold text-base group-hover:text-primary transition-colors cursor-pointer" 
                                onClick={() => handleEditTask(taskItem)}
                              >
                                {taskItem.title}
                              </h3>
                              {taskItem.description && (
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                  {taskItem.description}
                                </p>
                              )}
                              
                              <div className="flex items-center gap-4 mt-3">
                                {taskItem.dueDate && (
                                  <p className="text-xs text-muted-foreground flex items-center">
                                    <span className="mr-1">Due:</span> 
                                    {new Date(taskItem.dueDate).toLocaleDateString()}
                                  </p>
                                )}
                                
                                {taskItem.assigneeId && memberMap[taskItem.assigneeId] && (
                                  <div className="flex items-center gap-1.5">
                                    <Avatar className="h-5 w-5">
                                      <AvatarImage src={memberMap[taskItem.assigneeId].image || undefined} />
                                      <AvatarFallback className="text-[10px]">
                                        {memberMap[taskItem.assigneeId].name?.charAt(0).toUpperCase() || "U"}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-xs">{memberMap[taskItem.assigneeId].name || memberMap[taskItem.assigneeId].email}</span>
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex gap-2 mt-3">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => handleEditTask(taskItem)} 
                                  className="h-7 px-2 text-xs"
                                >
                                  <Edit3 className="h-3 w-3 mr-1" /> Edit
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => deleteTaskMutation.mutate(taskItem.id)}
                                  className="h-7 px-2 text-xs text-destructive hover:text-destructive/80 hover:bg-destructive/10 border-destructive/50 hover:border-destructive"
                                  disabled={deleteTaskMutation.isPending && deleteTaskMutation.variables === taskItem.id}
                                >
                                  {deleteTaskMutation.isPending && deleteTaskMutation.variables === taskItem.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin mr-1"/>
                                  ) : (
                                    <Trash2 className="h-3 w-3 mr-1" />
                                  )}
                                  Delete
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    
                    {(!tasksByStatus[statusOption.value] || tasksByStatus[statusOption.value].length === 0) && (
                      <div className="text-center p-4 border-2 border-dashed rounded-lg">
                        <p className="text-sm text-muted-foreground">No tasks</p>
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      <CreateEditTaskDialog 
        open={isCreateTaskDialogOpen} 
        onOpenChange={(isOpen) => {
          setIsCreateTaskDialogOpen(isOpen);
          if (!isOpen) setTaskToEdit(null);
        }} 
        projectId={projectId} 
        taskToEdit={taskToEdit}
      />
    </div>
  );
} 