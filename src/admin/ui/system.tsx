import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowUpRight, ArrowDownRight, Check, ChevronDown, ChevronLeft, ChevronRight,
  MoveUpRight, Search, X as XIcon,
} from "lucide-react";
import { Dropdown } from "./Dropdown";

/* ─────────────────────────────────────────────────────────────────────────────
   Admin design system — the single source of truth for every admin screen.

   One accent, everything else neutral. Accent and neutral ramp were validated
   with the palette checker against a white card surface:
     accent  #2a78d6 (light) / #3987e5 (dark)
     ramp    #2b2b29 → #575652 → #85847f → #b0afa9
   Dark values are stepped for the dark surface, never flipped from light.

   House rules that keep screens consistent:
     · cards are hairline-bordered, never shadowed — depth comes from the
       border against the gray page plane
     · micro-labels are 10–11px / 600 / uppercase / 0.08em, secondary ink
     · status colour never carries meaning alone; it always ships with its text
   ────────────────────────────────────────────────────────────────────────── */
export const T = {
  page:     "bg-[#F4F4F2] dark:bg-[#0D0D0D]",
  card:     "bg-white dark:bg-[#1A1A19] border border-[#EAEAE7] dark:border-white/10",
  radius:   "rounded-2xl",
  ink:      "text-[#111110] dark:text-white",
  ink2:     "text-[#6B6A66] dark:text-[#C3C2B7]",
  muted:    "text-[#9A9995] dark:text-[#898781]",
  hairline: "border-[#EAEAE7] dark:border-white/10",
  divide:   "divide-[#EAEAE7] dark:divide-white/10",
  hover:    "hover:bg-[#FAFAF8] dark:hover:bg-white/5",
} as const;

export const CHART = {
  accent:     "#2a78d6",
  accentDark: "#3987e5",
  ramp:       ["#2b2b29", "#575652", "#85847f", "#b0afa9"],
  rampDark:   ["#f2f2ef", "#b9b8b2", "#807f7a", "#55544f"],
  grid:       "#E1E0D9",
  gridDark:   "#2C2C2A",
  axis:       "#898781",
  good:       "#0CA30C",
  warning:    "#FAB219",
  serious:    "#EC835A",
  critical:   "#D03B3B",
  /* Dark-mode steps, chosen against #1A1A19 rather than lightened from the
     values above — both pass the lightness band, chroma floor and 3:1 contrast. */
  goodDark:     "#34AF5F",
  criticalDark: "#E8635F",
} as const;

/* ── Surfaces ─────────────────────────────────────────────────────────────── */

export const Panel = ({
  className = "",
  children,
}: { className?: string; children: React.ReactNode }) => (
  <div className={`${T.card} ${T.radius} ${className}`}>{children}</div>
);

export const PanelHeader = ({
  icon: Icon, title, right,
}: { icon: React.ElementType; title: string; right?: React.ReactNode }) => (
  <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-3">
    <div className="flex min-w-0 items-center gap-2">
      <Icon size={14} className="shrink-0 text-[#6B6A66] dark:text-[#C3C2B7]" />
      <span className={`truncate text-[11px] font-semibold uppercase tracking-[0.08em] ${T.ink2}`}>
        {title}
      </span>
    </div>
    {right ? <div className="flex shrink-0 items-center gap-2">{right}</div> : null}
  </div>
);

/* ── Controls ─────────────────────────────────────────────────────────────── */

export const IconButton = ({ label, onClick }: { label: string; onClick?: () => void }) => (
  <button
    type="button" aria-label={label} onClick={onClick}
    className={`grid h-7 w-7 place-items-center rounded-lg border ${T.hairline} ${T.ink2}
                transition-colors hover:bg-[#F4F4F2] dark:hover:bg-white/5`}
  >
    <MoveUpRight size={13} />
  </button>
);

export const Pill = ({
  children, onClick,
}: { children: React.ReactNode; onClick?: () => void }) => (
  <button
    type="button" onClick={onClick}
    className={`inline-flex items-center gap-1.5 rounded-lg border ${T.hairline} px-2.5 py-1.5
                text-[12px] font-medium ${T.ink2} transition-colors
                hover:bg-[#F4F4F2] dark:hover:bg-white/5`}
  >
    {children}
    <ChevronDown size={12} className="opacity-60" />
  </button>
);

