import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/lib/db";
import { budgetEntry, budget, task } from "@/lib/db/schema";
import { requireAuth, AuthenticatedUser } from "@/lib/auth/auth-middleware";
import { validateRequestBody, createBudgetEntrySchema } from "@/lib/validation";
import { eq, sum, desc } from "drizzle-orm";

// GET /api/budget-entries - Get budget entries (filtered by budgetId if provided)
export async function GET(request: NextRequest) {
  return requireAuth(request, async (user: AuthenticatedUser) => {
    try {
      const { searchParams } = new URL(request.url);
      const budgetId = searchParams.get('budgetId');

      if (!budgetId) {
        return NextResponse.json({ error: 'Budget ID is required' }, { status: 400 });
      }

      // Get all entries for the budget with task information
      // Include all fields from budgetEntry table
      const entries = await db
        .select()
        .from(budgetEntry)
        .leftJoin(task, eq(budgetEntry.taskId, task.id))
        .where(eq(budgetEntry.budgetId, budgetId))
        .orderBy(desc(budgetEntry.createdAt));

      // Convert amounts from cents to dollars for the frontend
      const formattedEntries = entries.map(entry => {
        return {
          id: entry.budget_entry.id,
          name: entry.budget_entry.name,
          amount: entry.budget_entry.amount / 100,
          description: entry.budget_entry.description,
          category: entry.budget_entry.category,
          taskId: entry.budget_entry.taskId,
          createdById: entry.budget_entry.createdById,
          createdAt: entry.budget_entry.createdAt,
          startDate: entry.budget_entry.startDate,
          endDate: entry.budget_entry.endDate,
          imageBase64: entry.budget_entry.imageBase64,
          imageType: entry.budget_entry.imageType,
        };
      });

      return NextResponse.json(formattedEntries);
    } catch (error) {
      console.error('Error fetching budget entries:', error);
      return NextResponse.json(
        { error: 'Failed to fetch budget entries' },
        { status: 500 }
      );
    }
  });
}

// POST /api/budget-entries - Create a new budget entry
export const POST = requireAuth(async (request: NextRequest, user: AuthenticatedUser) => {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = validateRequestBody(createBudgetEntrySchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const validation_data = validation.data;
    
    // Create entry data with required fields (these always exist)
    const entryData: any = {
      budgetId: validation_data.budgetId,
      amount: validation_data.amount,
      description: validation_data.description,
      category: validation_data.category || 'general',
      taskId: validation_data.taskId || null,
      createdById: user.id,
    };
    
    // Only include new fields if they exist in the validation data
    // The database will ignore fields that don't match its schema
    if ('name' in validation_data && validation_data.name) {
      entryData.name = validation_data.name;
    }
    
    if ('startDate' in validation_data && validation_data.startDate) {
      entryData.startDate = new Date(validation_data.startDate);
    }
    
    if ('endDate' in validation_data && validation_data.endDate) {
      entryData.endDate = new Date(validation_data.endDate);
    }
    
    if ('imageBase64' in validation_data && validation_data.imageBase64) {
      entryData.imageBase64 = validation_data.imageBase64;
    }
    
    if ('imageType' in validation_data && validation_data.imageType) {
      entryData.imageType = validation_data.imageType;
    }

    // Create the budget entry
    const newEntry = await db.insert(budgetEntry).values(entryData).returning();

    // Get the budgetId from the validation data
    const budgetId = validation_data.budgetId;
    
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

    // Format the response
    const response = {
      ...newEntry[0],
      amount: newEntry[0].amount / 100, // Convert to dollars for response
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating budget entry:', error);
    return NextResponse.json({ error: 'Failed to create budget entry' }, { status: 500 });
  }
}); 