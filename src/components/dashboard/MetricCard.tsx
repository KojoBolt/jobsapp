import React from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { CHART, T } from "@/admin/ui/system";
import { Sparkline, useRamp, type SparkPoint } from "@/admin/ui/charts";

/**
 * Metric card: label + tinted icon tile on top, the value and its trend side by
 * side, then the period-over-period change.
 *
 * `delta` is null when there's nothing to compare against, which hides the
 * change row rather than printing a meaningless 0%.
 *
 * Direction is encoded three ways — arrow glyph, sign, and colour — because red
 * and green are near-indistinguishable under deuteranopia, so the arrow has to
 * carry the meaning on its own.
 */
const MetricCard = ({
  icon: Icon,
  label,
  value,
  series,
  delta,
  deltaCaption = "Last Week",
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  series: SparkPoint[];
  delta: number | null;
  deltaCaption?: string;
}) => {
  const { dark } = useRamp();
  const falling = delta !== null && delta < 0;
  const direction = delta === null ? "flat" : falling ? "down" : "up";

  const trend = falling
    ? (dark ? CHART.criticalDark : CHART.critical)
    : (dark ? CHART.goodDark : CHART.good);
  // Neutral tile until the metric is actually down, matching the reference.
  const tint = falling ? trend : (dark ? CHART.accentDark : CHART.accent);
  const Arrow = falling ? ArrowDownRight : ArrowUpRight;

  return (
    <div className={`rounded-2xl border ${T.hairline} bg-white p-4 dark:bg-[#1A1A19]`}>
      <div className="flex items-start justify-between gap-3">
        <p className={`text-[13.5px] font-bold leading-tight ${T.ink}`}>{label}</p>
        <span
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg"
          style={{ backgroundColor: `${tint}1A`, color: tint }}
        >
          <Icon size={15} strokeWidth={2} />
        </span>
      </div>

      {/* Value left, trend right. The chart is capped so it can't stretch into a
          near-flat line across a wide card — it stays a compact glyph. */}
      <div className="mt-2 flex items-end justify-between gap-3">
        <p className={`shrink-0 text-[26px] font-bold leading-none tracking-[-0.02em] ${T.ink}`}>
          {value}
        </p>
        <div className="min-w-0 max-w-[190px] flex-1">
          <Sparkline data={series} direction={direction} />
        </div>
      </div>

      {delta !== null && (
        <p className="mt-1.5 flex items-center gap-1 text-[11.5px]">
          <Arrow size={12} strokeWidth={2.5} style={{ color: trend }} />
          <span className="font-bold" style={{ color: trend }}>
            {Math.abs(delta)}%
          </span>
          <span className={T.muted}>{deltaCaption}</span>
        </p>
      )}
    </div>
  );
};

export default MetricCard;
