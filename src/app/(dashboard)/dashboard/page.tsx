"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Folder, User, CalendarClock, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Project } from "@/types";

export default function DashboardPage() {
	const router = useRouter();
	const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
	const queryClient = useQueryClient();

	return (
		<div className="container mx-auto py-8 px-4">
			<div className="flex justify-between items-center mb-8">
				<h1 className="text-2xl font-bold">My Projects</h1>
				<Button 
					onClick={() => setIsCreateProjectOpen(true)}
					className="flex items-center gap-2"
				>
					<PlusCircle className="h-4 w-4" />
					Create Project
				</Button>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				<ProjectsGrid />
			</div>

		</div>
	);
}

function ProjectsGrid() {
	const { data: projects, isLoading, error } = useQuery<Project[], Error>({
		queryKey: ['projects'], 
	});

	if (isLoading) {
		return <ProjectsSkeleton />;
	}
	
	if (error) {
		return <div className="col-span-full text-center py-8 text-red-500">Error: {error.message}</div>;
	}
	
	if (!projects || projects.length === 0) {
		return <EmptyProjectsState />;
	}
	
	return (
		<>
			{projects.map((project) => (
				<ProjectCard key={project.id} project={project} />
			))}
		</>
	);
}

// Empty state when no projects exist
function EmptyProjectsState() {
	return (
		<div className="col-span-full">
			<Card className="border-dashed">
				<CardContent className="flex flex-col items-center justify-center pt-10 pb-10">
					<Folder className="h-12 w-12 text-muted-foreground mb-4" />
					<h3 className="text-lg font-medium mb-2">No projects yet</h3>
					<p className="text-center text-muted-foreground mb-6">
						Create your first project to start collaborating with your team.
					</p>
					<Button 
						onClick={() => {
							// Find and click the create project button
							const createProjectButton = document.querySelector('[data-create-project]') as HTMLElement;
							if (createProjectButton) {
								createProjectButton.click();
							}
						}}
						variant="outline"
						className="border-dashed"
					>
						<PlusCircle className="mr-2 h-4 w-4" />
						Create a project
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}

// Loading skeleton for projects
function ProjectsSkeleton() {
	return (
		<>
			{[1, 2, 3].map((i) => (
				<Card key={i} className="border-dashed animate-pulse">
					<CardHeader>
						<div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
						<div className="h-4 bg-muted rounded w-1/2"></div>
					</CardHeader>
					<CardContent>
						<div className="h-4 bg-muted rounded w-full mb-3"></div>
						<div className="h-4 bg-muted rounded w-5/6"></div>
					</CardContent>
					<CardFooter>
						<div className="h-8 bg-muted rounded w-full"></div>
					</CardFooter>
				</Card>
			))}
		</>
	);
}

// Project Card Component
function ProjectCard({ project }: { project: Project }) {
	return (
		<Link href={`/projects/${project.id}`} className="block">
			<Card className="hover:border-primary/50 transition-colors">
				<CardHeader>
					<CardTitle>{project.name}</CardTitle>
					<CardDescription className="line-clamp-1">
						{project.description || "No description provided"}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex items-center text-sm text-muted-foreground gap-4">
						<div className="flex items-center">
							<User className="mr-1 h-4 w-4" />
							{project.memberCount} members
						</div>
						<div className="flex items-center">
							<CalendarClock className="mr-1 h-4 w-4" />
							{new Date(project.createdAt).toLocaleDateString()}
						</div>
					</div>
				</CardContent>
				<CardFooter>
					<Button variant="outline" className="w-full">
						View Project
					</Button>
				</CardFooter>
			</Card>
		</Link>
	);
}