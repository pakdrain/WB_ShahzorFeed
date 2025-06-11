# Local Setup Guide for Weighbridge Authentication System

## Prerequisites

1. **Node.js** (version 18 or higher)
2. **PostgreSQL** (with your existing database)
3. **Git** (to clone the repository)

## Step 1: Download the Project

1. Download all project files to your local machine
2. Extract to a folder (e.g., `weighbridge-system`)

## Step 2: Database Configuration

Make sure your PostgreSQL database has the correct users table structure:

```sql
CREATE TABLE users (
    user_id  bigint NOT NULL DEFAULT nextval('users_user_id_seq'),
    user_no  numeric(20,6),
    user_name character varying(2000) COLLATE pg_catalog."default",
    user_password character varying(2000) COLLATE pg_catalog."default",
    user_creation_date timestamp without time zone
);

-- Create sequence for user_id
CREATE SEQUENCE IF NOT EXISTS users_user_id_seq OWNED BY users.user_id;
SELECT setval('users_user_id_seq', COALESCE(MAX(user_id), 0) + 1, false) FROM users;
```

## Step 3: Environment Configuration

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update `.env` with your local database credentials:
   ```
   PGHOST=localhost
   PGPORT=5432
   PGUSER=postgres
   PGPASSWORD=your_actual_password
   PGDATABASE=WB
   DATABASE_URL=postgresql://postgres:your_actual_password@localhost:5432/WB
   PORT=5000
   NODE_ENV=development
   ```

## Step 4: Install Dependencies

```bash
npm install
```

## Step 5: Run the Application

```bash
npm run dev
```

## Step 6: Access the Application

Open your browser and go to: `http://localhost:5000`

## Troubleshooting

### Database Connection Issues

1. **Check PostgreSQL Service**: Ensure PostgreSQL is running on your local machine
2. **Verify Credentials**: Make sure username, password, and database name are correct
3. **Check Port**: Default PostgreSQL port is 5432
4. **Database Permissions**: Ensure your user has read/write access to the database

### Authentication Issues

1. **Clear Browser Cache**: Clear localStorage and cookies
2. **Check Console**: Open browser DevTools and check for JavaScript errors
3. **Verify API**: Test endpoints manually:
   ```bash
   # Test registration
   curl -X POST http://localhost:5000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"userName": "testuser", "userPassword": "password123", "confirmPassword": "password123"}'
   
   # Test login
   curl -X POST http://localhost:5000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"userName": "testuser", "userPassword": "password123"}'
   ```

## Features Included

- User Registration with validation
- User Login with session management
- Protected Routes (Purchase Form access)
- Beautiful UI with modern design
- Database integration with your existing PostgreSQL setup
- Logout functionality
- User information display in sidebar

## File Structure

```
weighbridge-system/
├── client/                 # Frontend React application
│   └── src/
│       ├── components/     # UI components
│       ├── pages/         # Application pages
│       └── lib/           # Authentication logic
├── server/                # Backend Express server
│   ├── routes.ts          # API routes including auth
│   └── index.ts           # Server entry point
├── shared/                # Shared schemas and types
└── .env                   # Environment configuration
```

## Security Notes

- Passwords are currently stored as plain text as per your database schema
- For production, consider implementing password hashing
- Ensure PostgreSQL is properly secured if exposing to network