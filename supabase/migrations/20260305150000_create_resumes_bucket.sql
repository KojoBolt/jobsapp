-- Create resumes bucket and setup storage policies
BEGIN;

-- Insert the bucket into storage.buckets if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', false)
ON CONFLICT (id) DO NOTHING;

-- Drop all conflicting policies explicitly
DROP POLICY IF EXISTS "Authenticated users can upload to resumes bucket" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read resumes" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own resume files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own resume files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users full access to resumes" ON storage.objects;

-- Single permissive policy for authenticated users on resumes bucket
CREATE POLICY "Allow authenticated users full access to resumes"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'resumes')
WITH CHECK (bucket_id = 'resumes');

COMMIT;
