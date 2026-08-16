-- =====================================================================
--  Restrict the resumes bucket to the file's owner.
--
--  THE PROBLEM
--  20260305150000_create_resumes_bucket.sql created one policy:
--
--    FOR ALL TO authenticated USING (bucket_id = 'resumes')
--
--  There is no owner check in it. Every signed-in account could read,
--  overwrite and delete every other account's CV. The `resumes` TABLE is
--  correctly scoped to auth.uid(), so paths are not trivially enumerable —
--  but object paths are predictable (they start with a user id) and table
--  RLS does not protect the object store. This is the fix.
--
--  TWO PATH SHAPES, BOTH LIVE
--  The app writes resume objects two different ways, and a policy that
--  handles only one would lock those users out of their own files:
--
--    src/components/dashboard/ResumeManager.tsx
--      <user_id>/<timestamp>_<name>.pdf              → user id at position 1
--
--    src/pages/IdentityVault.tsx
--      resumes/<user_id>/<timestamp>.pdf             → user id at position 2
--
--  (The second doubles the bucket name into the key. Harmless, and not
--  worth a migration to rewrite existing objects, so both are accepted.)
--
--  storage.foldername() returns the path segments as text[]. Indexing past
--  the end yields NULL, and NULL = anything is not true, so the two-segment
--  branch simply fails to match a one-segment path rather than erroring.
--
--  ADMINS GET READ ONLY
--  Applications that automation cannot complete are parked for an admin to
--  submit by hand, which is not possible without the candidate's CV. Admins
--  already view every campaign and delete any application, so read access
--  here is consistent with that role. They do not get write or delete: an
--  admin has no reason to alter a candidate's CV, and leaving it out means
--  a bug in the admin app cannot destroy one.
--
--  THE WORKER IS UNAFFECTED — it holds the service role key, which bypasses
--  RLS entirely. These policies constrain browser sessions only.
-- =====================================================================

BEGIN;

-- The permissive policy this migration exists to remove.
DROP POLICY IF EXISTS "Allow authenticated users full access to resumes" ON storage.objects;

-- Older names from earlier attempts at this, dropped so re-running is safe
-- and so nothing left behind can re-open what we just closed.
DROP POLICY IF EXISTS "Authenticated users can upload to resumes bucket" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read resumes"             ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own resume files"                ON storage.objects;
DROP POLICY IF EXISTS "Users can update own resume files"                ON storage.objects;

DROP POLICY IF EXISTS "Users read own resume files"    ON storage.objects;
DROP POLICY IF EXISTS "Users upload own resume files"  ON storage.objects;
DROP POLICY IF EXISTS "Users update own resume files"  ON storage.objects;
DROP POLICY IF EXISTS "Users delete own resume files"  ON storage.objects;
DROP POLICY IF EXISTS "Admins read all resume files"   ON storage.objects;

-- True when the object key belongs to the calling user, under either shape.
-- STABLE, not IMMUTABLE: it reads auth.uid(), which comes from the request's
-- settings. Declaring it immutable would tell the planner the result can be
-- folded to a constant independent of the session — the kind of mistake that
-- works in testing and hands one user another user's files under load.
CREATE OR REPLACE FUNCTION public.owns_resume_object(object_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public, storage
AS $$
  SELECT
    (storage.foldername(object_name))[1] = auth.uid()::text
    OR (
      (storage.foldername(object_name))[1] = 'resumes'
      AND (storage.foldername(object_name))[2] = auth.uid()::text
    );
$$;

CREATE POLICY "Users read own resume files"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'resumes' AND public.owns_resume_object(name));

CREATE POLICY "Users upload own resume files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'resumes' AND public.owns_resume_object(name));

-- Both clauses: USING decides which rows may be updated, WITH CHECK decides
-- what they may become. Without the second, a user could move their own file
-- into someone else's folder.
CREATE POLICY "Users update own resume files"
  ON storage.objects FOR UPDATE TO authenticated
  USING      (bucket_id = 'resumes' AND public.owns_resume_object(name))
  WITH CHECK (bucket_id = 'resumes' AND public.owns_resume_object(name));

CREATE POLICY "Users delete own resume files"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'resumes' AND public.owns_resume_object(name));

CREATE POLICY "Admins read all resume files"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'resumes' AND public.is_admin());

-- Belt and braces: the bucket was created private and must stay that way.
-- A public bucket serves objects over an unauthenticated URL and no policy
-- above would apply.
UPDATE storage.buckets SET public = false WHERE id = 'resumes';

COMMIT;
