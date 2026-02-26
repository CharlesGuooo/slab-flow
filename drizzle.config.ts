import type { Config } from 'drizzle-kit';

export default {
  schema: './drizzle/schema-sqlite.ts',
  out: './drizzle/migrations',
  driver: 'turso',
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL || 'file:slabflow-local.db',
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
} satisfies Config;
