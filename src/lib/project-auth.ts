import { db } from "@/lib/db";
import { project, projectMember } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { AuthenticatedUser } from "./auth-middleware";

export async function canAccessProject(userId: string, projectId: string): Promise<boolean> {
  try {
    const [membership] = await db
      .select()
      .from(projectMember)
      .where(
        and(
          eq(projectMember.userId, userId),
          eq(projectMember.projectId, projectId)
        )
      )
      .limit(1);

    return !!membership;
  } catch (error) {
    console.error("Error checking project access:", error);
    return false;
  }
}

export async function canModifyProject(userId: string, projectId: string): Promise<boolean> {
  try {
    const [membership] = await db
      .select()
      .from(projectMember)
      .where(
        and(
          eq(projectMember.userId, userId),
          eq(projectMember.projectId, projectId)
        )
      )
      .limit(1);

    // Only owners and admins can modify projects
    return membership && (membership.role === 'owner' || membership.role === 'admin');
  } catch (error) {
    console.error("Error checking project modification rights:", error);
    return false;
  }
}

export async function getUserProjects(userId: string) {
  try {
    const projects = await db
      .select({
        id: project.id,
        name: project.name,
        description: project.description,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        createdById: project.createdById,
        role: projectMember.role,
        joinedAt: projectMember.joinedAt,
      })
      .from(project)
      .innerJoin(projectMember, eq(project.id, projectMember.projectId))
      .where(eq(projectMember.userId, userId))
      .orderBy(project.createdAt);

    return projects;
  } catch (error) {
    console.error("Error fetching user projects:", error);
    return [];
  }
}

export async function getProjectTasks(userId: string, projectId: string) {
  // First check if user has access to the project
  const hasAccess = await canAccessProject(userId, projectId);
  if (!hasAccess) {
    return null;
  }

  try {
    const tasks = await db
      .select()
      .from(project)
      .where(eq(project.id, projectId));
    
    return tasks;
  } catch (error) {
    console.error("Error fetching project tasks:", error);
    return null;
  }
} 