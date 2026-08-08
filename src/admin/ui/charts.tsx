import React, { useState } from "react";
import {
  LineChart, Line, BarChart, Bar, Cell, XAxis, YAxis,
  CartesianGrid, ResponsiveContainer, ReferenceLine, LabelList,
  Tooltip as RTooltip,
} from "recharts";
import { useTheme } from "@/admin/context/ThemeContext";
import { CHART, T } from "@/admin/ui/system";

/* Ordinal neutral ramp, validated in both modes (light end 2.20:1 / 2.30:1).
   Identity is always carried by an adjacent label — never by shade alone. */
export const RAMP_LIGHT = ["#2b2b29", "#575652", "#85847f", "#b0afa9"];
export const RAMP_DARK  = ["#f2f2ef", "#b9b8b2", "#807f7a", "#55544f"];

export const useRamp = () => {
  const { theme } = useTheme();
  const dark = theme === "dark";
  return {
    dark,
    ramp:   dark ? RAMP_DARK : RAMP_LIGHT,
    accent: dark ? CHART.accentDark : CHART.accent,
    grid:   dark ? CHART.gridDark : CHART.grid,
    surface: dark ? "#1A1A19" : "#ffffff",
  };
};

/* ── Floating tooltip ──────────────────────────────────────────────────────
   Dark rounded card, matching the reference. Shared by every chart here.   */
const TipCard = ({ title, rows }: { title: string; rows: [string, string][] }) => (
  <div className="rounded-xl bg-[#1C1C1A] px-3 py-2.5 text-white shadow-lg ring-1 ring-white/10">
    <p className="mb-1.5 text-[11px] font-semibold">{title}</p>
    {rows.map(([k, v]) => (
      <div key={k} className="flex items-center justify-between gap-6 text-[11px]">
        <span className="text-white/60">{k}</span>
        <span className="font-semibold tabular-nums">{v}</span>
      </div>
    ))}
  </div>
);

/* ═══════════════════════════════════════════════════════════════════════════
   1. PipelineGauge — a half-donut of tapered radial segments.
   Sequential magnitude: each status claims a proportional run of segments,
   shaded by the ordinal ramp. The legend beside it names every band, so the
   shading is reinforcement rather than the only key.
   ══════════════════════════════════════════════════════════════════════════ */
export type GaugeBand = { name: string; value: number };

export const PipelineGauge = ({
  bands,
  total,
  caption,
  segments = 26,
}: {
  bands: GaugeBand[];
  total: number;
  caption: string;
  segments?: number;
}) => {
  const { ramp } = useRamp();
  const [hover, setHover] = useState<number | null>(null);

  const W = 260, H = 150;
  const cx = W / 2, cy = H - 12;
  const rIn = 62, rOut = 96;

  const sum = bands.reduce((a, b) => a + b.value, 0) || 1;

  // Which band owns each segment, left → right.
  const owner: number[] = [];
  let cursor = 0;
  bands.forEach((b, i) => {
    const count = Math.round((b.value / sum) * segments);
    for (let k = 0; k < count && cursor < segments; k++, cursor++) owner.push(i);
  });
  while (owner.length < segments) owner.push(bands.length - 1);

  const polar = (r: number, deg: number) => {
    const rad = (deg * Math.PI) / 180;
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)] as const;
  };

  const step = 180 / segments;
  const pad = step * 0.19; // surface gap between adjacent segments

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img"
           aria-label={`${caption}: ${total} total`}>
        {Array.from({ length: segments }, (_, k) => {
          const a0 = 180 + k * step + pad;
          const a1 = 180 + (k + 1) * step - pad;
          const [x1, y1] = polar(rIn, a0);
          const [x2, y2] = polar(rOut, a0);
          const [x3, y3] = polar(rOut, a1);
          const [x4, y4] = polar(rIn, a1);
          const bandIdx = owner[k];
          const active = hover === null || hover === bandIdx;

          return (
            <path
              key={k}
              d={`M${x1},${y1} L${x2},${y2} A${rOut},${rOut} 0 0 1 ${x3},${y3} L${x4},${y4} A${rIn},${rIn} 0 0 0 ${x1},${y1} Z`}
              fill={ramp[bandIdx % ramp.length]}
              strokeLinejoin="round"
              stroke={ramp[bandIdx % ramp.length]}
              strokeWidth={1.5}
              opacity={active ? 1 : 0.28}
              style={{ transition: "opacity 140ms" }}
              onMouseEnter={() => setHover(bandIdx)}
              onMouseLeave={() => setHover(null)}
            />
          );
        })}
      </svg>

      <div className="pointer-events-none absolute inset-x-0 bottom-3 text-center">
        <p className={`text-[26px] font-bold leading-none tracking-[-0.02em] ${T.ink}`}>
          {total.toLocaleString()}
        </p>
        <p className={`mt-1 text-[11px] ${T.muted}`}>
          {hover !== null && bands[hover] ? bands[hover].name : caption}
        </p>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   2. TrendChart — one real series (blue) against a dashed neutral target.
   The target is chrome, not a second series: a gray categorical slot fails
   the chroma floor, and a reference line is what it actually represents.
   ══════════════════════════════════════════════════════════════════════════ */
