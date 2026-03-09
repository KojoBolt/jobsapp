
-- Add columns to job_applications table (if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='job_applications' AND column_name='salary_range') THEN
    ALTER TABLE public.job_applications
      ADD COLUMN salary_range text,
      ADD COLUMN location text,
      ADD COLUMN contact_name text,
      ADD COLUMN contact_email text,
      ADD COLUMN contact_phone text;
  END IF;
END $$;
