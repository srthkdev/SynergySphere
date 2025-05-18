import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as z from "zod";
import { Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { Task, TaskStatus, ProjectMember } from "@/types";
import { createTask, updateTask, fetchProjectMembers, fetchProjectById } from "@/lib/queries";
import { taskStatusOptions } from "../tabs/TasksTab";

// Define priority options
const priorityOptions = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
];

// Create a function that returns the appropriate schema based on whether we're editing
const getTaskFormSchema = (isEditing: boolean) => {
  if (isEditing) {
    return z.object({
      title: z.string().optional().default(""),
      description: z.string().optional().default(""),
      status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).default('TODO'),
      dueDate: z.string().optional().default(""),
      assigneeId: z.string().optional().nullable(),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
      attachmentUrl: z.string().optional().nullable(),
    });
  } else {
    return z.object({
      title: z.string().min(1, "Title is required").max(100),
      description: z.string().optional().default(""),
      status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).default('TODO'),
      dueDate: z.string().optional().default(""),
      assigneeId: z.string().optional().nullable(),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
      attachmentUrl: z.string().optional().nullable(),
    });
  }
};

// Create a type from our schema
type TaskFormValues = z.infer<ReturnType<typeof getTaskFormSchema>>;

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
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  
  const defaultFormValues: TaskFormValues = {
    title: "",
    description: "",
    status: 'TODO',
    dueDate: "",
    assigneeId: null,
    priority: 'MEDIUM',
    attachmentUrl: null,
  };

  // Fetch project members to populate assignee dropdown
  const { data: members = [] } = useQuery<ProjectMember[], Error>({
    queryKey: ['projectMembers', projectId],
    queryFn: () => fetchProjectMembers(projectId),
    enabled: open, // Only fetch when dialog is open
  });
  
  // Fetch project details
  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => fetchProjectById(projectId),
    enabled: open,
  });

  const isEditing = !!taskToEdit;
  const taskFormSchema = getTaskFormSchema(isEditing);

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: taskToEdit 
      ? { 
          title: taskToEdit.title,
          description: taskToEdit.description || "",
          status: taskToEdit.status,
          dueDate: taskToEdit.dueDate ? new Date(taskToEdit.dueDate).toISOString().substring(0, 10) : "",
          assigneeId: taskToEdit.assigneeId || null,
          priority: taskToEdit.priority || 'MEDIUM',
          attachmentUrl: taskToEdit.attachmentUrl || null,
        }
      : defaultFormValues,
  });

  // Set image preview when task to edit has an attachment
  useEffect(() => {
    if (taskToEdit?.attachmentUrl) {
      setImagePreview(taskToEdit.attachmentUrl);
    } else {
      setImagePreview(null);
      setImageFile(null);
    }
  }, [taskToEdit]);

  // Reset form when taskToEdit changes
  useEffect(() => {
    if (taskToEdit) {
      form.reset({ 
        title: taskToEdit.title,
        description: taskToEdit.description || "",
        status: taskToEdit.status,
        dueDate: taskToEdit.dueDate ? new Date(taskToEdit.dueDate).toISOString().substring(0, 10) : "",
        assigneeId: taskToEdit.assigneeId || null,
        priority: taskToEdit.priority || 'MEDIUM',
        attachmentUrl: taskToEdit.attachmentUrl || null,
      });
    } else {
      form.reset(defaultFormValues);
    }
  }, [taskToEdit, form]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setImageFile(null);
    form.setValue('attachmentUrl', null);
  };

  // Mock function to simulate uploading an image to a server
  const uploadImage = async (file: File): Promise<string> => {
    // In a real implementation, this would upload the file to your server/cloud storage
    // and return the URL
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate a URL returned from server
        resolve(`https://example.com/uploads/${file.name}`);
      }, 500);
    });
  };

  const { 
    mutate: manageTask, 
    isPending: isSubmittingTask 
  } = useMutation({
    mutationFn: async ({ taskData, currentTask }: { taskData: TaskFormValues; currentTask?: Task | null }) => {
      // If there's a new image file, upload it first
      let attachmentUrl = taskData.attachmentUrl;
      if (imageFile) {
        attachmentUrl = await uploadImage(imageFile);
      }
      
      const apiData = {
        title: taskData.title?.trim() === "" && !isEditing ? "Untitled Task" : taskData.title,
        description: taskData.description?.trim() === "" ? null : taskData.description,
        status: taskData.status,
        dueDate: taskData.dueDate?.trim() === "" ? null : new Date(taskData.dueDate).toISOString(),
        assigneeId: taskData.assigneeId === "unassigned" ? null : taskData.assigneeId,
        priority: taskData.priority,
        attachmentUrl: attachmentUrl,
      };

      if (currentTask) {
        return updateTask(projectId, currentTask.id, apiData);
      }
      return createTask(projectId, apiData as Omit<Task, 'id' | 'projectId' | 'createdAt' | 'updatedAt' | 'createdById'>);
    },
    onSuccess: (savedTask: Task) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      toast.success(taskToEdit ? "Task updated!" : "Task created!");
      onOpenChange(false);
      form.reset(defaultFormValues);
      setImagePreview(null);
      setImageFile(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || (taskToEdit ? "Failed to update task" : "Failed to create task"));
    },
  });

  const handleSubmit = form.handleSubmit((data: TaskFormValues) => {
    manageTask({ taskData: data, currentTask: taskToEdit });
  });

  return (
    <Dialog open={open} onOpenChange={(isOpen: boolean) => {
      if (!isOpen) {
        // When closing the dialog, wait a moment before resetting the form
        // to avoid UI glitches during the closing animation
        setTimeout(() => {
          form.reset(defaultFormValues);
          setImagePreview(null);
          setImageFile(null);
        }, 300);
      }
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{taskToEdit ? "Edit Task" : "Create New Task"}</DialogTitle>
          <DialogDescription>
            {taskToEdit ? "Update the details of your task." : "Fill in the details to create a new task."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Project field (non-editable) */}
          <div>
            <Label>Project</Label>
            <div className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm">
              {project?.name || `Project ID: ${projectId}`}
            </div>
          </div>
          
          <div>
            <Label htmlFor="title">Title {!isEditing && <span className="text-red-500">*</span>}</Label>
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
                render={({ field }: { field: any }) => (
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
          
          <div className="grid grid-cols-2 gap-4">
            {/* Priority field */}
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Controller
                name="priority"
                control={form.control}
                render={({ field }: { field: any }) => (
                  <Select onValueChange={field.onChange} value={field.value} disabled={isSubmittingTask}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {priorityOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            
            {/* Assignee field */}
            <div>
              <Label htmlFor="assigneeId">Assign To</Label>
              <Controller
                name="assigneeId"
                control={form.control}
                render={({ field }: { field: any }) => (
                  <Select 
                    onValueChange={(value: string) => field.onChange(value === "unassigned" ? null : value)} 
                    value={field.value || "unassigned"} 
                    disabled={isSubmittingTask || members.length === 0}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={members.length ? "Select team member" : "No team members available"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {members.map((member: ProjectMember) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name || member.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>
          
          {/* Image Upload */}
          <div>
            <Label>Attachment</Label>
            <div className="border-2 border-dashed rounded-md p-4 mt-1">
              {imagePreview ? (
                <div className="relative">
                  <img 
                    src={imagePreview} 
                    alt="Attachment preview" 
                    className="max-h-48 mx-auto rounded-md"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6"
                    onClick={removeImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="text-center">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mt-2">
                    Drag and drop or click to upload
                  </p>
                  <Input
                    id="image-upload"
                    type="file"
                    className="hidden"
                    onChange={handleImageUpload}
                    accept="image/*"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-2"
                    onClick={() => document.getElementById('image-upload')?.click()}
                    disabled={isSubmittingTask}
                  >
                    Select File
                  </Button>
                </div>
              )}
            </div>
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