/**
 * A Pill that actually opens a menu. `Pill` above is presentation only — use
 * this wherever the chevron implies a choice, so the affordance isn't a lie.
 */
export const PillMenu = <V extends string>({
  value, options, onChange, heading,
}: {
  value: V;
  options: { value: V; label: string }[];
  onChange: (v: V) => void;
  heading?: string;
}) => {
  const [open, setOpen] = React.useState(false);
  const current = options.find((o) => o.value === value);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`dropdown-toggle inline-flex items-center gap-1.5 rounded-lg border ${T.hairline}
                    px-2.5 py-1.5 text-[12px] font-medium ${T.ink2} transition-colors
                    hover:bg-[#F4F4F2] dark:hover:bg-white/5`}
      >
        {current?.label ?? value}
        <ChevronDown size={12} className="opacity-60" />
      </button>

      <Dropdown
        isOpen={open}
        onClose={() => setOpen(false)}
        className={`absolute right-0 mt-2 w-[164px] overflow-hidden rounded-2xl border ${T.hairline}
                    bg-white p-1.5 shadow-xl dark:bg-[#1A1A19]`}
      >
        {heading && (
          <p className={`px-2.5 pb-1.5 pt-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${T.muted}`}>
            {heading}
          </p>
        )}
        <ul role="menu">
          {options.map((o) => {
            const selected = o.value === value;
            return (
              <li key={o.value}>
                <button
                  role="menuitemradio"
                  aria-checked={selected}
                  onClick={() => { onChange(o.value); setOpen(false); }}
                  className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2
                              text-left text-[12.5px] transition-colors ${
                                selected ? `font-semibold ${T.ink}` : `font-medium ${T.ink2}`
                              } hover:bg-[#F4F4F2] dark:hover:bg-white/5`}
                >
                  {o.label}
                  {selected && <Check size={14} strokeWidth={3} className="shrink-0" />}
                </button>
              </li>
            );
          })}
        </ul>
      </Dropdown>
    </div>
  );
};

