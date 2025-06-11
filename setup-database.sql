-- Database setup script for Weighbridge Authentication System
-- Run this in your PostgreSQL database (WB)
-- This creates a simple users table with only userName and userPassword columns

-- Drop existing users table if it exists
DROP TABLE IF EXISTS users CASCADE;

-- Create simple users table with only 2 columns
CREATE TABLE users (
    user_name character varying(255) NOT NULL,
    user_password character varying(255) NOT NULL,
    CONSTRAINT users_pkey PRIMARY KEY (user_name)
);

-- Verify table structure
SELECT column_name, data_type, character_maximum_length, is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;