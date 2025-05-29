import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Local PostgreSQL configuration - using the same settings as your working file
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'wb',
  password: '@1122',
  port: 5432,
});

export const db = drizzle(pool, { schema });
export { pool };
