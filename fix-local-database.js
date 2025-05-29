// Test different PostgreSQL connection methods for your local machine
import { Pool } from 'pg';

const connectionConfigs = [
  // Config 1: Your current settings
  {
    name: "Current Config",
    config: {
      user: 'postgres',
      host: 'localhost',
      database: 'wb',
      password: '@1122',
      port: 5432,
    }
  },
  // Config 2: With connection timeout
  {
    name: "With Timeout",
    config: {
      user: 'postgres',
      host: 'localhost',
      database: 'wb',
      password: '@1122',
      port: 5432,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
    }
  },
  // Config 3: With SSL disabled
  {
    name: "SSL Disabled",
    config: {
      user: 'postgres',
      host: 'localhost',
      database: 'wb',
      password: '@1122',
      port: 5432,
      ssl: false,
    }
  },
  // Config 4: Using 127.0.0.1 instead of localhost
  {
    name: "Using 127.0.0.1",
    config: {
      user: 'postgres',
      host: '127.0.0.1',
      database: 'wb',
      password: '@1122',
      port: 5432,
      ssl: false,
    }
  }
];

async function testConnections() {
  console.log('Testing PostgreSQL connections...\n');
  
  for (const { name, config } of connectionConfigs) {
    console.log(`Testing: ${name}`);
    console.log('Config:', JSON.stringify(config, null, 2));
    
    try {
      const pool = new Pool(config);
      const client = await pool.connect();
      
      const result = await client.query('SELECT current_database(), version()');
      console.log('✅ SUCCESS!');
      console.log('Database:', result.rows[0].current_database);
      console.log('Version:', result.rows[0].version.substring(0, 50) + '...');
      
      // Test if wb_weighbridge table exists
      try {
        const tableCheck = await client.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'wb_weighbridge' 
          LIMIT 5
        `);
        console.log('Found wb_weighbridge table with columns:', tableCheck.rows.map(r => r.column_name));
      } catch (e) {
        console.log('wb_weighbridge table not found - will need to create it');
      }
      
      client.release();
      await pool.end();
      console.log('🎉 This configuration works! Use this one.\n');
      break;
      
    } catch (error) {
      console.log('❌ FAILED:', error.message);
      console.log('');
    }
  }
}

testConnections();