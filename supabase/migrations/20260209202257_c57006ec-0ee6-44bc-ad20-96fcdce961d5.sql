
ALTER TABLE public.job_applications
  ADD COLUMN salary_range text,
  ADD COLUMN location text,
  ADD COLUMN contact_name text,
  ADD COLUMN contact_email text,
  ADD COLUMN contact_phone text;
