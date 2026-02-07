import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, ShieldCheck } from "lucide-react";
import {
  MOCK_MODE,
  generateActivityMessage,
  type ActivityMessage,
} from "@/lib/reviewerSimulation";

interface ReviewerActivityProps {
  industry?: string;
  onVerified?: () => void;
}

const ReviewerActivity = ({ industry = "Engineering", onVerified }: ReviewerActivityProps) => {
  const [activities, setActivities] = useState<ActivityMessage[]>(() =>
    MOCK_MODE
      ? Array.from({ length: 4 }, () => generateActivityMessage(industry))
      : []
  );

  useEffect(() => {
    if (!MOCK_MODE) return;

    // Rotate every 15-45 seconds (randomized per cycle)
    const scheduleNext = () => {
      const delay = 15000 + Math.random() * 30000; // 15–45s
      return setTimeout(() => {
        const msg = generateActivityMessage(industry);
        setActivities((prev) => [msg, ...prev.slice(0, 7)]);
        if (msg.isVerified) onVerified?.();
        timerRef = scheduleNext();
      }, delay);
    };

    let timerRef = scheduleNext();
    return () => clearTimeout(timerRef);
  }, [industry, onVerified]);

  return (
    <div className="w-full rounded-lg border border-border/30 bg-muted/10 p-3">
      <div className="mb-2 flex items-center gap-2">
        <div className="relative">
          <User className="h-3.5 w-3.5 text-status-interview" />
          <div className="absolute -right-0.5 -top-0.5 h-2 w-2 animate-pulse rounded-full bg-status-interview" />
        </div>
        <span className="text-[11px] font-semibold text-foreground">Reviewer Activity</span>
        <span className="text-[9px] text-status-interview font-semibold">LIVE</span>
        {MOCK_MODE && (
          <span className="ml-auto rounded bg-muted/40 px-1.5 py-0.5 text-[8px] font-mono text-muted-foreground">
            SIM
          </span>
        )}
      </div>
      <div className="space-y-1.5 overflow-hidden">
        <AnimatePresence initial={false}>
          {activities.slice(0, 6).map((activity, i) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -10, height: 0 }}
              animate={{ opacity: 1 - i * 0.12, x: 0, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="flex items-start gap-2 text-[10px]"
            >
              {activity.isVerified ? (
                <ShieldCheck className="mt-0.5 h-3 w-3 shrink-0 text-status-interview" />
              ) : (
                <span className="mt-0.5 h-3 w-3 shrink-0 text-center text-primary">›</span>
              )}
              <span className="shrink-0 font-semibold text-primary">
                {activity.reviewer.name}
              </span>
              <span className="text-[9px] text-muted-foreground/60">
                {activity.reviewer.title}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
        {activities.length > 0 && (
          <div className="pt-1 text-[10px] text-muted-foreground">
            {activities[0].message}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewerActivity;
