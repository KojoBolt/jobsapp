-- Fix resumes table RLS policies - ensure authenticated users can insert
-- This migration explicitly reconfigures RLS to allow properly authenticated inserts

-- 1. Ensure function exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Ensure trigger exists
DROP TRIGGER IF EXISTS update_resumes_updated_at ON public.resumes;
CREATE TRIGGER update_resumes_updated_at
BEFORE UPDATE ON public.resumes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Grant explicit permissions to authenticated users
BEGIN;
  GRANT SELECT, INSERT, UPDATE, DELETE ON public.resumes TO authenticated;
  GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO authenticated;
COMMIT;

-- 4. Ensure RLS is enabled
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;

-- 5. Drop any existing policies
DROP POLICY IF EXISTS "Users can view own resumes" ON public.resumes;
DROP POLICY IF EXISTS "Users can insert own resumes" ON public.resumes;
DROP POLICY IF EXISTS "Users can update own resumes" ON public.resumes;
DROP POLICY IF EXISTS "Users can delete own resumes" ON public.resumes;

-- 6. Create RLS policies - allow authenticated users to manage their own resumes
CREATE POLICY "Users can view own resumes"
ON public.resumes
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own resumes"  
ON public.resumes
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own resumes"
ON public.resumes
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own resumes"
ON public.resumes
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
