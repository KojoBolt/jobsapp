import { useState } from "react";
import { Calendar, Check, ChevronDown } from "lucide-react";
import { Dropdown } from "./Dropdown";
import { T } from "./system";
import {
  useAdminActions, RANGE_LABEL, RANGE_ORDER, type RangeKey,
} from "@/admin/context/AdminActionsContext";

/**
 * Date-range control for the header.
 * A list of presets with the active one check-marked — selection writes to
 * AdminActionsContext, and each page filters its own data from it.
 */
export const DateRangeMenu = () => {
  const [open, setOpen] = useState(false);
  const { range, setRange } = useAdminActions();

  const pick = (key: RangeKey) => {
    setRange(key);
    setOpen(false);
  };

  const active = range !== "all";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        // dropdown-toggle exempts this from Dropdown's outside-click handler.
        className={`dropdown-toggle inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[12px]
                    font-medium transition-colors ${
                      active
                        ? "border-[#2a78d6]/40 bg-[#2a78d6]/[0.06] text-[#111110] dark:border-[#3987e5]/40 dark:bg-[#3987e5]/10 dark:text-white"
                        : `${T.hairline} ${T.ink2} hover:bg-[#F4F4F2] dark:hover:bg-white/5`
                    }`}
      >
        <Calendar size={12} />
        {RANGE_LABEL[range]}
        <ChevronDown size={12} className="opacity-60" />
      </button>

      <Dropdown
        isOpen={open}
        onClose={() => setOpen(false)}
        className={`absolute right-0 mt-2 w-[196px] overflow-hidden rounded-2xl border ${T.hairline}
                    bg-white p-1.5 shadow-xl dark:bg-[#1A1A19]`}
      >
        <p className={`px-2.5 pb-1.5 pt-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${T.muted}`}>
          Date range
        </p>

        <ul role="menu">
          {RANGE_ORDER.map((key) => {
            const selected = key === range;
            return (
              <li key={key}>
                <button
                  role="menuitemradio"
                  aria-checked={selected}
                  onClick={() => pick(key)}
                  className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2
                              text-left text-[12.5px] transition-colors ${
                                selected
                                  ? `font-semibold ${T.ink}`
                                  : `font-medium ${T.ink2}`
                              } hover:bg-[#F4F4F2] dark:hover:bg-white/5`}
                >
                  {RANGE_LABEL[key]}
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
