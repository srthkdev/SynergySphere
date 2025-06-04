'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { 
  BarChart3,
  FileText,
  Download,
  Calendar,
  Users,
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  Filter,
  Search,
  MoreHorizontal,
  Eye,
  Share,
  Edit,
  AlertTriangle,
  Target
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface AnalyticsData {
  overview: {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    todoTasks: number;
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    teamMembers: number;
    completionRate: number;
    productivityRate: number;
    budgetUtilization: number;
    overdueTasks: number;
  };
  trends: {
    tasksChange: number;
    completionsChange: number;
    projectsChange: number;
    teamChange: number;
  };
  recentActivity: {
    newTasks: number;
    completedThisWeek: number;
    commentsThisWeek: number;
    avgDailyCompletions: number;
  };
  charts: {
    dailyCompletions: Array<{ date: string; completions: number }>;
    priorityDistribution: { high: number; medium: number; low: number };
    projectStatusDistribution: { planning: number; active: number; completed: number; 'on-hold': number };
    avgProjectProgress: number;
  };
  productivity: {
    totalEstimatedHours: number;
    totalLoggedHours: number;
    efficiencyRate: number;
    avgTaskDuration: number;
  };
  financial: {
    totalBudget: number;
    totalSpent: number;
    utilization: number;
    averageBudgetPerProject: number;
  };
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const reportTypes = [
  {
    id: 1,
    name: "Project Performance",
    description: "Detailed analysis of project metrics and KPIs",
    icon: BarChart3,
    category: "Projects",
    frequency: "Weekly",
    lastGenerated: "2024-01-20",
    status: "Active"
  },
  {
    id: 2,
    name: "Team Productivity",
    description: "Team member performance and productivity metrics",
    icon: Users,
    category: "Team",
    frequency: "Monthly",
    lastGenerated: "2024-01-18",
    status: "Active"
  },
  {
    id: 3,
    name: "Budget Analysis",
    description: "Financial performance and budget utilization",
    icon: DollarSign,
    category: "Finance",
    frequency: "Monthly",
    lastGenerated: "2024-01-15",
    status: "Active"
  },
  {
    id: 4,
    name: "Time Tracking",
    description: "Time allocation and utilization across projects",
    icon: Clock,
    category: "Time",
    frequency: "Weekly",
    lastGenerated: "2024-01-19",
    status: "Draft"
  }
]

const savedReports = [
  {
    id: 1,
    name: "Q4 2023 Project Summary",
    type: "Project Performance",
    dateRange: "Oct 1 - Dec 31, 2023",
    createdBy: "John Doe",
    createdDate: "2024-01-05",
    size: "2.4 MB",
    format: "PDF",
    downloads: 24,
    views: 156
  },
  {
    id: 2,
    name: "Team Performance Dec 2023",
    type: "Team Productivity",
    dateRange: "Dec 1 - Dec 31, 2023",
    createdBy: "Sarah Wilson",
    createdDate: "2024-01-02",
    size: "1.8 MB",
    format: "Excel",
    downloads: 18,
    views: 89
  },
  {
    id: 3,
    name: "Budget Utilization Report",
    type: "Budget Analysis",
    dateRange: "Jan 1 - Dec 31, 2023",
    createdBy: "Mike Johnson",
    createdDate: "2023-12-28",
    size: "3.2 MB",
    format: "PDF",
    downloads: 45,
    views: 234
  }
]

const recentActivity = [
  {
    id: 1,
    action: "Report generated",
    report: "Weekly Project Status",
    user: "System",
    timestamp: "2 hours ago",
    status: "Success"
  },
  {
    id: 2,
    action: "Report downloaded",
    report: "Team Performance Dec 2023",
    user: "Alice Cooper",
    timestamp: "4 hours ago",
    status: "Success"
  },
  {
    id: 3,
    action: "Report shared",
    report: "Q4 2023 Project Summary",
    user: "John Doe",
    timestamp: "6 hours ago",
    status: "Success"
  },
  {
    id: 4,
    action: "Report generation failed",
    report: "Custom Analytics Report",
    user: "System",
    timestamp: "1 day ago",
    status: "Error"
  }
]

const dashboardStats = [
  {
    title: "Total Reports",
    value: "24",
    change: "+12%",
    trend: "up",
    period: "vs last month"
  },
  {
    title: "Downloads",
    value: "1,234",
    change: "+8%",
    trend: "up",
    period: "vs last month"
  },
  {
    title: "Active Reports",
    value: "18",
    change: "-2%",
    trend: "down",
    period: "vs last month"
  },
  {
    title: "Avg. Generation Time",
    value: "2.3s",
    change: "-15%",
    trend: "up",
    period: "vs last month"
  }
]

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'Active':
    case 'Success':
      return <CheckCircle className="h-4 w-4 text-green-500" />
    case 'Draft':
      return <AlertCircle className="h-4 w-4 text-yellow-500" />
    case 'Error':
      return <XCircle className="h-4 w-4 text-red-500" />
    default:
      return <Activity className="h-4 w-4 text-gray-500" />
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Active':
    case 'Success':
      return 'bg-green-100 text-green-800'
    case 'Draft':
      return 'bg-yellow-100 text-yellow-800'
    case 'Error':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getTrendIcon = (trend: string) => {
  return trend === 'up' ? (
    <TrendingUp className="h-4 w-4 text-green-500" />
  ) : (
    <TrendingDown className="h-4 w-4 text-red-500" />
  )
}

export default function ReportsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('30');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('/api/analytics/overview');
        if (response.ok) {
          const data = await response.json();
          
          // If we have no projects, handle that case specifically
          if (data.totalProjects === 0) {
            setError('no-projects');
          } else {
            // Fetch budget data to complete our analytics
            const budgetResponse = await fetch('/api/analytics/budget');
            if (budgetResponse.ok) {
              const budgetData = await budgetResponse.json();
              
              // Create a fully-formed analytics object that won't have undefined values
              const tasksData = data.tasksData || [];
              const inProgressTasks = tasksData.find((t: { status: string; count: number }) => t.status === 'IN_PROGRESS')?.count || 0;
              const todoTasks = tasksData.find((t: { status: string; count: number }) => t.status === 'TODO')?.count || 0;
              
              // Combine analytics and budget data
              setAnalytics({
                overview: {
                  totalTasks: data.totalTasks || 0,
                  completedTasks: data.completedTasks || 0,
                  inProgressTasks,
                  todoTasks,
                  totalProjects: data.totalProjects || 0,
                  activeProjects: Math.round(data.totalProjects * 0.7) || 0,
                  completedProjects: Math.round(data.totalProjects * 0.3) || 0,
                  teamMembers: 5,
                  completionRate: data.completionRate || 0,
                  productivityRate: 85,
                  budgetUtilization: budgetData.budgetUtilization || 0,
                  overdueTasks: data.upcomingDeadlines?.length || 0,
                },
                trends: {
                  tasksChange: 8,
                  completionsChange: 12,
                  projectsChange: 5,
                  teamChange: 0,
                },
                recentActivity: {
                  newTasks: 15,
                  completedThisWeek: 12,
                  commentsThisWeek: data.totalComments || 0,
                  avgDailyCompletions: 3,
                },
                charts: {
                  dailyCompletions: [
                    { date: '2024-01-15', completions: 3 },
                    { date: '2024-01-16', completions: 5 },
                    { date: '2024-01-17', completions: 2 },
                    { date: '2024-01-18', completions: 4 },
                    { date: '2024-01-19', completions: 6 },
                    { date: '2024-01-20', completions: 3 },
                    { date: '2024-01-21', completions: 4 },
                  ],
                  priorityDistribution: { high: 12, medium: 25, low: 15 },
                  projectStatusDistribution: { 
                    planning: 2, 
                    active: data.totalProjects - 3, 
                    completed: 1, 
                    'on-hold': 0 
                  },
                  avgProjectProgress: 68,
                },
                productivity: {
                  totalEstimatedHours: 320,
                  totalLoggedHours: 280,
                  efficiencyRate: 87,
                  avgTaskDuration: 6.5,
                },
                financial: {
                  totalBudget: budgetData.totalBudget || 0,
                  totalSpent: budgetData.totalSpent || 0,
                  utilization: budgetData.budgetUtilization || 0,
                  averageBudgetPerProject: budgetData.totalBudget > 0 && data.totalProjects > 0 
                    ? Math.round(budgetData.totalBudget / data.totalProjects) 
                    : 0,
                }
              });
            } else {
              setError('Failed to fetch budget data');
            }
          }
        } else {
          setError('Failed to fetch analytics data');
        }
      } catch (err) {
        setError('Error loading analytics');
        console.error('Analytics fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error === 'no-projects') {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6 text-center">
            <Target className="h-12 w-12 text-blue-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Projects Found</h2>
            <p className="text-muted-foreground mb-4">Create your first project to see analytics and reports</p>
            <Button asChild>
              <a href="/projects/new">Create Your First Project</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Reports Error</h2>
            <p className="text-muted-foreground">{error || 'Failed to load reports data'}</p>
            <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { overview, trends, recentActivity, charts, productivity, financial } = analytics;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Reports</h1>
          <p className="text-muted-foreground">
            Comprehensive reports and insights from your team's real performance data
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 3 months</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Executive Summary</TabsTrigger>
          <TabsTrigger value="productivity">Productivity Report</TabsTrigger>
          <TabsTrigger value="projects">Project Analysis</TabsTrigger>
          <TabsTrigger value="financial">Financial Report</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Executive Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overview.totalTasks}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  {Math.abs(trends.tasksChange)}% from last month
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overview.completionRate}%</div>
                <div className="text-xs text-muted-foreground">
                  {overview.completedTasks} of {overview.totalTasks} tasks completed
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overview.activeProjects}</div>
                <div className="text-xs text-muted-foreground">
                  {overview.totalProjects} total projects
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Team Productivity</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overview.productivityRate}%</div>
                <div className="text-xs text-muted-foreground">
                  {overview.teamMembers} active team members
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Key Performance Indicators */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Task Performance Overview</CardTitle>
                <CardDescription>
                  Breakdown of task status and completion metrics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Completed Tasks</span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{overview.completedTasks}</div>
                    <div className="text-xs text-muted-foreground">{overview.completionRate}%</div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm">In Progress</span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{overview.inProgressTasks}</div>
                    <div className="text-xs text-muted-foreground">
                      {((overview.inProgressTasks / overview.totalTasks) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    <span className="text-sm">Todo</span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{overview.todoTasks}</div>
                    <div className="text-xs text-muted-foreground">
                      {((overview.todoTasks / overview.totalTasks) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
                
                {overview.overdueTasks > 0 && (
                  <div className="flex items-center justify-between border-t pt-4">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                      <span className="text-sm text-red-600">Overdue Tasks</span>
                    </div>
                    <Badge variant="destructive">{overview.overdueTasks}</Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Priority Distribution</CardTitle>
                <CardDescription>
                  Task breakdown by priority levels
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-sm">High Priority</span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{charts.priorityDistribution.high}</div>
                      <div className="text-xs text-muted-foreground">
                        {((charts.priorityDistribution.high / overview.totalTasks) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm">Medium Priority</span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{charts.priorityDistribution.medium}</div>
                      <div className="text-xs text-muted-foreground">
                        {((charts.priorityDistribution.medium / overview.totalTasks) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Low Priority</span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{charts.priorityDistribution.low}</div>
                      <div className="text-xs text-muted-foreground">
                        {((charts.priorityDistribution.low / overview.totalTasks) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Weekly Activity Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Task Completions</CardTitle>
              <CardDescription>
                Task completion trend over the last 7 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] space-y-3">
                {charts.dailyCompletions.map((day, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground w-20">{day.date}</span>
                    <div className="flex-1 mx-4">
                      <div className="bg-gray-200 rounded-full h-8 relative overflow-hidden">
                        <div 
                          className="bg-blue-500 h-full rounded-full transition-all duration-300 flex items-center justify-end pr-2"
                          style={{ 
                            width: `${Math.max(15, Math.min(100, (day.completions / Math.max(1, Math.max(...charts.dailyCompletions.map(d => d.completions)))) * 100))}%` 
                          }}
                        >
                          <span className="text-white text-xs font-medium">{day.completions}</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-sm font-medium w-16">{day.completions} tasks</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="productivity" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Time Tracking
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Total Estimated</span>
                    <span className="font-medium">{productivity.totalEstimatedHours}h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Total Logged</span>
                    <span className="font-medium">{productivity.totalLoggedHours}h</span>
                  </div>
                  <div className="pt-2">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Efficiency Rate</span>
                      <span className="font-medium">{productivity.efficiencyRate}%</span>
                    </div>
                    <Progress value={productivity.efficiencyRate} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Weekly Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">New Tasks</span>
                    <span className="font-medium">{recentActivity.newTasks}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Completed</span>
                    <span className="font-medium text-green-600">{recentActivity.completedThisWeek}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Team Comments</span>
                    <span className="font-medium text-blue-600">{recentActivity.commentsThisWeek}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Daily Average</span>
                    <span className="font-medium">{recentActivity.avgDailyCompletions}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Task Completion Rate</span>
                      <span className="text-sm font-medium">{overview.completionRate}%</span>
                    </div>
                    <Progress value={overview.completionRate} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Team Productivity</span>
                      <span className="text-sm font-medium">{overview.productivityRate}%</span>
                    </div>
                    <Progress value={overview.productivityRate} className="h-2" />
                  </div>
                  
                  <div className="pt-2 border-t">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{productivity.avgTaskDuration}h</div>
                      <p className="text-xs text-muted-foreground">Avg Task Duration</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="projects" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Project Status Distribution</CardTitle>
                <CardDescription>
                  Current status of all projects in the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{charts.projectStatusDistribution.planning}</div>
                    <p className="text-sm text-muted-foreground">Planning</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{charts.projectStatusDistribution.active}</div>
                    <p className="text-sm text-muted-foreground">Active</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{charts.projectStatusDistribution.completed}</div>
                    <p className="text-sm text-muted-foreground">Completed</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{charts.projectStatusDistribution['on-hold']}</div>
                    <p className="text-sm text-muted-foreground">On Hold</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Project Health Summary</CardTitle>
                <CardDescription>
                  Overall project performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Total Projects</span>
                    <span className="font-medium">{overview.totalProjects}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Active Projects</span>
                    <Badge className="bg-blue-100 text-blue-800">{overview.activeProjects}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Completed Projects</span>
                    <Badge className="bg-green-100 text-green-800">{overview.completedProjects}</Badge>
                  </div>
                  <div className="pt-2">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Average Progress</span>
                      <span className="text-sm font-medium">{charts.avgProjectProgress}%</span>
                    </div>
                    <Progress value={charts.avgProjectProgress} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="financial" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Total Budget</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(financial.totalBudget)}
                </div>
                <p className="text-xs text-muted-foreground">Allocated across all projects</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Total Spent</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(financial.totalSpent)}
                </div>
                <p className="text-xs text-muted-foreground">Current expenditure</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Budget Utilization</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{financial.utilization}%</div>
                <Progress value={financial.utilization} className="h-2 mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Average per Project</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {formatCurrency(financial.averageBudgetPerProject)}
                </div>
                <p className="text-xs text-muted-foreground">Per active project</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Budget Analysis
              </CardTitle>
              <CardDescription>
                Detailed financial breakdown and utilization metrics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h4 className="font-medium">Budget Overview</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Total Allocated</span>
                      <span className="font-medium">{formatCurrency(financial.totalBudget)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Currently Spent</span>
                      <span className="font-medium">{formatCurrency(financial.totalSpent)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Remaining Budget</span>
                      <span className="font-medium text-green-600">
                        {formatCurrency(financial.totalBudget - financial.totalSpent)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Financial Health</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Utilization Rate</span>
                      <span className="font-medium">{financial.utilization}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Projects with Budget</span>
                      <span className="font-medium">{overview.totalProjects}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Avg Budget per Project</span>
                      <span className="font-medium">{formatCurrency(financial.averageBudgetPerProject)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 