-- =====================================================================
--  Workday boards for ats_companies.
--
--  Read by supabase/functions/_shared/workday.ts, which filters on
--  provider = 'workday'.
--
--  BOARD TOKEN FORMAT — "tenant/datacentre/site", taken straight out of
--  the careers URL:
--
--    https://transperfect.wd5.myworkdayjobs.com/en-US/transperfect/job/...
--            └─ tenant ──┘ └dc┘                      └─ site ─┘
--
--    → 'transperfect/wd5/transperfect'
--
--  The datacentre varies per customer (wd1, wd3, wd5, wd103…) and is not
--  guessable from the company name — read it off their careers page.
--
--  `industries` MUST use the vocabulary in src/pages/IdentityVault.tsx, or
--  loadBoards' overlaps() filter silently matches nothing.
--
--  Only tokens verified against the live endpoint are seeded here: a wrong
--  one 404s and the adapter retires it, which is safe but wastes a slot on
--  the first run.
-- =====================================================================

BEGIN;

INSERT INTO public.ats_companies (provider, board_token, company_name, industries, domain)
VALUES
  ('workday', 'transperfect/wd5/transperfect', 'TransPerfect',
   ARRAY['Engineering','Operations','Sales','Project Manager','Marketing'],
   'transperfect.com')
ON CONFLICT DO NOTHING;

COMMIT;
