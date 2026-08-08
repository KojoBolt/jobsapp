import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  ExternalLink, CheckCircle2, Send, Info, ChevronDown, ChevronUp,
  ClipboardCheck, AlertTriangle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/admin/toast/ToastContext";
import { format, formatDistanceToNow } from "date-fns";
import {
  T, Panel, Th, Avatar, SearchInput, PrimaryButton, GhostButton,
  Pagination, EmptyState, ConfirmDialog,
} from "@/admin/ui/system";
import { useRegisterExport } from "@/admin/context/AdminActionsContext";

interface ApprovedApplication {
  id: string;
  user_id: string;
  company_name: string;
  job_title: string;
  job_url: string | null;
  cover_letter: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string | null;
  user_full_name: string;
  user_email: string;
}

const ITEMS_PER_PAGE = 10;

const csvCell = (v: unknown) => {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const SubmissionQueuePage = (): JSX.Element => {
  const [applications, setApplications] = useState<ApprovedApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [submittingAll, setSubmittingAll] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [expandedApp, setExpandedApp] = useState<string | null>(null);
  const { pushToast } = useToast();

  useEffect(() => {
    fetchApprovedApps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchApprovedApps = async () => {
    try {
      setLoading(true);
      setLoadError(null);

      const { data: apps, error } = await supabase
        .from("applications")
        .select("*")
        .eq("status", "approved")
        .order("updated_at", { ascending: true }); // oldest approved first

      if (error) {
        console.error("[SubmissionQueue] query failed:", error);
        setLoadError(error.message || "Failed to load queue");
        pushToast({ variant: "error", title: "Error", message: error.message || "Failed to load queue" });
        return;
      }

      if (!apps || apps.length === 0) {
        setApplications([]);
        return;
      }

      const userIds = [...new Set(apps.map((a) => a.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);

      const profileMap = new Map(
        (profiles || []).map((p) => [p.id, { full_name: p.full_name, email: p.email }]),
      );

      const enriched: ApprovedApplication[] = apps.map((app) => {
        const profile = profileMap.get(app.user_id);
        return {
          ...app,
          user_full_name: profile?.full_name || "Unknown User",
          user_email: profile?.email || "No email",
        };
      });

      setApplications(enriched);
    } catch (err: any) {
      console.error("[SubmissionQueue] unexpected error:", err);
      setLoadError(err?.message || "Unexpected error");
      pushToast({ variant: "error", title: "Error", message: "Unexpected error" });
    } finally {
      setLoading(false);
    }
  };

  const getAdminId = async (): Promise<string | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id ?? null;
  };

  // Single submit — race-guarded + audit-stamped.
  const handleMarkSubmitted = async (appId: string) => {
    setSubmitting(appId);
    try {
      const adminId = await getAdminId();
      const { data, error } = await supabase
        .from("applications")
        .update({
          status: "submitted",
          submitted_at: new Date().toISOString(),
          submitted_by: adminId,
        })
        .eq("id", appId)
        .eq("status", "approved")            // only approved → submitted
        .select();

      if (error) {
        pushToast({ variant: "error", title: "Error", message: `Failed: ${error.message}` });
        return;
      }
      if (!data || data.length === 0) {
        pushToast({
          variant: "warning",
          title: "Skipped",
          message: "This application is no longer awaiting submission.",
        });
        setApplications((prev) => prev.filter((a) => a.id !== appId)); // drop stale row
        return;
      }

      setApplications((prev) => prev.filter((a) => a.id !== appId));
      pushToast({ variant: "success", title: "Submitted!", message: "Application marked as submitted." });
    } catch (err: any) {
      pushToast({ variant: "error", title: "Error", message: err.message });
    } finally {
      setSubmitting(null);
    }
  };

  // Bulk submit — scoped to the CURRENTLY FILTERED set (respects the search box),
  // chunked to stay within request limits, race-guarded, audit-stamped.
  const handleSubmitAll = async () => {
    if (filtered.length === 0) return;

    setSubmittingAll(true);
    try {
      const adminId = await getAdminId();
      const ids = filtered.map((a) => a.id);
      const submittedIds = new Set<string>();

      for (let i = 0; i < ids.length; i += 50) {
        const chunk = ids.slice(i, i + 50);
        const { data, error } = await supabase
          .from("applications")
          .update({
            status: "submitted",
            submitted_at: new Date().toISOString(),
            submitted_by: adminId,
          })
          .in("id", chunk)
          .eq("status", "approved")
          .select("id");

        if (error) {
          pushToast({ variant: "error", title: "Error", message: `Failed partway: ${error.message}` });
          break;
        }
        (data || []).forEach((r: { id: string }) => submittedIds.add(r.id));
      }

      if (submittedIds.size > 0) {
        setApplications((prev) => prev.filter((a) => !submittedIds.has(a.id)));
        pushToast({
          variant: "success",
          title: "Submitted",
          message: `${submittedIds.size} application${submittedIds.size === 1 ? "" : "s"} marked as submitted.`,
        });
      } else {
        pushToast({
          variant: "warning",
          title: "Nothing submitted",
          message: "No approved applications were updated.",
        });
      }
    } catch (e: any) {
      pushToast({ variant: "error", title: "Error", message: e.message });
    } finally {
      setSubmittingAll(false);
      setConfirmOpen(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return applications.filter(
      (app) =>
        app.company_name.toLowerCase().includes(q) ||
        app.job_title.toLowerCase().includes(q) ||
        app.user_full_name.toLowerCase().includes(q),
    );
  }, [applications, search]);

  const exportCsv = useCallback(() => {
    const header = ["Applicant", "Email", "Company", "Job title", "Job URL", "Approved on"];
    const rows = filtered.map((a) => [
      a.user_full_name, a.user_email, a.company_name, a.job_title, a.job_url ?? "",
      format(new Date(a.updated_at || a.created_at), "yyyy-MM-dd"),
    ]);
    const csv = [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `submission-queue-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filtered]);

  useRegisterExport(exportCsv);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  // Oldest item in the queue — the thing most at risk of going stale.
  const oldest = filtered.length
    ? filtered[0].updated_at || filtered[0].created_at
    : null;

  /** Cover letter + notes panel — shared by the desktop table and mobile cards. */
  const renderLetter = (app: ApprovedApplication) => (
    <div className={`border-t ${T.hairline} bg-[#FAFAF8] px-4 py-4 dark:bg-white/[0.02] sm:px-5`}>
      <p className={`mb-2 text-[10px] font-semibold uppercase tracking-[0.08em] ${T.muted}`}>
        Cover letter
      </p>
      <div className={`max-h-60 overflow-y-auto rounded-xl border ${T.hairline} bg-white p-4 dark:bg-[#1A1A19]`}>
        <p className={`whitespace-pre-wrap text-[12.5px] leading-relaxed ${T.ink}`}>
          {app.cover_letter || (
            <span className={`italic ${T.muted}`}>No cover letter available.</span>
          )}
        </p>
      </div>
      {app.admin_notes && (
        <div className="mt-3 rounded-xl border border-[#FAB219]/30 bg-[#FAB219]/10 p-3">
          <p className={`text-[10px] font-semibold uppercase tracking-[0.08em] ${T.muted}`}>
            Admin notes
          </p>
          <p className={`mt-1 text-[12px] ${T.ink}`}>{app.admin_notes}</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className={`text-[20px] font-bold tracking-[-0.01em] ${T.ink}`}>Submission Queue</h1>
          <p className={`text-[12px] ${T.muted}`}>
            {loading
              ? "Loading…"
              : `${filtered.length} approved application${filtered.length !== 1 ? "s" : ""} ready to submit`}
            {oldest && !loading && (
              <> · oldest {formatDistanceToNow(new Date(oldest), { addSuffix: true })}</>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <SearchInput
            value={search}
            onChange={(v) => { setSearch(v); setCurrentPage(1); }}
            placeholder="Applicant, company, role…"
          />
          {!loading && filtered.length > 0 && (
            <PrimaryButton onClick={() => setConfirmOpen(true)}>
              <Send size={13} />
              {submittingAll ? "Submitting…" : `Submit all (${filtered.length})`}
            </PrimaryButton>
          )}
        </div>
      </div>

      {/* ── How-to banner ───────────────────────────────────────────────── */}
      <Panel className="flex items-start gap-3 px-5 py-3.5">
        <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#2a78d6]/10 text-[#2a78d6] dark:bg-[#3987e5]/15 dark:text-[#3987e5]">
          <Info size={14} />
        </span>
        <div>
          <p className={`text-[12.5px] font-semibold ${T.ink}`}>How this queue works</p>
          <p className={`mt-0.5 text-[11.5px] leading-relaxed ${T.ink2}`}>
            These applications are reviewed and approved. Open the job posting, submit manually
            using the applicant&apos;s cover letter, then mark it as submitted here.
          </p>
        </div>
      </Panel>

      {/* ── Mobile: one card per application ────────────────────────────── */}
      <div className="space-y-3 md:hidden">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <Panel key={i} className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 animate-pulse rounded-full bg-[#EFEFEC] dark:bg-white/10" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-32 animate-pulse rounded bg-[#EFEFEC] dark:bg-white/10" />
                  <div className="h-3 w-44 animate-pulse rounded bg-[#EFEFEC] dark:bg-white/10" />
                </div>
              </div>
            </Panel>
          ))
        ) : paginated.length > 0 ? (
          paginated.map((app) => {
            const isOpen = expandedApp === app.id;
            const busy = submitting === app.id || submittingAll;

            return (
              <Panel key={app.id} className="overflow-hidden">
                <div className="flex items-start gap-3 p-4">
                  <Avatar name={app.user_full_name} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-[14px] font-bold ${T.ink}`}>{app.user_full_name}</p>
                    <p className={`truncate text-[12px] ${T.muted}`}>{app.user_email}</p>
                  </div>
                </div>

                <div className={`border-t ${T.hairline} p-4`}>
                  <p className={`text-[13px] font-semibold ${T.ink}`}>{app.company_name}</p>
                  <p className={`text-[12px] ${T.ink2}`}>{app.job_title}</p>

                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className={`text-[11px] ${T.muted}`}>
                      Approved {formatDistanceToNow(new Date(app.updated_at || app.created_at), { addSuffix: true })}
                    </span>
                    {app.job_url && (
                      <a
                        href={app.job_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-0.5 text-[11px] font-medium text-[#2a78d6] hover:underline dark:text-[#3987e5]"
                      >
                        Open posting <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                </div>

                {/* Mark submitted is the primary action here, so it gets the
                    full width rather than competing in a button row. */}
                <div className={`space-y-2 border-t ${T.hairline} p-4`}>
                  <button
                    onClick={() => !busy && handleMarkSubmitted(app.id)}
                    disabled={busy}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#111110]
                               px-3 py-2.5 text-[13px] font-semibold text-white transition-opacity
                               hover:opacity-90 disabled:opacity-50 dark:bg-white dark:text-[#111110]"
                  >
                    <CheckCircle2 size={14} />
                    {submitting === app.id ? "Marking…" : "Mark submitted"}
                  </button>

                  <button
                    onClick={() => setExpandedApp(isOpen ? null : app.id)}
                    className={`flex w-full items-center justify-center gap-1.5 rounded-xl border ${T.hairline}
                                px-3 py-2 text-[12.5px] font-medium ${T.ink2} transition-colors
                                hover:bg-[#F4F4F2] dark:hover:bg-white/5`}
                  >
                    {isOpen ? <><ChevronUp size={13} /> Hide letter</> : <><ChevronDown size={13} /> View letter</>}
                  </button>
                </div>

                {isOpen && renderLetter(app)}
              </Panel>
            );
          })
        ) : (
          <Panel>
            {loadError ? (
              <EmptyState icon={AlertTriangle} title="Couldn't load the queue" hint={loadError} />
            ) : (
              <EmptyState
                icon={search ? ClipboardCheck : CheckCircle2}
                title={search ? "No matches" : "Queue is empty"}
                hint={
                  search
                    ? "No approved applications match that search."
                    : "Nothing approved is waiting to be submitted."
                }
              />
            )}
          </Panel>
        )}
      </div>

      {/* ── Desktop: table ──────────────────────────────────────────────── */}
      <Panel className="hidden overflow-hidden md:block">
        {loading ? (
          <div className={`divide-y ${T.divide}`}>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-4">
                <div className="h-8 w-8 animate-pulse rounded-full bg-[#EFEFEC] dark:bg-white/10" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-40 animate-pulse rounded bg-[#EFEFEC] dark:bg-white/10" />
                  <div className="h-3 w-56 animate-pulse rounded bg-[#EFEFEC] dark:bg-white/10" />
                </div>
              </div>
            ))}
          </div>
        ) : paginated.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px]">
              <thead className={`border-b ${T.hairline} bg-[#FAFAF8] dark:bg-white/[0.02]`}>
                <tr>
                  <Th>Applicant</Th>
                  <Th>Company</Th>
                  <Th>Job title</Th>
                  <Th>Approved</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody className={`divide-y ${T.divide}`}>
                {paginated.map((app) => {
                  const isOpen = expandedApp === app.id;
                  const busy = submitting === app.id || submittingAll;

                  return (
                    <React.Fragment key={app.id}>
                      <tr className={`transition-colors ${T.hover}`}>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={app.user_full_name} />
                            <div className="min-w-0">
                              <p className={`truncate text-[13px] font-semibold ${T.ink}`}>
                                {app.user_full_name}
                              </p>
                              <p className={`truncate text-[11px] ${T.muted}`}>{app.user_email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className={`text-[12.5px] font-semibold ${T.ink}`}>{app.company_name}</p>
                          {app.job_url && (
                            <a
                              href={app.job_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-0.5 text-[10.5px] font-medium text-[#2a78d6] hover:underline dark:text-[#3987e5]"
                            >
                              Open posting <ExternalLink size={9} />
                            </a>
                          )}
                        </td>
                        <td className={`px-5 py-3.5 text-[12.5px] ${T.ink2}`}>{app.job_title}</td>
                        <td className="px-5 py-3.5">
                          <p className={`text-[12px] tabular-nums ${T.ink2}`}>
                            {format(new Date(app.updated_at || app.created_at), "d MMM yyyy")}
                          </p>
                          <p className={`text-[10.5px] ${T.muted}`}>
                            {formatDistanceToNow(new Date(app.updated_at || app.created_at), { addSuffix: true })}
                          </p>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end gap-2">
                            <GhostButton onClick={() => setExpandedApp(isOpen ? null : app.id)}>
                              {isOpen ? <><ChevronUp size={13} /> Hide</> : <><ChevronDown size={13} /> Letter</>}
                            </GhostButton>
                            <PrimaryButton onClick={() => !busy && handleMarkSubmitted(app.id)}>
                              <CheckCircle2 size={13} />
                              {submitting === app.id ? "Marking…" : "Mark submitted"}
                            </PrimaryButton>
                          </div>
                        </td>
                      </tr>

                      {isOpen && (
                        <tr>
                          <td colSpan={5} className="p-0">
                            {renderLetter(app)}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : loadError ? (
          <EmptyState icon={AlertTriangle} title="Couldn't load the queue" hint={loadError} />
        ) : (
          <EmptyState
            icon={search ? ClipboardCheck : CheckCircle2}
            title={search ? "No matches" : "Queue is empty"}
            hint={
              search
                ? "No approved applications match that search."
                : "Nothing approved is waiting to be submitted."
            }
          />
        )}
      </Panel>

      <Pagination page={currentPage} totalPages={totalPages} onChange={setCurrentPage} />

      <ConfirmDialog
        open={confirmOpen}
        busy={submittingAll}
        title="Mark all as submitted?"
        destructive
        confirmLabel={`Submit ${filtered.length}`}
        body={
          <>
            This marks <strong>{filtered.length}</strong> approved application
            {filtered.length === 1 ? "" : "s"} as submitted
            {search && <> matching “{search}”</>}. This cannot be undone.
          </>
        }
        onConfirm={handleSubmitAll}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
};

export default SubmissionQueuePage;
