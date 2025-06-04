import { db } from ".";
import { sql } from "drizzle-orm";

const main = async () => {
  const startTime = Date.now();
  console.log(`[${new Date().toISOString()}] Starting database cleanup...`);
  
  try {
    // Get all tables in the database
    const tablesResult = await db.execute(sql`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename NOT LIKE 'drizzle%'
      ORDER BY tablename;
    `);
    
    const tables = tablesResult.rows.map((row: any) => row.tablename as string);
    console.log(`Found ${tables.length} tables:`, tables);
    
    // Drop all tables in the correct order to handle dependencies
    const tablesToDrop = [
      'notification',
      'comment', 
      'task',
      'budget_entry',
      'budget',
      'project_member',
      'project',
      'session',
      'account',
      'verification',
      'user',
      'files',
    ];
    
    for (const tableName of tablesToDrop) {
      if (tables.includes(tableName)) {
        console.log(`🗑️  Dropping ${tableName}...`);
        await db.execute(sql.raw(`DROP TABLE IF EXISTS "${tableName}" CASCADE;`));
      } else {
        console.log(`⏭️  Skipping ${tableName} (doesn't exist)`);
      }
    }
    
    // Also drop any custom types that might conflict
    const typesToDrop = ['task_status', 'project_role'];
    for (const typeName of typesToDrop) {
      try {
        await db.execute(sql.raw(`DROP TYPE IF EXISTS "${typeName}" CASCADE;`));
        console.log(`🗑️  Dropped type ${typeName}`);
      } catch (error) {
        console.log(`⏭️  Type ${typeName} doesn't exist or couldn't be dropped`);
      }
    }
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[${new Date().toISOString()}] ✅ Database cleared successfully in ${duration}s`);
  } catch (error: unknown) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error(`[${new Date().toISOString()}] ❌ Database cleanup failed after ${duration}s`);
    
    if (error instanceof Error) {
      console.error(`Error details: ${error.message}`);
      if (error.stack) {
        console.error(`Stack trace:\n${error.stack}`);
      }
    } else {
      console.error(`Error details: ${String(error)}`);
    }
    
    process.exit(1);
  }
  
  process.exit(0);
};

main(); 