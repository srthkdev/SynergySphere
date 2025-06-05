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

      const projectBudget = await db
        .select()
        .from(budget)
        .where(eq(budget.projectId, projectId))
        .limit(1);

      if (!projectBudget.length) {
        return NextResponse.json({ error: 'Budget not found' }, { status: 404 });
      }

      return NextResponse.json(projectBudget[0]);
    } catch (error) {
      console.error('Error fetching project budget:', error);
      return NextResponse.json({ error: 'Failed to fetch project budget' }, { status: 500 });
    }
  });
} 