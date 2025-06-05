import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/lib/db";
import { budget } from "@/lib/db/schema";
import { requireAuth, AuthenticatedUser } from "@/lib/auth/auth-middleware";
import { eq } from "drizzle-orm";

// GET /api/projects/[id]/budget - Get budget for a project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requireAuth(request, async (user: AuthenticatedUser) => {
    try {
      const { id: projectId } = await params;

      // Explicitly select all columns to avoid SQL errors
      const projectBudget = await db
        .select({
          id: budget.id,
          projectId: budget.projectId,
          name: budget.name,
          description: budget.description,
          totalBudget: budget.totalBudget,
          spentAmount: budget.spentAmount,
          currency: budget.currency,
          startDate: budget.startDate,
          endDate: budget.endDate,
          imageBase64: budget.imageBase64,
          imageType: budget.imageType,
          createdById: budget.createdById,
          createdAt: budget.createdAt,
          updatedAt: budget.updatedAt
        })
        .from(budget)
        .where(eq(budget.projectId, projectId))
        .limit(1);

      if (!projectBudget.length) {
        return NextResponse.json({ error: 'Budget not found' }, { status: 404 });
      }

      // Convert currency amounts from cents to whole units for the frontend
      const result = {
        ...projectBudget[0],
        totalBudget: projectBudget[0].totalBudget / 100,
        spentAmount: projectBudget[0].spentAmount / 100,
      };

      return NextResponse.json(result);
    } catch (error) {
      console.error('Error fetching project budget:', error);
      return NextResponse.json({ error: 'Failed to fetch project budget' }, { status: 500 });
    }
  });
} 