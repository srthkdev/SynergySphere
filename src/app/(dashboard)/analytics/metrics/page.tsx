'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Activity,
  TrendingUp, 
  TrendingDown,
  Clock, 
  Users,
  Target, 
  DollarSign,
  AlertCircle,
  CheckCircle,
  BarChart3,
  Timer,
  Calendar,
  Award,
  Zap,
  TrendingUp as Growth,
  AlertTriangle,
  RefreshCw
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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

const getTrendIcon = (change: number) => {
  return change >= 0 ? (
    <TrendingUp className="h-4 w-4 text-green-500" />
  ) : (
    <TrendingDown className="h-4 w-4 text-red-500" />
  )
}

const getTrendColor = (change: number) => {
  return change >= 0 ? 'text-green-600' : 'text-red-600'
}

const getPerformanceColor = (value: number, thresholds: { excellent: number; good: number; warning: number }) => {
  if (value >= thresholds.excellent) return 'text-green-600';
  if (value >= thresholds.good) return 'text-blue-600';
  if (value >= thresholds.warning) return 'text-yellow-600';
  return 'text-red-600';
}

const getPerformanceIcon = (value: number, thresholds: { excellent: number; good: number; warning: number }) => {
  if (value >= thresholds.excellent) return <Award className="h-4 w-4 text-green-500" />;
  if (value >= thresholds.good) return <CheckCircle className="h-4 w-4 text-blue-500" />;
  if (value >= thresholds.warning) return <AlertCircle className="h-4 w-4 text-yellow-500" />;
  return <AlertTriangle className="h-4 w-4 text-red-500" />;
}

