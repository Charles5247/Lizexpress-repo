/*
  # Fix all critical issues for production launch

  1. Storage Policies
    - Fix avatar and item image upload policies
    - Ensure proper bucket access

  2. User Table Policies
    - Fix RLS policies for profile management
    - Allow proper CRUD operations

  3. Database Functions
    - Ensure user profile creation works properly
*/

-- Ensure storage buckets exist
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public) 
  VALUES ('avatars', 'avatars', true)
  ON CONFLICT (id) DO NOTHING;
  
  INSERT INTO storage.buckets (id, name, public) 
  VALUES ('items', 'items', true)
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Drop and recreate storage policies for avatars
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

CREATE POLICY "Avatar images are publicly accessible" 
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" 
  ON storage.objects FOR INSERT 
  WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own avatar" 
  ON storage.objects FOR UPDATE 
  USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own avatar" 
  ON storage.objects FOR DELETE 
  USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Drop and recreate storage policies for items
DROP POLICY IF EXISTS "Item images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload item images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their item images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their item images" ON storage.objects;

CREATE POLICY "Item images are publicly accessible" 
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'items');

CREATE POLICY "Users can upload item images" 
  ON storage.objects FOR INSERT 
  WITH CHECK (
    bucket_id = 'items' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their item images" 
  ON storage.objects FOR UPDATE 
  USING (
    bucket_id = 'items' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their item images" 
  ON storage.objects FOR DELETE 
  USING (
    bucket_id = 'items' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Fix users table policies
DROP POLICY IF EXISTS "Users can read their own profile" ON users;
DROP POLICY IF EXISTS "Users can create their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;

CREATE POLICY "Users can read their own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can create their own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Add UPSERT policy for users table
CREATE POLICY "Users can upsert their own profile"
  ON users FOR ALL
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Ensure items table policies work with user profiles
DROP POLICY IF EXISTS "Users can create items" ON items;

CREATE POLICY "Users can create items"
  ON items FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Update the trigger function to handle upserts properly
CREATE OR REPLACE FUNCTION ensure_user_profile_exists()
RETURNS TRIGGER AS $$
BEGIN
  -- Upsert user profile to ensure it exists
  INSERT INTO users (id, created_at, updated_at)
  VALUES (NEW.user_id, now(), now())
  ON CONFLICT (id) DO UPDATE SET updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS ensure_user_profile_before_item_insert ON items;
CREATE TRIGGER ensure_user_profile_before_item_insert
  BEFORE INSERT ON items
  FOR EACH ROW
  EXECUTE FUNCTION ensure_user_profile_exists();