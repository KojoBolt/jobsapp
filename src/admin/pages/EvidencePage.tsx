import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Camera, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  T, Panel, SearchInput, PillMenu, EmptyState, StatusPill, Pagination, ConfirmDialog,
} from "@/admin/ui/system";
import ApplicationEvidence from "@/admin/ApplicationEvidence";
import ApplicationFillValues from "@/admin/ApplicationFillValues";
import { Trash2 } from "lucide-react";

const BUCKET = "application-evidence";
const PER_PAGE = 10;

/**
 * Remove one application's screenshots.
 *
 * Deletes the IMAGES, never the application. This page is about what the bot
 * saw, so "delete" here means "clear these screenshots" — removing a customer's
 * application from a screenshots screen would be a surprising place to lose it.
 *
 * Returns how many objects went, so the caller can report the real number
 * rather than an assumed one.
 */
async function deleteEvidenceFor(applicationId: string): Promise<number> {
  const { data: files } = await supabase.storage.from(BUCKET).list(applicationId);
  const paths = (files ?? []).map((f) => `${applicationId}/${f.name}`);

  if (paths.length) {
    const { error } = await supabase.storage.from(BUCKET).remove(paths);
    if (error) throw new Error(error.message);
  }

  // The column points at an object that no longer exists, so it has to go too
  // — otherwise the row still claims to have evidence.
  // Cast: automation_evidence post-dates the generated Supabase types, the
  // same drift as `source` and `resumes.file_path`.
  await supabase
    .from("applications")
    .update({ automation_evidence: null, automation_error: null, automation_blocked: null } as never)
    .eq("id", applicationId);
  return paths.length;
}

/**
 * Every application the automation has worked on, with what it saw.
 *
 * Separate from the Review Queue on purpose. The queue is organised around a
 * decision — approve or reject this application. This page is organised around
 * a question — what is the robot actually doing, and where is it getting
 * stuck? Those want different shapes, and answering the second one inside the
 * first meant opening applications one at a time to find out.
 */

interface Row {
  id: string;
  /** Needed to read that candidate's vault for the copy-to-fill panel. */
  user_id: string;
  cover_letter: string | null;
  company_name: string | null;
  job_title: string | null;
  job_url: string | null;
  status: string;
  automation_error: string | null;
  automation_blocked: string[] | null;
  automation_claimed_at: string | null;
}

const OUTCOMES = [
  { value: "__all__", label: "All outcomes" },
  { value: "submitted", label: "Submitted" },
  { value: "blocked", label: "Blocked on questions" },
  { value: "dry", label: "Dry run" },
] as const;

