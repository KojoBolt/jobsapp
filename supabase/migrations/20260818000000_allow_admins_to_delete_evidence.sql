-- =====================================================================
--  Let admins delete automation screenshots.
--
--  20260816020000 gave admins SELECT on application-evidence and nothing
--  else, on the reasoning that a browser has no business altering evidence of
--  what was sent. That was right for the worker's writes — those still come
--  from the service role — but it also silently blocked the admin UI's own
--  delete button: storage.remove() returns an error, the click appears to do
--  nothing, and the spinner never resolves.
--
--  DELETE only. Admins still cannot INSERT or UPDATE here, so the only way an
--  image enters this bucket remains the worker itself. An admin can discard a
--  screenshot; nobody with a browser session can forge one.
-- =====================================================================

BEGIN;

DROP POLICY IF EXISTS "Admins delete application evidence" ON storage.objects;

CREATE POLICY "Admins delete application evidence"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'application-evidence' AND public.is_admin());

COMMIT;
