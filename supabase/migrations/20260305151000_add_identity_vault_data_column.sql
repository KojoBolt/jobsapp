-- Add identity_vault_data column to profiles table if it doesn't exist
BEGIN;

-- Add the identity_vault_data column to profiles table if it doesn't exist
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS identity_vault_data jsonb DEFAULT NULL;

-- Create an index on the column for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_identity_vault_data 
ON public.profiles USING gin(identity_vault_data);

COMMIT;
