import { useState, useEffect, useMemo } from "react";
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
import { ScrollArea } from "@/components/ui/scroll-area";

import { Task, TaskStatus, ProjectMember, Project } from "@/types";
import { createTask, updateTask, fetchProjectMembers, fetchProjectById, fetchProjects } from "@/lib/queries";
import { taskStatusOptions } from "../tabs/TasksTab";
import { useSession } from "@/lib/auth/auth-client";

// Define priority options
const priorityOptions = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
];

// Create a unified schema for both creating and editing
const taskFormSchema = z.object({
  projectId: z.string().min(1, "Project is required"),
  title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  description: z.string(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']),
  dueDate: z.string(),
  assigneeId: z.string().nullable(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  attachmentUrl: z.string().nullable(),
});

// Create a type from our schema
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
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const { data: session } = useSession();
  const user = session?.user;
  
  const defaultFormValues: TaskFormValues = {
    projectId: projectId,
    title: "",
    description: "",
    status: 'TODO',
    dueDate: "",
    assigneeId: null,
    priority: 'MEDIUM',
    attachmentUrl: null,
  };

  const isEditing = !!taskToEdit;

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: taskToEdit 
      ? { 
          projectId: taskToEdit.projectId || projectId,
          title: taskToEdit.title,
          description: taskToEdit.description || "",
          status: taskToEdit.status,
          dueDate: taskToEdit.dueDate ? new Date(taskToEdit.dueDate).toISOString().substring(0, 10) : "",
          assigneeId: taskToEdit.assigneeId,
          priority: taskToEdit.priority || 'MEDIUM',
          attachmentUrl: taskToEdit.attachmentUrl || null,
        }
      : defaultFormValues,
  });
  
  // Get the current project ID from the form
  const currentProjectId = form.watch('projectId') || projectId;
  
  // Fetch project members to populate assignee dropdown
  const { 
    data: members = [], 
    isLoading: isLoadingMembers, 
    error: membersError 
  } = useQuery({
    queryKey: ['projectMembers', currentProjectId],
    queryFn: () => fetchProjectMembers(currentProjectId),
    enabled: open, // Only fetch when dialog is open
  });
  
  // Fetch ALL projects for the dropdown
  const { 
    data: allProjects = [], 
    isLoading: isLoadingProjects 
  } = useQuery({
    queryKey: ['allProjects'],
    queryFn: fetchProjects,
    enabled: open,
  });

  // Get valid member IDs for validation
  const validMemberIds = useMemo(() => {
    // The userId field from the member object is what we need to use as assigneeId
    return members.map(member => member.userId);
  }, [members]);

  // Reset assignee when project changes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'projectId') {
        // Reset assignee when project changes
        form.setValue('assigneeId', null);
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Set image preview when task to edit has an attachment
  useEffect(() => {
    if (taskToEdit?.attachmentUrl) {
      setImagePreview(taskToEdit.attachmentUrl);
    } else {
      setImagePreview(null);
      setImageFile(null);
    }
  }, [taskToEdit]);

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
    isPending: isSubmittingTask,
    error: submitError
  } = useMutation({
    mutationFn: async ({ taskData, currentTask }: { taskData: TaskFormValues; currentTask?: Task | null }) => {
      // If there's a new image file, upload it first
      let attachmentUrl = taskData.attachmentUrl;
      if (imageFile) {
        attachmentUrl = await uploadImage(imageFile);
      }
      
      const apiData = {
        projectId: taskData.projectId,
        title: taskData.title?.trim() === "" ? "Untitled Task" : taskData.title,
        description: taskData.description?.trim() === "" ? null : taskData.description,
        status: taskData.status,
        dueDate: taskData.dueDate?.trim() === "" ? null : (taskData.dueDate ? new Date(taskData.dueDate).toISOString() : null),
        priority: taskData.priority,
        attachmentUrl: attachmentUrl,
        assigneeId: taskData.assigneeId, // Simply pass through the assigneeId - it's already null if unassigned
      };

      console.log("Final API payload:", apiData);

      if (currentTask) {
        return updateTask(taskData.projectId, currentTask.id, apiData);
      }
      return createTask(taskData.projectId, apiData);
    },
    onSuccess: (savedTask: Task, variables) => {
      const finalProjectId = variables.taskData.projectId;
      queryClient.invalidateQueries({ queryKey: ['tasks', finalProjectId] });
      if (taskToEdit && taskToEdit.projectId !== finalProjectId) {
        queryClient.invalidateQueries({ queryKey: ['tasks', taskToEdit.projectId] });
      }
      queryClient.invalidateQueries({ queryKey: ['project', finalProjectId] });
      toast.success(taskToEdit ? "Task updated!" : "Task created!");
      onOpenChange(false);
      form.reset({...defaultFormValues, projectId: projectId});
      setImagePreview(null);
      setImageFile(null);
    },
    onError: (error: Error) => {
      console.error("Task submission error:", error);
      toast.error(error.message || (taskToEdit ? "Failed to update task" : "Failed to create task"));
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    form.handleSubmit((data: TaskFormValues) => {
      console.log("Form data before submission:", data);
      manageTask({ taskData: data, currentTask: taskToEdit });
    })(e);
  };

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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{taskToEdit ? "Edit Task" : "Create New Task"}</DialogTitle>
          <DialogDescription>
            {taskToEdit ? "Update the details of your task." : "Fill in the details to create a new task."}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-grow pr-4">
          <form id="task-form" onSubmit={handleSubmit} className="space-y-5">
            {/* Project field (NOW A DROPDOWN) */}
            <div className="space-y-2">
              <Label htmlFor="projectId">Project <span className="text-red-500">*</span></Label>
              <Controller
                name="projectId"
                control={form.control}
                defaultValue={projectId}
                render={({ field }) => (
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value || projectId}
                    disabled={isLoadingProjects || isSubmittingTask}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={isLoadingProjects ? "Loading projects..." : "Select project"} />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingProjects ? (
                        <SelectItem value="loading" disabled>Loading projects...</SelectItem>
                      ) : allProjects.length === 0 ? (
                        <SelectItem value="no-projects" disabled>No projects available</SelectItem>
                      ) : (
                        allProjects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.projectId && (
                <p className="text-xs text-red-500 mt-1">{form.formState.errors.projectId.message}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="title">Title <span className="text-red-500">*</span></Label>
              <Input id="title" {...form.register("title")} disabled={isSubmittingTask} />
              {form.formState.errors.title && <p className="text-xs text-red-500 mt-1">{form.formState.errors.title.message}</p>}
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" {...form.register("description")} disabled={isSubmittingTask} className="min-h-[100px]" />
              {form.formState.errors.description && <p className="text-xs text-red-500 mt-1">{form.formState.errors.description.message}</p>}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Controller
                  name="status"
                  control={form.control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value} disabled={isSubmittingTask}>
                      <SelectTrigger className="w-full">
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
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Priority field */}
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Controller
                  name="priority"
                  control={form.control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value} disabled={isSubmittingTask}>
                      <SelectTrigger className="w-full">
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
                {form.formState.errors.priority && <p className="text-xs text-red-500 mt-1">{form.formState.errors.priority.message}</p>}
              </div>
              
              {/* Assignee field */}
              <div>
                <Label htmlFor="assigneeId">Assign To</Label>
                <Controller
                  name="assigneeId"
                  control={form.control}
                  render={({ field }) => (
                    <Select 
                      onValueChange={(value) => {
                        // If unassigned is selected, set to null
                        const assigneeId = value === "unassigned" ? null : value;
                        field.onChange(assigneeId);
                        console.log("Setting assigneeId to:", assigneeId);
                      }}
                      value={field.value === null ? "unassigned" : field.value}
                      disabled={isSubmittingTask || isLoadingMembers}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={isLoadingMembers ? "Loading members..." : "Select team member"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {isLoadingMembers ? (
                          <SelectItem value="loading" disabled>Loading members...</SelectItem>
                        ) : membersError ? (
                          <SelectItem value="error" disabled>Error loading members</SelectItem>
                        ) : members.length === 0 ? (
                          <SelectItem value="no-members" disabled>No team members available</SelectItem>
                        ) : (
                          members.map((member) => (
                            <SelectItem key={member.id} value={member.userId}>
                              {member.name || member.email}
                            </SelectItem>
                          ))
                        )}
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
                      disabled={isSubmittingTask}
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
                      disabled={isSubmittingTask}
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

            {submitError && (
              <div className="text-red-500 text-sm border border-red-300 bg-red-50 p-3 rounded-md">
                Error: {submitError.message || "Failed to submit task. Please try again."}
              </div>
            )}
          </form>
        </ScrollArea>
        <DialogFooter className="mt-6 pt-4 border-t">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmittingTask}>Cancel</Button>
          <Button type="submit" form="task-form" disabled={isSubmittingTask}>
            {isSubmittingTask && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {taskToEdit ? "Save Changes" : "Create Task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 