'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  FolderOpen,
  Calendar,
  Users,
  Clock,
  Target,
  TrendingUp,
  Plus,
  Filter,
  Search,
  MoreVertical,
  Edit3,
  Trash2,
  Eye,
  Settings,
  CheckCircle,
  AlertCircle,
  Star,
  Archive,
  Share,
  GitBranch,
  DollarSign,
  Play,
  Pause,
  AlertTriangle,
  MoreHorizontal,
  Edit,
  X
} from "lucide-react"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

// Import the new view components
import { ViewSwitcher, ViewMode } from "@/components/ui/view-switcher"
import { GalleryView } from "@/components/views/gallery-view"
import { ListView } from "@/components/views/list-view"
import { Project, Task } from "@/types"

const projectStats = [
  {
    title: "Total Projects",
    value: "0",
    icon: Target,
    description: "All projects"
  },
  {
    title: "Active", 
    value: "0",
    icon: TrendingUp,
    description: "Currently running"
  },
  {
    title: "Completed",
    value: "0", 
    icon: Star,
    description: "Successfully finished"
  },
  {
    title: "At Risk",
    value: "0",
    icon: AlertTriangle,
    description: "Need attention"
  }
];

function getPriorityColor(priority: string) {
  switch (priority) {
    case 'high': return 'bg-red-100 text-red-800';
    case 'medium': return 'bg-yellow-100 text-yellow-800';
    case 'low': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'completed': return 'bg-green-100 text-green-800';
    case 'active': return 'bg-blue-100 text-blue-800';
    case 'on-hold': return 'bg-orange-100 text-orange-800';
    case 'planning': return 'bg-purple-100 text-purple-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState<'all' | 'active' | 'completed' | 'planning'>('all');
  const [currentView, setCurrentView] = useState<ViewMode>('gallery');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const router = useRouter();

  // Fetch projects from API
  useEffect(() => {
    async function fetchProjects() {
      try {
        const response = await fetch('/api/projects');
        if (!response.ok) {
          throw new Error('Failed to fetch projects');
        }
        const data = await response.json();
        setProjects(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchProjects();
  }, []);

  // Calculate project statistics
  const totalProjects = projects.length;
  const activeProjects = projects.filter(project => project.status === 'active').length;
  const completedProjects = projects.filter(project => project.status === 'completed').length;
  const atRiskProjects = projects.filter(project => {
    // For now, consider projects that have been active for a while as "at risk"
    // This is a placeholder until we have proper budget/timeline tracking
    const createdDate = new Date(project.createdAt);
    const daysSinceCreated = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
    return project.status === 'active' && daysSinceCreated > 30;
  }).length;

  // Update project stats
  projectStats[0].value = totalProjects.toString();
  projectStats[1].value = activeProjects.toString();
  projectStats[2].value = completedProjects.toString();
  projectStats[3].value = atRiskProjects.toString();

  // Filter projects based on search, tab, and priority
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = selectedTab === 'all' || project.status === selectedTab;
    const matchesPriority = selectedPriority === 'all' || project.priority === selectedPriority;
    
    return matchesSearch && matchesTab && matchesPriority;
  });

  const handleProjectUpdate = async (projectId: string, updates: Partial<Project>) => {
    try {
      const response = await fetch('/api/projects', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: projectId, ...updates }),
      });

      if (!response.ok) {
        throw new Error('Failed to update project');
      }

      const updatedProject = await response.json();
      setProjects(prev => prev.map(p => p.id === projectId ? { ...p, ...updatedProject } : p));
    } catch (error) {
      console.error('Error updating project:', error);
    }
  };

  const handleProjectClick = (item: Task | Project) => {
    // Navigate to project detail page
    window.location.href = `/projects/${item.id}`;
  };

  const handleItemUpdate = (itemId: string, updates: any) => {
    handleProjectUpdate(itemId, updates);
  };

  const handleProjectEdit = (item: Project | Task) => {
    if ('name' in item) { // Check if it's a Project
      router.push(`/projects/edit/${item.id}`);
    }
  };

  const handleProjectDelete = async (item: Project | Task) => {
    if ('name' in item) { // Check if it's a Project
      const project = item as Project;
      if (confirm(`Are you sure you want to delete "${project.name}"?`)) {
        try {
          const response = await fetch(`/api/projects/${project.id}`, {
            method: 'DELETE',
          });

          if (response.ok) {
            setProjects(projects.filter(p => p.id !== project.id));
            toast.success('Project deleted successfully');
          } else {
            throw new Error('Failed to delete project');
          }
        } catch (error) {
          console.error('Error deleting project:', error);
          toast.error('Failed to delete project');
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading projects...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-600">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            Manage your projects and track their progress
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Link href="/projects/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </Link>
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <Card className="p-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">Priority:</label>
              <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="sm" onClick={() => {
              setSelectedPriority('all');
              setSearchTerm('');
              setSelectedTab('all');
            }}>
              Clear Filters
            </Button>
          </div>
        </Card>
      )}

      {/* Project Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {projectStats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(value as 'all' | 'active' | 'completed' | 'planning')} className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all" onClick={() => setSelectedTab('all')}>All</TabsTrigger>
            <TabsTrigger value="active" onClick={() => setSelectedTab('active')}>Active</TabsTrigger>
            <TabsTrigger value="completed" onClick={() => setSelectedTab('completed')}>Completed</TabsTrigger>
            <TabsTrigger value="planning" onClick={() => setSelectedTab('planning')}>Planning</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search projects..." className="pl-8 w-[250px]" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
            </div>
            
            <ViewSwitcher 
              currentView={currentView} 
              onViewChange={setCurrentView}
              availableViews={['gallery', 'list']}
            />
          </div>
        </div>

        <TabsContent value={selectedTab} className="space-y-4">
          {filteredProjects.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No projects found</h3>
                <p className="text-sm text-muted-foreground text-center">
                  {projects.length === 0 
                    ? "You don't have any projects yet. "
                    : "No projects match your current filter criteria."
                  }
                </p>
                {projects.length === 0 && (
                  <Link href="/projects/new">
                    <Button className="mt-4">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Your First Project
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ) : (
            <div>
              {currentView === 'gallery' && (
                <GalleryView
                  items={filteredProjects}
                  type="projects"
                  onItemUpdate={handleProjectUpdate}
                  onItemClick={handleProjectClick}
                  onEdit={handleProjectEdit}
                  onDelete={handleProjectDelete}
                />
              )}
              
              {currentView === 'list' && (
                <ListView
                  items={filteredProjects as any}
                  type="projects"
                  onItemUpdate={handleProjectUpdate}
                  onItemClick={handleProjectClick as any}
                  onEdit={handleProjectEdit as any}
                  onDelete={handleProjectDelete as any}
                />
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
} 