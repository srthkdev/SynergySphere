import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/lib/db";
import { requireAuth, AuthenticatedUser } from "@/lib/auth/auth-middleware";

// This is a temporary endpoint to run our migration
export async function GET(request: NextRequest) {
  return requireAuth(request, async (user: AuthenticatedUser) => {
    const results = [];
    
    try {
      // Run each statement in a separate try-catch to ensure partial success
      try {
        await db.execute(`ALTER TABLE "budget_entry" ADD COLUMN IF NOT EXISTS "name" text`);
        results.push({ column: "name", status: "success" });
      } catch (error: any) {
        console.error('Error adding name column:', error);
        results.push({ column: "name", status: "error", message: error?.message || 'Unknown error' });
      }
      
      try {
        await db.execute(`ALTER TABLE "budget_entry" ADD COLUMN IF NOT EXISTS "start_date" timestamp`);
        results.push({ column: "start_date", status: "success" });
      } catch (error: any) {
        console.error('Error adding start_date column:', error);
        results.push({ column: "start_date", status: "error", message: error?.message || 'Unknown error' });
      }
      
      try {
        await db.execute(`ALTER TABLE "budget_entry" ADD COLUMN IF NOT EXISTS "end_date" timestamp`);
        results.push({ column: "end_date", status: "success" });
      } catch (error: any) {
        console.error('Error adding end_date column:', error);
        results.push({ column: "end_date", status: "error", message: error?.message || 'Unknown error' });
      }
      
      try {
        await db.execute(`ALTER TABLE "budget_entry" ADD COLUMN IF NOT EXISTS "image_base64" text`);
        results.push({ column: "image_base64", status: "success" });
      } catch (error: any) {
        console.error('Error adding image_base64 column:', error);
        results.push({ column: "image_base64", status: "error", message: error?.message || 'Unknown error' });
      }
      
      try {
        await db.execute(`ALTER TABLE "budget_entry" ADD COLUMN IF NOT EXISTS "image_type" text`);
        results.push({ column: "image_type", status: "success" });
      } catch (error: any) {
        console.error('Error adding image_type column:', error);
        results.push({ column: "image_type", status: "error", message: error?.message || 'Unknown error' });
      }
      
      // Check for overall success
      const successCount = results.filter(r => r.status === "success").length;
      const status = successCount === 5 ? "complete" : "partial";
      
      return NextResponse.json({ 
        message: `Migration ${status}. ${successCount}/5 columns added.`,
        results 
      });
    } catch (error) {
      console.error('Error applying migration:', error);
      return NextResponse.json(
        { error: 'Failed to apply migration', results },
        { status: 500 }
      );
    }
  });
} 