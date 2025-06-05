import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/lib/db";
import { budget, project, projectMember } from "@/lib/db/schema";
import { requireAuth, AuthenticatedUser } from "@/lib/auth/auth-middleware";
import { validateRequestBody, createBudgetSchema } from "@/lib/validation";
import { eq, and, inArray } from 'drizzle-orm';

// POST /api/budgets - Create a new budget
export const POST = requireAuth(async (request: NextRequest, user: AuthenticatedUser) => {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = validateRequestBody(createBudgetSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { 
      projectId, 
      name, 
      description, 
      totalBudget, 
      currency, 
      startDate, 
      endDate, 
      imageBase64, 
      imageType 
    } = validation.data;

    // Check if user has access to the project
    const memberResult = await db
      .select()
      .from(projectMember)
      .where(
        and(
          eq(projectMember.projectId, projectId),
          eq(projectMember.userId, user.id)
        )
      );

    if (memberResult.length === 0) {
      return NextResponse.json({ error: 'You do not have access to this project' }, { status: 403 });
    }

    // Check if budget already exists for this project
    const existingBudget = await db
      .select()
      .from(budget)
      .where(eq(budget.projectId, projectId))
      .limit(1);

    if (existingBudget.length > 0) {
      return NextResponse.json({ 
        error: 'A budget already exists for this project' 
      }, { status: 409 });
    }

    // Ensure totalBudget is a number and is valid
    if (typeof totalBudget !== 'number' || isNaN(totalBudget) || totalBudget < 0) {
      return NextResponse.json({ error: 'Invalid budget amount' }, { status: 400 });
    }

    // Prepare budget data with all fields
    const budgetData = {
      projectId,
      name, // Name is now required
      totalBudget,
      spentAmount: 0,
      currency: currency || 'USD',
      createdById: user.id,
      description: description || null,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      imageBase64: imageBase64 || null,
      imageType: imageType || null
    };

    // Insert the budget with all fields
    const newBudget = await db.insert(budget).values(budgetData).returning();

    // Convert from cents to dollars for response
    const result = {
      ...newBudget[0],
      totalBudget: newBudget[0].totalBudget / 100,
      spentAmount: 0,
    };

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error creating budget:', error);
    return NextResponse.json({ error: 'Failed to create budget' }, { status: 500 });
  }
});

export async function GET(request: NextRequest) {
  return requireAuth(request, async (user) => {
    try {
      // First, get all projects the user is a member of
      const userProjects = await db
        .select({
          projectId: projectMember.projectId
        })
        .from(projectMember)
        .where(eq(projectMember.userId, user.id));

      const projectIds = userProjects.map(p => p.projectId);

      // If user isn't a member of any projects, return empty array
      if (projectIds.length === 0) {
        return NextResponse.json([]);
      }

      // Get all budgets with their associated project information
      // Only for projects the user is a member of
      const budgets = await db
        .select({
          id: budget.id,
          name: budget.name, 
          projectName: project.name,
          allocated: budget.totalBudget,
          spent: budget.spentAmount,
          currency: budget.currency,
          projectId: budget.projectId,
          createdAt: budget.createdAt,
          updatedAt: budget.updatedAt,
        })
        .from(budget)
        .leftJoin(project, eq(budget.projectId, project.id))
        .where(
          inArray(budget.projectId, projectIds)
        )
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
          projectName: b.projectName,
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