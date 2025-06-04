import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/lib/db";
import { task, project, projectMember, budget, budgetEntry } from "@/lib/db/schema";
import { eq, sum, count, sql } from "drizzle-orm";
import { requireAuth, AuthenticatedUser } from "@/lib/auth-middleware";

// Hourly rates for budget calculations
const HOURLY_RATES = {
  'URGENT': 120,
  'HIGH': 100,
  'MEDIUM': 80,
  'LOW': 60
};

const OPERATIONAL_COSTS = {
  infrastructure: 500,
  tools: 300,
  overhead: 0.15
};

// GET /api/analytics/budget - Get budget analytics
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
        totalBudget: 0,
        totalSpent: 0,
        budgetUtilization: 0,
        remainingBudget: 0,
        projectBreakdown: [],
        monthlyTrends: []
      });
    }

    // Get budgets for user's projects
    const projectBudgets = await db
      .select({
        projectId: budget.projectId,
        projectName: project.name,
        totalBudget: budget.totalBudget,
        spentAmount: budget.spentAmount,
        currency: budget.currency
      })
      .from(budget)
      .leftJoin(project, eq(budget.projectId, project.id))
      .where(sql`${budget.projectId} IN ${projectIds}`);

    // Calculate totals (amounts are in cents, so convert to dollars)
    const totalBudgetCents = projectBudgets.reduce((sum, p) => sum + p.totalBudget, 0);
    const totalSpentCents = projectBudgets.reduce((sum, p) => sum + p.spentAmount, 0);

    const totalBudget = totalBudgetCents / 100;
    const totalSpent = totalSpentCents / 100;
    const budgetUtilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
    const remainingBudget = totalBudget - totalSpent;

    // Get budget entries for monthly trends (last 6 months)
    const monthlyTrends = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const monthlyEntries = await db
        .select({
          amount: budgetEntry.amount
        })
        .from(budgetEntry)
        .leftJoin(budget, eq(budgetEntry.budgetId, budget.id))
        .where(sql`
          ${budget.projectId} IN ${projectIds} 
          AND ${budgetEntry.createdAt} >= ${monthStart.toISOString()}
          AND ${budgetEntry.createdAt} <= ${monthEnd.toISOString()}
        `);

      const monthlySpent = monthlyEntries.reduce((sum, entry) => sum + entry.amount, 0) / 100;

      monthlyTrends.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        spent: Math.round(monthlySpent),
        entries: monthlyEntries.length
      });
    }

    // Project breakdown
    const projectBreakdown = projectBudgets.map(p => ({
      projectName: p.projectName,
      totalBudget: p.totalBudget / 100,
      spentAmount: p.spentAmount / 100,
      utilization: p.totalBudget > 0 ? Math.round((p.spentAmount / p.totalBudget) * 100) : 0,
      remainingBudget: (p.totalBudget - p.spentAmount) / 100,
      currency: p.currency
    }));

    return NextResponse.json({
      totalBudget: Math.round(totalBudget),
      totalSpent: Math.round(totalSpent),
      budgetUtilization: Math.round(budgetUtilization),
      remainingBudget: Math.round(remainingBudget),
      projectBreakdown,
      monthlyTrends
    });
  } catch (error) {
    console.error('Error fetching budget analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch budget analytics' }, { status: 500 });
  }
}); 