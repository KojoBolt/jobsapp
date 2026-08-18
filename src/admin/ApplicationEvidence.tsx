import { useEffect, useState } from "react";
import { Camera, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { T } from "@/admin/ui/system";

const BUCKET = "application-evidence";

/** Ten minutes: long enough to read, short enough that a leaked link expires. */
const TTL_SECONDS = 10 * 60;

/**
 * What the worker was looking at, at each stage.
 *
 * The label is the filename the adapter chose, and it carries the whole story
 * of what happened — which is why they are shown rather than hidden behind a
 * single "screenshot" link.
 */
const LABELS: Record<string, string> = {
  "dry-run": "Filled (not submitted)",
  "before-submit": "Filled, about to submit",
  "after-submit": "After submitting",
  "blocked-questions": "Blocked on questions",
  "no-form": "No form found",
  "no-resume-input": "No résumé field",
  incomplete: "Required fields empty",
  blocked: "Bot challenge",
};

interface Shot {
  name: string;
  label: string;
  url: string;
}

/**
 * Screenshots the automation captured for one application.
 *
 * The bucket is private and admins have a read policy on it, so every image
 * needs a signed URL — a plain public link returns nothing. Signed at view
 * time rather than stored, because these expire.
 */
const ApplicationEvidence = ({
  applicationId,
  /** True when the adapter actually ran — it changes what "no images" means. */
  worked = false,
}: {
  applicationId: string;
  worked?: boolean;
}) => {
  const [shots, setShots] = useState<Shot[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<Shot | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);

      // Objects are keyed <application_id>/<label>.png, so the id is the folder.
      const { data: files, error } = await supabase.storage.from(BUCKET).list(applicationId);
      if (error) console.error("[evidence] list failed:", error);

      const images = (files ?? []).filter((f) => f.name.endsWith(".png"));
      const resolved: Shot[] = [];

      for (const file of images) {
        const path = `${applicationId}/${file.name}`;
        const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, TTL_SECONDS);
        if (!data?.signedUrl) continue;
        const key = file.name.replace(/\.png$/, "");
        resolved.push({ name: file.name, label: LABELS[key] ?? key, url: data.signedUrl });
      }

      // Newest last reads as a sequence: filled → submitted.
      resolved.sort((a, b) => a.name.localeCompare(b.name));
      if (!cancelled) {
        setShots(resolved);
        setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [applicationId]);

  if (loading) {
    return (
      <div className={`h-20 animate-pulse rounded-xl bg-[#EFEFEC] dark:bg-white/10`} />
    );
  }

  // Two different situations, and the earlier version of this message claimed
  // the first one for both. "No adapter yet for workday" means no browser was
  // ever opened, so there is genuinely nothing to capture. A row that reports
  // blocked questions HAS been through a browser, so missing images there mean
  // something else — deleted, or captured before the bucket existed. The
  // caller knows which, so it says.
  if (!shots.length) {
    return (
      <p className={`text-[11.5px] ${T.muted}`}>
        {worked
          ? "No screenshots stored — they may have been deleted, or captured before evidence storage was set up."
          : "No screenshots — the bot never opened this application, so there was nothing to capture."}
      </p>
    );
  }

  return (
    <>
      <div className="flex flex-wrap gap-2.5">
        {shots.map((shot) => (
          <button
            key={shot.name}
            type="button"
            onClick={() => setOpen(shot)}
            className={`group w-[132px] overflow-hidden rounded-xl border ${T.hairline}
                        text-left transition-colors hover:border-[#2a78d6]/40`}
          >
            <img
              src={shot.url}
              alt={shot.label}
              loading="lazy"
              // Top-aligned: the useful part of a full-page form screenshot is
              // always the first few hundred pixels.
              className="h-20 w-full bg-white object-cover object-top"
            />
            <span
              className={`block truncate px-2 py-1.5 text-[10.5px] font-semibold ${T.ink2}`}
            >
              {shot.label}
            </span>
          </button>
        ))}
      </div>

      {open && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4"
          onClick={() => setOpen(null)}
        >
          <div
            className="relative max-h-full w-full max-w-4xl overflow-auto rounded-2xl bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 flex items-center justify-between gap-3 border-b border-[#EAEAE7] bg-white px-4 py-2.5">
              <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[#111110]">
                <Camera size={13} />
                {open.label}
              </span>
              <div className="flex items-center gap-3">
                <a
                  href={open.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#2a78d6] hover:underline"
                >
                  Full size <ExternalLink size={11} />
                </a>
                <button
                  type="button"
                  onClick={() => setOpen(null)}
                  className="text-[12px] font-semibold text-[#6B6A66] hover:text-[#111110]"
                >
                  Close
                </button>
              </div>
            </div>
            <img src={open.url} alt={open.label} className="w-full" />
          </div>
        </div>
      )}
    </>
  );
};

export default ApplicationEvidence;
