import React, { useState, useEffect, useMemo } from "react";
import {
  CheckCircle2, ChevronDown, ChevronUp, ChevronRight, ExternalLink, Inbox, Briefcase, Trash2,
} from "lucide-react";
import ReviewModal from "../../admin/ReviewModal";
import { format } from "date-fns";
import { useToast } from "@/admin/toast/ToastContext";
import { supabase } from "@/integrations/supabase/client";
import {
  T, Panel, Th, Avatar, StatusPill, ScoreMeter, SearchInput, TabBar, PillMenu,
  PrimaryButton, GhostButton, Pagination, EmptyState, ConfirmDialog,
} from "@/admin/ui/system";

interface Application {
  id: string;
  user_id: string;
  company_name: string;
  job_title: string;
  job_url: string | null;
  job_description: string | null;
  cover_letter: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  campaign_id: string | null;
  match_score: number | null;
  /** Which job API the posting came from — see SOURCE_LABELS. */
  source: string | null;
}

interface UserWithApps {
  user_id: string;
  full_name: string;
  email: string;
  total_apps: number;
  applications: Application[];
}

type TabKey = "pending" | "approved" | "submitted" | "revision" | "completed" | "rejected";

/**
 * The complete app_status enum. Typing TABS against this is deliberate:
 * querying a value outside the enum makes Postgres reject the whole request
 * (22P02 invalid input value), so a tab silently returns nothing. Keeping the
 * union here turns that runtime failure into a compile error.
 */
type DbStatus =
  | "queued" | "drafting" | "pending_review"
  | "approved" | "submitted" | "completed" | "failed";

const TABS: { key: TabKey; label: string; statuses: DbStatus[] }[] = [
  { key: "pending",   label: "All Applications", statuses: ["queued", "pending_review"] },
  { key: "approved",  label: "Approved",         statuses: ["approved"] },
  { key: "submitted", label: "Submitted",        statuses: ["submitted"] },
  { key: "revision",  label: "Needs Revision",   statuses: ["drafting"] },
  { key: "completed", label: "Completed",        statuses: ["completed"] },
  { key: "rejected",  label: "Rejected",         statuses: ["failed"] },
];

/**
 * Every value `applications.source` is written with, mapped to how it should
 * read on screen. Anything not listed still appears in the filter — titlecased
 * from the raw value — so a source added to sourcing.ts shows up here without
 * this file needing to change. The map exists for capitalisation the machine
 * cannot guess: "smartrecruiters" is SmartRecruiters, not Smartrecruiters.
 */
const SOURCE_LABELS: Record<string, string> = {
  greenhouse: "Greenhouse",
  lever: "Lever",
  workday: "Workday",
  smartrecruiters: "SmartRecruiters",
  adzuna: "Adzuna",
  reed: "Reed",
  arbeitnow: "Arbeitnow",
  remotive: "Remotive",
  jsearch: "JSearch",
  findwork: "Findwork",
  themuse: "The Muse",
};

const sourceLabel = (raw: string) =>
  SOURCE_LABELS[raw] ?? raw.charAt(0).toUpperCase() + raw.slice(1);

/** Sentinel for "don't filter" — an empty string reads as a real option. */
const ALL_SOURCES = "__all__";

const ITEMS_PER_PAGE = 10;
const JOBS_PER_PAGE = 5;

