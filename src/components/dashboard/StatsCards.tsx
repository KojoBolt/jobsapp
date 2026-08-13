import { useMemo } from "react";
import { format, startOfDay, subDays } from "date-fns";
import { DashboardStats, Application } from "@/hooks/useDashboardData";
import { Send, CheckCircle2, Layers } from "lucide-react";
import { type SparkPoint } from "@/admin/ui/charts";
import MetricCard from "@/components/dashboard/MetricCard";

interface StatsCardsProps {
  data: DashboardStats | null;
}

const SPARK_DAYS = 14;

/** Statuses the dashboard hook counts as a confirmation — kept in sync with
 *  useDashboardData so the sparkline can't tell a different story to the number
 *  printed above it. */
const CONFIRMED = ["submitted", "interview", "completed"];

/**
 * Daily counts across the trailing window. Days with no activity are kept as
 * zeros rather than dropped, so the line's horizontal spacing stays true to
 * elapsed time instead of compressing quiet stretches.
 */
const dailySeries = (apps: Application[], cumulative = false): SparkPoint[] => {
  const start = startOfDay(subDays(new Date(), SPARK_DAYS - 1));

  const buckets = new Map<string, number>();
  for (let i = 0; i < SPARK_DAYS; i++) {
    buckets.set(format(subDays(new Date(), SPARK_DAYS - 1 - i), "MMM d"), 0);
  }

  // Anything older than the window still counts toward a cumulative total.
  let carried = 0;
  for (const app of apps) {
    const at = new Date(app.created_at);
    if (at < start) {
      carried += 1;
      continue;
    }
    const key = format(at, "MMM d");
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) || 0) + 1);
  }

  let running = cumulative ? carried : 0;
  return Array.from(buckets, ([label, value]) => {
    if (!cumulative) return { label, value };
    running += value;
    return { label, value: running };
  });
};

/**
 * Percent change over the trailing week against the week before it. Returns
 * null when both windows are empty — there's no change to report, and a 0%
 * would read as a measurement rather than an absence of one.
 */
const weekOverWeek = (apps: Application[]): number | null => {
  const now = Date.now();
  const week = 7 * 24 * 60 * 60 * 1000;

  let recent = 0;
  let prior = 0;
  for (const app of apps) {
    const age = now - new Date(app.created_at).getTime();
    if (age < week) recent += 1;
    else if (age < week * 2) prior += 1;
  }

  if (recent === 0 && prior === 0) return null;
  if (prior === 0) return 100; // guard the divide-by-zero that makes deltas lie
  return Math.round(((recent - prior) / prior) * 100);
};

const StatsCards = ({ data }: StatsCardsProps) => {
  const series = useMemo(() => {
    const all = data?.applications ?? [];
    // The first two tiles are campaign-scoped, so their trends must be too.
    // With no active campaign useDashboardData reports 0, so the series has to
    // be empty as well — falling back to `all` here drew a line that
    // contradicted the zero printed above it.
    const campaign = data?.active_campaign_id
      ? all.filter((a) => a.campaign_id === data.active_campaign_id)
      : [];

    const confirmed = campaign.filter((a) => CONFIRMED.includes(a.status));

    return {
      sent: { points: dailySeries(campaign), delta: weekOverWeek(campaign) },
      confirmations: { points: dailySeries(confirmed), delta: weekOverWeek(confirmed) },
      lifetime: { points: dailySeries(all, true), delta: weekOverWeek(all) },
    };
  }, [data]);

  if (!data) return null;

  const stats = [
    {
      icon: Send,
      label: "Applications Sent",
      value: data.total_sent.toLocaleString(),
      series: series.sent,
    },
    {
      icon: CheckCircle2,
      label: "Confirmations",
      value: data.total_confirmations.toLocaleString(),
      series: series.confirmations,
    },
    {
      icon: Layers,
      label: "Total Applications Sent",
      value: data.lifetime_sent.toLocaleString(),
      series: series.lifetime,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {stats.map((s) => (
        <MetricCard
          key={s.label}
          icon={s.icon}
          label={s.label}
          value={s.value}
          series={s.series.points}
          delta={s.series.delta}
        />
      ))}
    </div>
  );
};

export default StatsCards;
