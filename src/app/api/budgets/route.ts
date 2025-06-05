import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/lib/db";
import { budget, project } from "@/lib/db/schema";
import { requireAuth, AuthenticatedUser } from "@/lib/auth/auth-middleware";
import { validateRequestBody, createBudgetSchema } from "@/lib/validation";
import { eq } from 'drizzle-orm';

// POST /api/budgets - Create a new budget
export const POST = requireAuth(async (request: NextRequest, user: AuthenticatedUser) => {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = validateRequestBody(createBudgetSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { projectId, totalBudget, currency } = validation.data;

    const newBudget = await db.insert(budget).values({
      projectId,
      totalBudget,
      spentAmount: 0,
      currency: currency || 'USD',
      createdById: user.id,
    }).returning();

    return NextResponse.json(newBudget[0], { status: 201 });
  } catch (error) {
    console.error('Error creating budget:', error);
    return NextResponse.json({ error: 'Failed to create budget' }, { status: 500 });
  }
});

export async function GET(request: NextRequest) {
  return requireAuth(request, async (user) => {
    try {
      // Get all budgets with their associated project information
      const budgets = await db
        .select({
          id: budget.id,
          name: project.name,
          allocated: budget.totalBudget,
          spent: budget.spentAmount,
          currency: budget.currency,
          projectId: budget.projectId,
          createdAt: budget.createdAt,
          updatedAt: budget.updatedAt,
        })
        .from(budget)
        .leftJoin(project, eq(budget.projectId, project.id))
        .orderBy(budget.createdAt);

      // Calculate remaining and status for each budget
      const budgetsWithCalculations = budgets.map(b => {
        const remaining = b.allocated - b.spent;
        const utilizationPercent = b.allocated > 0 ? (b.spent / b.allocated) * 100 : 0;
        
        let status = 'on-track';
        if (b.spent > b.allocated) {
          status = 'over-budget';
        } else if (utilizationPercent < 50) {
          status = 'under-budget';
        } else if (utilizationPercent > 90) {
          status = 'at-risk';
        }

        return {
          id: b.id,
          name: b.name,
          projectId: b.projectId,
          currency: b.currency,
          createdAt: b.createdAt,
          updatedAt: b.updatedAt,
          // Convert from cents to dollars for display
          allocated: b.allocated / 100,
          spent: b.spent / 100,
          remaining: remaining / 100,
          status,
          utilizationPercent: Math.round(utilizationPercent),
        };
      });

      return NextResponse.json(budgetsWithCalculations);
    } catch (error) {
      console.error('Error fetching budgets:', error);
      return NextResponse.json(
        { error: 'Failed to fetch budgets' },
        { status: 500 }
      );
    }
  });
} 