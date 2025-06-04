"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Bell, Calendar, CheckCircle, Clock, ArrowRight, BarChart3, Target, FileText, TrendingUp, TrendingDown, Users, Folder, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface Task {
	id: string;
	title: string;
	description: string;
	status: 'todo' | 'in-progress' | 'in-review' | 'completed';
	priority: 'low' | 'medium' | 'high' | 'urgent';
	dueDate?: string;
	assignedBy: string;
	assignedByAvatar: string;
	project: string;
	projectId: string;
}

interface Project {
	id: string;
	name: string;
	description: string;
	status: 'planning' | 'active' | 'on-hold' | 'completed';
	priority: 'low' | 'medium' | 'high';
	progress: number;
	startDate: string;
	endDate?: string;
	budget: number;
	spent: number;
	teamSize: number;
	tags: string[];
}

interface DashboardStats {
	totalProjects: number;
	activeProjects: number;
	completedProjects: number;
	totalTasks: number;
	completedTasks: number;
	inProgressTasks: number;
	overdueTasks: number;
	totalBudget: number;
	spentBudget: number;
}

function getPriorityColor(priority: string) {
	switch (priority) {
		case 'urgent': return 'bg-red-100 text-red-800';
		case 'high': return 'bg-orange-100 text-orange-800';
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

export default function DashboardPage() {
	const [projects, setProjects] = useState<Project[]>([]);
	const [tasks, setTasks] = useState<Task[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [stats, setStats] = useState<DashboardStats>({
		totalProjects: 0,
		activeProjects: 0,
		completedProjects: 0,
		totalTasks: 0,
		completedTasks: 0,
		inProgressTasks: 0,
		overdueTasks: 0,
		totalBudget: 0,
		spentBudget: 0,
	});

	// Fetch data from APIs
	useEffect(() => {
		async function fetchData() {
			try {
				setLoading(true);
				
				// Fetch both projects and tasks in parallel
				const [projectsResponse, tasksResponse] = await Promise.all([
					fetch('/api/projects'),
					fetch('/api/tasks')
				]);

				if (!projectsResponse.ok || !tasksResponse.ok) {
					throw new Error('Failed to fetch data');
				}

				const projectsData = await projectsResponse.json();
				const tasksData = await tasksResponse.json();

				setProjects(projectsData);
				setTasks(tasksData);

				// Calculate statistics
				const totalProjects = projectsData.length;
				const activeProjects = projectsData.filter((p: Project) => p.status === 'active').length;
				const completedProjects = projectsData.filter((p: Project) => p.status === 'completed').length;
				const totalTasks = tasksData.length;
				const completedTasks = tasksData.filter((t: Task) => t.status === 'completed').length;
				const inProgressTasks = tasksData.filter((t: Task) => t.status === 'in-progress').length;
				const overdueTasks = tasksData.filter((t: Task) => {
					if (!t.dueDate) return false;
					return new Date(t.dueDate) < new Date() && t.status !== 'completed';
				}).length;
				const totalBudget = projectsData.reduce((sum: number, p: Project) => sum + p.budget, 0);
				const spentBudget = projectsData.reduce((sum: number, p: Project) => sum + p.spent, 0);

				setStats({
					totalProjects,
					activeProjects,
					completedProjects,
					totalTasks,
					completedTasks,
					inProgressTasks,
					overdueTasks,
					totalBudget,
					spentBudget,
				});

			} catch (err) {
				setError(err instanceof Error ? err.message : 'An error occurred');
			} finally {
				setLoading(false);
			}
		}

		fetchData();
	}, []);

	// Get upcoming tasks (next 5 due tasks)
	const upcomingTasks = tasks
		.filter(task => task.dueDate && task.status !== 'completed')
		.sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
		.slice(0, 5);

	// Get active projects with progress
	const activeProjectsWithProgress = projects
		.filter(project => project.status === 'active')
		.slice(0, 3);

	const kpiData = [
		{
			title: "Active Projects",
			value: stats.activeProjects.toString(),
			change: stats.totalProjects > 0 ? `${Math.round((stats.activeProjects / stats.totalProjects) * 100)}%` : "0%",
			trend: "up",
			icon: Folder,
			description: "Projects in progress"
		},
		{
			title: "Tasks Completed",
			value: stats.totalTasks > 0 ? `${Math.round((stats.completedTasks / stats.totalTasks) * 100)}%` : "0%",
			change: `${stats.completedTasks}/${stats.totalTasks}`,
			trend: "up",
			icon: CheckCircle,
			description: "Task completion rate"
		},
		{
			title: "Budget Utilized",
			value: stats.totalBudget > 0 ? `${Math.round((stats.spentBudget / stats.totalBudget) * 100)}%` : "0%",
			change: formatCurrency(stats.spentBudget),
			trend: stats.spentBudget > stats.totalBudget * 0.8 ? "down" : "up",
			icon: BarChart3,
			description: "Of allocated budget"
		},
		{
			title: "Overdue Tasks",
			value: stats.overdueTasks.toString(),
			change: stats.totalTasks > 0 ? `${Math.round((stats.overdueTasks / stats.totalTasks) * 100)}%` : "0%",
			trend: stats.overdueTasks > 0 ? "down" : "up",
			icon: AlertTriangle,
			description: "Need attention"
		}
	];

	if (loading) {
		return (
			<div className="space-y-6">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
						<p className="text-muted-foreground">Loading your dashboard...</p>
					</div>
				</div>
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
					{[1, 2, 3, 4].map((i) => (
						<Card key={i} className="animate-pulse">
							<CardHeader className="space-y-0 pb-2">
								<div className="h-4 bg-gray-200 rounded w-3/4"></div>
							</CardHeader>
							<CardContent>
								<div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
								<div className="h-3 bg-gray-200 rounded w-full"></div>
							</CardContent>
						</Card>
					))}
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="space-y-6">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
						<p className="text-red-600">Error loading dashboard: {error}</p>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
					<p className="text-muted-foreground">
						Welcome back! Here's what's happening with your projects.
					</p>
				</div>
				<div className="flex items-center space-x-2">
					<Button variant="outline">
						<Bell className="mr-2 h-4 w-4" />
						Notifications
					</Button>
					<Link href="/projects">
						<Button>
							<Plus className="mr-2 h-4 w-4" />
							New Project
						</Button>
					</Link>
				</div>
			</div>

			{/* KPI Cards */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				{kpiData.map((kpi) => (
					<Card key={kpi.title}>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
							<kpi.icon className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">{kpi.value}</div>
							<div className="flex items-center space-x-1">
								{kpi.trend === 'up' ? (
									<TrendingUp className="h-4 w-4 text-green-600" />
								) : (
									<TrendingDown className="h-4 w-4 text-red-600" />
								)}
								<p className={`text-xs ${kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
									{kpi.change} {kpi.description}
								</p>
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				{/* Project Progress */}
				<Card className="lg:col-span-2">
					<CardHeader>
						<div className="flex items-center justify-between">
							<div>
								<CardTitle>Active Projects</CardTitle>
								<CardDescription>Track your project progress</CardDescription>
							</div>
							<Link href="/projects">
								<Button variant="outline" size="sm">
									View All
									<ArrowRight className="ml-2 h-4 w-4" />
								</Button>
							</Link>
						</div>
					</CardHeader>
					<CardContent className="space-y-4">
						{activeProjectsWithProgress.length === 0 ? (
							<div className="text-center py-8 text-muted-foreground">
								<Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
								<p>No active projects yet</p>
								<Link href="/projects">
									<Button variant="outline" size="sm" className="mt-2">
										<Plus className="mr-2 h-4 w-4" />
										Create Project
									</Button>
								</Link>
							</div>
						) : (
							activeProjectsWithProgress.map((project) => (
								<div key={project.id} className="space-y-2">
									<div className="flex items-center justify-between">
										<div className="space-y-1">
											<h3 className="font-medium">{project.name}</h3>
											<div className="flex items-center space-x-2 text-sm text-muted-foreground">
												<Calendar className="h-3 w-3" />
												<span>
													{project.endDate 
														? `Due ${new Date(project.endDate).toLocaleDateString()}`
														: 'No due date'
													}
												</span>
												<span>•</span>
												<Users className="h-3 w-3" />
												<span>{project.teamSize} members</span>
											</div>
										</div>
										<Badge className={getStatusColor(project.status)}>
											{project.status.replace('-', ' ')}
										</Badge>
									</div>
									<div className="space-y-1">
										<div className="flex items-center justify-between text-sm">
											<span>Progress</span>
											<span>{project.progress}%</span>
										</div>
										<Progress value={project.progress} />
									</div>
								</div>
							))
						)}
					</CardContent>
				</Card>

				{/* Upcoming Tasks */}
				<Card>
					<CardHeader>
						<CardTitle>Upcoming Tasks</CardTitle>
						<CardDescription>Your next priorities</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						{upcomingTasks.length === 0 ? (
							<div className="text-center py-4 text-muted-foreground">
								<CheckCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
								<p className="text-sm">No upcoming tasks</p>
								<Link href="/my-tasks">
									<Button variant="outline" size="sm" className="mt-2">
										<Plus className="mr-2 h-4 w-4" />
										View Tasks
									</Button>
								</Link>
							</div>
						) : (
							<>
								{upcomingTasks.map((task) => (
									<div key={task.id} className="space-y-2">
										<div className="flex items-start justify-between">
											<div className="space-y-1">
												<h4 className="font-medium text-sm">{task.title}</h4>
												<p className="text-xs text-muted-foreground">{task.project}</p>
											</div>
											<Badge className={getPriorityColor(task.priority)} variant="outline">
												{task.priority}
											</Badge>
										</div>
										<div className="flex items-center space-x-2 text-xs text-muted-foreground">
											<Clock className="h-3 w-3" />
											<span>Due {new Date(task.dueDate!).toLocaleDateString()}</span>
											<span>•</span>
											<span>{task.assignedBy}</span>
										</div>
									</div>
								))}
								<Link href="/my-tasks">
									<Button variant="outline" size="sm" className="w-full">
										<ArrowRight className="mr-2 h-4 w-4" />
										View All Tasks
									</Button>
								</Link>
							</>
						)}
					</CardContent>
				</Card>

				{/* Quick Actions */}
				<Card className="lg:col-span-2">
					<CardHeader>
						<CardTitle>Quick Actions</CardTitle>
						<CardDescription>Frequently used features</CardDescription>
					</CardHeader>
					<CardContent className="grid grid-cols-2 gap-2">
						<Link href="/projects">
							<Button variant="outline" className="w-full justify-start">
								<Plus className="mr-2 h-4 w-4" />
								Create Project
							</Button>
						</Link>
						<Link href="/my-tasks">
							<Button variant="outline" className="w-full justify-start">
								<CheckCircle className="mr-2 h-4 w-4" />
								View Tasks
							</Button>
						</Link>
						<Link href="/analytics">
							<Button variant="outline" className="w-full justify-start">
								<BarChart3 className="mr-2 h-4 w-4" />
								Analytics
							</Button>
						</Link>
						<Link href="/settings">
							<Button variant="outline" className="w-full justify-start">
								<FileText className="mr-2 h-4 w-4" />
								Settings
							</Button>
						</Link>
					</CardContent>
				</Card>

				{/* Budget Overview */}
				<Card>
					<CardHeader>
						<CardTitle>Budget Overview</CardTitle>
						<CardDescription>Financial summary</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<div className="flex items-center justify-between text-sm">
								<span>Total Budget</span>
								<span className="font-medium">{formatCurrency(stats.totalBudget)}</span>
							</div>
							<div className="flex items-center justify-between text-sm">
								<span>Spent</span>
								<span className="font-medium">{formatCurrency(stats.spentBudget)}</span>
							</div>
							<div className="flex items-center justify-between text-sm">
								<span>Remaining</span>
								<span className="font-medium">{formatCurrency(stats.totalBudget - stats.spentBudget)}</span>
							</div>
							{stats.totalBudget > 0 && (
								<div className="space-y-1">
									<div className="flex items-center justify-between text-sm">
										<span>Utilization</span>
										<span>{Math.round((stats.spentBudget / stats.totalBudget) * 100)}%</span>
									</div>
									<Progress value={(stats.spentBudget / stats.totalBudget) * 100} />
								</div>
							)}
						</div>
						<Link href="/budgets">
							<Button variant="outline" size="sm" className="w-full">
								<BarChart3 className="mr-2 h-4 w-4" />
								View Budgets
							</Button>
						</Link>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}