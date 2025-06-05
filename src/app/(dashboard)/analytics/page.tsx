'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Activity, 
  Users, 
  TrendingUp, 
  CheckCircle,
  Clock,
  DollarSign,
  FolderOpen,
  AlertTriangle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface AnalyticsData {
  overview: {
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    totalProjects: number;
    totalComments: number;
    completionRate: number;
  };
  budget: {
    totalBudget: number;
    totalSpent: number;
    budgetUtilization: number;
    remainingBudget: number;
  };
  upcomingDeadlines: Array<{
    id: string;
    title: string;
    dueDate: string;
    projectName: string;
  }>;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        // Fetch overview data
        const overviewResponse = await fetch('/api/analytics/overview');
        if (!overviewResponse.ok) {
          throw new Error('Failed to fetch overview data');
        }
        const overviewData = await overviewResponse.json();

        // Fetch budget data
        const budgetResponse = await fetch('/api/analytics/budget');
        if (!budgetResponse.ok) {
          throw new Error('Failed to fetch budget data');
        }
        const budgetData = await budgetResponse.json();

        // Handle case where user has no projects
        if (overviewData.totalProjects === 0) {
          setError('no-projects');
          return;
        }

        setAnalytics({
          overview: {
            totalTasks: overviewData.totalTasks,
            completedTasks: overviewData.completedTasks,
            pendingTasks: overviewData.pendingTasks,
            totalProjects: overviewData.totalProjects,
            totalComments: overviewData.totalComments,
            completionRate: overviewData.completionRate,
          },
          budget: {
            totalBudget: budgetData.totalBudget,
            totalSpent: budgetData.totalSpent,
            budgetUtilization: budgetData.budgetUtilization,
            remainingBudget: budgetData.remainingBudget,
          },
          upcomingDeadlines: overviewData.upcomingDeadlines || [],
        });
      } catch (err) {
        console.error('Analytics fetch error:', err);
        setError('Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-muted rounded w-20"></div>
                <div className="h-4 w-4 bg-muted rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-16 mb-2"></div>
                <div className="h-3 bg-muted rounded w-24"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error === 'no-projects') {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
        </div>
        <Card className="max-w-md mx-auto mt-8">
          <CardHeader className="text-center">
            <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <CardTitle>No Projects Found</CardTitle>
            <CardDescription>
              Create your first project to start seeing analytics data.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild>
              <Link href="/projects/new">Create Project</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
        </div>
        <Card className="max-w-md mx-auto mt-8">
          <CardHeader className="text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <CardTitle>Error Loading Analytics</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.totalTasks}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.overview.completedTasks} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.completionRate}%</div>
            <p className="text-xs text-muted-foreground">
              {analytics.overview.pendingTasks} tasks remaining
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.totalProjects}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.overview.totalComments} comments total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Usage</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.budget.budgetUtilization}%</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(analytics.budget.remainingBudget)} remaining
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Budget Overview */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Budget Overview</CardTitle>
            <CardDescription>Project budget allocation and spending</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Budget</span>
              <span className="font-medium">{formatCurrency(analytics.budget.totalBudget)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Amount Spent</span>
              <span className="font-medium">{formatCurrency(analytics.budget.totalSpent)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Remaining</span>
              <span className="font-medium text-green-600">
                {formatCurrency(analytics.budget.remainingBudget)}
              </span>
            </div>
            <div className="pt-2">
              <div className="flex justify-between text-sm mb-1">
                <span>Usage</span>
                <span>{analytics.budget.budgetUtilization}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${Math.min(analytics.budget.budgetUtilization, 100)}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Deadlines */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Deadlines</CardTitle>
            <CardDescription>Tasks with approaching due dates</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.upcomingDeadlines.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming deadlines</p>
            ) : (
              <div className="space-y-3">
                {analytics.upcomingDeadlines.slice(0, 5).map((task) => (
                  <div key={task.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{task.title}</p>
                      <p className="text-xs text-muted-foreground">{task.projectName}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      {new Date(task.dueDate).toLocaleDateString()}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 