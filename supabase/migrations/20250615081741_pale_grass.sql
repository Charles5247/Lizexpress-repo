/*
  # Fix User Table RLS Policies

  1. Security Updates
    - Add missing INSERT policy for users table
    - Ensure proper RLS policies for user profile management
    - Allow authenticated users to create and manage their own profiles

  2. Policy Changes
    - Add "Users can create their own profile" INSERT policy
    - Verify existing SELECT and UPDATE policies are correct
    - Ensure auth.uid() function is used consistently
*/

-- Drop existing policies to recreate them with correct permissions
DROP POLICY IF EXISTS "Users can read their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;

-- Create comprehensive RLS policies for users table
CREATE POLICY "Users can read their own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can create their own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Ensure RLS is enabled on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;