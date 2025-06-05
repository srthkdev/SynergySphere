import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/lib/db";
import { budget, budgetEntry } from "@/lib/db/schema";
import { requireAuth, AuthenticatedUser } from "@/lib/auth/auth-middleware";
import { eq, sum } from "drizzle-orm";

// GET /api/budgets/[id] - Get a single budget by ID
export async function GET(
  request: NextRequest, 
  {params}: { params: Promise<{ id: string }> }
) {
  // Access id from context instead of params directly
  const { id } = await params;
  
  return requireAuth(request, async (user: AuthenticatedUser) => {
    try {
      const budgetId = id;
      
      // Get the budget details
      const budgetResult = await db
        .select()
        .from(budget)
        .where(eq(budget.id, budgetId))
        .limit(1);
      
      if (budgetResult.length === 0) {
        return NextResponse.json({ error: 'Budget not found' }, { status: 404 });
      }
      
      const budgetData = budgetResult[0];
      
      // Calculate total spent amount and remaining
      const spentResult = await db
        .select({ total: sum(budgetEntry.amount) })
        .from(budgetEntry)
        .where(eq(budgetEntry.budgetId, budgetId));

      const spentAmount = Number(spentResult[0]?.total || 0);
      
      // Determine budget status
      let status = 'on-track';
      if (spentAmount > budgetData.totalBudget) {
        status = 'over-budget';
      } else if (spentAmount < budgetData.totalBudget * 0.25) {
        status = 'under-budget';
      } else if (spentAmount > budgetData.totalBudget * 0.9) {
        status = 'at-risk';
      }
      
      // Format budget data for response
      const formattedBudget = {
        ...budgetData,
        totalBudget: budgetData.totalBudget / 100, // Convert from cents to dollars
        spentAmount: spentAmount / 100, // Convert from cents to dollars
        remaining: (budgetData.totalBudget - spentAmount) / 100, // Calculate remaining amount
        status,
      };
      
      return NextResponse.json(formattedBudget);
    } catch (error) {
      console.error('Error fetching budget:', error);
      return NextResponse.json(
        { error: 'Failed to fetch budget' },
        { status: 500 }
      );
    }
  });
} 