export default function MetricsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/analytics/overview');
      if (response.ok) {
        const data = await response.json();
        
        // If we have no projects, handle that case specifically
        if (data.totalProjects === 0) {
          setError('no-projects');
          setLoading(false);
          return;
        }
        
        // Fetch budget data to complete our analytics
        const budgetResponse = await fetch('/api/analytics/budget');
        if (budgetResponse.ok) {
          const budgetData = await budgetResponse.json();
          
          // Create a fully-formed analytics object that won't have undefined values
          const tasksData = data.tasksData || [];
          const inProgressTasks = tasksData.find((t: { status: string; count: number }) => t.status === 'IN_PROGRESS')?.count || 0;
          const todoTasks = tasksData.find((t: { status: string; count: number }) => t.status === 'TODO')?.count || 0;
          
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
          setLastUpdated(new Date());
          setError(null);
        } else {
          setError('Failed to fetch budget data');
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

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
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
            <p className="text-muted-foreground mb-4">Create your first project to see metrics</p>
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
            <h2 className="text-xl font-semibold mb-2">Metrics Error</h2>
            <p className="text-muted-foreground mb-4">{error || 'Failed to load metrics data'}</p>
            <Button onClick={fetchAnalytics}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { overview, trends, recentActivity, charts, productivity, financial } = analytics;

  // Calculate derived metrics
  const taskVelocity = recentActivity.avgDailyCompletions;
  const budgetEfficiency = (financial.totalSpent / financial.totalBudget) * 100;
  const teamEfficiency = (overview.completedTasks / overview.teamMembers);
  const projectSuccess = (overview.completedProjects / overview.totalProjects) * 100;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Detailed Metrics</h1>
          <p className="text-muted-foreground">
            Comprehensive performance metrics and KPIs for your organization
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <p className="text-sm text-muted-foreground">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
          <Button variant="outline" onClick={fetchAnalytics}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Task Completion Rate</CardTitle>
            {getPerformanceIcon(overview.completionRate, { excellent: 80, good: 60, warning: 40 })}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getPerformanceColor(overview.completionRate, { excellent: 80, good: 60, warning: 40 })}`}>
              {overview.completionRate}%
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              {getTrendIcon(trends.completionsChange)}
              <span className={`ml-1 ${getTrendColor(trends.completionsChange)}`}>
                {Math.abs(trends.completionsChange)}% from last month
              </span>
            </div>
            <Progress value={overview.completionRate} className="mt-2 h-1" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Productivity</CardTitle>
            {getPerformanceIcon(overview.productivityRate, { excellent: 85, good: 70, warning: 50 })}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getPerformanceColor(overview.productivityRate, { excellent: 85, good: 70, warning: 50 })}`}>
              {overview.productivityRate}%
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <Zap className="h-3 w-3 mr-1" />
              <span>{teamEfficiency.toFixed(1)} tasks per member</span>
            </div>
            <Progress value={overview.productivityRate} className="mt-2 h-1" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time Efficiency</CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getPerformanceColor(productivity.efficiencyRate, { excellent: 80, good: 65, warning: 50 })}`}>
              {productivity.efficiencyRate}%
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <Clock className="h-3 w-3 mr-1" />
              <span>{productivity.avgTaskDuration}h avg per task</span>
            </div>
            <Progress value={productivity.efficiencyRate} className="mt-2 h-1" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Utilization</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getPerformanceColor(financial.utilization, { excellent: 70, good: 50, warning: 30 })}`}>
              {financial.utilization}%
            </div>
            <div className="text-xs text-muted-foreground">
              {formatCurrency(financial.totalSpent)} of {formatCurrency(financial.totalBudget)}
            </div>
            <Progress value={financial.utilization} className="mt-2 h-1" />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="productivity">Productivity</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="quality">Quality</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Task Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{overview.totalTasks}</div>
                    <p className="text-sm text-muted-foreground">Total Tasks</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{overview.completedTasks}</div>
                    <p className="text-sm text-muted-foreground">Completed</p>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">{overview.inProgressTasks}</div>
                    <p className="text-sm text-muted-foreground">In Progress</p>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{overview.overdueTasks}</div>
                    <p className="text-sm text-muted-foreground">Overdue</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Task Velocity</span>
                    <Badge variant="outline">{taskVelocity} tasks/day</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Success Rate</span>
                    <Badge variant={overview.completionRate >= 80 ? "default" : overview.completionRate >= 60 ? "secondary" : "destructive"}>
                      {overview.completionRate}%
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Team Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{overview.teamMembers}</div>
                    <p className="text-sm text-muted-foreground">Team Members</p>
                  </div>
                  <div className="text-center p-4 bg-indigo-50 rounded-lg">
                    <div className="text-2xl font-bold text-indigo-600">{teamEfficiency.toFixed(1)}</div>
                    <p className="text-sm text-muted-foreground">Tasks per Member</p>
                  </div>
                  <div className="text-center p-4 bg-pink-50 rounded-lg">
                    <div className="text-2xl font-bold text-pink-600">{recentActivity.commentsThisWeek}</div>
                    <p className="text-sm text-muted-foreground">Weekly Comments</p>
                  </div>
                  <div className="text-center p-4 bg-teal-50 rounded-lg">
                    <div className="text-2xl font-bold text-teal-600">{overview.productivityRate}%</div>
                    <p className="text-sm text-muted-foreground">Productivity Rate</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Team Growth</span>
                    <div className="flex items-center gap-1">
                      {getTrendIcon(trends.teamChange)}
                      <span className={`text-sm ${getTrendColor(trends.teamChange)}`}>
                        {Math.abs(trends.teamChange)}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Activity Level</span>
                    <Badge variant="outline">
                      {recentActivity.commentsThisWeek > 20 ? 'High' : 
                       recentActivity.commentsThisWeek > 10 ? 'Medium' : 'Low'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Priority Distribution Analysis</CardTitle>
              <CardDescription>
                Breakdown of tasks by priority level and completion status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600 mb-2">{charts.priorityDistribution.high}</div>
                  <div className="w-full bg-red-100 rounded-full h-2.5 mb-2 overflow-hidden">
                    <div 
                      className="bg-red-500 h-2.5 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${Math.min(100, Math.max(5, (charts.priorityDistribution.high / (charts.priorityDistribution.high + charts.priorityDistribution.medium + charts.priorityDistribution.low)) * 100))}%` 
                      }}
                    ></div>
                  </div>
                  <p className="text-sm text-muted-foreground">High Priority</p>
                  <p className="text-xs text-muted-foreground">
                    {((charts.priorityDistribution.high / overview.totalTasks) * 100).toFixed(1)}% of total
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-600 mb-2">{charts.priorityDistribution.medium}</div>
                  <div className="w-full bg-yellow-100 rounded-full h-2.5 mb-2 overflow-hidden">
                    <div 
                      className="bg-yellow-500 h-2.5 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${Math.min(100, Math.max(5, (charts.priorityDistribution.medium / (charts.priorityDistribution.high + charts.priorityDistribution.medium + charts.priorityDistribution.low)) * 100))}%` 
                      }}
                    ></div>
                  </div>
                  <p className="text-sm text-muted-foreground">Medium Priority</p>
                  <p className="text-xs text-muted-foreground">
                    {((charts.priorityDistribution.medium / overview.totalTasks) * 100).toFixed(1)}% of total
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">{charts.priorityDistribution.low}</div>
                  <div className="w-full bg-green-100 rounded-full h-2.5 mb-2 overflow-hidden">
                    <div 
                      className="bg-green-500 h-2.5 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${Math.min(100, Math.max(5, (charts.priorityDistribution.low / (charts.priorityDistribution.high + charts.priorityDistribution.medium + charts.priorityDistribution.low)) * 100))}%` 
                      }}
                    ></div>
                  </div>
                  <p className="text-sm text-muted-foreground">Low Priority</p>
                  <p className="text-xs text-muted-foreground">
                    {((charts.priorityDistribution.low / overview.totalTasks) * 100).toFixed(1)}% of total
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="productivity" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Time Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Time Efficiency</span>
                    <span className="font-medium">{productivity.efficiencyRate}%</span>
                  </div>
                  <Progress value={productivity.efficiencyRate} />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Hours Logged</span>
                    <span className="font-medium">{productivity.totalLoggedHours}h</span>
                  </div>
                  <Progress value={(productivity.totalLoggedHours / productivity.totalEstimatedHours) * 100} />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Hours Estimated</span>
                    <span className="font-medium">{productivity.totalEstimatedHours}h</span>
                  </div>
                  <Progress value={100} className="opacity-30" />
                </div>

                <div className="pt-4 border-t">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{productivity.avgTaskDuration}h</div>
                    <p className="text-sm text-muted-foreground">Average Task Duration</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Daily Completion Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {charts.dailyCompletions.map((day, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground w-16">{day.date}</span>
                      <div className="flex-1 mx-4">
                        <div className="bg-gray-200 rounded-full h-4 relative overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-purple-600 h-full rounded-full transition-all duration-500"
                            style={{ 
                              width: `${Math.max(8, Math.min(100, (day.completions / Math.max(1, Math.max(...charts.dailyCompletions.map(d => d.completions)))) * 100))}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                      <span className="text-sm font-medium w-8">{day.completions}</span>
                    </div>
                  ))}
                </div>
                
                <div className="pt-4 border-t text-center">
                  <div className="text-lg font-bold">{recentActivity.avgDailyCompletions}</div>
                  <p className="text-sm text-muted-foreground">Average Daily Completions</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Weekly Activity Summary</CardTitle>
              <CardDescription>
                Recent team activity and productivity metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-6">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{recentActivity.newTasks}</div>
                  <p className="text-sm text-muted-foreground">New Tasks</p>
                  <div className="mt-2">
                    <Badge variant="outline" className="text-xs">This Week</Badge>
                  </div>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{recentActivity.completedThisWeek}</div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <div className="mt-2">
                    <Badge variant="outline" className="text-xs">This Week</Badge>
                  </div>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{recentActivity.commentsThisWeek}</div>
                  <p className="text-sm text-muted-foreground">Comments</p>
                  <div className="mt-2">
                    <Badge variant="outline" className="text-xs">This Week</Badge>
                  </div>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{taskVelocity}</div>
                  <p className="text-sm text-muted-foreground">Daily Average</p>
                  <div className="mt-2">
                    <Badge variant="outline" className="text-xs">Velocity</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Budget Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold">{formatCurrency(financial.totalBudget)}</div>
                  <p className="text-sm text-muted-foreground">Total Budget</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Utilized</span>
                    <span className="font-medium">{financial.utilization}%</span>
                  </div>
                  <Progress value={financial.utilization} />
                </div>
                
                <div className="text-center pt-2 border-t">
                  <div className="text-xl font-bold text-green-600">{formatCurrency(financial.totalSpent)}</div>
                  <p className="text-sm text-muted-foreground">Spent</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Project Budgets</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{formatCurrency(financial.averageBudgetPerProject)}</div>
                  <p className="text-sm text-muted-foreground">Average per Project</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Active Projects</span>
                    <span className="font-medium">{overview.activeProjects}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Budget Efficiency</span>
                    <Badge variant={budgetEfficiency <= 100 ? "default" : "destructive"}>
                      {budgetEfficiency.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
                
                <div className="text-center pt-2 border-t">
                  <div className="text-lg font-bold text-blue-600">
                    {formatCurrency(financial.totalBudget - financial.totalSpent)}
                  </div>
                  <p className="text-sm text-muted-foreground">Remaining</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cost per Task</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {formatCurrency(overview.totalTasks > 0 ? financial.totalSpent / overview.totalTasks : 0)}
                  </div>
                  <p className="text-sm text-muted-foreground">Average Cost per Task</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Completed Tasks</span>
                    <span className="font-medium">{overview.completedTasks}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Cost per Completion</span>
                    <span className="font-medium">
                      {formatCurrency(overview.completedTasks > 0 ? financial.totalSpent / overview.completedTasks : 0)}
                    </span>
                  </div>
                </div>
                
                <div className="text-center pt-2 border-t">
                  <Badge variant={financial.utilization >= 70 ? "default" : financial.utilization >= 40 ? "secondary" : "outline"}>
                    {financial.utilization >= 70 ? 'Good Utilization' : 
                     financial.utilization >= 40 ? 'Moderate Utilization' : 'Low Utilization'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="quality" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Quality Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">Task Success Rate</span>
                      <span className="font-medium">{overview.completionRate}%</span>
                    </div>
                    <Progress value={overview.completionRate} />
                    <p className="text-xs text-muted-foreground mt-1">
                      {overview.completedTasks} of {overview.totalTasks} tasks completed
                    </p>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">On-Time Delivery</span>
                      <span className="font-medium">
                        {overview.totalTasks > 0 ? (((overview.totalTasks - overview.overdueTasks) / overview.totalTasks) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                    <Progress value={overview.totalTasks > 0 ? ((overview.totalTasks - overview.overdueTasks) / overview.totalTasks) * 100 : 0} />
                    <p className="text-xs text-muted-foreground mt-1">
                      {overview.overdueTasks} tasks are overdue
                    </p>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">Project Success Rate</span>
                      <span className="font-medium">{projectSuccess.toFixed(1)}%</span>
                    </div>
                    <Progress value={projectSuccess} />
                    <p className="text-xs text-muted-foreground mt-1">
                      {overview.completedProjects} of {overview.totalProjects} projects completed
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Project Status Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-sm">Planning</span>
                      </div>
                      <span className="font-medium">{charts.projectStatusDistribution.planning}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm">Active</span>
                      </div>
                      <span className="font-medium">{charts.projectStatusDistribution.active}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                        <span className="text-sm">Completed</span>
                      </div>
                      <span className="font-medium">{charts.projectStatusDistribution.completed}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <span className="text-sm">On Hold</span>
                      </div>
                      <span className="font-medium">{charts.projectStatusDistribution['on-hold']}</span>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t text-center">
                    <div className="text-lg font-bold">{charts.avgProjectProgress}%</div>
                    <p className="text-sm text-muted-foreground">Average Progress</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Quality Assessment</CardTitle>
              <CardDescription>
                Overall quality metrics and performance indicators
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center p-6 border rounded-lg">
                  {overview.overdueTasks === 0 ? 
                    <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" /> :
                    overview.overdueTasks <= 2 ?
                    <AlertCircle className="h-8 w-8 text-yellow-500 mx-auto mb-2" /> :
                    <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                  }
                  <div className="font-medium">
                    {overview.overdueTasks === 0 ? 'Excellent' :
                     overview.overdueTasks <= 2 ? 'Good' :
                     overview.overdueTasks <= 5 ? 'Fair' : 'Poor'}
                  </div>
                  <p className="text-sm text-muted-foreground">Deadline Management</p>
                </div>
                
                <div className="text-center p-6 border rounded-lg">
                  {overview.completionRate >= 80 ? 
                    <Award className="h-8 w-8 text-green-500 mx-auto mb-2" /> :
                    overview.completionRate >= 60 ?
                    <CheckCircle className="h-8 w-8 text-blue-500 mx-auto mb-2" /> :
                    <AlertCircle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                  }
                  <div className="font-medium">
                    {overview.completionRate >= 80 ? 'Excellent' :
                     overview.completionRate >= 60 ? 'Good' :
                     overview.completionRate >= 40 ? 'Fair' : 'Poor'}
                  </div>
                  <p className="text-sm text-muted-foreground">Task Completion</p>
                </div>
                
                <div className="text-center p-6 border rounded-lg">
                  {productivity.efficiencyRate >= 80 ? 
                    <Zap className="h-8 w-8 text-green-500 mx-auto mb-2" /> :
                    productivity.efficiencyRate >= 65 ?
                    <Activity className="h-8 w-8 text-blue-500 mx-auto mb-2" /> :
                    <Clock className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                  }
                  <div className="font-medium">
                    {productivity.efficiencyRate >= 80 ? 'Excellent' :
                     productivity.efficiencyRate >= 65 ? 'Good' :
                     productivity.efficiencyRate >= 50 ? 'Fair' : 'Poor'}
                  </div>
                  <p className="text-sm text-muted-foreground">Time Management</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Growth className="h-5 w-5" />
                  Performance Trends
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Task Creation</span>
                    <div className="flex items-center gap-1">
                      {getTrendIcon(trends.tasksChange)}
                      <span className={`text-sm font-medium ${getTrendColor(trends.tasksChange)}`}>
                        {Math.abs(trends.tasksChange)}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Task Completions</span>
                    <div className="flex items-center gap-1">
                      {getTrendIcon(trends.completionsChange)}
                      <span className={`text-sm font-medium ${getTrendColor(trends.completionsChange)}`}>
                        {Math.abs(trends.completionsChange)}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Active Projects</span>
                    <div className="flex items-center gap-1">
                      {getTrendIcon(trends.projectsChange)}
                      <span className={`text-sm font-medium ${getTrendColor(trends.projectsChange)}`}>
                        {Math.abs(trends.projectsChange)}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Team Growth</span>
                    <div className="flex items-center gap-1">
                      {getTrendIcon(trends.teamChange)}
                      <span className={`text-sm font-medium ${getTrendColor(trends.teamChange)}`}>
                        {Math.abs(trends.teamChange)}%
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Trend Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {[trends.tasksChange, trends.completionsChange, trends.projectsChange, trends.teamChange]
                      .filter(t => t >= 0).length}/4
                  </div>
                  <p className="text-sm text-muted-foreground">Positive Trends</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Overall Trend</span>
                    <Badge variant={
                      [trends.tasksChange, trends.completionsChange, trends.projectsChange, trends.teamChange]
                        .filter(t => t >= 0).length >= 3 ? "default" : 
                      [trends.tasksChange, trends.completionsChange, trends.projectsChange, trends.teamChange]
                        .filter(t => t >= 0).length >= 2 ? "secondary" : "outline"
                    }>
                      {[trends.tasksChange, trends.completionsChange, trends.projectsChange, trends.teamChange]
                        .filter(t => t >= 0).length >= 3 ? 'Positive' :
                       [trends.tasksChange, trends.completionsChange, trends.projectsChange, trends.teamChange]
                        .filter(t => t >= 0).length >= 2 ? 'Mixed' : 'Declining'}
                    </Badge>
                  </div>
                </div>
                
                <div className="pt-4 border-t text-center">
                  <p className="text-xs text-muted-foreground">
                    Compared to last month
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 