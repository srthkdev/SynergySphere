"use client"

import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  Frame,
  GalleryVerticalEnd,
  Inbox,
  LayoutDashboard,
  ListTodo,
  Map,
  PieChart,
  Settings2,
  SquareTerminal,
  Wallet,
} from "lucide-react"
import * as React from "react"
import { useState, useEffect } from "react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

// Static data for teams and navigation
const staticData = {
  teams: [
    {
      name: "SynergySphere",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
      isActive: true,
    },
    {
      title: "My Tasks",
      url: "/my-tasks",
      icon: ListTodo,
    },
    {
      title: "Inbox",
      url: "/inbox",
      icon: Inbox,
    },
    {
      title: "Budgets", 
      url: "/budgets",
      icon: Wallet,
    },
    {
      title: "Projects",
      url: "/projects",
      icon: Frame,
      items: [
        {
          title: "View All",
          url: "/projects",
        },
        {
          title: "Create New",
          url: "/projects/new",
        },
        {
          title: "Templates",
          url: "/projects/templates",
        },
      ],
    },
    {
      title: "Analytics",
      url: "/analytics",
      icon: PieChart,
      items: [
        {
          title: "Reports",
          url: "/analytics/reports",
        },
        {
          title: "Insights",
          url: "/analytics/insights",
        },
        {
          title: "Metrics",
          url: "/analytics/metrics",
        },
      ],
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings2,
      items: [
        {
          title: "Profile",
          url: "/settings/profile",
        },
        {
          title: "Team",
          url: "/settings/team",
        },
        {
          title: "Preferences",
          url: "/settings/preferences",
        },
      ],
    },
  ],
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user?: {
    name: string
    email: string
    image?: string | null
  } | null
}

interface Project {
  id: string;
  name: string;
  description: string;
  status: 'planning' | 'active' | 'on-hold' | 'completed';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
  role: string; // user's role in the project
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const [projects, setProjects] = useState<{name: string, url: string, icon: any}[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch real projects from API
  useEffect(() => {
    async function fetchProjects() {
      try {
        const response = await fetch('/api/projects');
        if (response.ok) {
          const projectsData: Project[] = await response.json();
          
          // Convert to sidebar format and limit to top 3 active projects
          const sidebarProjects = projectsData
            .filter(project => project.status === 'active')
            .slice(0, 3)
            .map(project => ({
              name: project.name,
              url: `/projects/${project.id}`,
              icon: project.priority === 'high' ? Frame : 
                    project.priority === 'medium' ? PieChart : Map,
            }));

          setProjects(sidebarProjects);
        } else {
          // Fallback to empty array if API fails
          setProjects([]);
        }
      } catch (error) {
        console.error('Failed to fetch projects:', error);
        setProjects([]);
      } finally {
        setLoading(false);
      }
    }

    fetchProjects();
  }, []);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={staticData.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={staticData.navMain} />
        {!loading && <NavProjects projects={projects} />}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user || null} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
} 