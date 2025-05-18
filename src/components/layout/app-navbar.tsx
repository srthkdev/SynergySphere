'use client'
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site.config";
import { ChevronRight, LayoutGrid } from "lucide-react"; 
import Link from "next/link";
import ThemeToggler from "@/components/theme/toggler";
import { UserProfile } from "@/components/user-profile";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export const AppNavbar = () => {
  const pathname = usePathname();
  const [projectName, setProjectName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Extract project id from path if available
  const pathSegments = pathname.split('/').filter(Boolean);
  const isProjectPage = pathSegments.length > 1 && pathSegments[0] === 'projects';
  const projectId = isProjectPage ? pathSegments[1] : null;
  
  useEffect(() => {
    const fetchProjectName = async () => {
      if (!projectId) return;
      
      setIsLoading(true);
      try {
        // Replace this with your actual API endpoint to fetch project details
        const response = await fetch(`/api/projects/${projectId}`);
        if (response.ok) {
          const data = await response.json();
          setProjectName(data.name);
        }
      } catch (error) {
        console.error("Failed to fetch project name:", error);
        // Fallback to formatted project ID if fetch fails
        setProjectName(projectId.replace(/-/g, ' '));
      } finally {
        setIsLoading(false);
      }
    };
    
    if (projectId) {
      fetchProjectName();
    } else {
      setProjectName(null);
    }
  }, [projectId]);
  
  return (
    <div 
      id="app-navbar" 
      style={{'--navbar-height': '56px'} as React.CSSProperties} 
      className="border-b border-dashed flex items-center justify-between h-[var(--navbar-height)] shrink-0 px-4 md:px-6"
    >
      <div className="flex items-center gap-4">
        <div id="brand" className="flex items-center">
          <Button variant="ghost" className="font-heading text-lg md:text-xl font-bold p-0 h-auto" asChild>
            <Link href="/dashboard">
              <LayoutGrid className="h-5 w-5 mr-2 text-primary" /> 
              <span>{siteConfig.name}</span>
            </Link>
          </Button>
        </div>
        
        {/* Breadcrumbs */}
        <div className="hidden md:flex items-center text-sm text-muted-foreground">
          <Link href="/dashboard" className="hover:text-foreground transition-colors">
            My Projects
          </Link>
          
          {projectId && (
            <>
              <ChevronRight className="h-4 w-4 mx-1" />
              <span className="text-foreground font-medium capitalize">
                {isLoading ? "Loading..." : projectName || projectId.replace(/-/g, ' ')}
              </span>
            </>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <ThemeToggler className="h-8 w-8" />
        <UserProfile className="h-9 w-9" />
      </div>
    </div>
  )
} 