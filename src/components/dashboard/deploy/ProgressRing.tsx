import { motion } from "framer-motion";

interface ProgressRingProps {
  progress: number; // 0-100
  label: string;
  size?: number;
}

const ProgressRing = ({ progress, label, size = 160 }: ProgressRingProps) => {
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Background ring */}
      <svg className="absolute" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
        />
      </svg>

      {/* Progress ring */}
      <svg className="absolute -rotate-90" width={size} height={size}>
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          style={{ filter: "drop-shadow(0 0 8px hsl(213 94% 55% / 0.5))" }}
        />
      </svg>

      {/* Outer glow ring */}
      <svg className="absolute -rotate-90 opacity-30" width={size} height={size}>
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius + 4}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          strokeDasharray={circumference * 1.05}
          animate={{ strokeDashoffset: circumference * 1.05 - (progress / 100) * circumference * 1.05 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />
      </svg>

      {/* Center text */}
      <div className="flex flex-col items-center gap-0.5">
        <span className="font-mono text-2xl font-bold text-foreground">
          {Math.round(progress)}%
        </span>
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </div>
    </div>
  );
};

export default ProgressRing;
