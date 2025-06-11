# Complete Local Setup Guide - Weighbridge Authentication System

**IMPORTANT**: This system must be run on your local machine to connect to your local PostgreSQL database. Replit cannot access your local database.

## Step 1: Download Project Files to Your Local Machine

1. Download all files from this Replit project
2. Create a new folder on your local machine: `C:\weighbridge-auth` (or your preferred location)
3. Copy all project files to this folder

## Step 2: Set Up Your Database

Run this SQL script in your PostgreSQL database (WB) to create the simple 2-column users table:

```sql
-- Drop existing users table if it exists
DROP TABLE IF EXISTS users CASCADE;

-- Create simple users table with only 2 columns
CREATE TABLE users (
    user_name character varying(255) NOT NULL,
    user_password character varying(255) NOT NULL,
    CONSTRAINT users_pkey PRIMARY KEY (user_name)
);
```

## Step 3: Create Environment File

Create a `.env` file in your project root with these exact settings:

```
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=@1122
PGDATABASE=WB
DATABASE_URL=postgresql://postgres:@1122@localhost:5432/WB
PORT=5000
NODE_ENV=development
```

## Step 4: Install Node.js Dependencies

Open Command Prompt in your project folder and run:

```bash
npm install
```

## Step 5: Test Database Connection

Run the test script to verify everything works:

```bash
node test-connection.js
```

You should see:
- ✅ Database connection successful!
- ✅ Users table exists
- ✅ Insert test successful
- ✅ Test record cleaned up

## Step 6: Start the Application

```bash
npm run dev
```

Open your browser to: `http://localhost:5000`

## Step 7: Test Registration and Login

1. **Register a new user**:
   - Go to the Register tab
   - Enter username and password
   - Click "Create Account"
   - Data will be inserted into your local users table

2. **Login**:
   - Go to the Login tab
   - Enter your credentials
   - Click "Sign In"
   - You'll be redirected to the purchase form

## How It Works

The authentication system now:
- **Registration**: Inserts `userName` and `userPassword` into your local users table
- **Login**: Queries your local users table to verify credentials
- **Sessions**: Stores user information in browser localStorage
- **Protection**: Blocks access to purchase form until logged in
- **Logout**: Clears session and redirects to login

## Database Operations

**Registration SQL**:
```sql
INSERT INTO users (user_name, user_password) VALUES ('username', 'password');
```

**Login SQL**:
```sql
SELECT user_name FROM users WHERE user_name = 'username' AND user_password = 'password';
```

## Troubleshooting

**Database Connection Failed**:
- Ensure PostgreSQL service is running
- Verify password is `@1122`
- Check database name is `WB`

**Registration/Login Not Working**:
- Check browser console for errors
- Verify the users table was created correctly
- Test database connection with the test script

**Port Already in Use**:
- Change PORT in .env file to 3000 or 8000

This setup works exactly like your purchase form insertion - same database, same connection pattern, but specifically designed for your 2-column users table structure.