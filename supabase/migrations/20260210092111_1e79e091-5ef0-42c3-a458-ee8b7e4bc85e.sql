
-- Add JSONB column for Identity Vault advanced targeting data
ALTER TABLE public.profiles
ADD COLUMN identity_vault_data jsonb DEFAULT '{}'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.identity_vault_data IS 'Stores Identity Vault data: personal info, targeting preferences, role specifics, tone of voice, etc.';
