# PostgreSQL 17 Connection Fix for Windows

## Quick Fix Steps

### 1. Check PostgreSQL 17 Service
```cmd
net stop postgresql-x64-17
net start postgresql-x64-17
```

### 2. Check if PostgreSQL is listening
```cmd
netstat -an | findstr 5432
```
You should see: `0.0.0.0:5432` or `127.0.0.1:5432`

### 3. Test direct connection
```cmd
psql -h 127.0.0.1 -U postgres -d wb
```
Enter password: `@1122`

### 4. Update PostgreSQL Configuration

**Find your PostgreSQL 17 data directory:**
Usually: `C:\Program Files\PostgreSQL\17\data\`

**Edit postgresql.conf:**
```
listen_addresses = '*'
port = 5432
max_connections = 100
```

**Edit pg_hba.conf:**
Add this line at the top:
```
host    all             all             127.0.0.1/32            md5
host    all             all             ::1/128                 md5
```

### 5. Restart PostgreSQL
```cmd
net stop postgresql-x64-17
net start postgresql-x64-17
```

### 6. Test the fixed connection
Run the application again:
```cmd
npx tsx server/index.ts
```

## Expected Success Output:
```
✅ Database connected - using PostgreSQL storage
Connected to database: wb
PostgreSQL version: PostgreSQL 17.0 on x86_64-pc-windows-msvc
```

## If Still Failing:

### Alternative Connection Test
Create `test-pg17.js`:
```javascript
import { Pool } from 'pg';

const pool = new Pool({
  user: 'postgres',
  host: '127.0.0.1',
  database: 'wb',
  password: '@1122',
  port: 5432,
  ssl: false
});

try {
  const client = await pool.connect();
  console.log('✅ PostgreSQL 17 connection works!');
  const result = await client.query('SELECT version()');
  console.log(result.rows[0].version);
  client.release();
} catch (error) {
  console.log('❌ Error:', error.message);
} finally {
  await pool.end();
}
```

Run: `node test-pg17.js`

### Common PostgreSQL 17 Issues:

1. **Password Authentication Failed:**
   - Reset postgres password: `ALTER USER postgres PASSWORD '@1122';`

2. **Connection Refused:**
   - Check Windows Firewall
   - Verify PostgreSQL service is running

3. **Database 'wb' does not exist:**
   ```sql
   CREATE DATABASE wb;
   ```

Once the connection test passes, your application will automatically connect to PostgreSQL 17 instead of using memory storage.