import { useState, useEffect, useMemo, useCallback } from "react";
import {
  CheckCircle2, XCircle, ExternalLink, CalendarCheck, CalendarRange,
  CalendarDays, Gauge, PieChart, LineChart as LineIcon, CalendarClock,
  History, Inbox, AlertTriangle,
} from "lucide-react";
import { format, formatDistanceToNow, startOfMonth } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import {
  T, Panel, PanelHeader, StatTile, PillMenu, IconButton, LegendRow,
  Pagination, EmptyState, CHART,
} from "@/admin/ui/system";
import {
  PipelineGauge, TrendChart, TrendKey, ActivityHeatmap, useRamp,
  buildTrend, GRAIN_OPTIONS, type GaugeBand, type HeatCell, type Grain,
} from "@/admin/ui/charts";
import { useRegisterExport, useAdminActions } from "@/admin/context/AdminActionsContext";

interface Activity {
  id: string;
  action: "approved" | "failed";
  company_name: string;
  job_title: string;
  job_url: string | null;
  admin_notes: string | null;
  updated_at: string;
}

const PAGE_SIZE = 20;

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const BANDS = ["00–08", "08–16", "16–24"];

const csvCell = (v: unknown) => {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const MyActivityPage = (): JSX.Element => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [grain, setGrain] = useState<Grain>("monthly");
  const { ramp } = useRamp();
  const { inRange } = useAdminActions();

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        setLoading(true);
        setLoadError(null);

        const { data, error } = await supabase
          .from("applications")
          .select("id, status, company_name, job_title, job_url, admin_notes, updated_at, created_at")
          .in("status", ["approved", "failed"])
          .order("updated_at", { ascending: false });

        if (error) {
          console.error("[MyActivity] query failed:", error);
          setLoadError(error.message || "Failed to load activity");
          return;
        }

        setActivities(
          (data || []).map((app) => ({
            id: app.id,
            action: app.status === "approved" ? "approved" : "failed",
            company_name: app.company_name,
            job_title: app.job_title,
            job_url: app.job_url,
            admin_notes: app.admin_notes,
            updated_at: app.updated_at || app.created_at,
          })),
        );
      } catch (err: any) {
        console.error("[MyActivity] unexpected error:", err);
        setLoadError(err?.message || "Unexpected error");
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, []);

  // The header's date range scopes the whole page — tiles, charts and feed all
  // read from this, so they can never disagree with each other.
  const scoped = useMemo(
    () => activities.filter((a) => inRange(a.updated_at)),
    [activities, inRange],
  );

  /* ── Derived metrics + chart series ───────────────────────────────────── */
  const m = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
    const weekStart = new Date(now); weekStart.setDate(now.getDate() - 7);
    const monthStart = startOfMonth(now);

    const at = (a: Activity) => new Date(a.updated_at);
    const since = (from: Date) => scoped.filter((a) => at(a) >= from).length;

    const approved = scoped.filter((a) => a.action === "approved").length;
    const rejected = scoped.length - approved;
    const approvalRate = scoped.length
      ? Math.round((approved / scoped.length) * 100)
      : 0;

    const bands: GaugeBand[] = scoped.length
      ? [
          { name: "Approved", value: approved },
          { name: "Rejected", value: rejected },
        ].filter((b) => b.value > 0)
      : [];

    // Decisions bucketed at the selected granularity.
    const { data: trend, target, caption: trendCaption } = buildTrend(scoped, at, grain);

    // When reviewing actually happens — weekday × 8-hour band.
    const cells: HeatCell[] = [];
    scoped.forEach((a) => {
      const t = at(a);
      const day = DAYS[(t.getDay() + 6) % 7];
      const band = BANDS[Math.min(2, Math.floor(t.getHours() / 8))];
      const hit = cells.find((c) => c.day === day && c.band === band);
      if (hit) hit.value += 1;
      else cells.push({ day, band, value: 1 });
    });

    return {
      today: since(todayStart),
      week: since(weekStart),
      month: since(monthStart),
      approved, rejected, approvalRate, bands, trend, target, trendCaption, cells,
    };
  }, [scoped, grain]);

  const exportCsv = useCallback(() => {
    const header = ["Decision", "Company", "Job title", "Notes", "When"];
    const rows = scoped.map((a) => [
      a.action === "approved" ? "Approved" : "Rejected",
      a.company_name, a.job_title, a.admin_notes ?? "",
      format(new Date(a.updated_at), "yyyy-MM-dd HH:mm"),
    ]);
    const csv = [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `review-activity-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [scoped]);

  useRegisterExport(exportCsv);

  /* ── Feed: paginate flat, then group the page by day ──────────────────── */
  const totalPages = Math.max(1, Math.ceil(scoped.length / PAGE_SIZE));
  const start = (page - 1) * PAGE_SIZE;
  const paged = scoped.slice(start, start + PAGE_SIZE);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const grouped = useMemo(() => {
    const out: Record<string, Activity[]> = {};
    paged.forEach((a) => {
      const key = format(new Date(a.updated_at), "EEEE, d MMM yyyy");
      (out[key] ||= []).push(a);
    });
    return Object.entries(out);
  }, [paged]);

  return (
    <div className="space-y-4">
      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div>
        <h1 className={`text-[20px] font-bold tracking-[-0.01em] ${T.ink}`}>My Activity</h1>
        <p className={`text-[12px] ${T.muted}`}>
          {loading ? "Loading…" : `${scoped.length} review decisions logged`}
        </p>
      </div>

      {/* ── Stat row ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile icon={CalendarCheck} label="Reviewed Today" value={m.today}
                  delta={0} caption="since midnight" loading={loading} />
        <StatTile icon={CalendarRange} label="This Week" value={m.week}
                  delta={0} caption="last 7 days" loading={loading} />
        <StatTile icon={CalendarDays} label="This Month" value={m.month}
                  delta={0} caption="month to date" loading={loading} />
        <StatTile icon={Gauge} label="Approval Rate" value={`${m.approvalRate}%`}
                  delta={0} caption="lifetime" loading={loading} />
      </div>

      {/* ── Charts ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel>
          <PanelHeader icon={PieChart} title="Decision Split"
                       right={<IconButton label="Open decision split" />} />
          <div className="px-4 pb-4 sm:px-5">
            {scoped.length > 0 ? (
              <>
                <PipelineGauge bands={m.bands} total={scoped.length} caption="Decisions" />
                <div className={`mt-2 divide-y ${T.divide}`}>
                  {m.bands.map((b, i) => (
                    <LegendRow
                      key={b.name}
                      color={ramp[i % ramp.length]}
                      name={b.name}
                      sub={`${Math.round((b.value / scoped.length) * 100)}% of decisions`}
                      value={String(b.value)}
                    />
                  ))}
                </div>
              </>
            ) : (
              <p className={`py-14 text-center text-[12px] ${T.muted}`}>
                {loading ? "Loading…" : "No decisions yet"}
              </p>
            )}
          </div>
        </Panel>

        <Panel className="lg:col-span-2">
          <PanelHeader
            icon={LineIcon}
            title="Decisions Over Time"
            right={
              <>
                <PillMenu
                  value={grain}
                  onChange={(v) => setGrain(v)}
                  heading="Group by"
                  options={GRAIN_OPTIONS}
                />
                <IconButton label="Open trend" />
              </>
            }
          />
          <div className="px-4 pb-4 sm:px-5">
            <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className={`text-[24px] font-bold leading-none tracking-[-0.02em] ${T.ink}`}>
                  {m.trend.reduce((s, t) => s + t.value, 0)}
                </p>
                <p className={`mt-1 text-[11px] ${T.muted}`}>{m.trendCaption}</p>
              </div>
              <TrendKey />
            </div>
            <TrendChart data={m.trend} target={m.target} />
          </div>
        </Panel>
      </div>

      {scoped.length > 0 && (
        <Panel>
          <PanelHeader icon={CalendarClock} title="Review Rhythm"
                       right={<IconButton label="Open rhythm" />} />
          <div className="px-4 pb-5 sm:px-5">
            <p className={`mb-3 text-[11px] ${T.muted}`}>
              When decisions get made, by weekday and time of day
            </p>
            <ActivityHeatmap cells={m.cells} days={DAYS} bands={BANDS} />
          </div>
        </Panel>
      )}

      {/* ── Feed ────────────────────────────────────────────────────────── */}
      <Panel>
        <PanelHeader
          icon={History}
          title="Review History"
          right={
            <span className={`text-[11px] ${T.muted}`}>
              {m.approved} approved · {m.rejected} rejected
            </span>
          }
        />

        <div className="px-4 pb-4 sm:px-5">
          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex gap-3">
                  <div className="h-4 w-12 animate-pulse rounded bg-[#EFEFEC] dark:bg-white/10" />
                  <div className="h-16 flex-1 animate-pulse rounded-xl bg-[#EFEFEC] dark:bg-white/10" />
                </div>
              ))}
            </div>
          ) : loadError ? (
            <EmptyState icon={AlertTriangle} title="Couldn't load activity" hint={loadError} />
          ) : scoped.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="No activity yet"
              hint="Review decisions appear here once applications are approved or rejected."
            />
          ) : (
            <div className="space-y-6">
              {grouped.map(([date, dayActivities]) => (
                <div key={date}>
                  <div className="mb-3 flex items-center gap-3">
                    <span className={`text-[10px] font-semibold uppercase tracking-[0.08em] ${T.muted}`}>
                      {date}
                    </span>
                    <span className={`h-px flex-1 ${T.hairline} border-t`} />
                    <span className={`text-[10px] tabular-nums ${T.muted}`}>
                      {dayActivities.length}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {dayActivities.map((a) => {
                      const approved = a.action === "approved";
                      return (
                        <div key={a.id} className="flex gap-3">
                          {/* The time gutter costs ~56px of width — too much on a
                              phone, where the time moves inside the card instead. */}
                          <span className={`hidden w-11 shrink-0 pt-2.5 text-right text-[11px] tabular-nums sm:block ${T.muted}`}>
                            {format(new Date(a.updated_at), "HH:mm")}
                          </span>

                          <div className={`flex-1 rounded-xl border ${T.hairline} p-3.5 transition-colors ${T.hover}`}>
                            <div className="flex items-start gap-2.5">
                              <span
                                className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg"
                                style={{
                                  backgroundColor: `${approved ? CHART.good : CHART.critical}1A`,
                                  color: approved ? CHART.good : CHART.critical,
                                }}
                              >
                                {approved ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                              </span>

                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <span className={`text-[12.5px] font-semibold ${T.ink}`}>
                                    {approved ? "Approved" : "Rejected"}
                                    <span className={`ml-1.5 font-normal ${T.ink2}`}>
                                      {a.company_name}
                                    </span>
                                  </span>
                                  <span className={`shrink-0 text-[10.5px] tabular-nums ${T.muted}`}>
                                    {/* Absolute time only on mobile, where the
                                        gutter that carried it is hidden. */}
                                    <span className="sm:hidden">
                                      {format(new Date(a.updated_at), "HH:mm")} ·{" "}
                                    </span>
                                    {formatDistanceToNow(new Date(a.updated_at), { addSuffix: true })}
                                  </span>
                                </div>

                                <p className={`mt-0.5 text-[12px] ${T.ink2}`}>{a.job_title}</p>

                                {a.admin_notes && (
                                  <p className={`mt-2 rounded-lg bg-[#FAFAF8] px-3 py-2 text-[12px] italic
                                                 ${T.ink2} dark:bg-white/[0.03]`}>
                                    “{a.admin_notes}”
                                  </p>
                                )}

                                {a.job_url && (
                                  <a
                                    href={a.job_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-2 inline-flex items-center gap-1 text-[10.5px] font-medium text-[#2a78d6] hover:underline dark:text-[#3987e5]"
                                  >
                                    <ExternalLink size={9} /> View job posting
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {!loading && !loadError && scoped.length > 0 && (
          <div className={`border-t ${T.hairline} px-5 py-3`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className={`hidden text-[12px] sm:block ${T.muted}`}>
                Showing {start + 1}–{Math.min(start + PAGE_SIZE, scoped.length)} of{" "}
                {scoped.length}
              </p>
              <Pagination page={page} totalPages={totalPages} onChange={setPage} />
            </div>
          </div>
        )}
      </Panel>
    </div>
  );
};

export default MyActivityPage;
