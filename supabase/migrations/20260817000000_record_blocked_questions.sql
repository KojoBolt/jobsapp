-- =====================================================================
--  Record EVERY question that blocked an application, not a sample.
--
--  A Stripe form blocked on eleven required questions and reported three,
--  because `automation_error` is a single string and the adapter truncates it
--  to keep it readable. Two consequences:
--
--    * the admin finishing the application by hand sees a fraction of the work
--    * nobody can answer "which questions block us most often?", which is the
--      only sound way to decide what the Identity Vault should collect next
--
--  Stored as jsonb rather than text so it can be counted:
--
--    select q, count(*)
--    from applications, jsonb_array_elements_text(automation_blocked) as q
--    where automation_blocked is not null
--    group by q order by 2 desc;
--
--  That query turns "what should I build next?" from a guess into a
--  measurement. A question appearing across many employers earns a vault
--  field; one that names a single company stays human forever.
-- =====================================================================

BEGIN;

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS automation_blocked jsonb;

COMMENT ON COLUMN public.applications.automation_blocked IS
  'Array of every reason the automation could not finish this application, '
  'written on each attempt. automation_error holds a truncated summary of the '
  'same list for display.';

COMMIT;
