-- =====================================================================
--  SmartRecruiters companies for ats_companies.
--
--  Read by supabase/functions/_shared/smartrecruiters.ts, which filters on
--  provider = 'smartrecruiters'.
--
--  BOARD TOKEN — the SmartRecruiters company identifier, straight out of
--  the careers URL:
--
--    https://jobs.smartrecruiters.com/Jobsbridge1/111405948-clearcase-admin
--                                     └─ token ─┘
--
--  Verified live: Jobsbridge1 returns 1,631 published postings. Note that
--  is more automatable jobs from ONE row than the entire 40-company
--  Greenhouse list produced in a 200-job campaign — staffing agencies post
--  at scale because they recruit for many clients at once, which makes them
--  disproportionately valuable rows in this table.
--
--  `industries` MUST use the vocabulary in src/pages/IdentityVault.tsx, or
--  loadBoards' overlaps() filter silently matches nothing.
-- =====================================================================

BEGIN;

INSERT INTO public.ats_companies (provider, board_token, company_name, industries, domain)
VALUES
  ('smartrecruiters', 'Jobsbridge1', 'Jobsbridge',
   ARRAY['Engineering','Data Science','Operations','Product','Project Manager'],
   'jobsbridge.com')
ON CONFLICT DO NOTHING;

COMMIT;
