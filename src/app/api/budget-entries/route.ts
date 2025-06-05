import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/lib/db";
import { budgetEntry, budget } from "@/lib/db/schema";
import { requireAuth, AuthenticatedUser } from "@/lib/auth/auth-middleware";
import { validateRequestBody, createBudgetEntrySchema } from "@/lib/validation";
import { eq, sum } from "drizzle-orm";

// POST /api/budget-entries - Create a new budget entry
export const POST = requireAuth(async (request: NextRequest, user: AuthenticatedUser) => {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = validateRequestBody(createBudgetEntrySchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { budgetId, amount, description, category, taskId } = validation.data;

    // Create the budget entry
    const newEntry = await db.insert(budgetEntry).values({
      budgetId,
      amount,
      description,
      category,
      taskId: taskId || null,
      createdById: user.id,
    }).returning();

    // Calculate the new spent amount
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

    return NextResponse.json(newEntry[0], { status: 201 });
  } catch (error) {
    console.error('Error creating budget entry:', error);
    return NextResponse.json({ error: 'Failed to create budget entry' }, { status: 500 });
  }
}); 