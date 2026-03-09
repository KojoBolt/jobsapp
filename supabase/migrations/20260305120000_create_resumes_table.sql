-- Create resumes table
CREATE TABLE IF NOT EXISTS public.resumes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT,
  cloudinary_public_id TEXT,
  extracted_text TEXT,
  job_title TEXT,
  location TEXT,
  salary_expectation TEXT,
  tone_preference TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist
DROP POLICY IF EXISTS "Users can view own resumes" ON public.resumes;
DROP POLICY IF EXISTS "Users can insert own resumes" ON public.resumes;
DROP POLICY IF EXISTS "Users can update own resumes" ON public.resumes;
DROP POLICY IF EXISTS "Users can delete own resumes" ON public.resumes;

-- Users can view their own resumes
CREATE POLICY "Users can view own resumes"
ON public.resumes
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own resumes
CREATE POLICY "Users can insert own resumes"
ON public.resumes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own resumes
CREATE POLICY "Users can update own resumes"
ON public.resumes
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own resumes
CREATE POLICY "Users can delete own resumes"
ON public.resumes
FOR DELETE
USING (auth.uid() = user_id);

-- Update timestamp trigger (drop and recreate if exists)
DROP TRIGGER IF EXISTS update_resumes_updated_at ON public.resumes;
