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
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Project } from "@/types"; // Import Project type

// API function to create a project
const createProject = async (newProject: Omit<Project, 'id' | 'memberCount' | 'createdAt' | 'updatedAt'>): Promise<Project> => {
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
});

type ProjectFormValues = z.infer<typeof projectSchema>;

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

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const mutation = useMutation<Project, Error, ProjectFormValues, OptimisticUpdateContext>({ 
    mutationFn: createProject,
    onMutate: async (newProjectData) => {
      await queryClient.cancelQueries({ queryKey: ['projects'] });
      const previousProjects = queryClient.getQueryData<Project[]>(['projects']);
      const optimisticProject: Project = {
        id: `temp-${Date.now()}-${Math.random().toString(36).substring(7)}`, // More unique temp ID
        name: newProjectData.name,
        description: newProjectData.description,
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

  const onSubmit = (data: ProjectFormValues) => {
    mutation.mutate(data);
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