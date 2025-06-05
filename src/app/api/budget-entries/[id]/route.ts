import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/lib/db";
import { budgetEntry, budget } from "@/lib/db/schema";
import { requireAuth, AuthenticatedUser } from "@/lib/auth/auth-middleware";
import { eq, sum } from "drizzle-orm";

// DELETE /api/budget-entries/[id] - Delete a budget entry
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return requireAuth(request, async (user: AuthenticatedUser) => {
    try {
      const { id } = params;

      // Get the budget entry to find its budget ID
      const entryResult = await db
        .select({
          budgetId: budgetEntry.budgetId
        })
        .from(budgetEntry)
        .where(eq(budgetEntry.id, id))
        .limit(1);

      if (entryResult.length === 0) {
        return NextResponse.json({ error: 'Budget entry not found' }, { status: 404 });
      }

      const budgetId = entryResult[0].budgetId;

      // Delete the entry
      await db
        .delete(budgetEntry)
        .where(eq(budgetEntry.id, id));

      // Recalculate the budget's spent amount
      const spentResult = await db
        .select({ total: sum(budgetEntry.amount) })
        .from(budgetEntry)
        .where(eq(budgetEntry.budgetId, budgetId));

      const newSpentAmount = Number(spentResult[0]?.total || 0);

      // Update the budget's spent amount
      await db
        .update(budget)
        .set({
          spentAmount: newSpentAmount,
          updatedAt: new Date(),
        })
        .where(eq(budget.id, budgetId));

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Error deleting budget entry:', error);
      return NextResponse.json({ error: 'Failed to delete budget entry' }, { status: 500 });
    }
  });
} 