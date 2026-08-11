import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  ChevronDown, ChevronUp, Activity, Radio, CheckCircle2, Target,
  PieChart, LineChart as LineIcon, Inbox, AlertTriangle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/admin/toast/ToastContext";
import { format, formatDistanceToNow, subMonths, startOfMonth } from "date-fns";
import {
  T, Panel, PanelHeader, Th, Avatar, StatTile, StatusPill, SearchInput,
  GhostButton, IconButton, Pill, LegendRow, Pagination, EmptyState,
} from "@/admin/ui/system";
import {
  PipelineGauge, TrendChart, TrendKey, useRamp, type GaugeBand,
} from "@/admin/ui/charts";
import { useRegisterExport, useAdminActions } from "@/admin/context/AdminActionsContext";

interface Campaign {
  id: string;
  user_id: string;
  status: string;
  total_jobs: number;
  processed_jobs: number;
  created_at: string;
  user_full_name: string;
  user_email: string;
  success_rate: number;
  drafted: number;
}

const ITEMS_PER_PAGE = 10;

/** Progress as length — the number beside it carries the exact figure. */
const ProgressBar = ({ done, total }: { done: number; total: number }) => {
  const pct = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="h-1.5 w-20 overflow-hidden rounded-full bg-[#EFEFEC] dark:bg-white/10">
        <span
          className="block h-full rounded-full bg-[#2a78d6] transition-all dark:bg-[#3987e5]"
          style={{ width: `${pct}%` }}
        />
      </span>
      <span className={`text-[11.5px] tabular-nums ${T.ink2}`}>
        {done}/{total || 0}
      </span>
    </div>
  );
};

