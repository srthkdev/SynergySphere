"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Users, 
  LayoutList, 
  MessageSquare, 
  Settings,
  DollarSign,
  Loader2,
  Edit,
  Paperclip
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { fetchProjectById } from "@/lib/queries";
import { Project } from "@/types";
import { TabButton } from "@/components/projects/TabButton";
import { TasksTab } from "@/components/projects/tabs/TasksTab";
import { MembersTab } from "@/components/projects/tabs/MembersTab";
import { DiscussionsTab } from "@/components/projects/tabs/DiscussionsTab";
import { SettingsTab } from "@/components/projects/tabs/SettingsTab";
import { BudgetTab } from "@/components/projects/tabs/BudgetTab";
import { AttachmentsTab } from "@/components/projects/tabs/AttachmentsTab";

// Tabs for the project
type ProjectTab = 'tasks' | 'members' | 'discussions' | 'attachments' | 'budget' | 'settings';

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  
  const [activeTab, setActiveTab] = useState<ProjectTab>('tasks');

  const {
    data: project, 
    isLoading, 
    error 
  } = useQuery<Project, Error>({
    queryKey: ['project', projectId], 
    queryFn: () => fetchProjectById(projectId),
    enabled: !!projectId,
  });
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error || !project) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center mb-8">
          <Button variant="outline" size="icon" className="mr-4" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold text-red-500">
            Error: {error ? error.message : "Project not found"}
          </h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p>We couldn't load the requested project. Please try again or return to dashboard.</p>
            <Button 
              className="mt-4" 
              asChild
            >
              <Link href="/dashboard">Back to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header with project name and back button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div className="flex items-center">
          <Button variant="outline" size="icon" className="mr-4" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{project.name}</h1>
            {project.description && (
              <p className="text-muted-foreground mt-1">{project.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/projects/edit/${projectId}`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Project
            </Link>
          </Button>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="border-b mb-6">
        <div className="flex space-x-8 overflow-x-auto pb-1">
          <TabButton 
            isActive={activeTab === 'tasks'} 
            onClick={() => setActiveTab('tasks')}
            icon={<LayoutList className="h-4 w-4 mr-2" />}
            label="Tasks"
          />
          <TabButton 
            isActive={activeTab === 'members'} 
            onClick={() => setActiveTab('members')}
            icon={<Users className="h-4 w-4 mr-2" />}
            label="Members"
          />
          <TabButton 
            isActive={activeTab === 'discussions'} 
            onClick={() => setActiveTab('discussions')}
            icon={<MessageSquare className="h-4 w-4 mr-2" />}
            label="Discussions"
          />
          <TabButton 
            isActive={activeTab === 'attachments'} 
            onClick={() => setActiveTab('attachments')}
            icon={<Paperclip className="h-4 w-4 mr-2" />}
            label="Attachments"
          />
          <TabButton 
            isActive={activeTab === 'budget'} 
            onClick={() => setActiveTab('budget')}
            icon={<DollarSign className="h-4 w-4 mr-2" />}
            label="Budget"
          />
          <TabButton 
            isActive={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')}
            icon={<Settings className="h-4 w-4 mr-2" />}
            label="Settings"
          />
        </div>
      </div>
      
      {/* Tab content */}
      <div className="min-h-[60vh]">
        {activeTab === 'tasks' && <TasksTab projectId={projectId} />}
        {activeTab === 'members' && <MembersTab projectId={projectId} />}
        {activeTab === 'discussions' && <DiscussionsTab projectId={projectId} />}
        {activeTab === 'attachments' && <AttachmentsTab projectId={projectId} />}
        {activeTab === 'budget' && <BudgetTab projectId={projectId} />}
        {activeTab === 'settings' && <SettingsTab project={project} />}
      </div>
    </div>
  );
} 