import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

// ============================================================
// LOCAL DATABASE
// ============================================================

if (
  !process.env.PGHOST ||
  !process.env.PGDATABASE ||
  !process.env.PGUSER
) {
  throw new Error(
    "Local PostgreSQL environment variables are missing."
  );
}

export const pool = new Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT || 5432),
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD || "",
});

// ============================================================
// DATABASE CONNECTION TEST
// ============================================================

pool
  .connect()
  .then((client) => {
    console.log(
      "✅ PostgreSQL database connected successfully"
    );

    client.release();
  })
  .catch((error) => {
    console.error(
      "❌ PostgreSQL database connection failed:",
      error.message
    );
  });

// ============================================================
// EXPORT DATABASE
// ============================================================

export { schema };