/** Dark filled button — the single primary action per screen. */
export const PrimaryButton = ({
  children, onClick, type = "button",
}: { children: React.ReactNode; onClick?: () => void; type?: "button" | "submit" }) => (
  <button
    type={type} onClick={onClick}
    className="inline-flex items-center gap-1.5 rounded-lg bg-[#111110] px-3 py-1.5 text-[12px]
               font-semibold text-white transition-opacity hover:opacity-90
               dark:bg-white dark:text-[#111110]"
  >
    {children}
  </button>
);

/** Quiet bordered button — secondary/row-level actions. */
export const GhostButton = ({
  children, onClick,
}: { children: React.ReactNode; onClick?: (e: React.MouseEvent) => void }) => (
  <button
    type="button" onClick={onClick}
    className={`inline-flex items-center gap-1.5 rounded-lg border ${T.hairline} px-2.5 py-1.5
                text-[12px] font-medium ${T.ink} transition-colors
                hover:bg-[#F4F4F2] dark:hover:bg-white/5`}
  >
    {children}
  </button>
);

export type Suggestion = { id: string; title: string; subtitle?: string };

/**
 * Search field. Pass `suggestions` to get a typeahead list beneath it —
 * arrow keys to move, Enter to pick, Escape to dismiss. Without them it is a
 * plain controlled input, so existing call sites are unaffected.
 */
export const SearchInput = ({
  value, onChange, placeholder = "Search…", className = "w-64",
  suggestions, onSelectSuggestion,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  suggestions?: Suggestion[];
  onSelectSuggestion?: (id: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  const list = suggestions ?? [];
  const canSuggest = !!onSelectSuggestion && value.trim().length > 0;
  const show = open && canSuggest;

  // Reset the highlight whenever the result set changes underneath it.
  useEffect(() => setActive(-1), [value]);

  const pick = (s: Suggestion) => {
    onSelectSuggestion?.(s.id);
    setOpen(false);
    setActive(-1);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!canSuggest) return;
    if (e.key === "Escape") return setOpen(false);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(list.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter" && active >= 0 && list[active]) {
      e.preventDefault();
      pick(list[active]);
    }
  };

  const initials = (n: string) =>
    n.split(" ").filter(Boolean).map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "?";

  return (
    <div className={`relative ${className}`}>
      {/* dropdown-toggle so clicking the field doesn't dismiss the list. */}
      <div className="dropdown-toggle relative">
        <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9A9995]" />
        <input
          type="text" value={value} placeholder={placeholder}
          onChange={(e) => { onChange(e.target.value); setOpen(true); }}
          onFocus={() => canSuggest && setOpen(true)}
          onKeyDown={onKeyDown}
          role={canSuggest ? "combobox" : undefined}
          aria-expanded={canSuggest ? show : undefined}
          aria-autocomplete={canSuggest ? "list" : undefined}
          className={`w-full rounded-lg border ${T.hairline} bg-white py-1.5 pl-8 text-[12.5px]
                      ${T.ink} placeholder:text-[#9A9995] focus:outline-none focus:ring-2
                      focus:ring-[#2a78d6]/30 dark:bg-[#1A1A19] ${value ? "pr-8" : "pr-3"}`}
        />
        {value && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => { onChange(""); setOpen(false); }}
            className={`absolute right-2 top-1/2 grid h-5 w-5 -translate-y-1/2 place-items-center
                        rounded ${T.muted} hover:bg-[#F4F4F2] dark:hover:bg-white/5`}
          >
            <XIcon size={12} />
          </button>
        )}
      </div>

      {canSuggest && (
        <Dropdown
          isOpen={show}
          onClose={() => setOpen(false)}
          className={`absolute left-0 right-0 mt-2 max-h-[280px] w-auto overflow-y-auto rounded-2xl
                      border ${T.hairline} bg-white p-1.5 shadow-xl dark:bg-[#1A1A19]`}
        >
          {list.length === 0 ? (
            <p className={`px-3 py-3 text-[12px] ${T.muted}`}>No matches.</p>
          ) : (
            <ul role="listbox">
              {list.map((s, i) => (
                <li key={s.id}>
                  <button
                    role="option"
                    aria-selected={i === active}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => pick(s)}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left
                                transition-colors ${
                                  i === active ? "bg-[#F4F4F2] dark:bg-white/5" : ""
                                }`}
                  >
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#F4F4F2] text-[9.5px] font-bold text-[#6B6A66] dark:bg-white/10 dark:text-[#C3C2B7]">
                      {initials(s.title)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block truncate text-[12.5px] font-semibold ${T.ink}`}>
                        {s.title}
                      </span>
                      {s.subtitle && (
                        <span className={`block truncate text-[11px] ${T.muted}`}>{s.subtitle}</span>
                      )}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Dropdown>
      )}
    </div>
  );
};

/** Segmented tab strip — replaces the underline-tab pattern. */
export const TabBar = <K extends string>({
  tabs, active, onChange,
}: {
  tabs: { key: K; label: string; count?: number }[];
  active: K;
  onChange: (k: K) => void;
}) => (
  <TabBarInner tabs={tabs} active={active} onChange={onChange} />
);

/**
 * Scrolls rather than wrapping, so the strip stays one line tall at every
 * width. Arrow buttons appear only on the side that has more to reach, so the
 * strip never claims to be scrollable when it isn't.
 */
const TabBarInner = <K extends string>({
  tabs, active, onChange,
}: {
  tabs: { key: K; label: string; count?: number }[];
  active: K;
  onChange: (k: K) => void;
}) => {
  const scroller = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(true);

  const measure = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setAtStart(el.scrollLeft <= 1);
    // max <= 1 means everything already fits — treat that as "at the end" so
    // neither arrow shows.
    setAtEnd(max <= 1 || el.scrollLeft >= max - 1);
  }, []);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;

    measure();
    el.addEventListener("scroll", measure, { passive: true });

    // Re-measure when the container resizes (rotation, breakpoint change).
    const ro = new ResizeObserver(measure);
    ro.observe(el);

    return () => {
      el.removeEventListener("scroll", measure);
      ro.disconnect();
    };
  }, [measure, tabs.length]);

  const nudge = (dir: 1 | -1) =>
    scroller.current?.scrollBy({ left: dir * 150, behavior: "smooth" });

  const arrow = `absolute top-1/2 z-10 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-lg
                 border ${T.hairline} bg-white ${T.ink2} shadow-sm transition-colors
                 hover:bg-[#F4F4F2] dark:bg-[#1A1A19] dark:hover:bg-white/5`;

  return (
    <div className={`relative rounded-xl border ${T.hairline} bg-white dark:bg-[#1A1A19]`}>
      <div ref={scroller} className="no-scrollbar flex gap-1 overflow-x-auto p-1">
        {tabs.map((t) => {
          const on = t.key === active;
          return (
            <button
              key={t.key} type="button" onClick={() => onChange(t.key)}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12.5px]
                          transition-colors ${
                on
                  ? "bg-[#111110] font-semibold text-white dark:bg-white dark:text-[#111110]"
                  : `font-medium ${T.ink2} hover:bg-[#F4F4F2] dark:hover:bg-white/5`
              }`}
            >
              {t.label}
              {typeof t.count === "number" && (
                <span className={`text-[11px] tabular-nums ${on ? "opacity-70" : "text-[#9A9995]"}`}>
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* The mask runs to the container's inner edge and stays fully opaque
          across the button's footprint (from → via at 50%), so no tab shows
          through the arrow or in the gap beside it. */}
      {!atStart && (
        <>
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-px left-px w-16 rounded-l-xl
                       bg-gradient-to-r from-white via-white to-transparent
                       dark:from-[#1A1A19] dark:via-[#1A1A19]"
          />
          <button
            type="button"
            aria-label="Scroll tabs left"
            onClick={() => nudge(-1)}
            className={`${arrow} left-1.5`}
          >
            <ChevronLeft size={14} />
          </button>
        </>
      )}

      {!atEnd && (
        <>
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-px right-px w-16 rounded-r-xl
                       bg-gradient-to-l from-white via-white to-transparent
                       dark:from-[#1A1A19] dark:via-[#1A1A19]"
          />
          <button
            type="button"
            aria-label="Scroll tabs right"
            onClick={() => nudge(1)}
            className={`${arrow} right-1.5`}
          >
            <ChevronRight size={14} />
          </button>
        </>
      )}
    </div>
  );
};

/* ── Data display ─────────────────────────────────────────────────────────── */

export const DeltaChip = ({ value, invert = false }: { value: number; invert?: boolean }) => {
  const up = value >= 0;
  const positive = invert ? !up : up;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${
        positive
          ? "bg-[#0CA30C]/10 text-[#0A7F0A] dark:bg-[#0CA30C]/15 dark:text-[#4ED04E]"
          : "bg-[#D03B3B]/10 text-[#B32F2F] dark:bg-[#D03B3B]/15 dark:text-[#EF7A7A]"
      }`}
    >
      <Icon size={11} strokeWidth={2.5} />
      {Math.abs(value)}%
    </span>
  );
};

export const Avatar = ({ name, size = 32 }: { name: string; size?: number }) => {
  const initials =
    name.split(" ").filter(Boolean).map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "?";
  return (
    <span
      style={{ width: size, height: size, fontSize: size * 0.34 }}
      className="grid shrink-0 place-items-center rounded-full bg-[#F4F4F2] font-bold
                 text-[#6B6A66] dark:bg-white/10 dark:text-[#C3C2B7]"
    >
      {initials}
    </span>
  );
};

/** Status is a dot + its own words — never colour alone. */
const STATUS_TONE: Record<string, string> = {
  queued: CHART.warning,
  pending_review: CHART.warning,
  drafting: CHART.serious,
  approved: CHART.good,
  submitted: CHART.good,
  interview: CHART.good,
  completed: CHART.good,
  failed: CHART.critical,
};

export const StatusPill = ({ status }: { status: string }) => (
  <span className={`inline-flex items-center gap-1.5 text-[11.5px] font-medium capitalize ${T.ink2}`}>
    <span
      aria-hidden
      className="h-1.5 w-1.5 shrink-0 rounded-full"
      style={{ backgroundColor: STATUS_TONE[status] || CHART.axis }}
    />
    {status.replace(/_/g, " ")}
  </span>
);

/** Magnitude as length, not hue — avoids spending a status colour on a score. */
export const ScoreMeter = ({ value }: { value: number | null }) => {
  if (value === null) return <span className={`text-[12px] ${T.muted}`}>—</span>;
  return (
    <span className="inline-flex items-center gap-2">
      <span className="h-1.5 w-10 overflow-hidden rounded-full bg-[#EFEFEC] dark:bg-white/10">
        <span
          className="block h-full rounded-full bg-[#2a78d6] dark:bg-[#3987e5]"
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </span>
      <span className={`text-[12px] font-semibold tabular-nums ${T.ink}`}>{value}%</span>
    </span>
  );
};

export const StatTile = ({
  icon: Icon, label, value, note, delta, caption, invertDelta = false, loading = false,
  chart,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  note?: string;
  /** Omit when there's no previous period to compare against — a 0 here would
   *  render as a green "0%" and read as a real measurement. */
  delta?: number;
  caption: string;
  invertDelta?: boolean;
  loading?: boolean;
  /** Optional trend rendered under the caption — pass a <Sparkline />. */
  chart?: React.ReactNode;
}) => (
  // overflow-hidden so a chart that bleeds to the edges is clipped by the
  // tile's rounded corners instead of squaring them off.
  <Panel className="overflow-hidden p-4">
    <div className="flex items-start justify-between gap-2">
      <div className="flex min-w-0 items-center gap-2">
        <Icon size={13} className="shrink-0 text-[#6B6A66] dark:text-[#C3C2B7]" />
        <span className={`truncate text-[10.5px] font-semibold uppercase tracking-[0.08em] ${T.muted}`}>
          {label}
        </span>
      </div>
      <IconButton label={`Open ${label}`} />
    </div>

    {loading ? (
      <div className="mt-3 space-y-2">
        <div className="h-7 w-28 animate-pulse rounded bg-[#EFEFEC] dark:bg-white/10" />
        <div className="h-4 w-24 animate-pulse rounded bg-[#EFEFEC] dark:bg-white/10" />
      </div>
    ) : (
      <>
        <div className="mt-2.5 flex items-baseline gap-2">
          <span className={`text-[26px] font-bold leading-none tracking-[-0.02em] ${T.ink}`}>{value}</span>
          {note ? <span className={`text-[12px] ${T.muted}`}>{note}</span> : null}
        </div>
        <div className="mt-2.5 flex items-center gap-2">
          {typeof delta === "number" ? <DeltaChip value={delta} invert={invertDelta} /> : null}
          <span className={`truncate text-[11px] ${T.muted}`}>{caption}</span>
        </div>
        {chart}
      </>
    )}
  </Panel>
);

export const LegendRow = ({
  color, name, sub, value, delta,
}: {
  color: string; name: string; sub: string; value: string; delta?: number;
}) => (
  <div className="flex items-center justify-between gap-3 py-2">
    <div className="flex min-w-0 items-start gap-2">
      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} aria-hidden />
      <div className="min-w-0">
        <p className={`truncate text-[12.5px] font-semibold ${T.ink}`}>{name}</p>
        <p className={`truncate text-[11px] ${T.muted}`}>{sub}</p>
      </div>
    </div>
    <div className="flex shrink-0 items-center gap-2">
      {typeof delta === "number" ? <DeltaChip value={delta} /> : null}
      <span className={`text-[12.5px] font-semibold tabular-nums ${T.ink}`}>{value}</span>
    </div>
  </div>
);

/* ── Table chrome ─────────────────────────────────────────────────────────── */

export const Th = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <th className={`px-5 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#9A9995] ${className}`}>
    {children}
  </th>
);