const csvCell = (v: unknown) => {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const CampaignMonitorPage = (): JSX.Element => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedCampaign, setExpandedCampaign] = useState<string | null>(null);
  const [expandedApps, setExpandedApps] = useState<Record<string, any[]>>({});
  const { pushToast } = useToast();
  const { ramp } = useRamp();

  useEffect(() => {
    fetchCampaigns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      setLoadError(null);

      const { data: campaignsData, error } = await supabase
        .from("campaigns")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[CampaignMonitor] campaigns query failed:", error);
        setLoadError(error.message || "Failed to load campaigns");
        pushToast({
          variant: "error",
          title: "Error",
          message: error.message || "Failed to load campaigns",
        });
        return;
      }

      if (!campaignsData || campaignsData.length === 0) {
        setCampaigns([]);
        return;
      }

      const userIds = [...new Set(campaignsData.map((c) => c.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);

      const profileMap = new Map(
        (profiles || []).map((p) => [p.id, { full_name: p.full_name, email: p.email }]),
      );

      const { data: appData } = await supabase
        .from("applications")
        .select("campaign_id, status")
        .in("campaign_id", campaignsData.map((c) => c.id));

      const appMap = new Map<string, any[]>();
      (appData || []).forEach((a) => {
        if (!appMap.has(a.campaign_id)) appMap.set(a.campaign_id, []);
        appMap.get(a.campaign_id)!.push(a);
      });

      const enriched: Campaign[] = campaignsData.map((c) => {
        const profile = profileMap.get(c.user_id);
        const apps = appMap.get(c.id) || [];
        const submitted = apps.filter((a) =>
          ["submitted", "completed", "approved"].includes(a.status),
        ).length;

        return {
          id: c.id,
          user_id: c.user_id,
          status: c.status,
          total_jobs: c.total_jobs ?? 0,
          processed_jobs: c.processed_jobs ?? 0,
          created_at: c.created_at,
          user_full_name: profile?.full_name || "Unknown User",
          user_email: profile?.email || "No email",
          success_rate: apps.length > 0 ? Math.round((submitted / apps.length) * 100) : 0,
          drafted: apps.length,
        };
      });

      setCampaigns(enriched);
    } catch (err: any) {
      console.error("[CampaignMonitor] unexpected error:", err);
      setLoadError(err?.message || "Unexpected error");
      pushToast({ variant: "error", title: "Error", message: "Unexpected error" });
    } finally {
      setLoading(false);
    }
  };

  const fetchCampaignApps = async (campaignId: string) => {
    // Check for the key, not truthiness — an already-loaded empty result is [].
    if (campaignId in expandedApps) return;

    const { data, error } = await supabase
      .from("applications")
      .select("id, company_name, job_title, status, created_at")
      .eq("campaign_id", campaignId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("[CampaignMonitor] applications query failed:", error);
      pushToast({
        variant: "error",
        title: "Error",
        message: error.message || "Failed to load applications",
      });
    }

    setExpandedApps((prev) => ({ ...prev, [campaignId]: data || [] }));
  };

  const handleExpand = (campaignId: string) => {
    if (expandedCampaign === campaignId) {
      setExpandedCampaign(null);
    } else {
      setExpandedCampaign(campaignId);
      fetchCampaignApps(campaignId);
    }
  };

  const { inRange } = useAdminActions();

  // The header's date range scopes everything on the page — charts and table
  // read from the same array, so they can never disagree.
  const scoped = useMemo(
    () => campaigns.filter((c) => inRange(c.created_at)),
    [campaigns, inRange],
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return scoped.filter(
      (c) =>
        c.user_full_name.toLowerCase().includes(q) ||
        c.user_email.toLowerCase().includes(q),
    );
  }, [scoped, search]);

  // Typeahead over the already-loaded campaigns — no extra round trip. The
  // subtitle carries status and progress, since one user can have several.
  const suggestions = useMemo(
    () =>
      search.trim()
        ? filtered.slice(0, 6).map((c) => ({
            id: c.id,
            title: c.user_full_name,
            subtitle: `${c.status.replace(/_/g, " ")} · ${c.processed_jobs}/${c.total_jobs || 0} drafted`,
          }))
        : [],
    [filtered, search],
  );

  /** Picking a suggestion narrows to that user and opens the campaign. */
  const selectSuggestion = (id: string) => {
    const campaign = campaigns.find((c) => c.id === id);
    if (!campaign) return;
    setSearch(campaign.user_full_name);
    setCurrentPage(1);
    setExpandedCampaign(id);
    fetchCampaignApps(id);
  };

  /* ── Derived metrics + chart series ───────────────────────────────────── */
  const m = useMemo(() => {
    const running = scoped.filter((c) => c.status === "running").length;
    const completed = scoped.filter((c) => c.status === "completed").length;
    const withApps = scoped.filter((c) => c.drafted > 0);
    const avgSuccess = withApps.length
      ? Math.round(withApps.reduce((s, c) => s + c.success_rate, 0) / withApps.length)
      : 0;

    const totalDrafted = scoped.reduce((s, c) => s + c.drafted, 0);
    const totalTarget = scoped.reduce((s, c) => s + c.total_jobs, 0);

    // Status mix for the gauge — top three, remainder folded in.
    const byStatus = new Map<string, number>();
    scoped.forEach((c) => byStatus.set(c.status, (byStatus.get(c.status) || 0) + 1));
    const sorted = [...byStatus.entries()].sort((a, b) => b[1] - a[1]);
    const otherTotal = sorted.slice(3).reduce((s, [, v]) => s + v, 0);
    const bands: GaugeBand[] = [
      ...sorted.slice(0, 3).map(([name, value]) => ({ name: name.replace(/_/g, " "), value })),
      ...(otherTotal > 0 ? [{ name: "other", value: otherTotal }] : []),
    ];

    // Campaigns launched per month, last 7 months.
    const now = new Date();
    const trend = Array.from({ length: 7 }, (_, i) => {
      const from = startOfMonth(subMonths(now, 6 - i));
      const to = startOfMonth(subMonths(now, 5 - i));
      return {
        month: format(from, "MMM"),
        value: scoped.filter((c) => {
          const t = new Date(c.created_at);
          return t >= from && t < to;
        }).length,
      };
    });
    const nonZero = trend.filter((t) => t.value > 0);
    const target = nonZero.length
      ? Math.round(nonZero.reduce((s, t) => s + t.value, 0) / nonZero.length)
      : 0;

    return {
      running, completed, avgSuccess, bands, trend, target,
      totalDrafted, totalTarget,
    };
  }, [scoped]);

  const exportCsv = useCallback(() => {
    const header = ["User", "Email", "Status", "Drafted", "Target", "Success rate %", "Started"];
    const rows = filtered.map((c) => [
      c.user_full_name, c.user_email, c.status, c.drafted, c.total_jobs,
      c.success_rate, format(new Date(c.created_at), "yyyy-MM-dd"),
    ]);
    const csv = [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `campaigns-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filtered]);

  useRegisterExport(exportCsv);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  /** Drafted-applications list — shared by the desktop table and mobile cards. */
  const renderApps = (campaign: Campaign) => {
    const apps = expandedApps[campaign.id];

    return (
      <div className={`border-t ${T.hairline} bg-[#FAFAF8] dark:bg-white/[0.02]`}>
        {/* Column labels only apply once the rows are in columns. */}
        <div className={`hidden gap-3 border-b px-4 py-2 sm:grid sm:grid-cols-4 sm:px-5 ${T.hairline}`}>
          {["Company", "Job title", "Status", "Date"].map((h) => (
            <span
              key={h}
              className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#9A9995]"
            >
              {h}
            </span>
          ))}
        </div>

        {apps === undefined ? (
          <p className={`px-4 py-4 text-[12px] sm:px-5 ${T.muted}`}>Loading applications…</p>
        ) : apps.length > 0 ? (
          apps.map((app) => (
            <div
              key={app.id}
              className={`grid grid-cols-1 gap-1 border-b px-4 py-3 sm:grid-cols-4 sm:items-center
                          sm:gap-3 sm:px-5 sm:py-2.5 ${T.hairline} ${T.hover}`}
            >
              <span className={`truncate text-[12.5px] font-semibold ${T.ink}`}>
                {app.company_name}
              </span>
              <span className={`truncate text-[12.5px] ${T.ink2}`}>{app.job_title}</span>
              <div className="flex items-center justify-between gap-3 sm:contents">
                <StatusPill status={app.status} />
                <span className={`text-[12px] tabular-nums ${T.ink2}`}>
                  {format(new Date(app.created_at), "d MMM yyyy")}
                </span>
              </div>
            </div>
          ))
        ) : (
          <p className={`px-4 py-4 text-[12px] sm:px-5 ${T.muted}`}>
            No applications drafted for this campaign yet.
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className={`text-[20px] font-bold tracking-[-0.01em] ${T.ink}`}>Campaign Monitor</h1>
          <p className={`text-[12px] ${T.muted}`}>
            {loading
              ? "Loading…"
              : `${filtered.length} campaign${filtered.length !== 1 ? "s" : ""} · ${m.totalDrafted} drafted`}
          </p>
        </div>
        <SearchInput
          value={search}
          onChange={(v) => { setSearch(v); setCurrentPage(1); }}
          placeholder="Search by user…"
          suggestions={suggestions}
          onSelectSuggestion={selectSuggestion}
        />
      </div>

      {/* ── Stat row ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile icon={Radio} label="Total Campaigns" value={scoped.length}
                  delta={0} caption="all time" loading={loading} />
        <StatTile icon={Activity} label="Running" value={m.running} note="active"
                  delta={0} caption="currently drafting" loading={loading} />
        <StatTile icon={CheckCircle2} label="Completed" value={m.completed}
                  delta={0} caption="finished campaigns" loading={loading} />
        <StatTile icon={Target} label="Avg Success Rate" value={`${m.avgSuccess}%`}
                  delta={0} caption="submitted of drafted" loading={loading} />
      </div>

      {/* ── Charts ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel>
          <PanelHeader icon={PieChart} title="Campaign Status"
                       right={<IconButton label="Open status breakdown" />} />
          <div className="px-5 pb-4">
            {scoped.length > 0 ? (
              <>
                <PipelineGauge bands={m.bands} total={scoped.length} caption="Campaigns" />
                <div className={`mt-2 divide-y ${T.divide}`}>
                  {m.bands.map((b, i) => (
                    <LegendRow
                      key={b.name}
                      color={ramp[i % ramp.length]}
                      name={b.name.replace(/\b\w/g, (c) => c.toUpperCase())}
                      sub={`${Math.round((b.value / scoped.length) * 100)}% of all`}
                      value={String(b.value)}
                    />
                  ))}
                </div>
              </>
            ) : (
              <p className={`py-14 text-center text-[12px] ${T.muted}`}>
                {loading ? "Loading…" : "No campaigns yet"}
              </p>
            )}
          </div>
        </Panel>

        <Panel className="lg:col-span-2">
          <PanelHeader icon={LineIcon} title="Campaigns Launched"
                       right={<><Pill>Monthly</Pill><IconButton label="Open trend" /></>} />
          <div className="px-5 pb-4">
            <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className={`text-[24px] font-bold leading-none tracking-[-0.02em] ${T.ink}`}>
                  {m.trend.reduce((s, t) => s + t.value, 0)}
                </p>
                <p className={`mt-1 text-[11px] ${T.muted}`}>Last 7 months</p>
              </div>
              <TrendKey />
            </div>
            <TrendChart data={m.trend} target={m.target} />
          </div>
        </Panel>
      </div>

      {/* ── Mobile: one card per campaign ───────────────────────────────── */}
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
          paginated.map((campaign) => {
            const isOpen = expandedCampaign === campaign.id;
            const pct = campaign.total_jobs > 0
              ? Math.min(100, Math.round((campaign.processed_jobs / campaign.total_jobs) * 100))
              : 0;

            return (
              <Panel key={campaign.id} className="overflow-hidden">
                <div className="flex items-start gap-3 p-4">
                  <Avatar name={campaign.user_full_name} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-[14px] font-bold ${T.ink}`}>
                      {campaign.user_full_name}
                    </p>
                    <p className={`truncate text-[12px] ${T.muted}`}>{campaign.user_email}</p>
                  </div>
                  <span className="flex shrink-0 items-center gap-1.5">
                    {campaign.status === "running" && (
                      <Activity size={11} className="animate-pulse text-[#2a78d6] dark:text-[#3987e5]" />
                    )}
                    <StatusPill status={campaign.status} />
                  </span>
                </div>

                {/* Progress gets the full card width — it's the number this
                    page exists to report. */}
                <div className={`border-t ${T.hairline} p-4`}>
                  <div className="mb-1.5 flex items-baseline justify-between gap-3">
                    <span className={`text-[11px] ${T.muted}`}>Progress</span>
                    <span className={`text-[12px] font-semibold tabular-nums ${T.ink}`}>
                      {campaign.processed_jobs}/{campaign.total_jobs || 0}
                      <span className={`ml-1.5 font-normal ${T.muted}`}>{pct}%</span>
                    </span>
                  </div>
                  <span className="block h-2 w-full overflow-hidden rounded-full bg-[#EFEFEC] dark:bg-white/10">
                    <span
                      className="block h-full rounded-full bg-[#2a78d6] transition-all dark:bg-[#3987e5]"
                      style={{ width: `${pct}%` }}
                    />
                  </span>
                </div>

                <div className={`grid grid-cols-2 border-t ${T.hairline}`}>
                  <div className={`border-r ${T.hairline} p-4`}>
                    <p className={`text-[11px] ${T.muted}`}>Success rate</p>
                    <p className={`mt-0.5 text-[18px] font-bold leading-none tabular-nums ${T.ink}`}>
                      {campaign.success_rate}%
                      <span className={`ml-1.5 text-[11px] font-normal ${T.muted}`}>
                        of {campaign.drafted}
                      </span>
                    </p>
                  </div>
                  <div className="p-4">
                    <p className={`text-[11px] ${T.muted}`}>Started</p>
                    <p className={`mt-0.5 text-[12.5px] font-semibold ${T.ink}`}>
                      {format(new Date(campaign.created_at), "d MMM yyyy")}
                    </p>
                  </div>
                </div>

                <div className={`border-t ${T.hairline} p-4`}>
                  <button
                    onClick={() => handleExpand(campaign.id)}
                    className={`flex w-full items-center justify-center gap-1.5 rounded-xl border ${T.hairline}
                                px-3 py-2 text-[12.5px] font-medium ${T.ink2} transition-colors
                                hover:bg-[#F4F4F2] dark:hover:bg-white/5`}
                  >
                    {isOpen
                      ? <><ChevronUp size={13} /> Hide applications</>
                      : <><ChevronDown size={13} /> View applications</>}
                  </button>
                </div>

                {isOpen && renderApps(campaign)}
              </Panel>
            );
          })
        ) : (
          <Panel>
            {loadError ? (
              <EmptyState icon={AlertTriangle} title="Couldn't load campaigns" hint={loadError} />
            ) : (
              <EmptyState
                icon={Inbox}
                title={search ? "No matches" : "No campaigns yet"}
                hint={
                  search
                    ? "No users match that search."
                    : "Campaigns appear here when users deploy applications."
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
                  <Th>User</Th>
                  <Th>Status</Th>
                  <Th>Progress</Th>
                  <Th>Success rate</Th>
                  <Th>Started</Th>
                  <Th className="text-right">Details</Th>
                </tr>
              </thead>
              <tbody className={`divide-y ${T.divide}`}>
                {paginated.map((campaign) => {
                  const isOpen = expandedCampaign === campaign.id;
                  return (
                    <React.Fragment key={campaign.id}>
                      <tr
                        onClick={() => handleExpand(campaign.id)}
                        className={`cursor-pointer transition-colors ${T.hover}`}
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={campaign.user_full_name} />
                            <div className="min-w-0">
                              <p className={`truncate text-[13px] font-semibold ${T.ink}`}>
                                {campaign.user_full_name}
                              </p>
                              <p className={`truncate text-[11px] ${T.muted}`}>
                                {campaign.user_email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center gap-1.5">
                            {campaign.status === "running" && (
                              <Activity size={11} className="animate-pulse text-[#2a78d6] dark:text-[#3987e5]" />
                            )}
                            <StatusPill status={campaign.status} />
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <ProgressBar done={campaign.processed_jobs} total={campaign.total_jobs} />
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`text-[12.5px] font-semibold tabular-nums ${T.ink}`}>
                            {campaign.success_rate}%
                          </span>
                          <span className={`ml-1.5 text-[11px] ${T.muted}`}>
                            of {campaign.drafted}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className={`text-[12px] tabular-nums ${T.ink2}`}>
                            {format(new Date(campaign.created_at), "d MMM yyyy")}
                          </p>
                          <p className={`text-[10.5px] ${T.muted}`}>
                            {formatDistanceToNow(new Date(campaign.created_at), { addSuffix: true })}
                          </p>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <GhostButton
                            onClick={(e) => { e.stopPropagation(); handleExpand(campaign.id); }}
                          >
                            {isOpen
                              ? <><ChevronUp size={13} /> Hide</>
                              : <><ChevronDown size={13} /> View apps</>}
                          </GhostButton>
                        </td>
                      </tr>

                      {isOpen && (
                        <tr>
                          <td colSpan={6} className="p-0">
                            {renderApps(campaign)}
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
          <EmptyState icon={AlertTriangle} title="Couldn't load campaigns" hint={loadError} />
        ) : (
          <EmptyState
            icon={Inbox}
            title={search ? "No matches" : "No campaigns yet"}
            hint={
              search
                ? "No users match that search."
                : "Campaigns appear here when users deploy applications."
            }
          />
        )}
      </Panel>

      <Pagination page={currentPage} totalPages={totalPages} onChange={setCurrentPage} />
    </div>
  );
};

export default CampaignMonitorPage;
