import { useState, useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as z from "zod";
import { Loader2, Upload, X, File, FileText, Image as ImageIcon } from "lucide-react";
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
import { uploadAttachment } from '@/lib/utils/file-utils';

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
  tags: z.string().min(1, "At least one tag is required"),
});

// Create a type from our schema
type TaskFormValues = z.infer<typeof taskFormSchema>;

interface CreateEditTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  taskToEdit?: Task | null;
}

const ACCEPTED_TYPES = [
  "image/jpeg", "image/png", "image/gif", "image/webp", "image/*",
  "application/pdf",
  "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".doc", ".docx", ".txt"
];

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
    tags: "",
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
<<<<<<< HEAD
          priority: taskToEdit.priority || 'MEDIUM',
          attachmentUrl: taskToEdit.attachmentUrl || null,
          tags: Array.isArray(taskToEdit.tags) ? taskToEdit.tags.join(", ") : (typeof taskToEdit.tags === 'string' ? taskToEdit.tags : ""),
=======
          priority: taskToEdit.priority === 'URGENT' ? 'HIGH' : (taskToEdit.priority || 'MEDIUM'),
          attachmentUrl: null,
>>>>>>> fb17aecb2e495cf28351b71147cba5196976367c
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
    // Task type doesn't have attachmentUrl, so always reset
    setImagePreview(null);
    setImageFile(null);
  }, [taskToEdit]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File too large. Maximum size is 10MB.");
        return;
      }
      // Validate file type/extension
      const isValidType = ACCEPTED_TYPES.some(type => {
        if (type === "image/*") return file.type.startsWith("image/");
        if (type.startsWith(".")) return file.name.toLowerCase().endsWith(type);
        return file.type === type;
      });
      if (!isValidType) {
        toast.error("File type not supported. Allowed: images, PDF, DOC, DOCX, TXT.");
        return;
      }
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

  const { 
    mutate: manageTask, 
    isPending: isSubmittingTask,
    error: submitError
  } = useMutation({
    mutationFn: async ({ taskData, currentTask }: { taskData: Omit<TaskFormValues, 'tags'> & { tags: string[] }; currentTask?: Task | null }) => {
      const apiData = {
        title: taskData.title?.trim() === "" ? "Untitled Task" : taskData.title,
        description: taskData.description?.trim() === "" ? undefined : taskData.description,
        status: taskData.status,
        dueDate: taskData.dueDate?.trim() === "" ? undefined : (taskData.dueDate ? new Date(taskData.dueDate).toISOString() : undefined),
        priority: taskData.priority,
<<<<<<< HEAD
        assigneeId: taskData.assigneeId,
        tags: taskData.tags,
=======
        assigneeId: taskData.assigneeId || undefined, // Convert null to undefined
>>>>>>> fb17aecb2e495cf28351b71147cba5196976367c
      };
      let savedTask;
      if (currentTask) {
        savedTask = await updateTask(taskData.projectId, currentTask.id, apiData);
      } else {
        savedTask = await createTask(taskData.projectId, apiData);
      }
      // Upload attachment if present
      if (imageFile && savedTask?.id) {
        try {
          await uploadAttachment(imageFile, undefined, savedTask.id);
        } catch (err) {
          toast.error('Attachment upload failed, but task was saved.');
        }
      }
      return savedTask;
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
      const processedTags = (data.tags || "")
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
      const apiData = {
        ...data,
        tags: processedTags,
      };
      manageTask({ taskData: apiData, currentTask: taskToEdit });
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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{taskToEdit ? "Edit Task" : "Create New Task"}</DialogTitle>
          <DialogDescription>
            {taskToEdit ? "Update the details of your task." : "Fill in the details to create a new task."}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-1 min-h-0 overflow-y-auto pr-2">
          <form id="task-form" onSubmit={handleSubmit} className="space-y-6 p-4">
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
            
            <div className="space-y-2">
              <Label htmlFor="title">Title <span className="text-red-500">*</span></Label>
              <Input id="title" {...form.register("title")} disabled={isSubmittingTask} />
              {form.formState.errors.title && <p className="text-xs text-red-500 mt-1">{form.formState.errors.title.message}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" {...form.register("description")} disabled={isSubmittingTask} className="min-h-[100px]" />
              {form.formState.errors.description && <p className="text-xs text-red-500 mt-1">{form.formState.errors.description.message}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tags">Tags <span className="text-red-500">*</span> <span className="text-xs text-muted-foreground">(comma-separated)</span></Label>
              <Input id="tags" {...form.register("tags")} disabled={isSubmittingTask} placeholder="e.g. urgent, frontend, bug" />
              {form.formState.errors.tags && <p className="text-xs text-red-500 mt-1">{form.formState.errors.tags.message}</p>}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
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
              
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input id="dueDate" type="date" {...form.register("dueDate")} disabled={isSubmittingTask} />
                {form.formState.errors.dueDate && <p className="text-xs text-red-500 mt-1">{form.formState.errors.dueDate.message}</p>}
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
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
              
              <div className="space-y-2">
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
            <div className="space-y-2">
              <Label>Attachment</Label>
              <div className="border-2 border-dashed rounded-md p-4 mt-1">
                {imagePreview && imageFile ? (
                  imageFile.type.startsWith("image/") ? (
                    <img
                      src={imagePreview}
                      alt="Attachment preview"
                      className="max-h-48 mx-auto rounded-md"
                    />
                  ) : (
                    <div className="flex items-center gap-2 justify-center">
                      {imageFile.type === "application/pdf" ? (
                        <FileText className="h-8 w-8 text-red-500" />
                      ) : imageFile.type.includes("word") || imageFile.name.toLowerCase().endsWith(".doc") || imageFile.name.toLowerCase().endsWith(".docx") ? (
                        <FileText className="h-8 w-8 text-blue-500" />
                      ) : imageFile.type === "text/plain" || imageFile.name.toLowerCase().endsWith(".txt") ? (
                        <FileText className="h-8 w-8 text-gray-500" />
                      ) : (
                        <File className="h-8 w-8 text-gray-500" />
                      )}
                      <span className="text-sm">{imageFile.name}</span>
                    </div>
                  )
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
                      onClick={e => { e.stopPropagation(); }}
                      onChange={handleImageUpload}
                      accept="image/*,application/pdf,.doc,.docx,.txt"
                      disabled={isSubmittingTask}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-2"
                      onClick={e => {
                        e.preventDefault();
                        e.stopPropagation();
                        document.getElementById('image-upload')?.click();
                      }}
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