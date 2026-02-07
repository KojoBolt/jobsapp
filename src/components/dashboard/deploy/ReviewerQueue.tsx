import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, CheckCircle2, Eye } from "lucide-react";
import {
  MOCK_MODE,
  generateQueueReviewers,
  type QueueReviewer,
} from "@/lib/reviewerSimulation";

interface ReviewerQueueProps {
  totalProcessed: number;
  industry?: string;
}

const statusConfig: Record<
  QueueReviewer["status"],
  { icon: typeof Loader2; label: string; color: string }
> = {
  active: { icon: Loader2, label: "Drafting", color: "text-primary" },
  reviewing: { icon: Eye, label: "Reviewing", color: "text-status-reviewing" },
  stamping: { icon: CheckCircle2, label: "Verified", color: "text-status-interview" },
};

const ReviewerQueue = ({ totalProcessed, industry = "Engineering" }: ReviewerQueueProps) => {
  const [queue, setQueue] = useState<QueueReviewer[]>(() =>
    MOCK_MODE ? generateQueueReviewers(totalProcessed, industry) : []
  );

  useEffect(() => {
    if (!MOCK_MODE) return;

    const timer = setInterval(() => {
      setQueue(generateQueueReviewers(totalProcessed, industry));
    }, 3000);

    return () => clearInterval(timer);
  }, [totalProcessed, industry]);

  return (
    <div className="w-full rounded-lg border border-border/30 bg-muted/10 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-semibold text-foreground">Reviewer Queue</span>
        <span className="text-[9px] font-mono text-muted-foreground">
          {queue.filter((r) => r.status !== "stamping").length} Active
        </span>
      </div>

      <div className="space-y-2">
        {queue.map((item, i) => {
          const config = statusConfig[item.status];
          const Icon = config.icon;
          const isSpinning = item.status === "active";

          return (
            <motion.div
              key={item.reviewer.name}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-2 rounded-md bg-background/40 px-2 py-1.5"
            >
              <Icon
                className={`h-3 w-3 shrink-0 ${config.color} ${isSpinning ? "animate-spin" : ""}`}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-[10px] font-semibold text-foreground">
                    {item.reviewer.name}
                  </span>
                  <span className="text-[8px] text-muted-foreground/60">
                    {item.reviewer.title}
                  </span>
                </div>
                <p className="text-[9px] text-muted-foreground">
                  Reviewing Application #{item.currentApp} of {item.totalApps}
                </p>
              </div>
              <span className={`text-[8px] font-semibold uppercase ${config.color}`}>
                {config.label}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default ReviewerQueue;