const ReviewQueuePage = (): JSX.Element => {
  const [users, setUsers] = useState<UserWithApps[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("pending");
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string>(ALL_SOURCES);
  const [currentPage, setCurrentPage] = useState(1);
  const [jobPages, setJobPages] = useState<Record<string, number>>({});
  const [deleteTarget, setDeleteTarget] = useState<Application | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const { pushToast } = useToast();

  useEffect(() => {
    const fetchUsersWithApps = async () => {
      try {
        setLoading(true);
        const activeTabConfig = TABS.find((t) => t.key === activeTab);
        const statuses = activeTabConfig?.statuses || ["queued"];

        const { data: appsData, error: appsError } = await supabase
          .from("applications")
          .select("*")
          .in("status", statuses)
          .order("created_at", { ascending: false });

        if (appsError) {
          console.error("[ReviewQueue] applications query failed:", appsError);
          pushToast({
            variant: "error",
            title: "Error",
            message: appsError.message || "Failed to load applications",
          });
          return;
        }

        if (!appsData || appsData.length === 0) {
          setUsers([]);
          return;
        }

        const userIds = [...new Set(appsData.map((a) => a.user_id))];

        const { data: profilesData } = await supabase
          .from("profiles")
          .select("*")
          .in("id", userIds);

        const profileMap = new Map<string, { full_name: string; email: string }>();
        (profilesData || []).forEach((p: any) => {
          profileMap.set(p.id, {
            full_name: p.full_name || p.first_name || "Unknown User",
            email: p.email || "No email",
          });
        });

        const userMap = new Map<string, UserWithApps>();

        appsData.forEach((app) => {
          const userId = app.user_id;
          const profile = profileMap.get(userId);

          if (!userMap.has(userId)) {
            userMap.set(userId, {
              user_id: userId,
              full_name: profile?.full_name || "Unknown User",
              email: profile?.email || "No email",
              total_apps: 0,
              applications: [],
            });
          }

          const user = userMap.get(userId)!;
          user.total_apps += 1;
          user.applications.push({
            id: app.id,
            user_id: app.user_id,
            company_name: app.company_name,
            job_title: app.job_title,
            job_url: app.job_url,
            job_description: app.job_description,
            cover_letter: app.cover_letter,
            status: app.status,
            admin_notes: app.admin_notes,
            created_at: app.created_at,
            campaign_id: app.campaign_id,
            match_score: app.match_score,
            // Cast because `source` is not in the generated Supabase types —
            // the column exists in the database but the types were generated
            // before it was added. Same drift as resumes.file_path.
            source: (app as { source?: string | null }).source ?? null,
          });
        });

        setUsers(Array.from(userMap.values()));
        setCurrentPage(1);
        setExpandedUser(null);
      } catch (err) {
        pushToast({ variant: "error", title: "Error", message: "An unexpected error occurred" });
      } finally {
        setLoading(false);
      }
    };

    fetchUsersWithApps();
  }, [activeTab, pushToast]);

  const handleApprove = async (notes?: string, coverLetter?: string) => {
    if (!selectedApp) return;
    try {
      const { data, error } = await supabase
        .from("applications")
        .update({
          status: "approved",
          admin_notes: notes || "",
          cover_letter: coverLetter || selectedApp.cover_letter,
        })
        .eq("id", selectedApp.id)
        .select();

      if (error) {
        pushToast({ variant: "error", title: "Error", message: `Failed to approve: ${error.message}` });
        return;
      }
      if (!data || data.length === 0) {
        pushToast({ variant: "error", title: "Error", message: "Update failed — check RLS policies" });
        return;
      }

      setUsers((prev) =>
        prev
          .map((user) => ({
            ...user,
            applications: user.applications.filter((a) => a.id !== selectedApp.id),
            total_apps: user.total_apps - 1,
          }))
          .filter((user) => user.total_apps > 0),
      );

      pushToast({ variant: "success", title: "Approved", message: "Application approved successfully!" });
      setSelectedApp(null);
    } catch (error: any) {
      pushToast({ variant: "error", title: "Error", message: error.message || "Unexpected error" });
    }
  };

  const handleReject = async (notes?: string) => {
    if (!selectedApp) return;
    try {
      const { data, error } = await supabase
        .from("applications")
        .update({ status: "failed", admin_notes: notes || "" })
        .eq("id", selectedApp.id)
        .select();

      if (error) {
        pushToast({ variant: "error", title: "Error", message: `Failed to reject: ${error.message}` });
        return;
      }
      if (!data || data.length === 0) {
        pushToast({ variant: "error", title: "Error", message: "Update failed — check RLS policies" });
        return;
      }

      setUsers((prev) =>
        prev
          .map((user) => ({
            ...user,
            applications: user.applications.filter((a) => a.id !== selectedApp.id),
            total_apps: user.total_apps - 1,
          }))
          .filter((user) => user.total_apps > 0),
      );

      pushToast({ variant: "warning", title: "Rejected", message: "Application rejected." });
      setSelectedApp(null);
    } catch (error: any) {
      pushToast({ variant: "error", title: "Error", message: error.message || "Unexpected error" });
    }
  };

  /**
   * Permanently removes the application row. Approve/reject only change
   * `status`, so this is the one action here that can't be undone — hence the
   * confirm step and the destructive styling.
   */
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const { data, error } = await supabase
        .from("applications")
        .delete()
        .eq("id", deleteTarget.id)
        .select();

      if (error) {
        pushToast({ variant: "error", title: "Error", message: `Failed to delete: ${error.message}` });
        return;
      }
      if (!data || data.length === 0) {
        pushToast({ variant: "error", title: "Error", message: "Delete failed — check RLS policies" });
        return;
      }

      // Same local update the approve/reject handlers use: drop the row, and
      // drop the user once they have nothing left in this tab.
      setUsers((prev) =>
        prev
          .map((user) => ({
            ...user,
            applications: user.applications.filter((a) => a.id !== deleteTarget.id),
            total_apps: user.total_apps - 1,
          }))
          .filter((user) => user.total_apps > 0),
      );

      pushToast({ variant: "success", title: "Deleted", message: "Application removed." });
      setDeleteTarget(null);
      // Close the review modal if it was open on the row we just removed.
      setSelectedApp((cur) => (cur?.id === deleteTarget.id ? null : cur));
    } catch (error: any) {
      pushToast({ variant: "error", title: "Error", message: error.message || "Unexpected error" });
    } finally {
      setDeleting(false);
    }
  };

  /**
   * Bulk delete of everything currently listed — the active tab, narrowed by
   * the search box if one is set. Scoped to what's on screen rather than the
   * whole table, so the confirm dialog's count is exactly what disappears.
   *
   * Deletes in chunks: `.in()` puts every id in the query string, and a few
   * hundred UUIDs overflow the URL length limit in one request.
   */
  const handleDeleteAll = async () => {
    const ids = filtered.flatMap((u) => u.applications.map((a) => a.id));
    if (!ids.length) return;

    setDeletingAll(true);
    let removed = 0;
    try {
      for (let i = 0; i < ids.length; i += 100) {
        const chunk = ids.slice(i, i + 100);
        const { data, error } = await supabase
          .from("applications")
          .delete()
          .in("id", chunk)
          .select("id");

        if (error) {
          pushToast({
            variant: "error",
            title: "Partly deleted",
            message: `Removed ${removed} before failing: ${error.message}`,
          });
          break;
        }
        removed += data?.length ?? 0;
      }

      // Rebuild from what actually went, not from what we asked for — a
      // failed chunk must not vanish from the UI as though it succeeded.
      const goneSet = new Set(ids.slice(0, removed));
      setUsers((prev) =>
        prev
          .map((user) => {
            const remaining = user.applications.filter((a) => !goneSet.has(a.id));
            return { ...user, applications: remaining, total_apps: remaining.length };
          })
          .filter((user) => user.total_apps > 0),
      );

      if (removed) {
        pushToast({
          variant: "success",
          title: "Deleted",
          message: `${removed} application${removed !== 1 ? "s" : ""} removed.`,
        });
      }
      setConfirmDeleteAll(false);
      setCurrentPage(1);
    } catch (error: any) {
      pushToast({ variant: "error", title: "Error", message: error.message || "Unexpected error" });
    } finally {
      setDeletingAll(false);
    }
  };

  /**
   * Sources present in what's currently loaded, with counts.
   *
   * Built from the data rather than hard-coded so a provider added to
   * sourcing.ts appears here on its own — and so the menu never offers a
   * filter that would return nothing.
   */
  const sourceOptions = useMemo(() => {
    const counts = new Map<string, number>();
    let missing = 0;
    for (const user of users) {
      for (const app of user.applications) {
        if (!app.source) { missing++; continue; }
        counts.set(app.source, (counts.get(app.source) ?? 0) + 1);
      }
    }
    const total = [...counts.values()].reduce((s, n) => s + n, 0) + missing;

    const options = [{ value: ALL_SOURCES, label: `All sources (${total})` }];
    for (const [value, count] of [...counts.entries()].sort((a, b) => b[1] - a[1])) {
      options.push({ value, label: `${sourceLabel(value)} (${count})` });
    }
    // Older rows predate the source column. Offered explicitly rather than
    // hidden, because "why do these totals not add up" is a worse question
    // than an Unknown bucket.
    if (missing) options.push({ value: "__none__", label: `Unknown (${missing})` });
    return options;
  }, [users]);

  /**
   * Search narrows candidates; the source filter narrows their applications.
   * A candidate left with no matching applications drops out of the list
   * entirely — showing a name with an empty job list reads as a bug.
   */
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const byName = users.filter(
      (user) =>
        user.full_name.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q),
    );

    if (sourceFilter === ALL_SOURCES) return byName;

    return byName
      .map((user) => {
        const applications = user.applications.filter((a) =>
          sourceFilter === "__none__" ? !a.source : a.source === sourceFilter,
        );
        return { ...user, applications, total_apps: applications.length };
      })
      .filter((user) => user.total_apps > 0);
  }, [users, search, sourceFilter]);

  // Typeahead over the already-loaded candidates — no extra round trip. The
  // subtitle carries the pending count, which is what you're triaging by.
  const suggestions = useMemo(
    () =>
      search.trim()
        ? filtered.slice(0, 6).map((u) => ({
            id: u.user_id,
            title: u.full_name,
            subtitle: `${u.email} · ${u.total_apps} application${u.total_apps === 1 ? "" : "s"}`,
          }))
        : [],
    [filtered, search],
  );

  /** Picking a suggestion narrows to that candidate and opens their jobs. */
  const selectSuggestion = (userId: string) => {
    const user = users.find((u) => u.user_id === userId);
    if (!user) return;
    setSearch(user.full_name);
    setCurrentPage(1);
    setExpandedUser(userId);
  };

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const getJobPage = (userId: string) => jobPages[userId] || 1;
  const setJobPage = (userId: string, page: number) =>
    setJobPages((prev) => ({ ...prev, [userId]: page }));

  const getPaginatedJobs = (user: UserWithApps) => {
    const page = getJobPage(user.user_id);
    const start = (page - 1) * JOBS_PER_PAGE;
    return {
      jobs: user.applications.slice(start, start + JOBS_PER_PAGE),
      totalPages: Math.ceil(user.applications.length / JOBS_PER_PAGE),
      currentPage: page,
    };
  };

  const totalApps = filtered.reduce((s, u) => s + u.total_apps, 0);

  /** Expanded job list — shared by the desktop table and the mobile cards. */
  const renderJobs = (user: UserWithApps) => {
    const { jobs, totalPages: jobTotal, currentPage: jobPage } = getPaginatedJobs(user);

    return (
      <div className={`border-t ${T.hairline} bg-[#FAFAF8] dark:bg-white/[0.02]`}>
        {/* Column labels only make sense once the rows are actually in
            columns — below sm they stack. */}
        <div className={`hidden gap-3 border-b px-3 py-2 sm:grid sm:grid-cols-2 sm:px-5 md:grid-cols-5 ${T.hairline}`}>
          {["Company", "Job title", "Match", "Date", "Action"].map((h, i) => (
            <span
              key={h}
              className={`text-[10px] font-semibold uppercase tracking-[0.08em] text-[#9A9995] ${
                i > 1 ? "hidden md:block" : ""
              } ${i === 4 ? "md:text-right" : ""}`}
            >
              {h}
            </span>
          ))}
        </div>

        {jobs.map((app) => (
          <div
            key={app.id}
            className={`grid grid-cols-1 items-start gap-2 border-b px-3 py-3
                        sm:grid-cols-2 sm:items-center sm:gap-3 sm:px-5
                        md:grid-cols-5 ${T.hairline} ${T.hover}`}
          >
            <div className="flex min-w-0 items-center gap-2">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white text-[10px] font-bold text-[#6B6A66] ring-1 ring-[#EAEAE7] dark:bg-white/5 dark:text-[#C3C2B7] dark:ring-white/10">
                {app.company_name?.slice(0, 2).toUpperCase() || "??"}
              </span>
              <div className="min-w-0">
                <p className={`truncate text-[12.5px] font-semibold ${T.ink}`}>
                  {app.company_name}
                </p>
                {app.job_url && (
                  <a
                    href={app.job_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-0.5 text-[10.5px] text-[#2a78d6] hover:underline dark:text-[#3987e5]"
                  >
                    View posting <ExternalLink size={9} />
                  </a>
                )}
              </div>
            </div>

            <div className="flex min-w-0 items-center gap-2">
              <span className={`truncate text-[12.5px] ${T.ink2}`}>{app.job_title}</span>
              {app.source && (
                <span
                  title={`Sourced from ${sourceLabel(app.source)}`}
                  className={`hidden shrink-0 rounded-md border ${T.hairline} px-1.5 py-0.5
                              text-[9.5px] font-semibold uppercase tracking-[0.06em]
                              text-[#6B6A66] lg:inline dark:text-[#C3C2B7]`}
                >
                  {sourceLabel(app.source)}
                </span>
              )}
            </div>

            <span className="hidden md:block">
              <ScoreMeter value={app.match_score} />
            </span>

            <span className={`hidden text-[12px] tabular-nums md:block ${T.ink2}`}>
              {format(new Date(app.created_at), "d MMM yyyy")}
            </span>

            <div className="flex items-center justify-between gap-2 sm:col-span-2 sm:justify-end md:col-span-1">
              <StatusPill status={app.status} />
              <div className="flex items-center gap-1.5">
                <PrimaryButton onClick={() => setSelectedApp(app)}>Review</PrimaryButton>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteTarget(app);
                  }}
                  aria-label={`Delete application to ${app.company_name}`}
                  title="Delete application"
                  className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg border ${T.hairline}
                              text-[#9A9995] transition-colors hover:border-[#D03B3B]/40
                              hover:bg-[#D03B3B]/10 hover:text-[#B32F2F]
                              dark:hover:text-[#EF7A7A]`}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {jobTotal > 1 && (
          <div className="px-3 py-3 sm:px-5">
            <Pagination
              page={jobPage}
              totalPages={jobTotal}
              onChange={(p) => setJobPage(user.user_id, p)}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className={`text-[20px] font-bold tracking-[-0.01em] ${T.ink}`}>Review Queue</h1>
          <p className={`text-[12px] ${T.muted}`}>
            {loading
              ? "Loading…"
              : `${filtered.length} user${filtered.length !== 1 ? "s" : ""} · ${totalApps} application${totalApps !== 1 ? "s" : ""}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SearchInput
            value={search}
            onChange={(v) => { setSearch(v); setCurrentPage(1); }}
            placeholder="Search by name or email…"
            suggestions={suggestions}
            onSelectSuggestion={selectSuggestion}
          />

          {/* Only worth showing once there is more than one source to choose
              between — a menu with a single option is furniture. */}
          {!loading && sourceOptions.length > 2 && (
            <PillMenu
              value={sourceFilter}
              options={sourceOptions}
              heading="Job source"
              onChange={(v) => {
                setSourceFilter(v);
                setCurrentPage(1);
                setExpandedUser(null);
              }}
            />
          )}
          {/* Only offered when there is actually something listed to delete. */}
          {!loading && totalApps > 0 && (
            <button
              type="button"
              onClick={() => setConfirmDeleteAll(true)}
              title={`Delete all ${totalApps} listed applications`}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border ${T.hairline}
                          px-3 py-1.5 text-[12px] font-semibold text-[#B32F2F]
                          transition-colors hover:border-[#D03B3B]/40 hover:bg-[#D03B3B]/10
                          dark:text-[#EF7A7A]`}
            >
              <Trash2 size={13} />
              <span className="hidden sm:inline">Delete all</span>
            </button>
          )}
        </div>
      </div>

      <TabBar
        tabs={TABS.map((t) => ({ key: t.key, label: t.label }))}
        active={activeTab}
        onChange={(k) => { setActiveTab(k); setCurrentPage(1); }}
      />

      {/* ── Mobile: one card per candidate ──────────────────────────────── */}
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
          paginated.map((user) => {
            const isOpen = expandedUser === user.user_id;
            return (
              <Panel key={user.user_id} className="overflow-hidden">
                <div className="flex items-start gap-3 p-4">
                  <Avatar name={user.full_name} size={44} />
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-[15px] font-bold ${T.ink}`}>{user.full_name}</p>
                    <p className={`truncate text-[12.5px] ${T.muted}`}>{user.email}</p>
                  </div>
                </div>

                <div className={`flex items-center justify-between gap-3 border-t ${T.hairline} p-4`}>
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#2a78d6]/[0.08] text-[#2a78d6] dark:bg-[#3987e5]/15 dark:text-[#3987e5]">
                      <Briefcase size={16} />
                    </span>
                    <div>
                      <p className={`text-[12px] ${T.muted}`}>Applications</p>
                      <p className={`text-[18px] font-bold leading-tight ${T.ink}`}>
                        {user.total_apps}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setExpandedUser(isOpen ? null : user.user_id)}
                    className={`inline-flex items-center gap-1.5 rounded-xl border ${T.hairline} px-3.5 py-2.5
                                text-[13px] font-semibold ${T.ink} transition-colors
                                hover:bg-[#F4F4F2] dark:hover:bg-white/5`}
                  >
                    {isOpen ? "Hide" : "View jobs"}
                    {isOpen ? <ChevronUp size={14} /> : <ChevronRight size={14} />}
                  </button>
                </div>

                {isOpen && renderJobs(user)}
              </Panel>
            );
          })
        ) : (
          <Panel>
            <EmptyState
              icon={activeTab === "pending" ? CheckCircle2 : Inbox}
              title={activeTab === "pending" ? "All caught up" : "Nothing here"}
              hint={
                search
                  ? "No candidates match that search."
                  : "No applications in this category."
              }
            />
          </Panel>
        )}
      </div>

      {/* ── Desktop: table ──────────────────────────────────────────────── */}
      <Panel className="hidden overflow-hidden md:block">
        {loading ? (
          <div className="divide-y divide-[#EAEAE7] dark:divide-white/10">
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
          <table className="w-full">
            <thead className={`border-b ${T.hairline} bg-[#FAFAF8] dark:bg-white/[0.02]`}>
              <tr>
                <Th className="px-3 sm:px-5">Candidate</Th>
                <Th className="hidden px-3 sm:px-5 md:table-cell">Email</Th>
                <Th className="px-3 sm:px-5">Apps</Th>
                <Th className="px-3 text-right sm:px-5">Action</Th>
              </tr>
            </thead>
            <tbody className={`divide-y ${T.divide}`}>
              {paginated.map((user) => {
                const isOpen = expandedUser === user.user_id;
                return (
                  <React.Fragment key={user.user_id}>
                    <tr
                      className={`cursor-pointer transition-colors ${T.hover}`}
                      onClick={() => setExpandedUser(isOpen ? null : user.user_id)}
                    >
                      <td className="max-w-[190px] px-3 py-3.5 sm:max-w-none sm:px-5">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={user.full_name} />
                          <div className="min-w-0">
                            <p className={`truncate text-[13px] font-semibold ${T.ink}`}>
                              {user.full_name}
                            </p>
                            <p className={`truncate text-[11px] md:hidden ${T.muted}`}>{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className={`hidden px-3 py-3.5 text-[12.5px] sm:px-5 md:table-cell ${T.ink2}`}>
                        {user.email}
                      </td>
                      <td className="px-3 py-3.5 sm:px-5">
                        <span className={`inline-flex h-6 min-w-6 items-center justify-center rounded-md
                                          border ${T.hairline} px-1.5 text-[12px] font-semibold tabular-nums ${T.ink}`}>
                          {user.total_apps}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 text-right sm:px-5">
                        <GhostButton
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedUser(isOpen ? null : user.user_id);
                          }}
                        >
                          {isOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                          {/* Label is dropped below sm — the chevron carries it there. */}
                          <span className="hidden sm:inline">{isOpen ? "Hide" : "View jobs"}</span>
                        </GhostButton>
                      </td>
                    </tr>

                    {isOpen && (
                      <tr>
                        <td colSpan={4} className="p-0">
                          {renderJobs(user)}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
          </div>
        ) : (
          <EmptyState
            icon={activeTab === "pending" ? CheckCircle2 : Inbox}
            title={activeTab === "pending" ? "All caught up" : "Nothing here"}
            hint={
              search
                ? "No candidates match that search."
                : "No applications in this category."
            }
          />
        )}
      </Panel>

      <Pagination page={currentPage} totalPages={totalPages} onChange={setCurrentPage} />

      {selectedApp && (
        <ReviewModal
          application={selectedApp}
          onClose={() => setSelectedApp(null)}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        destructive
        busy={deleting}
        title="Delete this application?"
        confirmLabel={deleting ? "Deleting…" : "Delete"}
        body={
          <>
            <strong>{deleteTarget?.job_title}</strong> at{" "}
            <strong>{deleteTarget?.company_name}</strong> will be permanently removed.
            This can't be undone.
          </>
        }
        onConfirm={handleDelete}
        onCancel={() => !deleting && setDeleteTarget(null)}
      />

      <ConfirmDialog
        open={confirmDeleteAll}
        destructive
        busy={deletingAll}
        title={`Delete ${totalApps} application${totalApps !== 1 ? "s" : ""}?`}
        confirmLabel={deletingAll ? "Deleting…" : `Delete ${totalApps}`}
        body={
          <>
            This removes every application currently listed under{" "}
            <strong>{TABS.find((t) => t.key === activeTab)?.label}</strong>
            {sourceFilter !== ALL_SOURCES ? (
              <>
                {" "}
                sourced from{" "}
                <strong>
                  {sourceFilter === "__none__" ? "Unknown" : sourceLabel(sourceFilter)}
                </strong>
              </>
            ) : null}
            {search ? <> matching “{search}”</> : null}, across{" "}
            <strong>{filtered.length}</strong> user{filtered.length !== 1 ? "s" : ""}.
            {(activeTab === "submitted" || activeTab === "completed") && (
              <>
                {" "}
                These were already sent to employers — deleting them erases the record of
                work delivered and lowers those customers’ totals.
              </>
            )}{" "}
            This can’t be undone.
          </>
        }
        onConfirm={handleDeleteAll}
        onCancel={() => !deletingAll && setConfirmDeleteAll(false)}
      />
    </div>
  );
};

export default ReviewQueuePage;
