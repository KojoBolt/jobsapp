import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, Users, Sparkles } from "lucide-react";
import { CHART, T } from "@/admin/ui/system";
import { useRamp } from "@/admin/ui/charts";

/**
 * ⚠️ PLACEHOLDER DATA — NOT MEASURED.
 *
 * These are invented marketing lines, not events read from any table. Nothing
 * produces them and nothing updates them. Replace this whole array when real
 * activity becomes queryable; deleting it will make the ticker below fail
 * loudly rather than quietly keep faking a live feed.
 *
 * Split into name / action / time so the name can carry the typographic weight
 * instead of being buried mid-sentence.
 */
const PLACEHOLDER_ACTIVITY = [
  { icon: TrendingUp, name: "John",    action: "landed a $15K raise using the Salary Playbook.", time: "2m ago"  },
  { icon: Users,      name: "Sarah",   action: "referred 3 friends and earned $45 in credits.",   time: "11m ago" },
  { icon: Sparkles,   name: "Michael", action: "upgraded to the Premium System collection.",      time: "24m ago" },
  { icon: TrendingUp, name: "Bella",   action: "unlocked 100 Behavioral Interview Q&A.",          time: "38m ago" },
  { icon: Users,      name: "David",   action: "shared his referral link — 2 friends joined.",    time: "1h ago"  },
  { icon: Sparkles,   name: "Emma",    action: "unlocked the Career Accelerator bundle.",         time: "2h ago"  },
];

const ROTATE_MS = 4000;

const SocialProofTicker = () => {
  const { dark } = useRamp();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(
      () => setIndex((prev) => (prev + 1) % PLACEHOLDER_ACTIVITY.length),
      ROTATE_MS,
    );
    return () => clearInterval(id);
  }, [paused]);

  const accent = dark ? CHART.accentDark : CHART.accent;
  const live = dark ? CHART.goodDark : CHART.good;

  const current = PLACEHOLDER_ACTIVITY[index];
  const Icon = current.icon;

  return (
    <div
      className={`overflow-hidden rounded-2xl border ${T.hairline} bg-white px-4 py-3
                  dark:bg-[#1A1A19]`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-1.5">
          {/* The dot pulses, but "LIVE" is spelled out beside it — the state
              never reads by colour alone. */}
          <span className="relative grid h-2 w-2 shrink-0 place-items-center">
            <span
              className="absolute inset-0 animate-ping rounded-full opacity-60"
              style={{ backgroundColor: live }}
            />
            <span
              className="relative h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: live }}
            />
          </span>
          <span
            className={`truncate text-[10.5px] font-semibold uppercase tracking-[0.08em] ${T.ink2}`}
          >
            Live activity
          </span>
        </div>

        {/* Position pills double as a progress read — the active one widens. */}
        <div className="flex shrink-0 items-center gap-1">
          {PLACEHOLDER_ACTIVITY.map((_, i) => (
            <span
              key={i}
              className={`h-1 rounded-full transition-all duration-300 ${
                i === index ? "w-4" : "w-1 bg-[#E1E0D9] dark:bg-white/15"
              }`}
              style={i === index ? { backgroundColor: accent } : undefined}
            />
          ))}
        </div>
      </div>

      {/* Fixed height so the card doesn't collapse between exit and enter. */}
      <div className="mt-2 flex h-9 items-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -12, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="flex w-full min-w-0 items-center gap-2.5"
          >
            <span
              className="grid h-7 w-7 shrink-0 place-items-center rounded-lg"
              style={{ backgroundColor: `${accent}1A`, color: accent }}
            >
              <Icon size={13} />
            </span>

            <p className={`min-w-0 flex-1 truncate text-[12.5px] ${T.ink2}`}>
              <span className={`font-bold ${T.ink}`}>{current.name}</span>{" "}
              {current.action}
            </p>

            <span className={`hidden shrink-0 text-[11px] sm:block ${T.muted}`}>
              {current.time}
            </span>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SocialProofTicker;
