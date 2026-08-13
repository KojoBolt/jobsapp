import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow, format } from "date-fns";
import {
  ExternalLink, Brain, Trash2, X, AlertTriangle, Search, Download,
  ArrowUpDown, ChevronDown, ChevronLeft, ChevronRight, Inbox, MapPin,
} from "lucide-react";
import VerifiedHumanBadge from "@/components/dashboard/VerifiedHumanBadge";
import PrepBotSheet from "@/components/dashboard/PrepBotSheet";
import ApplicationDetailModal from "@/components/dashboard/ApplicationDetailModal";
import CompanyLogo from "@/components/dashboard/CompanyLogo";
import { Application } from "@/hooks/useDashboardData";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { CHART, T } from "@/admin/ui/system";
import { useRamp } from "@/admin/ui/charts";

/* Tabs map onto statuses that actually exist in the data — no tab can be
   permanently empty because it has nothing to match. */
const TABS = [
  { key: "all",      label: "All",       match: (_: string) => true },
  { key: "applied",  label: "Applied",   match: (s: string) => ["submitted", "completed"].includes(s) },
  { key: "review",   label: "In Review", match: (s: string) => ["pending_review", "approved"].includes(s) },
  { key: "drafting", label: "Drafting",  match: (s: string) => ["queued", "drafting"].includes(s) },
  { key: "failed",   label: "Failed",    match: (s: string) => s === "failed" },
] as const;

type TabKey = (typeof TABS)[number]["key"];
type SortKey = "newest" | "oldest" | "match" | "company";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "newest", label: "Newest" },
  { key: "oldest", label: "Oldest" },
  { key: "match", label: "Best match" },
  { key: "company", label: "Company A–Z" },
];

const STATUS_LABELS: Record<string, string> = {
  queued: "Queued",
  drafting: "Drafting",
  pending_review: "In review",
  approved: "Approved",
  submitted: "Applied",
  interview: "Interview",
  completed: "Completed",
  failed: "Failed",
};

/** Ordinal bands for the match score. The word is always rendered beside the
 *  colour, so the band is never communicated by hue alone. */
const scoreBand = (score: number) =>
  score >= 85 ? "STRONG" : score >= 65 ? "GOOD" : "FAIR";

// ─── Delete Confirmation Modal ────────────────────────────────────────────────
interface DeleteModalProps {
  isOpen: boolean;
  isDeleteAll: boolean;
  companyName?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}