const EvidencePage = (): JSX.Element => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [outcome, setOutcome] = useState<string>("__all__");
  const [openId, setOpenId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<Row | null>(null);
  const [confirmAll, setConfirmAll] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      // Anything the worker has touched leaves one of these behind, so this is
      // the set of applications that could possibly have a screenshot.
      const { data, error } = await supabase
        .from("applications")
        .select("id, user_id, cover_letter, company_name, job_title, job_url, status, automation_error, automation_blocked, automation_claimed_at")
        .or("automation_error.not.is.null,automation_evidence.not.is.null")
        .order("automation_claimed_at", { ascending: false, nullsFirst: false })
        .limit(200);

      if (error) console.error("[evidence] query failed:", error);
      setRows((data ?? []) as unknown as Row[]);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (q && !`${r.company_name ?? ""} ${r.job_title ?? ""}`.toLowerCase().includes(q)) return false;
      if (outcome === "__all__") return true;
      if (outcome === "submitted") return r.status === "submitted";
      if (outcome === "dry") return /dry run/i.test(r.automation_error ?? "");
      return (r.automation_blocked?.length ?? 0) > 0;
    });
  }, [rows, search, outcome]);

  // Filters change the result count, so a page number from the old list can
  // point past the end of the new one.
  useEffect(() => { setPage(1); }, [search, outcome]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const visible = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  /** Drop a row from view once its screenshots are gone. */
  const forget = (ids: string[]) => {
    const gone = new Set(ids);
    setRows((prev) => prev.filter((r) => !gone.has(r.id)));
    setOpenId(null);
  };

  const removeOne = async () => {
    if (!deleteTarget) return;
    setBusy(true);
    setError(null);
    try {
      await deleteEvidenceFor(deleteTarget.id);
      forget([deleteTarget.id]);
      setDeleteTarget(null);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Delete failed";
      console.error("[evidence] delete failed:", e);
      setError(
        /policy|permission|denied/i.test(message)
          ? "Not permitted — the storage delete policy migration may not be applied yet."
          : message,
      );
      setDeleteTarget(null);
    } finally {
      setBusy(false);
    }
  };

  /**
   * Clears screenshots for everything currently LISTED — the filtered set, not
   * the whole table. What you can see is what goes, which is the only version
   * of "delete all" that is safe next to a search box.
   */
  const removeAllListed = async () => {
    setBusy(true);
    setError(null);
    try {
      // Listed in parallel, then removed in bulk. One-at-a-time meant three
      // round trips per application — for 200 rows that is 600 sequential
      // requests, which is why this appeared to hang rather than work.
      const listed = await Promise.all(
        filtered.map(async (row) => {
          const { data } = await supabase.storage.from(BUCKET).list(row.id);
          return { id: row.id, paths: (data ?? []).map((f) => `${row.id}/${f.name}`) };
        }),
      );

      const allPaths = listed.flatMap((l) => l.paths);
      // Chunked: the storage API takes a list, but not an unbounded one.
      for (let i = 0; i < allPaths.length; i += 100) {
        const { error } = await supabase.storage.from(BUCKET).remove(allPaths.slice(i, i + 100));
        if (error) throw new Error(error.message);
      }

      const ids = listed.map((l) => l.id);
      for (let i = 0; i < ids.length; i += 100) {
        await supabase
          .from("applications")
          .update({ automation_evidence: null, automation_error: null, automation_blocked: null } as never)
          .in("id", ids.slice(i, i + 100));
      }

      forget(ids);
      setConfirmAll(false);
      setPage(1);
    } catch (e) {
      // Surfaced, not just logged. A delete that fails silently is what sent
      // you looking at a spinner that never finished.
      const message = e instanceof Error ? e.message : "Delete failed";
      console.error("[evidence] delete all failed:", e);
      setError(
        /policy|permission|denied/i.test(message)
          ? "Not permitted — the storage delete policy migration may not be applied yet."
          : message,
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className={`text-[20px] font-bold tracking-[-0.01em] ${T.ink}`}>Automation screenshots</h1>
          <p className={`text-[12px] ${T.muted}`}>
            {loading ? "Loading…" : `${filtered.length} application${filtered.length === 1 ? "" : "s"} worked by the bot`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SearchInput value={search} onChange={setSearch} placeholder="Search company or role…" />
          {!loading && filtered.length > 0 && (
            <button
              type="button"
              onClick={() => setConfirmAll(true)}
              title={`Clear screenshots for all ${filtered.length} listed`}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border ${T.hairline}
                          px-3 py-1.5 text-[12px] font-semibold text-[#B32F2F]
                          transition-colors hover:border-[#D03B3B]/40 hover:bg-[#D03B3B]/10
                          dark:text-[#EF7A7A]`}
            >
              <Trash2 size={13} />
              <span className="hidden sm:inline">Delete all</span>
            </button>
          )}
          <PillMenu
            value={outcome}
            options={OUTCOMES as unknown as { value: string; label: string }[]}
            heading="Outcome"
            onChange={setOutcome}
          />
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-[#D03B3B]/30 bg-[#D03B3B]/10 px-3.5 py-2.5 text-[12px] font-medium text-[#B32F2F] dark:text-[#EF7A7A]">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Panel key={i} className="h-24 animate-pulse"><span /></Panel>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Panel className="p-8">
          <EmptyState
            icon={Camera}
            title="Nothing to show yet"
            hint="Screenshots appear here once the worker has attempted an application."
          />
        </Panel>
      ) : (
        <div className="space-y-3">
          {visible.map((r) => {
            const isOpen = openId === r.id;
            const blockedCount = r.automation_blocked?.length ?? 0;

            return (
              <Panel key={r.id} className="overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenId(isOpen ? null : r.id)}
                  className={`flex w-full items-start justify-between gap-4 p-4 text-left ${T.hover}`}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[13.5px] font-bold ${T.ink}`}>{r.company_name ?? "Unknown"}</span>
                      <StatusPill status={r.status} />
                      {blockedCount > 0 && (
                        <span className="rounded-md bg-[#D03B3B]/10 px-1.5 py-0.5 text-[10.5px] font-semibold text-[#B32F2F] dark:text-[#EF7A7A]">
                          {blockedCount} blocked
                        </span>
                      )}
                    </div>
                    <p className={`mt-0.5 truncate text-[12.5px] ${T.ink2}`}>{r.job_title}</p>
                    {r.automation_error && (
                      <p className={`mt-1 line-clamp-2 text-[11.5px] ${T.muted}`}>{r.automation_error}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className={`text-[11.5px] tabular-nums ${T.muted}`}>
                      {r.automation_claimed_at ? format(new Date(r.automation_claimed_at), "d MMM, HH:mm") : "—"}
                    </span>
                    {r.job_url && (
                      <a
                        href={r.job_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-0.5 text-[11px] text-[#2a78d6] hover:underline"
                      >
                        Posting <ExternalLink size={9} />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setDeleteTarget(r); }}
                      title="Clear this automation record"
                      className={`mt-0.5 inline-flex items-center gap-1 text-[11px] font-semibold
                                  text-[#B32F2F] hover:underline dark:text-[#EF7A7A]`}
                    >
                      <Trash2 size={10} /> Delete
                    </button>
                  </div>
                </button>

                {/* Images are only fetched when a row is opened — signing a URL
                    per screenshot for 200 rows up front would be pointless
                    work, and signed URLs expire. */}
                {isOpen && (
                  <div className={`border-t ${T.hairline} bg-[#FAFAF8] p-4 dark:bg-white/[0.02]`}>
                    <ApplicationEvidence applicationId={r.id} worked={blockedCount > 0} />

                    {/* Everything needed to finish this application by hand,
                        right beside the screenshot of where the bot stopped.
                        The panel lists the blocked questions itself, so the
                        separate list that used to sit here only repeated it. */}
                    <div className="mt-4">
                      <ApplicationFillValues
                        applicationId={r.id}
                        userId={r.user_id}
                        coverLetter={r.cover_letter}
                      />
                    </div>
                  </div>
                )}
              </Panel>
            );
          })}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        destructive
        busy={busy}
        title="Clear this automation record?"
        confirmLabel={busy ? "Deleting…" : "Delete"}
        body={
          <>
            This removes the screenshots, the error and the blocked-question list for{" "}
            <strong>{deleteTarget?.company_name}</strong> — the application itself, its status and its cover letter are not touched.
            {deleteTarget?.status === "submitted" && (
              <> These are the proof this application was actually sent.</>
            )}{" "}
            This can’t be undone.
          </>
        }
        onConfirm={removeOne}
        onCancel={() => !busy && setDeleteTarget(null)}
      />

      <ConfirmDialog
        open={confirmAll}
        destructive
        busy={busy}
        title={`Delete screenshots for ${filtered.length} application${filtered.length === 1 ? "" : "s"}?`}
        confirmLabel={busy ? "Deleting…" : `Delete ${filtered.length}`}
        body={
          <>
            This clears the screenshots, errors and blocked-question lists for every application currently listed
            {search ? <> matching “{search}”</> : null}
            {outcome !== "__all__" ? <> under that outcome filter</> : null}. The applications
            themselves are not touched. This can’t be undone.
          </>
        }
        onConfirm={removeAllListed}
        onCancel={() => !busy && setConfirmAll(false)}
      />
    </div>
  );
};

export default EvidencePage;
