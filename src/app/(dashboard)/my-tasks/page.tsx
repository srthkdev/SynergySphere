"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Calendar, Clock, User, Filter } from "lucide-react";
import Link from "next/link";
import { TaskStatus, Task } from "@/types";
import { AttachmentViewer } from "@/components/ui/attachment-viewer";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

// Function to fetch user's tasks
async function fetchMyTasks(includeCreated: boolean = false): Promise<Task[]> {
  const response = await fetch(`/api/tasks/my-tasks${includeCreated ? '?includeCreated=true' : ''}`);
  if (!response.ok) {
    throw new Error("Failed to fetch tasks");
  }
  return response.json();
}

export default function MyTasksPage() {
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [includeCreated, setIncludeCreated] = useState<boolean>(false);
  
  const { data: tasks, isLoading, error, refetch } = useQuery<Task[], Error>({
    queryKey: ["my-tasks", includeCreated],
    queryFn: () => fetchMyTasks(includeCreated),
  });

  const filteredTasks = tasks ? 
    activeTab === "ALL" 
      ? tasks 
      : tasks.filter(task => task.status === activeTab) 
    : [];

  // Function to get count of tasks by status
  const getTaskCountByStatus = (status: string | "ALL") => {
    if (!tasks) return 0;
    return status === "ALL" 
      ? tasks.length 
      : tasks.filter(task => task.status === status).length;
  };

  const handleIncludeCreatedToggle = (checked: boolean) => {
    setIncludeCreated(checked);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Tasks</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <Switch 
              id="include-created" 
              checked={includeCreated}
              onCheckedChange={handleIncludeCreatedToggle}
            />
            <Label htmlFor="include-created" className="text-sm">Include tasks I created</Label>
          </div>
        </div>
      </div>
      
      <Tabs defaultValue="ALL" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 mb-8">
          <TabsTrigger value="ALL">
            All ({getTaskCountByStatus("ALL")})
          </TabsTrigger>
          <TabsTrigger value="TODO">
            To Do ({getTaskCountByStatus("TODO")})
          </TabsTrigger>
          <TabsTrigger value="IN_PROGRESS">
            In Progress ({getTaskCountByStatus("IN_PROGRESS")})
          </TabsTrigger>
          <TabsTrigger value="DONE">
            Done ({getTaskCountByStatus("DONE")})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center py-10 text-red-500">
              {error.message || "Failed to load tasks"}
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              {includeCreated 
                ? "No tasks found in this category" 
                : "No tasks assigned to you in this category"}
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Status badge colors
const statusColors: Record<TaskStatus, string> = {
  TODO: "bg-amber-500",
  IN_PROGRESS: "bg-blue-500",
  DONE: "bg-green-500",
};

// Status display names
const statusNames: Record<TaskStatus, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  DONE: "Completed",
};

// Priority colors
const priorityColors: Record<string, string> = {
  LOW: "bg-blue-500",
  MEDIUM: "bg-amber-500",
  HIGH: "bg-red-500",
};

function TaskCard({ task }: { task: Task }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">{task.title}</CardTitle>
            <CardDescription className="mt-1 text-sm">
              Project: <Link href={`/projects/${task.projectId}`} className="hover:underline text-primary">
                View Project
              </Link>
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {task.priority && (
              <Badge className={priorityColors[task.priority]}>
                {task.priority}
              </Badge>
            )}
            <Badge className={statusColors[task.status]}>
              {statusNames[task.status]}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          {task.description || "No description provided"}
        </p>
        
        {task.attachmentUrl && (
          <div className="mb-4">
            <p className="text-sm font-medium mb-2">Attachment</p>
            <AttachmentViewer url={task.attachmentUrl} alt={`Attachment for ${task.title}`} />
          </div>
        )}
        
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {task.dueDate && (
            <div className="flex items-center">
              <Calendar className="mr-1 h-4 w-4" />
              Due: {new Date(task.dueDate).toLocaleDateString()}
            </div>
          )}
          <div className="flex items-center">
            <Clock className="mr-1 h-4 w-4" />
            Created: {new Date(task.createdAt).toLocaleDateString()}
          </div>
        </div>
      </CardContent>
      
      <CardFooter>
        <Link href={`/projects/${task.projectId}?task=${task.id}`} className="w-full">
          <Button variant="outline" className="w-full">
            View Details
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
} 