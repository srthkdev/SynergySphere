import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import { Project } from "@/types";
import { deleteProject } from "@/lib/queries";

interface DeleteProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
  redirectAfterDelete?: boolean;
}

export function DeleteProjectDialog({
  open,
  onOpenChange,
  project,
  redirectAfterDelete = false,
}: DeleteProjectDialogProps) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const deleteProjectMutation = useMutation({
    mutationFn: () => {
      if (!project) throw new Error("No project to delete");
      return deleteProject(project.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', project?.id] });
      toast.success("Project deleted successfully!");
      onOpenChange(false);
      
      if (redirectAfterDelete) {
        router.push('/projects');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete project");
    },
  });

  const handleDelete = () => {
    deleteProjectMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Delete Project
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <strong>{project?.name}</strong>? This action cannot be undone.
            All tasks, comments, and project data will be permanently removed.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={deleteProjectMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteProjectMutation.isPending}
          >
            {deleteProjectMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete Project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 