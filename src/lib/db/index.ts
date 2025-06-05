import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not defined');
}

const db = drizzle(process.env.DATABASE_URL, {
  schema
});

export default db;
export { db };
