import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/lib/db";
import { task, project, comment, projectMember } from "@/lib/db/schema";
import { eq, count, sql } from "drizzle-orm";
import { requireAuth, AuthenticatedUser } from "@/lib/auth/auth-middleware";

// GET /api/analytics/overview - Get overview analytics
export const GET = requireAuth(async (request: NextRequest, user: AuthenticatedUser) => {
  try {
    // Get user's projects
    const userProjects = await db
      .select({ projectId: projectMember.projectId })
      .from(projectMember)
      .where(eq(projectMember.userId, user.id));

    const projectIds = userProjects.map(p => p.projectId);
    
    if (projectIds.length === 0) {
      return NextResponse.json({
        totalProjects: 0,
        totalTasks: 0,
        completedTasks: 0,
        pendingTasks: 0,
        totalComments: 0,
        projectsData: [],
        tasksData: [],
        completionRate: 0,
        upcomingDeadlines: []
      });
    }

    // Get project statistics
    const [projectStats] = await db
      .select({ count: count() })
      .from(project)
      .where(sql`${project.id} IN ${projectIds}`);

    // Get task statistics
    const taskStats = await db
      .select({
        status: task.status,
        count: count()
      })
      .from(task)
      .where(sql`${task.projectId} IN ${projectIds}`)
      .groupBy(task.status);

    // Get total tasks
    const [totalTasksResult] = await db
      .select({ count: count() })
      .from(task)
      .where(sql`${task.projectId} IN ${projectIds}`);

    // Get comments count
    const [commentsResult] = await db
      .select({ count: count() })
      .from(comment)
      .where(sql`${comment.projectId} IN ${projectIds}`);

    // Calculate task statistics
    const completedTasks = taskStats.find(t => t.status === 'DONE')?.count || 0;
    const totalTasks = totalTasksResult?.count || 0;
    const pendingTasks = totalTasks - completedTasks;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Get projects with task counts for charts
    const projectsData = await db
      .select({
        name: project.name,
        taskCount: count(task.id)
      })
      .from(project)
      .leftJoin(task, eq(project.id, task.projectId))
      .where(sql`${project.id} IN ${projectIds}`)
      .groupBy(project.id, project.name);

    // Get task status distribution for charts
    const tasksData = taskStats.map(t => ({
      status: t.status,
      count: t.count
    }));

    // Get upcoming deadlines
    const upcomingTasks = await db
      .select({
        id: task.id,
        title: task.title,
        dueDate: task.dueDate,
        projectName: project.name
      })
      .from(task)
      .leftJoin(project, eq(task.projectId, project.id))
      .where(sql`${task.projectId} IN ${projectIds} AND ${task.dueDate} IS NOT NULL AND ${task.dueDate} > NOW() AND ${task.status} != 'DONE'`)
      .orderBy(task.dueDate)
      .limit(5);

    return NextResponse.json({
      totalProjects: projectStats?.count || 0,
      totalTasks,
      completedTasks,
      pendingTasks,
      totalComments: commentsResult?.count || 0,
      projectsData,
      tasksData,
      completionRate: Math.round(completionRate),
      upcomingDeadlines: upcomingTasks
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}); 