const DeleteModal = ({
  isOpen, isDeleteAll, companyName, onConfirm, onCancel, isDeleting,
}: DeleteModalProps) => {
  if (!isOpen) return null;

  return (
    // z-[1900] clears the sticky dashboard header at z-[1000].
    <div className="fixed inset-0 z-[1900] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.15 }}
        className={`relative w-full max-w-[420px] rounded-2xl border ${T.hairline} bg-white p-6
                    shadow-xl dark:bg-[#1A1A19]`}
      >
        <button
          onClick={onCancel}
          aria-label="Close"
          className={`absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-lg ${T.muted}
                      transition-colors hover:bg-[#F4F4F2] dark:hover:bg-white/5`}
        >
          <X size={15} />
        </button>

        <div className="flex flex-col items-center gap-3 text-center">
          <span
            className="grid h-12 w-12 place-items-center rounded-full"
            style={{ backgroundColor: `${CHART.critical}1F`, color: CHART.critical }}
          >
            <AlertTriangle size={22} strokeWidth={2.25} />
          </span>

          <div>
            <h3 className={`text-[16px] font-bold ${T.ink}`}>
              {isDeleteAll ? "Delete all applications?" : "Delete application?"}
            </h3>
            <p className={`mt-1.5 text-[12.5px] leading-relaxed ${T.muted}`}>
              {isDeleteAll
                ? "This will permanently delete all your applications. This action cannot be undone."
                : `This will permanently delete your application to ${companyName || "this company"}. This action cannot be undone.`}
            </p>
          </div>

          <div className="mt-2 flex w-full gap-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={isDeleting}
              className={`flex-1 rounded-lg border ${T.hairline} px-4 py-2.5 text-[12.5px] font-semibold
                          ${T.ink} transition-colors hover:bg-[#F4F4F2] disabled:opacity-50
                          dark:hover:bg-white/5`}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5
                         text-[12.5px] font-semibold text-white transition-opacity hover:opacity-90
                         disabled:opacity-50"
              style={{ backgroundColor: CHART.critical }}
            >
              {isDeleting ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Deleting…
                </>
              ) : (
                <>
                  <Trash2 size={14} />
                  {isDeleteAll ? "Delete all" : "Delete"}
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
interface ApplicationFeedProps {
  applications: Application[];
  onApplicationDeleted?: () => void;
}

const ApplicationFeed = ({ applications, onApplicationDeleted }: ApplicationFeedProps) => {
  const { user } = useAuth();
  const { dark } = useRamp();
  const [localApplications, setLocalApplications] = useState<Application[]>(applications);
  const [currentPage, setCurrentPage] = useState(1);
  const [tab, setTab] = useState<TabKey>("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("newest");
  const [sortOpen, setSortOpen] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [perPageOpen, setPerPageOpen] = useState(false);
  const [prepBot, setPrepBot] = useState<{ open: boolean; company: string; role: string }>({
    open: false,
    company: "",
    role: "",
  });
  const [modal, setModal] = useState<{
    open: boolean;
    isDeleteAll: boolean;
    targetId?: string;
    companyName?: string;
  }>({ open: false, isDeleteAll: false });
  const [isDeleting, setIsDeleting] = useState(false);
  const [detail, setDetail] = useState<Application | null>(null);

  useEffect(() => {
    setLocalApplications(applications);
  }, [applications]);

  const accent = dark ? CHART.accentDark : CHART.accent;
  const good = dark ? CHART.goodDark : CHART.good;

  /** Per-tab counts, computed off the whole set so they don't shift with search. */
  const counts = useMemo(() => {
    const out: Record<string, number> = {};
    for (const t of TABS) out[t.key] = localApplications.filter((a) => t.match(a.status)).length;
    return out;
  }, [localApplications]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    const tabDef = TABS.find((t) => t.key === tab)!;

    const rows = localApplications.filter((a) => {
      if (!tabDef.match(a.status)) return false;
      if (!term) return true;
      return (
        (a.company_name || "").toLowerCase().includes(term) ||
        (a.job_title || "").toLowerCase().includes(term)
      );
    });

    const sorted = [...rows];
    sorted.sort((a, b) => {
      switch (sort) {
        case "oldest":
          return +new Date(a.created_at) - +new Date(b.created_at);
        case "match":
          return (b.match_score || 0) - (a.match_score || 0);
        case "company":
          return (a.company_name || "").localeCompare(b.company_name || "");
        default:
          return +new Date(b.created_at) - +new Date(a.created_at);
      }
    });
    return sorted;
  }, [localApplications, tab, query, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const page = Math.min(currentPage, totalPages);
  const displayed = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  // Any change to the result set should return the reader to the first page,
  // otherwise a narrower filter can land them on a page that no longer exists.
  useEffect(() => {
    setCurrentPage(1);
  }, [tab, query, sort, itemsPerPage]);

  const openPrepBot = (company: string, role: string) => {
    setPrepBot({ open: true, company, role });
  };

  const confirmDelete = (id: string, companyName: string) => {
    setModal({ open: true, isDeleteAll: false, targetId: id, companyName });
  };

  const confirmDeleteAll = () => {
    setModal({ open: true, isDeleteAll: true });
  };

  const closeModal = () => {
    setModal({ open: false, isDeleteAll: false });
  };

  const handleDelete = async () => {
    if (!modal.targetId || !user) return;

    try {
      setIsDeleting(true);

      const { error } = await supabase
        .from("applications")
        .delete()
        .eq("id", modal.targetId)
        .eq("user_id", user.id);

      if (error) throw error;

      const newApps = localApplications.filter((a) => a.id !== modal.targetId);
      setLocalApplications(newApps);

      // If we deleted last item on page, go back
      const newTotalPages = Math.ceil(newApps.length / itemsPerPage);
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages);
      }

      closeModal();
      if (onApplicationDeleted) onApplicationDeleted();
    } catch (error: any) {
      console.error("Delete error:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle delete all
  const handleDeleteAll = async () => {
    if (!user) return;

    try {
      setIsDeleting(true);

      const { error } = await supabase
        .from("applications")
        .delete()
        .eq("user_id", user.id);

      if (error) throw error;

      setLocalApplications([]);
      setCurrentPage(1);
      closeModal();
      if (onApplicationDeleted) onApplicationDeleted();
    } catch (error: any) {
      console.error("Delete all error:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  /** CSV of the current view, so what you export is what you filtered to. */
  const exportCsv = () => {
    const rows = [
      ["company", "role", "status", "match", "location", "applied"],
      ...filtered.map((a) => [
        a.company_name || "",
        a.job_title || "",
        STATUS_LABELS[a.status] || a.status,
        a.match_score ? String(a.match_score) : "",
        a.location || "",
        format(new Date(a.created_at), "yyyy-MM-dd"),
      ]),
    ];
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `applications-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!localApplications || localApplications.length === 0) {
    return (
      <div className={`rounded-2xl border ${T.hairline} bg-white px-6 py-14 text-center dark:bg-[#1A1A19]`}>
        <span
          className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-xl"
          style={{ backgroundColor: `${accent}1A`, color: accent }}
        >
          <Inbox size={18} />
        </span>
        <p className={`text-[14px] font-bold ${T.ink}`}>No applications yet</p>
        <p className={`mt-1 text-[12px] ${T.muted}`}>
          Deploy your first campaign and applications will appear here.
        </p>
      </div>
    );
  }

  /* ── Row renderers — one source of truth so desktop and mobile can't drift ── */

  const StatusPill = ({ status }: { status: string }) => {
    const tone =
      status === "failed"
        ? (dark ? CHART.criticalDark : CHART.critical)
        : ["submitted", "completed", "interview"].includes(status)
        ? good
        : CHART.warning;

    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-semibold"
        style={{ backgroundColor: `${tone}1A`, color: tone }}
      >
        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: tone }} />
        {STATUS_LABELS[status] || status}
      </span>
    );
  };

  const MatchScore = ({ score }: { score?: number }) => {
    if (!score) return <span className={`text-[12px] ${T.muted}`}>—</span>;
    const band = scoreBand(score);
    const tone = band === "STRONG" ? good : band === "GOOD" ? CHART.warning : CHART.serious;

    return (
      <div className="w-[86px]">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[15px] font-bold tabular-nums" style={{ color: tone }}>
            {score}
          </span>
          <span className={`text-[9.5px] font-bold tracking-[0.06em] ${T.muted}`}>{band}</span>
        </div>
        <div
          className="mt-1 h-1 w-full overflow-hidden rounded-full"
          style={{ backgroundColor: dark ? "#2C2C2A" : "#EFEFEC" }}
        >
          <div
            className="h-full rounded-full"
            style={{ width: `${Math.min(100, score)}%`, backgroundColor: tone }}
          />
        </div>
      </div>
    );
  };

  const RowActions = ({ app }: { app: Application }) => (
    <div className="flex items-center justify-end gap-1">
      {(app.status === "submitted" || app.status === "interview") && (
        <button
          type="button"
          onClick={() => openPrepBot(app.company_name || "Company", app.job_title || "Role")}
          title="Open Prep-Bot Intel"
          className={`grid h-7 w-7 place-items-center rounded-lg ${T.ink2} transition-colors
                      hover:bg-[#F4F4F2] dark:hover:bg-white/5`}
        >
          <Brain size={14} />
        </button>
      )}
      <a
        href={app.job_url}
        target="_blank"
        rel="noopener noreferrer"
        title="Open job posting"
        className={`grid h-7 w-7 place-items-center rounded-lg ${T.ink2} transition-colors
                    hover:bg-[#F4F4F2] dark:hover:bg-white/5`}
      >
        <ExternalLink size={14} />
      </a>
      <button
        type="button"
        onClick={() => confirmDelete(app.id, app.company_name || "this company")}
        title="Delete application"
        className={`grid h-7 w-7 place-items-center rounded-lg ${T.muted} transition-colors
                    hover:bg-[#D03B3B]/10 hover:text-[#B32F2F] dark:hover:text-[#EF7A7A]`}
      >
        <Trash2 size={14} />
      </button>
    </div>
  );

  return (
    <>
      <PrepBotSheet
        open={prepBot.open}
        onOpenChange={(open) => setPrepBot((prev) => ({ ...prev, open }))}
        company={prepBot.company}
        role={prepBot.role}
      />

      <AnimatePresence>
        {detail && (
          <ApplicationDetailModal app={detail} onClose={() => setDetail(null)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modal.open && (
          <DeleteModal
            isOpen={modal.open}
            isDeleteAll={modal.isDeleteAll}
            companyName={modal.companyName}
            onConfirm={modal.isDeleteAll ? handleDeleteAll : handleDelete}
            onCancel={closeModal}
            isDeleting={isDeleting}
          />
        )}
      </AnimatePresence>

      <div className={`overflow-hidden rounded-2xl border ${T.hairline} bg-white dark:bg-[#1A1A19]`}>
        {/* ── Tabs + export ─────────────────────────────────────────────── */}
        <div className={`flex items-center gap-3 border-b ${T.hairline} px-3 py-2.5`}>
          <div className="no-scrollbar flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
            {TABS.map((t) => {
              const active = t.key === tab;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px]
                              transition-colors ${
                                active
                                  ? "font-bold"
                                  : `font-medium ${T.ink2} hover:bg-[#F4F4F2] dark:hover:bg-white/5`
                              }`}
                  style={active ? { backgroundColor: `${accent}1F`, color: accent } : undefined}
                >
                  {t.label}
                  <span
                    className={`rounded-full px-1.5 text-[10.5px] font-bold ${
                      active ? "" : T.muted
                    }`}
                    style={active ? { backgroundColor: `${accent}26` } : undefined}
                  >
                    {counts[t.key] ?? 0}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={exportCsv}
            className={`hidden shrink-0 items-center gap-1.5 rounded-lg border ${T.hairline} px-3 py-1.5
                        text-[12px] font-semibold ${T.ink} transition-colors hover:bg-[#F4F4F2]
                        sm:inline-flex dark:hover:bg-white/5`}
          >
            <Download size={13} />
            Export CSV
            <span className={T.muted}>· {filtered.length}</span>
          </button>
        </div>

        {/* ── Search + controls ─────────────────────────────────────────── */}
        <div className={`flex flex-wrap items-center gap-2 border-b ${T.hairline} px-3 py-2.5`}>
          <div className="relative min-w-0 flex-1">
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9A9995]"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search company or role…"
              className={`w-full rounded-lg border ${T.hairline} bg-transparent py-2 pl-8 pr-8
                          text-[12.5px] ${T.ink} placeholder:text-[#9A9995] focus:outline-none
                          focus:ring-2 focus:ring-[#2a78d6]/30`}
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className={`absolute right-2 top-1/2 grid h-5 w-5 -translate-y-1/2 place-items-center
                            rounded ${T.muted} hover:bg-[#F4F4F2] dark:hover:bg-white/5`}
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Sort */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => { setSortOpen((v) => !v); setPerPageOpen(false); }}
              className={`inline-flex items-center gap-1.5 rounded-lg border ${T.hairline} px-3 py-2
                          text-[12px] font-semibold ${T.ink} transition-colors hover:bg-[#F4F4F2]
                          dark:hover:bg-white/5`}
            >
              <ArrowUpDown size={13} />
              {SORTS.find((s) => s.key === sort)!.label}
              <ChevronDown size={12} className={sortOpen ? "rotate-180" : ""} />
            </button>
            {sortOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setSortOpen(false)} />
                <div
                  className={`absolute right-0 z-20 mt-1 w-[150px] rounded-xl border ${T.hairline}
                              bg-white p-1 shadow-xl dark:bg-[#1A1A19]`}
                >
                  {SORTS.map((s) => (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => { setSort(s.key); setSortOpen(false); }}
                      className={`block w-full rounded-lg px-2.5 py-1.5 text-left text-[12px] transition-colors
                                  ${s.key === sort ? `font-bold ${T.ink}` : `font-medium ${T.ink2}`}
                                  hover:bg-[#F4F4F2] dark:hover:bg-white/5`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Rows per page */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => { setPerPageOpen((v) => !v); setSortOpen(false); }}
              className={`inline-flex items-center gap-1.5 rounded-lg border ${T.hairline} px-3 py-2
                          text-[12px] font-semibold ${T.ink} transition-colors hover:bg-[#F4F4F2]
                          dark:hover:bg-white/5`}
            >
              {itemsPerPage} / page
              <ChevronDown size={12} className={perPageOpen ? "rotate-180" : ""} />
            </button>
            {perPageOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setPerPageOpen(false)} />
                <div
                  className={`absolute right-0 z-20 mt-1 w-[110px] rounded-xl border ${T.hairline}
                              bg-white p-1 shadow-xl dark:bg-[#1A1A19]`}
                >
                  {[10, 25, 50].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => { setItemsPerPage(n); setPerPageOpen(false); }}
                      className={`block w-full rounded-lg px-2.5 py-1.5 text-left text-[12px] transition-colors
                                  ${n === itemsPerPage ? `font-bold ${T.ink}` : `font-medium ${T.ink2}`}
                                  hover:bg-[#F4F4F2] dark:hover:bg-white/5`}
                    >
                      {n} / page
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={confirmDeleteAll}
            className={`shrink-0 rounded-lg border ${T.hairline} px-3 py-2 text-[12px] font-semibold
                        ${T.muted} transition-colors hover:bg-[#D03B3B]/10 hover:text-[#B32F2F]
                        dark:hover:text-[#EF7A7A]`}
          >
            <Trash2 size={13} className="inline" />
          </button>
        </div>

        {/* ── Desktop table ─────────────────────────────────────────────── */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[860px]">
            <thead>
              <tr className={`border-b ${T.hairline}`}>
                {["Company", "Role", "Status", "Match", "Location", "When"].map((h) => (
                  <th
                    key={h}
                    className={`px-4 py-2.5 text-left text-[10.5px] font-semibold uppercase
                                tracking-[0.08em] ${T.muted}`}
                  >
                    {h}
                  </th>
                ))}
                <th
                  className={`px-4 py-2.5 text-right text-[10.5px] font-semibold uppercase
                              tracking-[0.08em] ${T.muted}`}
                >
                  Action
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${T.divide}`}>
              {displayed.map((app) => (
                <tr
                  key={app.id}
                  className="group relative transition-colors hover:bg-[#FAFAF8] dark:hover:bg-white/[0.03]"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <CompanyLogo name={app.company_name} logo={app.company_logo} size={32} />
                      <span className={`truncate text-[13px] font-bold ${T.ink}`}>
                        {app.company_name || "Unknown Company"}
                      </span>
                    </div>
                  </td>
                  <td className="max-w-[220px] px-4 py-3">
                    {/* Opens the detail modal; the external posting is reachable
                        from inside it and from the row's link icon. */}
                    <button
                      type="button"
                      onClick={() => setDetail(app)}
                      className={`block w-full truncate text-left text-[12.5px] font-semibold ${T.ink}
                                  hover:underline`}
                    >
                      {app.job_title || "Unknown Role"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <StatusPill status={app.status} />
                      {(app.status === "submitted" || app.status === "interview") && (
                        <VerifiedHumanBadge
                          variant={app.status === "interview" ? "emerald" : "gold"}
                        />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <MatchScore score={app.match_score} />
                  </td>
                  <td className="px-4 py-3">
                    {app.location ? (
                      <span
                        className={`inline-flex max-w-[150px] items-center gap-1 rounded-md border
                                    ${T.hairline} px-2 py-0.5 text-[11px] ${T.ink2}`}
                      >
                        <MapPin size={10} className="shrink-0" />
                        <span className="truncate">{app.location}</span>
                      </span>
                    ) : (
                      <span className={`text-[12px] ${T.muted}`}>—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className={`text-[12px] font-semibold ${T.ink}`}>
                      {STATUS_LABELS[app.status] || app.status}
                    </p>
                    <p className={`text-[11px] ${T.muted}`}>
                      {formatDistanceToNow(new Date(app.created_at), { addSuffix: true })}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <RowActions app={app} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Mobile cards ──────────────────────────────────────────────── */}
        <div className={`divide-y ${T.divide} md:hidden`}>
          {displayed.map((app) => (
            <div key={app.id} className="p-3.5">
              <div className="flex items-start gap-2.5">
                <CompanyLogo name={app.company_name} logo={app.company_logo} size={32} />
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-[13px] font-bold ${T.ink}`}>
                    {app.company_name || "Unknown Company"}
                  </p>
                  <button
                    type="button"
                    onClick={() => setDetail(app)}
                    className={`block w-full truncate text-left text-[12px] ${T.ink2} hover:underline`}
                  >
                    {app.job_title || "Unknown Role"}
                  </button>
                </div>
                <RowActions app={app} />
              </div>

              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <StatusPill status={app.status} />
                {app.location && (
                  <span
                    className={`inline-flex items-center gap-1 rounded-md border ${T.hairline}
                                px-2 py-0.5 text-[11px] ${T.ink2}`}
                  >
                    <MapPin size={10} />
                    {app.location}
                  </span>
                )}
                <span className={`text-[11px] ${T.muted}`}>
                  {formatDistanceToNow(new Date(app.created_at), { addSuffix: true })}
                </span>
              </div>

              {app.match_score ? (
                <div className="mt-2.5">
                  <MatchScore score={app.match_score} />
                </div>
              ) : null}
            </div>
          ))}
        </div>

        {/* ── Empty result set ──────────────────────────────────────────── */}
        {displayed.length === 0 && (
          <div className="px-6 py-12 text-center">
            <p className={`text-[13px] font-semibold ${T.ink}`}>No matching applications</p>
            <p className={`mt-1 text-[12px] ${T.muted}`}>
              Try a different tab or clear your search.
            </p>
          </div>
        )}

        {/* ── Pagination ────────────────────────────────────────────────── */}
        {filtered.length > 0 && (
          <div className={`flex items-center justify-between gap-3 border-t ${T.hairline} px-3 py-2.5`}>
            <p className={`text-[11.5px] ${T.muted}`}>
              {(page - 1) * itemsPerPage + 1}–{Math.min(page * itemsPerPage, filtered.length)} of{" "}
              {filtered.length}
            </p>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                aria-label="Previous page"
                className={`grid h-8 w-8 place-items-center rounded-lg border ${T.hairline} ${T.ink2}
                            transition-colors hover:bg-[#F4F4F2] disabled:opacity-40
                            dark:hover:bg-white/5`}
              >
                <ChevronLeft size={15} />
              </button>
              <span className={`px-2 text-[11.5px] font-semibold ${T.ink}`}>
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                aria-label="Next page"
                className={`grid h-8 w-8 place-items-center rounded-lg border ${T.hairline} ${T.ink2}
                            transition-colors hover:bg-[#F4F4F2] disabled:opacity-40
                            dark:hover:bg-white/5`}
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ApplicationFeed;
