import { sql } from "drizzle-orm";
import { db } from "../index";

export async function addImageBase64Fields() {
  try {
    console.log("Running migration: Add imageBase64 and imageType fields to project table");
    
    // Check if columns already exist
    const checkColumns = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'project' 
      AND column_name IN ('image_base64', 'image_type')
    `);
    
    const existingColumns = checkColumns.rows.map(row => row.column_name);
    
    // Add imageBase64 column if it doesn't exist
    if (!existingColumns.includes('image_base64')) {
      await db.execute(sql`
        ALTER TABLE "project"
        ADD COLUMN "image_base64" TEXT
      `);
      console.log("Added image_base64 column to project table");
    } else {
      console.log("image_base64 column already exists");
    }
    
    // Add imageType column if it doesn't exist
    if (!existingColumns.includes('image_type')) {
      await db.execute(sql`
        ALTER TABLE "project"
        ADD COLUMN "image_type" TEXT
      `);
      console.log("Added image_type column to project table");
    } else {
      console.log("image_type column already exists");
    }
    
    console.log("Migration completed successfully");
    return { success: true };
  } catch (error) {
    console.error("Migration failed:", error);
    return { success: false, error };
  }
}

// Export a function to run the migration
export default async function runMigration() {
  return await addImageBase64Fields();
} 