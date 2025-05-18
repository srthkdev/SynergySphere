"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Project } from "@/types"; // Import Project type
import { Controller } from "react-hook-form";

// API function to create a project
const createProject = async (newProject: Omit<Project, 'id' | 'memberCount' | 'createdAt' | 'updatedAt'> & { 
  tags?: string[]; 
  projectManager?: string;
  deadline?: string;
  priority?: "Low" | "Medium" | "High";
  imageUrl?: string;
}): Promise<Project> => {
  const response = await fetch('/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newProject),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to create project");
  }
  return response.json();
};

const projectSchema = z.object({
  name: z.string().min(3, "Project name must be at least 3 characters").max(50, "Project name must be less than 50 characters"),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
  tags: z.string().optional(), // Keep as string and process during submission
  projectManager: z.string().optional(),
  deadline: z.string().optional(),
  priority: z.enum(["Low", "Medium", "High"]).optional(),
  // We'll handle the file separately
});

// Define form values type based on projectSchema
type ProjectFormValues = z.infer<typeof projectSchema>;

// Add file field separately
interface FormData extends ProjectFormValues {
  imageFile?: FileList;
}

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectCreated?: () => void;
}

// Define context type for optimistic updates
interface OptimisticUpdateContext {
  previousProjects?: Project[];
  optimisticProject?: Project;
}

export function CreateProjectDialog({ 
  open, 
  onOpenChange,
  onProjectCreated 
}: CreateProjectDialogProps) {
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(projectSchema) as any, // Type cast to fix error
    defaultValues: {
      name: "",
      description: "",
      tags: "",
      projectManager: "",
      deadline: "",
      priority: "Medium",
    },
  });

  const mutation = useMutation<
    Project, 
    Error, 
    { projectData: ProjectFormValues; imageUrl?: string },
    OptimisticUpdateContext
  >({
    mutationFn: async ({ projectData, imageUrl }) => {
      // Process tags before sending to API
      const processedTags = projectData.tags 
        ? projectData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) 
        : [];
        
      return createProject({ 
        ...projectData, 
        tags: processedTags,
        imageUrl 
      });
    },
    onMutate: async ({ projectData, imageUrl }) => {
      await queryClient.cancelQueries({ queryKey: ['projects'] });
      const previousProjects = queryClient.getQueryData<Project[]>(['projects']);
      
      // Process tags for optimistic update
      const processedTags = projectData.tags 
        ? projectData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) 
        : [];
      
      const optimisticProject: Project = {
        id: `temp-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        name: projectData.name,
        description: projectData.description,
        tags: processedTags,
        projectManager: projectData.projectManager,
        deadline: projectData.deadline,
        priority: projectData.priority,
        imageUrl: imageUrl,
        memberCount: 1, 
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      queryClient.setQueryData<Project[]>(['projects'], (old = []) => [...old, optimisticProject]);
      return { previousProjects, optimisticProject };
    },
    onError: (err, newProject, context) => {
      toast.error(err.message || "Failed to create project");
      if (context?.previousProjects) {
        queryClient.setQueryData<Project[]>(['projects'], context.previousProjects);
      }
    },
    onSettled: (data, error, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      if (!error) {
        form.reset();
        onOpenChange(false);
        toast.success("Project created successfully!");
        if (onProjectCreated) onProjectCreated();
      }
    },
  });

  const onSubmit = async (data: FormData) => {
    if (form.formState.isSubmitting) return;
    
    let uploadedImageUrl: string | undefined = undefined;
    
    try {
      // Handle file upload if a file is selected
      if (data.imageFile?.[0]) {
        const file = data.imageFile[0];
        
        // Validate file size and type
        if (file.size > 5 * 1024 * 1024) {
          toast.error("File too large. Maximum size is 5MB.");
          return;
        }
        
        if (!["image/jpeg", "image/png", "image/gif"].includes(file.type)) {
          toast.error("Only JPG, PNG and GIF images are allowed.");
          return;
        }
        
        const uploadToastId = toast.loading("Uploading image...");
        
        try {
          const formData = new FormData();
          formData.append("file", file);
          
          const response = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Image upload failed");
          }
          
          const result = await response.json();
          uploadedImageUrl = result.imageUrl;
          toast.success("Image uploaded successfully!", { id: uploadToastId });
        } catch (error: any) {
          toast.error(error.message || "Image upload failed", { id: uploadToastId });
          return;
        }
      }
      
      // Proceed with project creation
      const { imageFile, ...projectData } = data;
      mutation.mutate({ projectData, imageUrl: uploadedImageUrl });
      
    } catch (error: any) {
      toast.error(error.message || "An unexpected error occurred");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!mutation.isPending) {
        onOpenChange(isOpen);
        if (!isOpen) form.reset();
      }
    }}>
      <DialogContent className="sm:max-w-[525px]">
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Create a new project to start collaborating with your team.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">
                Project Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Enter project name"
                {...form.register("name")}
                disabled={mutation.isPending}
                data-create-project="true"
              />
              {form.formState.errors.name && (
                <p className="text-red-500 text-xs mt-1">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="tags">
                Tags <span className="text-xs text-muted-foreground">(comma-separated)</span>
              </Label>
              <Input
                id="tags"
                placeholder="e.g., marketing, design, development"
                {...form.register("tags")}
                disabled={mutation.isPending}
              />
              {form.formState.errors.tags && (
                <p className="text-red-500 text-xs mt-1">
                  {form.formState.errors.tags.message}
                </p>
              )}
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="projectManager">
                Project Manager <span className="text-xs text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="projectManager"
                placeholder="Enter project manager's name"
                {...form.register("projectManager")}
                disabled={mutation.isPending}
              />
              {form.formState.errors.projectManager && (
                <p className="text-red-500 text-xs mt-1">
                  {form.formState.errors.projectManager.message}
                </p>
              )}
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="deadline">
                Deadline <span className="text-xs text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="deadline"
                type="date"
                {...form.register("deadline")}
                disabled={mutation.isPending}
              />
              {form.formState.errors.deadline && (
                <p className="text-red-500 text-xs mt-1">
                  {form.formState.errors.deadline.message}
                </p>
              )}
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="priority">
                Priority <span className="text-xs text-muted-foreground">(optional)</span>
              </Label>
              <Controller
                name="priority"
                control={form.control}
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={mutation.isPending}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.priority && (
                <p className="text-red-500 text-xs mt-1">
                  {form.formState.errors.priority.message}
                </p>
              )}
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="imageFile">
                Project Image <span className="text-xs text-muted-foreground">(optional, max 5MB)</span>
              </Label>
              <Input
                id="imageFile"
                type="file"
                accept="image/jpeg,image/png,image/gif"
                {...form.register("imageFile")}
                disabled={mutation.isPending}
              />
              {form.formState.errors.imageFile && (
                // @ts-ignore TODO: fix this type error if possible
                <p className="text-red-500 text-xs mt-1">{form.formState.errors.imageFile.message}</p>
              )}
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">
                Description <span className="text-xs text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                id="description"
                placeholder="Enter project description"
                rows={4}
                {...form.register("description")}
                disabled={mutation.isPending}
              />
              {form.formState.errors.description && (
                <p className="text-red-500 text-xs mt-1">
                  {form.formState.errors.description.message}
                </p>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Project
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 