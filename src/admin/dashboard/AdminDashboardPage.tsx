import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Tag, ClipboardList, Users, Gauge, PieChart, LineChart as LineIcon,
  BarChart3, CalendarClock, History,
} from "lucide-react";
import { format, formatDistanceToNow, subMonths, startOfMonth } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Panel, PanelHeader, StatTile, Pill, IconButton, LegendRow, T } from "@/admin/ui/system";
import { useRegisterExport, useAdminActions } from "@/admin/context/AdminActionsContext";
import {
  PipelineGauge, TrendChart, TrendKey, RankedBar, ActivityHeatmap,
  useRamp, type GaugeBand, type HeatCell,
} from "@/admin/ui/charts";

type AppRow = {
  id: string;
  status: string;
  created_at: string;
  updated_at: string | null;
  company_name: string | null;
  user_id: string | null;
};

const REVIEWED = ["approved", "submitted", "completed"];
const PENDING = ["queued", "pending_review", "drafting"];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const BANDS = ["00–08", "08–16", "16–24"];

/** Percent change, guarding the divide-by-zero case that makes deltas lie. */
const pctChange = (current: number, previous: number) =>
  previous === 0 ? (current > 0 ? 100 : 0) : Math.round(((current - previous) / previous) * 100);

const AdminDashboardPage = () => {
  const [apps, setApps] = useState<AppRow[]>([]);
  const [userCount, setUserCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { ramp } = useRamp();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        const { data, error } = await supabase
          .from("applications")
          .select("id, status, created_at, updated_at, company_name, user_id");

        if (error) {
          console.error("[AdminDashboard] applications query failed:", error);
          return;
        }
        setApps((data as AppRow[]) || []);

        const { count } = await supabase
          .from("profiles")
          .select("id", { count: "exact", head: true });
        setUserCount(count || 0);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const { inRange } = useAdminActions();

  // The header's date range scopes every figure and chart on this page.
  const scopedApps = useMemo(
    () => apps.filter((a) => inRange(a.created_at)),
    [apps, inRange],
  );

  const m = useMemo(() => {
    const apps = scopedApps;
    const now = new Date();
    const d30 = new Date(now); d30.setDate(now.getDate() - 30);
    const d60 = new Date(now); d60.setDate(now.getDate() - 60);

    const inWindow = (a: AppRow, from: Date, to: Date) => {
      const t = new Date(a.created_at);
      return t >= from && t < to;
    };

    const last30 = apps.filter((a) => inWindow(a, d30, now));
    const prev30 = apps.filter((a) => inWindow(a, d60, d30));

    const pending = apps.filter((a) => PENDING.includes(a.status));
    const reviewed = apps.filter((a) => REVIEWED.includes(a.status));
    const failed = apps.filter((a) => a.status === "failed");
    const decided = reviewed.length + failed.length;
    const approvalRate = decided > 0 ? Math.round((reviewed.length / decided) * 100) : 0;

    const prevDecided =
      prev30.filter((a) => REVIEWED.includes(a.status)).length +
      prev30.filter((a) => a.status === "failed").length;
    const prevRate =
      prevDecided > 0
        ? Math.round((prev30.filter((a) => REVIEWED.includes(a.status)).length / prevDecided) * 100)
        : 0;

    // ── Pipeline bands: top three statuses, remainder folded into "Other" ──
    const byStatus = new Map<string, number>();
    apps.forEach((a) => byStatus.set(a.status, (byStatus.get(a.status) || 0) + 1));
    const sorted = [...byStatus.entries()].sort((a, b) => b[1] - a[1]);
    const top3 = sorted.slice(0, 3);
    const otherTotal = sorted.slice(3).reduce((s, [, v]) => s + v, 0);
    const bands: GaugeBand[] = [
      ...top3.map(([name, value]) => ({ name: name.replace(/_/g, " "), value })),
      ...(otherTotal > 0 ? [{ name: "other", value: otherTotal }] : []),
    ];

    // ── Monthly volume, last 7 months ──
    const trend = Array.from({ length: 7 }, (_, i) => {
      const monthDate = startOfMonth(subMonths(now, 6 - i));
      const next = startOfMonth(subMonths(now, 5 - i));
      return {
        month: format(monthDate, "MMM"),
        value: apps.filter((a) => {
          const t = new Date(a.created_at);
          return t >= monthDate && t < next;
        }).length,
      };
    });
    const nonZero = trend.filter((t) => t.value > 0);
    const target = nonZero.length
      ? Math.round(nonZero.reduce((s, t) => s + t.value, 0) / nonZero.length)
      : 0;

    // ── Top companies ──
    const byCompany = new Map<string, number>();
    apps.forEach((a) => {
      const key = a.company_name?.trim() || "Unknown";
      byCompany.set(key, (byCompany.get(key) || 0) + 1);
    });
    const topCompanies = [...byCompany.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, value]) => ({ name: name.length > 12 ? `${name.slice(0, 11)}…` : name, value }));

    // ── Review activity: decided apps by weekday × 8h band ──
    const cells: HeatCell[] = [];
    const bump = (day: string, band: string) => {
      const hit = cells.find((c) => c.day === day && c.band === band);
      if (hit) hit.value += 1;
      else cells.push({ day, band, value: 1 });
    };
    apps
      .filter((a) => REVIEWED.includes(a.status) || a.status === "failed")
      .forEach((a) => {
        const t = new Date(a.updated_at || a.created_at);
        const day = DAYS[(t.getDay() + 6) % 7];
        bump(day, BANDS[Math.min(2, Math.floor(t.getHours() / 8))]);
      });

    const recent = [...apps]
      .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
      .slice(0, 4);

    return {
      total: apps.length,
      pending: pending.length,
      reviewed: reviewed.length,
      approvalRate,
      bands,
      trend,
      target,
      topCompanies,
      cells,
      recent,
      deltaTotal: pctChange(last30.length, prev30.length),
      deltaPending: pctChange(
        last30.filter((a) => PENDING.includes(a.status)).length,
        prev30.filter((a) => PENDING.includes(a.status)).length,
      ),
      deltaRate: approvalRate - prevRate,
      todayCount: apps.filter(
        (a) => new Date(a.created_at).toDateString() === new Date().toDateString(),
      ).length,
    };
  }, [scopedApps]);

  // Memoised: the header registers this by identity, so a new function every
  // render would re-register on every render and loop.
  const exportCsv = useCallback(() => {
    const rows = [
      ["metric", "value"],
      ["total_applications", m.total],
      ["pending_review", m.pending],
      ["active_users", userCount],
      ["approval_rate_pct", m.approvalRate],
      [],
      ["month", "applications"],
      ...m.trend.map((t) => [t.month, t.value]),
      [],
      ["company", "applications"],
      ...m.topCompanies.map((c) => [c.name, c.value]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `dashboard-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [m, userCount]);

  // Publish this page's export so the header's Export button can run it.
  useRegisterExport(exportCsv);

  return (
    <div className="space-y-4">
      {/* Date range, filters and Export live in the header — see AdminHeader. */}
      <div>
        <h1 className={`text-[20px] font-bold tracking-[-0.01em] ${T.ink}`}>Dashboard</h1>
        <p className={`text-[12px] ${T.muted}`}>Application review activity</p>
      </div>

      {/* ── Stat row ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile icon={Tag} label="Total Applications" value={m.total.toLocaleString()}
                  delta={m.deltaTotal} caption="vs previous 30 days" loading={loading} />
        <StatTile icon={ClipboardList} label="Pending Review" value={m.pending.toLocaleString()}
                  note="in queue" delta={m.deltaPending} invertDelta caption="vs previous 30 days"
                  loading={loading} />
        <StatTile icon={Users} label="Registered Users" value={userCount.toLocaleString()}
                  note="people" delta={0} caption="total on platform" loading={loading} />
        <StatTile icon={Gauge} label="Approval Rate" value={`${m.approvalRate}%`}
                  delta={m.deltaRate} caption="vs previous 30 days" loading={loading} />
      </div>

      {/* ── Main grid ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-4">
          <Panel>
            <PanelHeader icon={PieChart} title="Pipeline Breakdown" right={<IconButton label="Open pipeline" />} />
            <div className="px-5 pb-4">
              <PipelineGauge bands={m.bands} total={m.total} caption="Applications" />
              <div className="mt-2 divide-y divide-[#EAEAE7] dark:divide-white/10">
                {m.bands.map((b, i) => (
                  <LegendRow
                    key={b.name}
                    color={ramp[i % ramp.length]}
                    name={b.name.replace(/\b\w/g, (c) => c.toUpperCase())}
                    sub={`${m.total ? Math.round((b.value / m.total) * 100) : 0}% of pipeline`}
                    value={b.value.toLocaleString()}
                  />
                ))}
                {m.bands.length === 0 && !loading && (
                  <p className={`py-6 text-center text-[12px] ${T.muted}`}>No applications yet</p>
                )}
              </div>
            </div>
          </Panel>

          <Panel>
            <PanelHeader icon={History} title="Recent Activity" right={<IconButton label="Open applications" />} />
            <div className="px-5 pb-4">
              {m.recent.length ? (
                <div className="divide-y divide-[#EAEAE7] dark:divide-white/10">
                  {m.recent.map((a) => (
                    <div key={a.id} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#F4F4F2] text-[11px] font-bold text-[#6B6A66] dark:bg-white/5 dark:text-[#C3C2B7]">
                          {(a.company_name || "?").slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className={`truncate text-[12.5px] font-semibold ${T.ink}`}>
                            {a.company_name || "Unknown company"}
                          </p>
                          <p className={`truncate text-[11px] ${T.muted}`}>
                            {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      <span className={`shrink-0 text-[11px] capitalize ${T.ink2}`}>
                        {a.status.replace(/_/g, " ")}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={`py-6 text-center text-[12px] ${T.muted}`}>Nothing yet</p>
              )}
            </div>
          </Panel>
        </div>

        {/* Right column */}
        <div className="space-y-4 lg:col-span-2">
          <Panel>
            <PanelHeader
              icon={LineIcon}
              title="Applications Over Time"
              right={<><Pill>Monthly</Pill><IconButton label="Open trend" /></>}
            />
            <div className="px-5 pb-4">
              <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className={`text-[24px] font-bold leading-none tracking-[-0.02em] ${T.ink}`}>
                    {m.trend.reduce((s, t) => s + t.value, 0).toLocaleString()}
                  </p>
                  <p className={`mt-1 text-[11px] ${T.muted}`}>Last 7 months</p>
                </div>
                <TrendKey />
              </div>
              <TrendChart data={m.trend} target={m.target} />
            </div>
          </Panel>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Panel>
              <PanelHeader icon={BarChart3} title="Top Companies" right={<Pill>All time</Pill>} />
              <div className="px-5 pb-4">
                <p className={`mb-1 text-[11px] ${T.muted}`}>
                  Today&apos;s new applications:{" "}
                  <span className={`font-semibold ${T.ink}`}>{m.todayCount}</span>
                </p>
                {m.topCompanies.length ? (
                  <RankedBar data={m.topCompanies} />
                ) : (
                  <p className={`py-12 text-center text-[12px] ${T.muted}`}>No data yet</p>
                )}
              </div>
            </Panel>

            <Panel>
              <PanelHeader icon={CalendarClock} title="Review Activity" right={<IconButton label="Open activity" />} />
              <div className="px-5 pb-5">
                <div className="mb-3 flex items-baseline gap-2">
                  <span className={`text-[24px] font-bold leading-none tracking-[-0.02em] ${T.ink}`}>
                    {m.reviewed.toLocaleString()}
                  </span>
                  <span className={`text-[11px] ${T.muted}`}>decisions logged</span>
                </div>
                <ActivityHeatmap cells={m.cells} days={DAYS} bands={BANDS} />
              </div>
            </Panel>
          </div>
        </div>
      </div>

      <Link
        to="/admin/review-queue"
        className={`block ${T.card} rounded-2xl px-5 py-3.5 text-[12.5px] font-semibold ${T.ink}
                    transition-colors hover:bg-[#FAFAF8] dark:hover:bg-white/5`}
      >
        {m.pending} applications waiting for review →
      </Link>
    </div>
  );
};

export default AdminDashboardPage;
