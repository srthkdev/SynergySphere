import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Project } from "@/types";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { DeleteProjectDialog } from "@/components/projects/DeleteProjectDialog";
import { Edit } from "lucide-react";
import Link from "next/link";

export function SettingsTab({ project }: { project: Project }) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const router = useRouter();

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Project Settings</h2>
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-1">Project Details</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Update your project's basic information.
              </p>
              <Button asChild>
                <Link href={`/projects/edit/${project.id}`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Project
                </Link>
              </Button>
            </div>
            
            <div className="pt-4 border-t">
              <h3 className="font-medium mb-1 text-red-500">Danger Zone</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Permanently delete this project and all of its data.
              </p>
              <Button 
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                Delete Project
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <DeleteProjectDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        project={project}
        redirectAfterDelete={true}
      />
    </div>
  );
} 