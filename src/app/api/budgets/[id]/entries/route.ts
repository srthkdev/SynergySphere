import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/lib/db";
import { budgetEntry } from "@/lib/db/schema";
import { requireAuth, AuthenticatedUser } from "@/lib/auth/auth-middleware";
import { eq } from "drizzle-orm";

// GET /api/budgets/[id]/entries - Get budget entries for a budget
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requireAuth(request, async (user: AuthenticatedUser) => {
    try {
      const { id: budgetId } = await params;

      const entries = await db
        .select()
        .from(budgetEntry)
        .where(eq(budgetEntry.budgetId, budgetId))
        .orderBy(budgetEntry.createdAt);

      return NextResponse.json(entries);
    } catch (error) {
      console.error('Error fetching budget entries:', error);
      return NextResponse.json({ error: 'Failed to fetch budget entries' }, { status: 500 });
    }
  });
} 