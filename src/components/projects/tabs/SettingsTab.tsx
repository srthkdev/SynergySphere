import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Project } from "@/types";

export function SettingsTab({ project }: { project: Project }) {
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
              <Button onClick={() => toast.info("Project settings will be implemented next")}>
                Edit Project
              </Button>
            </div>
            
            <div className="pt-4 border-t">
              <h3 className="font-medium mb-1 text-red-500">Danger Zone</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Permanently delete this project and all of its data.
              </p>
              <Button 
                variant="destructive"
                onClick={() => toast.error("This project can't be deleted yet.")}
              >
                Delete Project
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 