export const EmptyState = ({
  icon: Icon, title, hint,
}: { icon: React.ElementType; title: string; hint?: string }) => (
  <div className="px-6 py-14 text-center">
    <span className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-xl bg-[#F4F4F2] text-[#6B6A66] dark:bg-white/5 dark:text-[#C3C2B7]">
      <Icon size={18} />
    </span>
    <p className={`text-[14px] font-semibold ${T.ink}`}>{title}</p>
    {hint ? <p className={`mt-1 text-[12px] ${T.muted}`}>{hint}</p> : null}
  </div>
);

/**
 * Confirm dialog for destructive or irreversible actions.
 * Replaces window.confirm, which ignores the design language entirely and
 * can't express the difference between "are you sure" and "this is permanent".
 */
export const ConfirmDialog = ({
  open, title, body, confirmLabel = "Confirm", destructive = false,
  busy = false, onConfirm, onCancel,
}: {
  open: boolean;
  title: string;
  body: React.ReactNode;
  confirmLabel?: string;
  destructive?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) => {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !busy && onCancel();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, busy, onCancel]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={() => !busy && onCancel()}
      className="fixed inset-0 z-[2000] grid place-items-center bg-black/40 p-4 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-sm overflow-hidden rounded-2xl border ${T.hairline}
                    bg-white shadow-2xl dark:bg-[#1A1A19]`}
      >
        <div className="px-5 pb-4 pt-5">
          <p className={`text-[15px] font-bold ${T.ink}`}>{title}</p>
          <div className={`mt-1.5 text-[12.5px] leading-relaxed ${T.ink2}`}>{body}</div>
        </div>
        <div className={`flex justify-end gap-2 border-t ${T.hairline} px-5 py-3`}>
          <GhostButton onClick={() => !busy && onCancel()}>Cancel</GhostButton>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px]
                        font-semibold text-white transition-opacity hover:opacity-90
                        disabled:opacity-50 ${
                          destructive
                            ? "bg-[#D03B3B]"
                            : "bg-[#111110] dark:bg-white dark:text-[#111110]"
                        }`}
          >
            {busy ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export const Pagination = ({
  page, totalPages, onChange,
}: { page: number; totalPages: number; onChange: (p: number) => void }) => {
  if (totalPages <= 1) return null;

  const pages: (number | string)[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1, 2);
    if (page > 4) pages.push("…");
    for (let i = Math.max(3, page - 1); i <= Math.min(totalPages - 2, page + 1); i++) pages.push(i);
    if (page < totalPages - 3) pages.push("…");
    pages.push(totalPages - 1, totalPages);
  }

  const btn = `rounded-lg border ${T.hairline} px-2.5 py-1.5 text-[12px] ${T.ink2}
               transition-colors hover:bg-[#F4F4F2] disabled:opacity-40 dark:hover:bg-white/5`;

  // Below sm the arrows become 36px icon buttons — a real tap target — and the
  // numbered pages give way to a single "Page X of Y". Cramming a label, page
  // numbers and both arrows into one phone-width row is what made it ugly.
  const arrowBtn = `grid h-9 w-9 shrink-0 place-items-center rounded-lg border ${T.hairline} ${T.ink2}
                    transition-colors hover:bg-[#F4F4F2] disabled:opacity-40 dark:hover:bg-white/5
                    sm:flex sm:h-auto sm:w-auto sm:items-center sm:gap-1 sm:px-2.5 sm:py-1.5`;

  return (
    <div className="flex items-center justify-between gap-3">
      <p className={`hidden text-[12px] sm:block ${T.muted}`}>
        Page {page} of {totalPages}
      </p>

      <div className="flex w-full items-center justify-between gap-1 sm:w-auto sm:justify-end">
        <button
          className={arrowBtn}
          onClick={() => onChange(Math.max(1, page - 1))}
          disabled={page === 1}
          aria-label="Previous page"
        >
          <ChevronLeft size={14} />
          <span className="hidden sm:inline">Previous</span>
        </button>

        {/* Mobile indicator */}
        <span className={`text-[12.5px] font-medium tabular-nums sm:hidden ${T.ink2}`}>
          Page <span className={T.ink}>{page}</span> of {totalPages}
        </span>

        {/* Desktop page numbers */}
        <div className="hidden items-center gap-1 sm:flex">
          {pages.map((p, i) =>
            p === "…" ? (
              <span key={`gap-${i}`} className={`px-2 text-[12px] ${T.muted}`}>…</span>
            ) : (
              <button
                key={p}
                onClick={() => onChange(Number(p))}
                className={
                  p === page
                    ? "rounded-lg bg-[#111110] px-2.5 py-1.5 text-[12px] font-semibold text-white dark:bg-white dark:text-[#111110]"
                    : btn
                }
              >
                {p}
              </button>
            ),
          )}
        </div>

        <button
          className={arrowBtn}
          onClick={() => onChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          aria-label="Next page"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};
