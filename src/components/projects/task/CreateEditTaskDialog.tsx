import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as z from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { Task, TaskStatus, ProjectMember } from "@/types";
import { createTask, updateTask, fetchProjectMembers } from "@/lib/queries";
import { taskStatusOptions } from "../tabs/TasksTab";

// Form schema with proper types
const taskFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().optional().default(""),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).default('TODO'),
  dueDate: z.string().optional().default(""),
  assigneeId: z.string().optional().nullable(),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

interface CreateEditTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  taskToEdit?: Task | null;
}

export function CreateEditTaskDialog({
  open,
  onOpenChange,
  projectId,
  taskToEdit,
}: CreateEditTaskDialogProps) {
  const queryClient = useQueryClient();
  
  const defaultFormValues: TaskFormValues = {
    title: "",
    description: "",
    status: 'TODO',
    dueDate: "",
    assigneeId: null,
  };

  // Fetch project members to populate assignee dropdown
  const { data: members = [] } = useQuery<ProjectMember[], Error>({
    queryKey: ['projectMembers', projectId],
    queryFn: () => fetchProjectMembers(projectId),
    enabled: open, // Only fetch when dialog is open
  });

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema) as any, // Type cast to avoid TypeScript errors
    defaultValues: taskToEdit 
      ? { 
          title: taskToEdit.title,
          description: taskToEdit.description || "",
          status: taskToEdit.status,
          dueDate: taskToEdit.dueDate ? new Date(taskToEdit.dueDate).toISOString().substring(0, 10) : "",
          assigneeId: taskToEdit.assigneeId || null,
        }
      : defaultFormValues,
  });

  const { 
    mutate: manageTask, 
    isPending: isSubmittingTask 
  } = useMutation({
    mutationFn: async ({ taskData, currentTask }: { taskData: TaskFormValues; currentTask?: Task | null }) => {
      const apiData = {
        title: taskData.title,
        description: taskData.description?.trim() === "" ? null : taskData.description,
        status: taskData.status,
        dueDate: taskData.dueDate?.trim() === "" ? null : new Date(taskData.dueDate).toISOString(),
        assigneeId: taskData.assigneeId === "unassigned" ? null : taskData.assigneeId,
      };

      if (currentTask) {
        return updateTask(projectId, currentTask.id, apiData);
      }
      return createTask(projectId, apiData as Omit<Task, 'id' | 'projectId' | 'createdAt' | 'updatedAt' | 'createdById'>);
    },
    onSuccess: (savedTask) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      toast.success(taskToEdit ? "Task updated!" : "Task created!");
      onOpenChange(false);
      form.reset(defaultFormValues);
    },
    onError: (error: Error) => {
      toast.error(error.message || (taskToEdit ? "Failed to update task" : "Failed to create task"));
    },
  });

  const handleSubmit = form.handleSubmit((data: TaskFormValues) => {
    manageTask({ taskData: data, currentTask: taskToEdit });
  });

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen);
      if (!isOpen && taskToEdit) {
        form.reset(defaultFormValues);
      }
    }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{taskToEdit ? "Edit Task" : "Create New Task"}</DialogTitle>
          <DialogDescription>
            {taskToEdit ? "Update the details of your task." : "Fill in the details to create a new task."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title <span className="text-red-500">*</span></Label>
            <Input id="title" {...form.register("title")} disabled={isSubmittingTask} />
            {form.formState.errors.title && <p className="text-xs text-red-500 mt-1">{form.formState.errors.title.message}</p>}
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" {...form.register("description")} disabled={isSubmittingTask} />
             {form.formState.errors.description && <p className="text-xs text-red-500 mt-1">{form.formState.errors.description.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Controller
                name="status"
                control={form.control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value} disabled={isSubmittingTask}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {taskStatusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
               {form.formState.errors.status && <p className="text-xs text-red-500 mt-1">{form.formState.errors.status.message}</p>}
            </div>
            <div>
              <Label htmlFor="dueDate">Due Date</Label>
              <Input id="dueDate" type="date" {...form.register("dueDate")} disabled={isSubmittingTask} />
               {form.formState.errors.dueDate && <p className="text-xs text-red-500 mt-1">{form.formState.errors.dueDate.message}</p>}
            </div>
          </div>
          
          {/* Assignee field */}
          <div>
            <Label htmlFor="assigneeId">Assign To</Label>
            <Controller
              name="assigneeId"
              control={form.control}
              render={({ field }) => (
                <Select 
                  onValueChange={(value) => field.onChange(value === "unassigned" ? null : value)} 
                  value={field.value || "unassigned"} 
                  disabled={isSubmittingTask || members.length === 0}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={members.length ? "Select team member" : "No team members available"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {members.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name || member.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmittingTask}>Cancel</Button>
            <Button type="submit" disabled={isSubmittingTask}>
              {isSubmittingTask && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {taskToEdit ? "Save Changes" : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 