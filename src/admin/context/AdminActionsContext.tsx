import React, {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
} from "react";

/**
 * Shared state between the header chrome and whichever page is mounted.
 *
 * Two things live here:
 *   · onExport — the header owns the Export button, but only the page knows
 *     what exporting means. Pages that register nothing don't get the button.
 *   · range    — the header owns the date-range control; pages read the
 *     resulting cutoff and filter their own data with it.
 */

export type RangeKey = "all" | "today" | "7d" | "30d" | "90d" | "mtd";

export const RANGE_LABEL: Record<RangeKey, string> = {
  all: "All time",
  today: "Today",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  mtd: "Month to date",
};

/** Order shown in the menu. */
export const RANGE_ORDER: RangeKey[] = ["all", "today", "7d", "30d", "90d", "mtd"];

/** Inclusive lower bound for a range, or null for "all time". */
export const rangeStart = (key: RangeKey): Date | null => {
  const now = new Date();

  switch (key) {
    case "all":
      return null;
    case "today": {
      const d = new Date(now);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    case "7d": {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      return d;
    }
    case "30d": {
      const d = new Date(now);
      d.setDate(d.getDate() - 30);
      return d;
    }
    case "90d": {
      const d = new Date(now);
      d.setDate(d.getDate() - 90);
      return d;
    }
    case "mtd": {
      const d = new Date(now.getFullYear(), now.getMonth(), 1);
      d.setHours(0, 0, 0, 0);
      return d;
    }
  }
};

type ExportFn = (() => void) | null;

const Ctx = createContext<{
  onExport: ExportFn;
  setOnExport: (fn: ExportFn) => void;
  range: RangeKey;
  setRange: (r: RangeKey) => void;
  /** Cutoff for the active range; null means no lower bound. */
  from: Date | null;
  /** True when a row's timestamp falls inside the active range. */
  inRange: (value: string | Date | null | undefined) => boolean;
}>({
  onExport: null,
  setOnExport: () => {},
  range: "all",
  setRange: () => {},
  from: null,
  inRange: () => true,
});

const STORAGE_KEY = "admin.range";

export const AdminActionsProvider = ({ children }: { children: React.ReactNode }) => {
  const [onExport, setOnExport] = useState<ExportFn>(null);

  // Defaults to "all" so the filter never silently hides data until a person
  // chooses a range. The choice survives navigation and reloads.
  const [range, setRange] = useState<RangeKey>(() => {
    if (typeof window === "undefined") return "all";
    const saved = window.localStorage.getItem(STORAGE_KEY) as RangeKey | null;
    return saved && saved in RANGE_LABEL ? saved : "all";
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, range);
  }, [range]);

  const from = useMemo(() => rangeStart(range), [range]);

  // Keyed to `from` alone — deliberately NOT rebuilt when onExport changes.
  // Pages feed inRange into their useMemo chains, so if its identity moved
  // whenever an export handler registered, those memos would recompute, the
  // handler identity would change, it would re-register, and round it goes.
  const inRange = useCallback(
    (v: string | Date | null | undefined) => {
      if (!from) return true;
      if (!v) return false;
      const t = v instanceof Date ? v : new Date(v);
      return !Number.isNaN(t.getTime()) && t >= from;
    },
    [from],
  );

  const value = useMemo(
    () => ({ onExport, setOnExport, range, setRange, from, inRange }),
    [onExport, range, from, inRange],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useAdminActions = () => useContext(Ctx);

/**
 * Call from a page to publish its export handler for as long as it is mounted.
 *
 * Registration happens once per mount. The handler is read through a ref, so a
 * page may pass a freshly-created function every render without re-registering
 * — the header still invokes the latest closure. Depending on `fn` identity
 * here is what previously caused "Maximum update depth exceeded".
 */
export const useRegisterExport = (fn: () => void) => {
  const { setOnExport } = useContext(Ctx);
  const latest = useRef(fn);

  useEffect(() => {
    latest.current = fn;
  }, [fn]);

  useEffect(() => {
    const stable = () => latest.current();
    // Updater form so React stores the function instead of calling it.
    setOnExport(() => stable);
    return () => setOnExport(null);
  }, [setOnExport]);
};
