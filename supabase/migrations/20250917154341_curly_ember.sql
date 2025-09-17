/*
  # Update demo users for Supabase Auth integration

  1. Changes
    - Remove the old demo users migration approach
    - The users will now be created through Supabase Auth UI
    - This migration ensures the users table structure is ready
    - Demo users need to be created manually in Supabase Auth dashboard

  2. Instructions
    After running this migration, create these users in Supabase Auth dashboard:
    - admin@demo.com with password: admin123
    - client@demo.com with password: client123
    
    Then update the public.users table with their roles using their Auth UUIDs.
*/

-- Ensure the users table has the correct structure
-- The id should match the auth.users.id (UUID)
DO $$
BEGIN
  -- Check if we need to update the id column to be UUID and match auth.users
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name = 'id' 
    AND data_type = 'uuid'
  ) THEN
    -- If id is not UUID, we need to recreate the table structure
    -- This is a safe operation since we're in development
    ALTER TABLE users ALTER COLUMN id TYPE uuid USING id::uuid;
  END IF;
END $$;

-- Add foreign key constraint to link with auth.users if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'users_id_fkey'
  ) THEN
    ALTER TABLE users 
    ADD CONSTRAINT users_id_fkey 
    FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Update the role constraint to include 'viewer' as default
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
CHECK (role = ANY (ARRAY['admin'::text, 'viewer'::text]));

-- Remove password_hash column since we're using Supabase Auth
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name = 'password_hash'
  ) THEN
    ALTER TABLE users DROP COLUMN password_hash;
  END IF;
END $$;