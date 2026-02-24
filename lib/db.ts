import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import * as schema from '../drizzle/schema';

// Database connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Drizzle ORM instance with schema
export const db = drizzle(pool, { schema });

// Re-export schema for convenience
export * from '../drizzle/schema';
