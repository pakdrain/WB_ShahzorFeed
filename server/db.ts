import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Local PostgreSQL configuration
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'wb',
  password: '@1122',
  port: 5432,
});

// Test connection on startup
pool.connect()
  .then(() => {
    console.log('✅ Connected to PostgreSQL database successfully');
  })
  .catch((err) => {
    console.log('❌ Failed to connect to PostgreSQL:', err.message);
    console.log('Please ensure PostgreSQL service is running and database "wb" exists');
  });

export const db = drizzle(pool, { schema });
export { pool };
