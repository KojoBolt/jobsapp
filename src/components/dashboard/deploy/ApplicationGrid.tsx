import { motion } from "framer-motion";

interface SlotStatus {
  state: "empty" | "ai" | "human" | "verified";
}

interface ApplicationGridProps {
  slots: SlotStatus[];
}

const stateColors: Record<SlotStatus["state"], string> = {
  empty: "bg-muted/30",
  ai: "bg-primary animate-pulse",
  human: "bg-status-reviewing",
  verified: "bg-status-interview",
};

const ApplicationGrid = ({ slots }: ApplicationGridProps) => {
  return (
    <div className="w-full rounded-lg border border-border/30 bg-muted/10 p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold text-foreground">
          AI + Human Orchestration
        </span>
        <span className="text-[10px] font-mono text-muted-foreground">
          {slots.filter((s) => s.state === "verified").length}/170 Verified
        </span>
      </div>

      {/* Legend */}
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 animate-pulse rounded-sm bg-primary" />
          <span className="text-[9px] text-muted-foreground">AI Drafting</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-sm bg-status-reviewing" />
          <span className="text-[9px] text-muted-foreground">Human Review</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-sm bg-status-interview" />
          <span className="text-[9px] text-muted-foreground">Verified & Submitted</span>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-[repeat(17,1fr)] gap-[2px]">
        {slots.map((slot, i) => (
          <motion.div
            key={i}
            className={`h-3 w-full rounded-[2px] transition-colors duration-200 ${stateColors[slot.state]}`}
            animate={
              slot.state === "verified"
                ? {
                    scale: [1, 1.15, 1],
                    boxShadow: [
                      "0 0 0px hsl(142 71% 45% / 0)",
                      "0 0 6px hsl(142 71% 45% / 0.5)",
                      "0 0 2px hsl(142 71% 45% / 0.2)",
                    ],
                  }
                : {}
            }
            transition={{ duration: 0.25 }}
          />
        ))}
      </div>
    </div>
  );
};

export default ApplicationGrid;
