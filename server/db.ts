import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Local PostgreSQL configuration - will only be used when database is available
let pool: Pool | null = null;
let db: any = null;

try {
  pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'wb',
    password: '@1122',
    port: 5432,
  });
  
  db = drizzle(pool, { schema });
} catch (error) {
  console.log('Database connection not available, using in-memory storage');
}

export { pool, db };
