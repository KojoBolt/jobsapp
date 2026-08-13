import CountUp from "react-countup";
import { Users, CalendarCheck, Package, Tag } from "lucide-react";
import { type Product, formatPrice } from "@/hooks/useAccelerators";
import { CHART, T, DeltaChip } from "@/admin/ui/system";
import { Sparkline, useRamp, type SparkPoint } from "@/admin/ui/charts";

/**
 * Community figures we publish. These are marketing claims with no table behind
 * them — keep them here, and keep them honest, rather than dressing them up as
 * live metrics.
 */
const COMMUNITY = {
  studentsHelped: 5000,
  interviews: 1240,
};

/**
 * ⚠️ PLACEHOLDER DATA — NOT MEASURED.
 *
 * The trend lines and percentage chips on this strip are invented so the panel
 * looks finished. Nothing computes them and nothing updates them. Replace this
 * whole constant when the underlying figures become queryable; deleting it will
 * make every consumer below fail loudly rather than quietly keep faking.
 *
 * Fixed arrays, not random, so the shapes don't jitter between renders.
 */
const PLACEHOLDER_TRENDS: Record<string, { delta: number; points: number[] }> = {
  students:   { delta: 18.2, points: [22, 26, 24, 31, 29, 38, 42, 40, 47, 52] },
  interviews: { delta: 12.0, points: [14, 17, 15, 21, 19, 18, 24, 27, 26, 31] },
  products:   { delta: 6.5,  points: [30, 30, 32, 31, 34, 36, 35, 38, 39, 41] },
  price:      { delta: -4.1, points: [48, 46, 47, 44, 45, 41, 42, 38, 37, 35] },
};

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun", "Mon", "Tue", "Wed"];

const seriesFor = (key: string): SparkPoint[] =>
  (PLACEHOLDER_TRENDS[key]?.points ?? []).map((value, i) => ({
    label: DAYS[i] ?? `Day ${i + 1}`,
    value,
  }));

interface SocialProofStripProps {
  /** Passed from the page so the catalogue figures are measured, not asserted. */
  products?: Product[];
}

const SocialProofStrip = ({ products = [] }: SocialProofStripProps) => {
  const { dark } = useRamp();
  const accent = dark ? CHART.accentDark : CHART.accent;

  // Derived from the real catalogue rather than hardcoded.
  const prices = products.map((p) => p.price_subunit).filter((n) => typeof n === "number");
  const currency = products[0]?.currency || "USD";
  const lowest = prices.length ? Math.min(...prices) : null;
  const highest = prices.length ? Math.max(...prices) : null;

  const priceRange =
    lowest === null || highest === null
      ? "—"
      : lowest === highest
      ? lowest === 0
        ? "Free"
        : formatPrice(lowest, currency)
      : `${lowest === 0 ? "Free" : formatPrice(lowest, currency)} – ${formatPrice(highest, currency)}`;

  const tiles = [
    {
      key: "students",
      icon: Users,
      label: "Students helped",
      value: <CountUp start={0} end={COMMUNITY.studentsHelped} duration={2} separator="," />,
      caption: "this month",
    },
    {
      key: "interviews",
      icon: CalendarCheck,
      label: "Interviews landed",
      value: <CountUp start={0} end={COMMUNITY.interviews} duration={2} separator="," />,
      caption: "this month",
    },
    {
      key: "products",
      icon: Package,
      label: "Career products",
      value: products.length ? <CountUp start={0} end={products.length} duration={1.2} /> : "—",
      caption: "available now",
    },
    {
      key: "price",
      icon: Tag,
      label: "Price range",
      value: priceRange,
      caption: "across catalogue",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {tiles.map((t) => {
        const Icon = t.icon;
        const trend = PLACEHOLDER_TRENDS[t.key];
        const rising = (trend?.delta ?? 0) >= 0;

        return (
          <div
            key={t.key}
            className={`overflow-hidden rounded-2xl border ${T.hairline} bg-white p-4
                        dark:bg-[#1A1A19]`}
          >
            <div className="flex items-center gap-2">
              <Icon size={13} style={{ color: accent }} className="shrink-0" />
              <span
                className={`truncate text-[10.5px] font-semibold uppercase tracking-[0.08em] ${T.muted}`}
              >
                {t.label}
              </span>
            </div>

            <p className={`mt-2.5 text-[26px] font-bold leading-none tracking-[-0.02em] ${T.ink}`}>
              {t.value}
            </p>

            {trend && (
              <div className="mt-2.5 flex items-center gap-2">
                <DeltaChip value={trend.delta} />
                <span className={`truncate text-[11px] ${T.muted}`}>{t.caption}</span>
              </div>
            )}

            {/* Direction is carried by the chip's arrow above as well as the
                line colour, so the trend never reads by hue alone. */}
            <div className="-mx-1 mt-1">
              <Sparkline
                data={seriesFor(t.key)}
                direction={rising ? "up" : "down"}
                showBadge={false}
                height={44}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SocialProofStrip;
