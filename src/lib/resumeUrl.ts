import { supabase } from "@/integrations/supabase/client";

/**
 * Resolve a viewable URL for a résumé row.
 *
 * WHY THIS EXISTS
 * `resumes.file_url` is not reliably viewable. Both storage upload paths —
 * IdentityVault.tsx and ResumeManager.tsx — call `getPublicUrl()`, but the
 * `resumes` bucket is private, so those URLs point at an endpoint that
 * refuses to serve them. Every "View resume" link built from `file_url` is
 * therefore dead for anything uploaded through the app.
 *
 * `file_url` is NOT universally broken though: the old onboarding flow
 * uploaded to Cloudinary and stored a genuine, working URL. Those rows have
 * no `file_path`. So the rule is:
 *
 *   file_path present  → sign it (the object lives in our private bucket)
 *   file_path absent   → fall back to file_url (legacy Cloudinary)
 *
 * Signed URLs expire, which is exactly why one must never be written back to
 * the row — resolve at view time, every time.
 */
export async function resolveResumeUrl(row: {
  file_path?: string | null;
  file_url?: string | null;
}): Promise<string | null> {
  const path = row.file_path?.trim();

  if (path) {
    const { data, error } = await supabase.storage
      .from("resumes")
      .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

    if (error) {
      console.error("[resumeUrl] could not sign", path, error);
      // Deliberately no fall-through to file_url here: for a row that has a
      // path, file_url is the broken public URL, and returning it would turn
      // a clear failure into a link that opens an error page.
      return null;
    }
    return data?.signedUrl ?? null;
  }

  return row.file_url?.trim() || null;
}

/** Long enough to open and read the document, short enough that a leaked
 *  link is not a standing grant. */
export const SIGNED_URL_TTL_SECONDS = 10 * 60;
