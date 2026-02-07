import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { ShieldCheck, Eye } from "lucide-react";
import { useEffect } from "react";

interface HumanQualityCounterProps {
  count: number;
}

const HumanQualityCounter = ({ count }: HumanQualityCounterProps) => {
  const motionCount = useMotionValue(0);
  const display = useTransform(motionCount, (v) => Math.round(v));

  useEffect(() => {
    const controls = animate(motionCount, count, {
      duration: 0.6,
      ease: "easeOut",
    });
    return controls.stop;
  }, [count, motionCount]);

  return (
    <div className="w-full rounded-lg border border-gold/20 bg-gold/5 p-3">
      <div className="mb-2 flex items-center gap-2">
        <Eye className="h-3.5 w-3.5 text-gold" />
        <span className="text-[11px] font-semibold text-foreground">
          Human Eyes on Your Profile
        </span>
      </div>

      <div className="flex items-center gap-3">
        <motion.div
          className="flex h-14 w-14 items-center justify-center rounded-full border border-gold/30 bg-gold/10"
          animate={{
            boxShadow: [
              "0 0 0px hsl(43 96% 56% / 0)",
              "0 0 15px hsl(43 96% 56% / 0.3)",
              "0 0 5px hsl(43 96% 56% / 0.1)",
            ],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ShieldCheck className="h-6 w-6 text-gold" />
        </motion.div>

        <div>
          <div className="flex items-baseline gap-1">
            <motion.span className="font-mono text-2xl font-bold text-gold">
              {display}
            </motion.span>
            <span className="text-[10px] text-muted-foreground">stamps</span>
          </div>
          <p className="text-[9px] text-muted-foreground">
            Each verified by a career specialist
          </p>
        </div>
      </div>
    </div>
  );
};

export default HumanQualityCounter;
