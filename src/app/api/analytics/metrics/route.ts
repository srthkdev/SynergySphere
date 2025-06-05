import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/lib/db";
import { task, project, comment, projectMember, user, budget, budgetEntry } from "@/lib/db/schema";
import { eq, count, sql, and, gte, lte, desc, asc, inArray } from "drizzle-orm";
import { requireAuth, AuthenticatedUser } from "@/lib/auth/auth-middleware";

// GET /api/analytics/metrics - Get comprehensive metrics analytics
export const GET = requireAuth(async (request: NextRequest, user: AuthenticatedUser) => {
  try {
    // Get time range from query params (default to last 30 days)
    const { searchParams } = new URL(request.url);
    const timeRange = parseInt(searchParams.get('days') || '30');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - timeRange);

    // Get user's projects
    const userProjects = await db
      .select({ projectId: projectMember.projectId })
      .from(projectMember)
      .where(eq(projectMember.userId, user.id));

    const projectIds = userProjects.map(p => p.projectId);
    
    if (projectIds.length === 0) {
      return NextResponse.json({
        overview: {
          totalTasks: 0,
          completedTasks: 0,
          inProgressTasks: 0,
          todoTasks: 0,
          totalProjects: 0,
          activeProjects: 0,
          completedProjects: 0,
          teamMembers: 0,
          completionRate: 0,
          productivityRate: 0,
          budgetUtilization: 0,
          overdueTasks: 0,
        },
        trends: {
          tasksChange: 0,
          completionsChange: 0,
          projectsChange: 0,
          teamChange: 0,
        },
        recentActivity: {
          newTasks: 0,
          completedThisWeek: 0,
          commentsThisWeek: 0,
          avgDailyCompletions: 0,
        },
        charts: {
          dailyCompletions: [],
          priorityDistribution: { high: 0, medium: 0, low: 0 },
          projectStatusDistribution: { planning: 0, active: 0, completed: 0, 'on-hold': 0 },
          avgProjectProgress: 0,
        },
        productivity: {
          totalEstimatedHours: 0,
          totalLoggedHours: 0,
          efficiencyRate: 0,
          avgTaskDuration: 0,
        },
        financial: {
          totalBudget: 0,
          totalSpent: 0,
          utilization: 0,
          averageBudgetPerProject: 0,
        }
      });
    }

    // Parallel queries for better performance
    const [
      projectStats,
      taskStats,
      totalTasksResult,
      commentsResult,
      tasksByPriority,
      projectsByStatus,
      recentTasks,
      completedTasks,
      teamMembersResult,
      budgetData,
      overdueTasks,
      weeklyStats
    ] = await Promise.all([
      // Project statistics
      db
        .select({ count: count() })
        .from(project)
        .where(sql`${project.id} IN ${sql.raw(`(${projectIds.map(() => '?').join(',')})`)}`, ...projectIds),

      // Task statistics by status
      db
        .select({
          status: task.status,
          count: count()
        })
        .from(task)
        .where(sql`${task.projectId} IN ${sql.raw(`(${projectIds.map(() => '?').join(',')})`)}`, ...projectIds)
        .groupBy(task.status),

      // Total tasks
      db
        .select({ count: count() })
        .from(task)
        .where(sql`${task.projectId} IN ${sql.raw(`(${projectIds.map(() => '?').join(',')})`)}`, ...projectIds),

      // Comments count
      db
        .select({ count: count() })
        .from(comment)
        .where(sql`${comment.projectId} IN ${sql.raw(`(${projectIds.map(() => '?').join(',')})`)}`, ...projectIds),

      // Tasks by priority
      db
        .select({
          priority: task.priority,
          count: count()
        })
        .from(task)
        .where(sql`${task.projectId} IN ${sql.raw(`(${projectIds.map(() => '?').join(',')})`)}`, ...projectIds)
        .groupBy(task.priority),

      // Projects by status
      db
        .select({
          status: project.status,
          count: count()
        })
        .from(project)
        .where(sql`${project.id} IN ${sql.raw(`(${projectIds.map(() => '?').join(',')})`)}`, ...projectIds)
        .groupBy(project.status),

      // Recent tasks (last 7 days)
      db
        .select({ count: count() })
        .from(task)
        .where(
          and(
            sql`${task.projectId} IN ${sql.raw(`(${projectIds.map(() => '?').join(',')})`)}`, ...projectIds,
            gte(task.createdAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
          )
        ),

      // Completed tasks in date range
      db
        .select({ 
          count: count(),
          date: sql<string>`DATE(${task.updatedAt})`.as('completion_date')
        })
        .from(task)
        .where(
          and(
            sql`${task.projectId} IN ${sql.raw(`(${projectIds.map(() => '?').join(',')})`)}`, ...projectIds,
            eq(task.status, 'DONE'),
            gte(task.updatedAt, startDate)
          )
        )
        .groupBy(sql`DATE(${task.updatedAt})`)
        .orderBy(sql`DATE(${task.updatedAt})`),

      // Team members count
      db
        .select({ count: count() })
        .from(projectMember)
        .where(sql`${projectMember.projectId} IN ${sql.raw(`(${projectIds.map(() => '?').join(',')})`)}`, ...projectIds),

      // Budget data
      db
        .select({
          totalBudget: sql<number>`COALESCE(SUM(${budget.totalBudget}), 0)`.as('total_budget'),
          totalSpent: sql<number>`COALESCE(SUM(${budget.spentAmount}), 0)`.as('total_spent')
        })
        .from(budget)
        .where(sql`${budget.projectId} IN ${sql.raw(`(${projectIds.map(() => '?').join(',')})`)}`, ...projectIds),

      // Overdue tasks
      db
        .select({ count: count() })
        .from(task)
        .where(
          and(
            sql`${task.projectId} IN ${sql.raw(`(${projectIds.map(() => '?').join(',')})`)}`, ...projectIds,
            sql`${task.dueDate} < NOW()`,
            sql`${task.status} != 'DONE'`
          )
        ),

      // Weekly completion stats
      db
        .select({ count: count() })
        .from(task)
        .where(
          and(
            sql`${task.projectId} IN ${sql.raw(`(${projectIds.map(() => '?').join(',')})`)}`, ...projectIds,
            eq(task.status, 'DONE'),
            gte(task.updatedAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
          )
        )
    ]);

    // Process the data
    const totalProjects = projectStats[0]?.count || 0;
    const totalTasks = totalTasksResult[0]?.count || 0;
    const totalComments = commentsResult[0]?.count || 0;
    const teamMembers = teamMembersResult[0]?.count || 0;
    const newTasksThisWeek = recentTasks[0]?.count || 0;
    const completedThisWeek = weeklyStats[0]?.count || 0;
    const overdue = overdueTasks[0]?.count || 0;

    // Task status distribution
    const completedTasksCount = taskStats.find(t => t.status === 'DONE')?.count || 0;
    const inProgressTasksCount = taskStats.find(t => t.status === 'IN_PROGRESS')?.count || 0;
    const todoTasksCount = taskStats.find(t => t.status === 'TODO')?.count || 0;

    // Priority distribution
    const highPriorityCount = tasksByPriority.find(t => t.priority === 'HIGH')?.count || 0;
    const mediumPriorityCount = tasksByPriority.find(t => t.priority === 'MEDIUM')?.count || 0;
    const lowPriorityCount = tasksByPriority.find(t => t.priority === 'LOW')?.count || 0;

    // Project status distribution
    const planningProjectsCount = projectsByStatus.find(p => p.status === 'planning')?.count || 0;
    const activeProjectsCount = projectsByStatus.find(p => p.status === 'active')?.count || 0;
    const completedProjectsCount = projectsByStatus.find(p => p.status === 'completed')?.count || 0;
    const onHoldProjectsCount = projectsByStatus.find(p => p.status === 'on-hold')?.count || 0;

    // Calculate rates and metrics
    const completionRate = totalTasks > 0 ? Math.round((completedTasksCount / totalTasks) * 100) : 0;
    const productivityRate = totalTasks > 0 ? Math.round(((completedTasksCount + inProgressTasksCount) / totalTasks) * 100) : 0;

    // Budget calculations (convert from cents to dollars)
    const totalBudget = Math.round((budgetData[0]?.totalBudget || 0) / 100);
    const totalSpent = Math.round((budgetData[0]?.totalSpent || 0) / 100);
    const budgetUtilization = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
    const averageBudgetPerProject = totalProjects > 0 && totalBudget > 0 ? Math.round(totalBudget / totalProjects) : 0;

    // Daily completions chart data
    const dailyCompletions = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const completions = completedTasks.find(c => c.date === dateStr)?.count || 0;
      dailyCompletions.push({
        date: dateStr,
        completions: Number(completions)
      });
    }

    // Calculate average project progress
    const avgProjectProgress = totalProjects > 0 ? Math.round(
      (activeProjectsCount * 50 + completedProjectsCount * 100 + planningProjectsCount * 10) / totalProjects
    ) : 0;

    // Calculate trends (simplified - you could make this more sophisticated with historical data)
    const avgDailyCompletions = completedThisWeek > 0 ? Math.round(completedThisWeek / 7) : 0;

    // Estimated productivity metrics (based on task completion patterns)
    const totalEstimatedHours = totalTasks * 8; // Assume 8 hours per task
    const totalLoggedHours = completedTasksCount * 6 + inProgressTasksCount * 3; // Weighted by status
    const efficiencyRate = totalEstimatedHours > 0 ? Math.round((totalLoggedHours / totalEstimatedHours) * 100) : 0;
    const avgTaskDuration = completedTasksCount > 0 ? Math.round(totalLoggedHours / completedTasksCount * 10) / 10 : 0;

    return NextResponse.json({
      overview: {
        totalTasks,
        completedTasks: completedTasksCount,
        inProgressTasks: inProgressTasksCount,
        todoTasks: todoTasksCount,
        totalProjects,
        activeProjects: activeProjectsCount,
        completedProjects: completedProjectsCount,
        teamMembers,
        completionRate,
        productivityRate,
        budgetUtilization,
        overdueTasks: overdue,
      },
      trends: {
        tasksChange: Math.round(Math.random() * 20 - 10), // TODO: Calculate from historical data
        completionsChange: completedThisWeek > 0 ? Math.round((completedThisWeek / 7) * 100) / 100 : 0,
        projectsChange: Math.round(Math.random() * 10 - 5), // TODO: Calculate from historical data
        teamChange: 0, // TODO: Calculate from historical data
      },
      recentActivity: {
        newTasks: newTasksThisWeek,
        completedThisWeek,
        commentsThisWeek: totalComments, // TODO: Filter by week
        avgDailyCompletions,
      },
      charts: {
        dailyCompletions,
        priorityDistribution: { 
          high: highPriorityCount, 
          medium: mediumPriorityCount, 
          low: lowPriorityCount 
        },
        projectStatusDistribution: { 
          planning: planningProjectsCount, 
          active: activeProjectsCount, 
          completed: completedProjectsCount, 
          'on-hold': onHoldProjectsCount 
        },
        avgProjectProgress,
      },
      productivity: {
        totalEstimatedHours,
        totalLoggedHours,
        efficiencyRate,
        avgTaskDuration,
      },
      financial: {
        totalBudget,
        totalSpent,
        utilization: budgetUtilization,
        averageBudgetPerProject,
      }
    });

  } catch (error) {
    console.error('Analytics metrics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics metrics' },
      { status: 500 }
    );
  }
}); 