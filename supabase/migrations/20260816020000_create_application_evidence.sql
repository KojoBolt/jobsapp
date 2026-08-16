-- =====================================================================
--  Storage for proof that an application was actually filled in and sent.
--
--  The worker screenshots the completed form before it submits, and the page
--  it lands on afterwards. Three reasons that matters:
--
--    * a customer can be shown their application really went out
--    * a failure is debuggable without reproducing it — which often cannot be
--      done at all, because the posting has since closed
--    * during the dry run it IS the deliverable: there is no other way to
--      tell whether the adapter filled a form correctly than to look at it
--
--  Objects are keyed  <application_id>/<label>.png  which is what both
--  policies below rely on to establish ownership.
-- =====================================================================

BEGIN;

INSERT INTO storage.buckets (id, name, public)
VALUES ('application-evidence', 'application-evidence', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Users read own application evidence"  ON storage.objects;
DROP POLICY IF EXISTS "Admins read all application evidence" ON storage.objects;

-- The first path segment is the application id, so ownership is a join away.
-- Read only, for both roles: these files are written by the worker under the
-- service role, and nothing that runs in a browser has any reason to alter
-- evidence of what was sent.
CREATE POLICY "Users read own application evidence"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'application-evidence'
    AND EXISTS (
      SELECT 1 FROM public.applications a
      WHERE a.id::text = (storage.foldername(name))[1]
        AND a.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins read all application evidence"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'application-evidence' AND public.is_admin());

-- Where the worker records the object key, so nothing has to guess at the
-- label it used.
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS automation_evidence text;

COMMENT ON COLUMN public.applications.automation_evidence IS
  'Object key in the application-evidence bucket for the most recent '
  'screenshot taken while working this application.';

COMMIT;
