-- Fix: Add INSERT policy to profiles table to allow new user signup
BEGIN;

-- Drop policy if it exists
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Add INSERT policy to allow authenticated users to insert their own profile
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Also grant INSERT permission
GRANT INSERT ON public.profiles TO authenticated;

COMMIT;
