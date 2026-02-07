import { Clock, ShieldCheck, Zap } from "lucide-react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect } from "react";

interface LiveStatsProps {
  totalProcessed: number;
  humanStamps: number;
}

const AnimatedNumber = ({ value }: { value: number }) => {
  const motionVal = useMotionValue(0);
  const display = useTransform(motionVal, (v) => Math.round(v));

  useEffect(() => {
    const controls = animate(motionVal, value, {
      duration: 0.5,
      ease: "easeOut",
    });
    return controls.stop;
  }, [value, motionVal]);

  return <motion.span>{display}</motion.span>;
};

const LiveStats = ({ totalProcessed, humanStamps }: LiveStatsProps) => {
  const timeSavedMinutes = totalProcessed * 30;
  const hours = Math.floor(timeSavedMinutes / 60);
  const mins = timeSavedMinutes % 60;

  return (
    <div className="sticky top-0 z-10 -mx-4 mb-4 border-b border-border/20 bg-background/90 px-4 py-3 backdrop-blur-lg sm:-mx-6 sm:px-6">
      <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5">
        {/* Processed */}
        <motion.div
          className="flex items-center gap-2.5 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5 shadow-[0_0_15px_hsl(var(--primary)/0.1)]"
          whileHover={{ scale: 1.03 }}
          transition={{ type: "spring", stiffness: 400 }}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Zap className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="font-mono text-lg font-bold leading-tight text-foreground">
              <AnimatedNumber value={totalProcessed} />/200
            </p>
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Processed
            </p>
          </div>
        </motion.div>

        {/* Human Stamps */}
        <motion.div
          className="flex items-center gap-2.5 rounded-xl border border-gold/20 bg-gold/5 px-4 py-2.5 shadow-[0_0_15px_hsl(43_96%_56%/0.1)]"
          whileHover={{ scale: 1.03 }}
          transition={{ type: "spring", stiffness: 400 }}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold/10">
            <ShieldCheck className="h-4 w-4 text-gold" />
          </div>
          <div>
            <p className="font-mono text-lg font-bold leading-tight text-foreground">
              <AnimatedNumber value={humanStamps} />
            </p>
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Human Stamps
            </p>
          </div>
        </motion.div>

        {/* Time Saved */}
        <motion.div
          className="flex items-center gap-2.5 rounded-xl border border-status-interview/20 bg-status-interview/5 px-4 py-2.5 shadow-[0_0_15px_hsl(var(--status-interview)/0.1)]"
          whileHover={{ scale: 1.03 }}
          transition={{ type: "spring", stiffness: 400 }}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-status-interview/10">
            <Clock className="h-4 w-4 text-status-interview" />
          </div>
          <div>
            <p className="font-mono text-lg font-bold leading-tight text-foreground">
              {hours}h {mins}m
            </p>
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Time Saved
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LiveStats;
