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
import { Badge } from "@/components/ui/badge"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

// Base navigation data (will be enhanced with dynamic data in component)
const baseNavMain = [
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
    title: "AI Assistant",
    url: "/ai-assistant",
    icon: Bot,
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
        title: "Appearance",
        url: "/settings/appearance",
      },
    ],
  },
]

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

// Simple App Header Component
function AppHeader() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <GalleryVerticalEnd className="size-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">SynergySphere</span>
            <span className="truncate text-xs">Project Management</span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const [projects, setProjects] = useState<{name: string, url: string, icon: any}[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Create navigation with dynamic badge for Inbox
  const navMain = baseNavMain.map(item => {
    if (item.title === "Inbox") {
      return {
        ...item,
        badge: unreadNotifications > 0 ? unreadNotifications : undefined
      };
    }
    return item;
  });

  // Fetch unread notifications count
  const fetchUnreadCount = async () => {
    try {
      const response = await fetch('/api/notifications?unread=true');
      if (response.ok) {
        const notifications = await response.json();
        setUnreadNotifications(notifications.length);
        console.log('Unread notifications count:', notifications.length); // Debug log
      }
    } catch (error) {
      console.error('Failed to fetch unread notifications:', error);
    }
  };

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
    fetchUnreadCount();
    
    // Refresh unread count every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <AppHeader />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        {!loading && <NavProjects projects={projects} />}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user || null} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
} 