export const TrendChart = ({
  data,
  target,
}: {
  data: { month: string; value: number }[];
  target: number;
}) => {
  const { accent, grid, surface, dark } = useRamp();

  return (
    <div className="h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: -8 }}>
          <CartesianGrid stroke={grid} strokeDasharray="3 4" vertical={false} />
          <XAxis
            dataKey="month" tickLine={false} axisLine={false}
            tick={{ fill: CHART.axis, fontSize: 11 }} dy={6}
          />
          <YAxis
            tickLine={false} axisLine={false} width={52}
            tick={{ fill: CHART.axis, fontSize: 11 }}
            tickFormatter={(v) => `${v}`}
          />
          <RTooltip
            cursor={{ stroke: dark ? "#ffffff" : "#111110", strokeOpacity: 0.06, strokeWidth: 28 }}
            content={({ active, payload, label }) =>
              active && payload?.length ? (
                <TipCard
                  title={String(label)}
                  rows={[
                    ["Target", target.toLocaleString()],
                    ["Applications", Number(payload[0].value).toLocaleString()],
                  ]}
                />
              ) : null
            }
          />
          <ReferenceLine
            y={target}
            stroke={CHART.axis}
            strokeDasharray="5 5"
            strokeWidth={1.5}
            label={{
              value: "Target",
              position: "right",
              fill: CHART.axis,
              fontSize: 10,
            }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={accent}
            strokeWidth={2}
            dot={{ r: 3.5, fill: surface, stroke: accent, strokeWidth: 2 }}
            activeDot={{ r: 5, fill: accent, stroke: surface, strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

/* Inline key for the trend chart — one series plus one reference line. */
export const TrendKey = () => {
  const { accent } = useRamp();
  return (
    <div className="flex items-center gap-4">
      <span className={`inline-flex items-center gap-1.5 text-[11px] ${T.ink2}`}>
        <span className="h-2 w-2 rounded-full" style={{ background: accent }} aria-hidden />
        Applications
      </span>
      <span className={`inline-flex items-center gap-1.5 text-[11px] ${T.ink2}`}>
        <svg width="14" height="2" aria-hidden>
          <line x1="0" y1="1" x2="14" y2="1" stroke={CHART.axis} strokeWidth="1.5" strokeDasharray="4 3" />
        </svg>
        Target
      </span>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   3. RankedBar — single-measure magnitude, neutral ordinal ramp,
   4px rounded tops anchored to the baseline, values direct-labeled.
   ══════════════════════════════════════════════════════════════════════════ */
export const RankedBar = ({
  data,
}: {
  data: { name: string; value: number }[];
}) => {
  const { ramp, grid, dark } = useRamp();

  return (
    <div className="h-[190px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 22, right: 8, bottom: 0, left: -18 }} barCategoryGap="34%">
          <CartesianGrid stroke={grid} strokeDasharray="3 4" vertical={false} />
          <XAxis
            dataKey="name" tickLine={false} axisLine={false}
            tick={{ fill: CHART.axis, fontSize: 11 }} dy={6}
          />
          <YAxis tickLine={false} axisLine={false} width={44}
                 tick={{ fill: CHART.axis, fontSize: 11 }} />
          <RTooltip
            cursor={{ fill: dark ? "#ffffff" : "#111110", fillOpacity: 0.04 }}
            content={({ active, payload }) =>
              active && payload?.length ? (
                <TipCard
                  title={String(payload[0].payload.name)}
                  rows={[["Applications", Number(payload[0].value).toLocaleString()]]}
                />
              ) : null
            }
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={54}>
            {data.map((_, i) => (
              <Cell key={i} fill={ramp[i % ramp.length]} />
            ))}
            <LabelList
              dataKey="value" position="top" offset={8}
              fill={dark ? "#ffffff" : "#111110"}
              style={{ fontSize: 12, fontWeight: 700 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   4. ActivityHeatmap — sequential neutral by magnitude. Zero reads as an
   empty hairline cell so "no activity" never looks like "a little".
   ══════════════════════════════════════════════════════════════════════════ */
export type HeatCell = { day: string; band: string; value: number };

export const ActivityHeatmap = ({
  cells,
  days,
  bands,
}: {
  cells: HeatCell[];
  days: string[];
  bands: string[];
}) => {
  const { dark } = useRamp();
  const [tip, setTip] = useState<{ x: number; y: number; c: HeatCell } | null>(null);

  const max = Math.max(1, ...cells.map((c) => c.value));
  const shade = (v: number) => {
    if (v === 0) return "transparent";
    const t = v / max;                       // 0..1 → light → dark
    const steps = dark
      ? ["#3a3a37", "#6a6963", "#9b9a94", "#f2f2ef"]
      : ["#dcdbd5", "#a8a7a1", "#6b6a66", "#2b2b29"];
    return steps[Math.min(steps.length - 1, Math.floor(t * steps.length))];
  };

  const at = (day: string, band: string) =>
    cells.find((c) => c.day === day && c.band === band) ?? { day, band, value: 0 };

  return (
    <div className="relative">
      {/* gap-1 below sm: with 7 day columns plus a row label, 6px gutters are
          what keeps the cells from collapsing on a phone. */}
      <div
        className="grid gap-1 sm:gap-1.5"
        style={{ gridTemplateColumns: `auto repeat(${days.length}, minmax(0, 1fr))` }}
      >
        <div />
        {days.map((d) => (
          <div key={d} className={`pb-1 text-center text-[10px] ${T.muted}`}>{d}</div>
        ))}

        {bands.map((band) => (
          <React.Fragment key={band}>
            <div className={`pr-1.5 text-right text-[9.5px] leading-6 sm:pr-2 sm:text-[10px] ${T.muted} whitespace-nowrap`}>
              {band}
            </div>
            {days.map((day) => {
              const c = at(day, band);
              return (
                <div
                  key={`${day}-${band}`}
                  onMouseEnter={(e) =>
                    setTip({ x: e.currentTarget.offsetLeft, y: e.currentTarget.offsetTop, c })
                  }
                  onMouseLeave={() => setTip(null)}
                  className={`h-6 rounded-[5px] transition-transform hover:scale-[1.06] ${
                    c.value === 0 ? `border ${T.hairline}` : ""
                  }`}
                  style={{ backgroundColor: shade(c.value) }}
                  role="img"
                  aria-label={`${day} ${band}: ${c.value} reviewed`}
                />
              );
            })}
          </React.Fragment>
        ))}
      </div>

      {tip ? (
        <div className="pointer-events-none absolute z-10 -translate-y-full"
             style={{ left: tip.x, top: tip.y - 6 }}>
          <TipCard title={`${tip.c.day} · ${tip.c.band}`}
                   rows={[["Reviewed", String(tip.c.value)]]} />
        </div>
      ) : null}
    </div>
  );
};
