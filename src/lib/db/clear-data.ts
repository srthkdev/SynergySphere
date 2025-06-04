import { drizzle } from 'drizzle-orm/neon-http';
import { sql } from 'drizzle-orm';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not defined');
}

const db = drizzle(process.env.DATABASE_URL);

async function clearAllData() {
  const startTime = Date.now();
  console.log('🧹 Starting database data cleanup...');

  try {
    // Get all tables in the database (excluding system tables)
    const tablesResult = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      AND table_name NOT LIKE 'drizzle%'
    `);

    const tables = tablesResult.rows.map((row: any) => row.table_name);
    console.log(`📋 Found ${tables.length} tables:`, tables);

    // Define the order to clear tables (respecting foreign key constraints)
    const clearOrder = [
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
      'files'
    ];

    // Clear tables in the specified order
    for (const tableName of clearOrder) {
      if (tables.includes(tableName)) {
        try {
          await db.execute(sql.raw(`DELETE FROM "${tableName}"`));
          console.log(`✅ Cleared data from table: ${tableName}`);
        } catch (error) {
          console.log(`⚠️  Failed to clear table ${tableName}:`, error);
        }
      } else {
        console.log(`⏭️  Table ${tableName} not found, skipping...`);
      }
    }

    // Clear any remaining tables not in the clearOrder list
    const remainingTables = tables.filter(table => !clearOrder.includes(table));
    for (const tableName of remainingTables) {
      try {
        await db.execute(sql.raw(`DELETE FROM "${tableName}"`));
        console.log(`✅ Cleared data from table: ${tableName}`);
      } catch (error) {
        console.log(`⚠️  Failed to clear table ${tableName}:`, error);
      }
    }

    const duration = Date.now() - startTime;
    console.log(`🎉 Database data cleanup completed in ${duration}ms`);
    
  } catch (error) {
    console.error('❌ Error during database data cleanup:', error);
    throw error;
  }
}

// Run the cleanup if this script is executed directly
if (process.argv[1]?.endsWith('clear-data.ts')) {
  clearAllData()
    .then(() => {
      console.log('✨ All data cleared successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Failed to clear data:', error);
      process.exit(1);
    });
}

export { clearAllData }; 