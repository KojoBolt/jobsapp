import { motion } from "framer-motion";
import { Crosshair } from "lucide-react";

interface PriorityVisualizerProps {
  filledCount: number; // 0-30
}

const PriorityVisualizer = ({ filledCount }: PriorityVisualizerProps) => {
  return (
    <div className="w-full rounded-lg border border-border/30 bg-muted/10 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Crosshair className="h-3.5 w-3.5 text-gold" />
          <span className="text-xs font-semibold text-foreground">
            Priority Applications
          </span>
        </div>
        <span className="text-[10px] font-mono text-gold">
          {Math.min(filledCount, 30)}/30 — Direct Hits
        </span>
      </div>
      <p className="mb-3 text-[10px] text-muted-foreground">
        Targeting User-Selected Roles
      </p>
      <div className="grid grid-cols-10 gap-1">
        {Array.from({ length: 30 }).map((_, i) => {
          const isFilled = i < filledCount;
          return (
            <motion.div
              key={i}
              className={`relative h-4 w-full rounded-sm ${
                isFilled
                  ? "bg-gold shadow-sm"
                  : "bg-muted/40"
              }`}
              initial={false}
              animate={
                isFilled
                  ? {
                      scale: [1, 1.3, 1],
                      boxShadow: [
                        "0 0 0px hsl(43 96% 56% / 0)",
                        "0 0 12px hsl(43 96% 56% / 0.6)",
                        "0 0 4px hsl(43 96% 56% / 0.3)",
                      ],
                    }
                  : {}
              }
              transition={{ duration: 0.3 }}
            >
              {isFilled && (
                <motion.div
                  className="absolute inset-0 rounded-sm bg-gold/30"
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                />
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default PriorityVisualizer;
