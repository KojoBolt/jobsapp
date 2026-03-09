-- Setup RLS policies for resumes storage bucket
BEGIN;

-- Drop existing policies for resumes bucket if they exist
DROP POLICY IF EXISTS "Authenticated users can upload to resumes bucket" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read resumes" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own resume files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own resume files" ON storage.objects;

-- Create policy to allow all authenticated users to upload to resumes bucket
CREATE POLICY "Authenticated users can upload to resumes bucket"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'resumes');

-- Create policy to allow all authenticated users to read from resumes bucket
CREATE POLICY "Authenticated users can read resumes"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'resumes');

-- Create policy to allow authenticated users to delete their own resumes
CREATE POLICY "Users can delete own resume files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'resumes'
  AND auth.uid()::text = (string_to_array(name, '/'))[1]
);

-- Also allow users to update/replace their own resumes
CREATE POLICY "Users can update own resume files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'resumes'
  AND auth.uid()::text = (string_to_array(name, '/'))[1]
);

COMMIT;
