import { Pool } from 'pg';

// Test PostgreSQL connection with the exact same settings
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'wb',
  password: '@1122',
  port: 5432,
});

async function testConnection() {
  console.log('Testing PostgreSQL connection...');
  
  try {
    const client = await pool.connect();
    console.log('✅ Successfully connected to PostgreSQL!');
    
    // Test a simple query
    const result = await client.query('SELECT current_database(), version()');
    console.log('Database:', result.rows[0].current_database);
    console.log('PostgreSQL Version:', result.rows[0].version);
    
    // Test if tables exist
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('Available tables:', tables.rows.map(row => row.table_name));
    
    client.release();
    console.log('✅ Database connection test completed successfully!');
  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
    console.log('Error details:', error);
  } finally {
    await pool.end();
  }
}

testConnection();