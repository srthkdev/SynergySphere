"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Folder, User, CalendarClock, Loader2, Search, Image } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CreateProjectDialog } from "@/components/project/create-project-dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchProjects } from "@/lib/queries";
import { Project } from "@/types";
import { Input } from "@/components/ui/input";

export default function DashboardPage() {
	const router = useRouter();
	const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
	const queryClient = useQueryClient();
	const [searchQuery, setSearchQuery] = useState("");

	return (
		<div className="container mx-auto py-8 px-4">
			<div className="flex justify-between items-center mb-6">
				<h1 className="text-2xl font-bold">My Projects</h1>
				<Button 
					onClick={() => setIsCreateProjectOpen(true)}
					className="flex items-center gap-2"
				>
					<PlusCircle className="h-4 w-4" />
					Create Project
				</Button>
			</div>
			
			<div className="mb-6 relative">
				<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
				<Input
					placeholder="Search projects..."
					className="pl-10"
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
				/>
			</div>

			<div className="flex flex-col gap-4">
				<ProjectsGrid searchQuery={searchQuery} />
			</div>

			<CreateProjectDialog 
				open={isCreateProjectOpen} 
				onOpenChange={setIsCreateProjectOpen} 
				onProjectCreated={() => {
					queryClient.invalidateQueries({ queryKey: ['projects'] });
				}}
			/>
		</div>
	);
}

function ProjectsGrid({ searchQuery }: { searchQuery: string }) {
	const { data: projects, isLoading, error } = useQuery<Project[], Error>({
		queryKey: ['projects'], 
		queryFn: fetchProjects,
	});

	if (isLoading) {
		return <ProjectsSkeleton />;
	}
	
	if (error) {
		return <div className="text-center py-8 text-red-500">Error: {error.message}</div>;
	}
	
	if (!projects || projects.length === 0) {
		return <EmptyProjectsState />;
	}
	
	const filteredProjects = projects.filter(project => 
		project.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
		(project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase()))
	);
	
	if (filteredProjects.length === 0) {
		return (
			<div className="text-center py-8 text-muted-foreground">
				No projects match your search
			</div>
		);
	}
	
	return (
		<>
			{filteredProjects.map((project) => (
				<ProjectCard key={project.id} project={project} />
			))}
		</>
	);
}

// Empty state when no projects exist
function EmptyProjectsState() {
	return (
		<div>
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
				{project.imageUrl && (
					<div className="w-full h-40 overflow-hidden">
						<img 
							src={project.imageUrl.startsWith('http') ? project.imageUrl : `${window.location.origin}${project.imageUrl}`} 
							alt={`${project.name} cover`}
							className="w-full h-full object-cover"
							onError={(e) => {
								// If image fails to load, add a placeholder or remove the container
								(e.target as HTMLImageElement).style.display = 'none';
							}}
						/>
					</div>
				)}
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