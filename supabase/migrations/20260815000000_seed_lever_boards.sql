-- =====================================================================
--  Lever boards for ats_companies.
--
--  Same registry as the Greenhouse rows, distinguished by `provider`.
--  supabase/functions/_shared/lever.ts reads provider = 'lever'.
--
--  Only slugs verified against https://api.lever.co/v0/postings/{slug}
--  are seeded — a wrong slug 404s and the adapter retires it, which is
--  safe but wastes a request slot on the first run.
--
--  `industries` MUST use the same vocabulary as src/pages/IdentityVault.tsx,
--  or loadBoards' overlaps() filter silently matches nothing.
-- =====================================================================

BEGIN;

INSERT INTO public.ats_companies (provider, board_token, company_name, industries, domain)
VALUES
  ('lever', 'matillion', 'Matillion',
   ARRAY['Technology','Engineering','Sales','Data Science'], 'matillion.com')
ON CONFLICT DO NOTHING;

COMMIT;
