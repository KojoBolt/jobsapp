import { Progress } from "@/components/ui/progress";
import { Gauge } from "lucide-react";

interface MonthlyUsageBarProps {
  used: number;
  limit: number;
  planName: string;
}

const MonthlyUsageBar = ({ used, limit, planName }: MonthlyUsageBarProps) => {
  const percentage = Math.min((used / limit) * 100, 100);
  const remaining = Math.max(limit - used, 0);

  return (
    <div className="rounded-lg border border-border/50 bg-card/50 p-3">
      <div className="mb-1.5 flex items-center gap-2">
        <Gauge className="h-3.5 w-3.5 text-primary" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Monthly Usage
        </span>
      </div>
      <Progress value={percentage} className="mb-1.5 h-2" />
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span>{used}/{limit} used</span>
        <span>{remaining} left</span>
      </div>
      <p className="mt-1 text-[10px] text-primary/70">{planName}</p>
    </div>
  );
};

export default MonthlyUsageBar;
