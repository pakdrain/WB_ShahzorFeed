// Test script to verify database connection
// Run this with: node test-connection.js

const { Pool } = require('pg');

// Update these credentials to match your local PostgreSQL setup
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',        // Your PostgreSQL username
  password: '@1122',       // Your PostgreSQL password
  database: 'WB',          // Your database name
});

async function testConnection() {
  try {
    console.log('Testing connection to local PostgreSQL database...');
    
    const client = await pool.connect();
    console.log('✅ Database connection successful!');
    
    // Test if users table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    if (tableCheck.rows[0].exists) {
      console.log('✅ Users table exists');
      
      // Check table structure
      const structure = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        ORDER BY ordinal_position;
      `);
      
      console.log('Table structure:');
      structure.rows.forEach(row => {
        console.log(`  - ${row.column_name}: ${row.data_type}`);
      });
      
      // Test insert (will be removed)
      try {
        const testInsert = await client.query(`
          INSERT INTO users (user_no, user_name, user_password, user_creation_date) 
          VALUES (999, 'test_connection', 'test123', NOW()) 
          RETURNING user_id, user_name;
        `);
        console.log('✅ Insert test successful:', testInsert.rows[0]);
        
        // Clean up test record
        await client.query('DELETE FROM users WHERE user_name = $1', ['test_connection']);
        console.log('✅ Test record cleaned up');
        
      } catch (insertError) {
        console.log('❌ Insert test failed:', insertError.message);
      }
      
    } else {
      console.log('❌ Users table does not exist');
      console.log('Please run the setup-database.sql script first');
    }
    
    client.release();
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('\nPlease check:');
    console.log('1. PostgreSQL is running on your local machine');
    console.log('2. Database credentials are correct');
    console.log('3. Database "WB" exists');
    console.log('4. User has proper permissions');
  } finally {
    await pool.end();
  }
}

testConnection();