-- =====================================================================
--  Put resumes.file_path into migrations, and recover it where missing.
--
--  THE DRIFT
--  src/pages/IdentityVault.tsx and src/components/dashboard/ResumeManager.tsx
--  both write `file_path`, and 20260305120000_create_resumes_table.sql never
--  created it — so it exists only in the live database, added by hand. The
--  schema is therefore not reproducible from this repo: a fresh environment
--  would break resume uploads with a column-not-found error, which PostgREST
--  reports as a schema cache miss rather than anything mentioning the column.
--
--  WHY IT MATTERS NOW
--  The worker downloads the CV to attach it to an application form, and the
--  path is the only usable handle on the object. `file_url` is not: the
--  bucket is private (see 20260305150000 and 20260816000000) but both upload
--  paths call getPublicUrl(), so the stored URL points at an endpoint that
--  refuses to serve it. That is a separate bug, still open, and not what this
--  migration fixes — it only makes sure the path is present and durable.
--
--  ADD COLUMN IF NOT EXISTS is a no-op against your database, where the
--  column already exists. It is here so the next environment built from
--  migrations matches this one.
-- =====================================================================

BEGIN;

ALTER TABLE public.resumes
  ADD COLUMN IF NOT EXISTS file_path text;

COMMENT ON COLUMN public.resumes.file_path IS
  'Object key within the private `resumes` bucket. The only reliable way to '
  'read the file — file_url is a getPublicUrl() result on a private bucket '
  'and does not resolve. Two shapes are in use: "<user_id>/..." from '
  'ResumeManager and "resumes/<user_id>/..." from IdentityVault.';

-- ── Backfill ────────────────────────────────────────────────────────────
-- Rows written before file_path existed still carry a file_url containing
-- the object key, so the path can be recovered from it:
--
--   https://<project>.supabase.co/storage/v1/object/public/resumes/<key>
--                                            └ public | sign ┘        └key┘
--
-- Guarded two ways, because a wrong path is worse than a null one — null
-- fails loudly at download time, wrong silently attaches nothing:
--   * the extracted key must be non-empty
--   * an object with exactly that key must exist in the bucket
--
-- Rows that fail either check are left alone. Those are mostly the Cloudinary
-- uploads from the old onboarding flow, which never had a storage object at
-- all and cannot be recovered here.
UPDATE public.resumes AS r
SET    file_path = c.path
FROM (
  SELECT
    id,
    -- split_part strips any ?token=… from a signed URL.
    split_part(
      substring(file_url from '/object/[^/]+/resumes/(.*)$'),
      '?', 1
    ) AS path
  FROM public.resumes
  WHERE (file_path IS NULL OR file_path = '')
    AND file_url IS NOT NULL
) AS c
WHERE r.id = c.id
  AND c.path <> ''
  AND EXISTS (
    SELECT 1 FROM storage.objects o
    WHERE o.bucket_id = 'resumes' AND o.name = c.path
  );

COMMIT;
