import db from "@/lib/db";
import { project, projectMember, task } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";


// Check if user can access a project (is a member)
export async function canAccessProject(userId: string, projectId: string): Promise<boolean> {
  try {
    const [member] = await db
      .select()
      .from(projectMember)
      .where(and(eq(projectMember.projectId, projectId), eq(projectMember.userId, userId)));
    return !!member;
  } catch (error) {
    console.error("Error checking project access:", error);
    return false;
  }
}

// Check if user can modify a project (is an owner, admin, or project creator)
export async function canModifyProject(userId: string, projectId: string): Promise<boolean> {
  try {
    // First check if user is the project creator
    const [projectData] = await db
      .select({ createdById: project.createdById })
      .from(project)
      .where(eq(project.id, projectId));
    
    if (projectData && projectData.createdById === userId) {
      return true;
    }

    // Then check if user is owner or admin
    const [member] = await db
      .select()
      .from(projectMember)
      .where(and(
        eq(projectMember.projectId, projectId), 
        eq(projectMember.userId, userId)
      ));
    
    // Allow modification if user is owner or admin
    return !!member && (member.role === 'owner' || member.role === 'admin');
  } catch (error) {
    console.error("Error checking project modification rights:", error);
    return false;
  }
}

// Get all projects a user has access to
export async function getUserProjects(userId: string) {
  try {
    const userProjects = await db
      .select({
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status,
        priority: project.priority,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        role: projectMember.role,
        memberCount: sql<number>`(
          SELECT COUNT(*)::int 
          FROM ${projectMember} pm 
          WHERE pm.project_id = ${project.id}
        )`.as('memberCount'),
      })
      .from(projectMember)
      .innerJoin(project, eq(projectMember.projectId, project.id))
      .where(eq(projectMember.userId, userId))
      .orderBy(project.createdAt);

    return userProjects;
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

// Check if user can delete a task (project admin/owner, project creator, or task creator)
export async function canDeleteTask(userId: string, taskId: string): Promise<boolean> {
  try {
    // Get the task and its project information
    const [taskData] = await db
      .select({
        taskId: task.id,
        taskCreatedById: task.createdById,
        projectId: task.projectId,
        projectCreatedById: project.createdById,
      })
      .from(task)
      .innerJoin(project, eq(task.projectId, project.id))
      .where(eq(task.id, taskId));

    if (!taskData) return false;

    // Check if user is the task creator
    if (taskData.taskCreatedById === userId) return true;

    // Check if user is the project creator
    if (taskData.projectCreatedById === userId) return true;

    // Check if user is project admin or owner
    const [member] = await db
      .select()
      .from(projectMember)
      .where(and(
        eq(projectMember.projectId, taskData.projectId), 
        eq(projectMember.userId, userId)
      ));
    
    return !!member && (member.role === 'owner' || member.role === 'admin');
  } catch (error) {
    console.error("Error checking task deletion rights:", error);
    return false;
  }
} 