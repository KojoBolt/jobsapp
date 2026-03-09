
-- Add JSONB column for Identity Vault advanced targeting data (if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='identity_vault_data') THEN
    ALTER TABLE public.profiles
    ADD COLUMN identity_vault_data jsonb DEFAULT '{}'::jsonb;

    COMMENT ON COLUMN public.profiles.identity_vault_data IS 'Stores Identity Vault data: personal info, targeting preferences, role specifics, tone of voice, etc.';
  END IF;
END $$;
