-- Add generations_left to users table
ALTER TABLE users ADD COLUMN generations_left INTEGER NOT NULL DEFAULT 5;
