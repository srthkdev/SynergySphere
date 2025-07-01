import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Check for DATABASE_URL with better error handling
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL environment variable is not defined');
  if (process.env.NODE_ENV === 'production') {
    throw new Error('DATABASE_URL environment variable is required in production');
  }
  // In development, you might want to handle this differently
  console.warn('Continuing without database connection (development mode)');
}

const db = databaseUrl ? drizzle(databaseUrl, {
  schema
}) : null;

if (!db) {
  console.warn('Database connection not established');
}

export default db;
export { db };
