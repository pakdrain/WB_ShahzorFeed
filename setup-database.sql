-- Database setup script for Weighbridge Authentication System
-- Run this in your PostgreSQL database (WB)

-- Create sequence for user_id auto-increment
CREATE SEQUENCE IF NOT EXISTS users_user_id_seq;

-- Ensure users table has correct structure
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    user_id bigint NOT NULL DEFAULT nextval('users_user_id_seq'),
    user_no numeric(20,6),
    user_name character varying(2000) COLLATE pg_catalog."default",
    user_password character varying(2000) COLLATE pg_catalog."default",
    user_creation_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_pkey PRIMARY KEY (user_id),
    CONSTRAINT users_user_name_unique UNIQUE (user_name)
);

-- Set sequence ownership
ALTER SEQUENCE users_user_id_seq OWNED BY users.user_id;

-- Reset sequence to start from 1
SELECT setval('users_user_id_seq', 1, false);

-- Verify table structure
SELECT column_name, data_type, character_maximum_length, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;