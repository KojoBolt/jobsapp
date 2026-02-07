import { Clock, ShieldCheck, Zap } from "lucide-react";

interface LiveStatsProps {
  totalProcessed: number;
  humanStamps: number;
}

const LiveStats = ({ totalProcessed, humanStamps }: LiveStatsProps) => {
  const timeSavedMinutes = totalProcessed * 30;
  const hours = Math.floor(timeSavedMinutes / 60);
  const mins = timeSavedMinutes % 60;

  return (
    <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
      <div className="flex items-center gap-2 rounded-lg border border-border/30 bg-muted/20 px-3 py-2">
        <Zap className="h-3.5 w-3.5 text-primary" />
        <div className="text-center">
          <p className="font-mono text-sm font-bold text-foreground">
            {totalProcessed}/200
          </p>
          <p className="text-[9px] uppercase tracking-wider text-muted-foreground">
            Processed
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-border/30 bg-muted/20 px-3 py-2">
        <ShieldCheck className="h-3.5 w-3.5 text-gold" />
        <div className="text-center">
          <p className="font-mono text-sm font-bold text-foreground">
            {humanStamps}
          </p>
          <p className="text-[9px] uppercase tracking-wider text-muted-foreground">
            Human Stamps
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-border/30 bg-muted/20 px-3 py-2">
        <Clock className="h-3.5 w-3.5 text-status-interview" />
        <div className="text-center">
          <p className="font-mono text-sm font-bold text-foreground">
            {hours}h {mins}m
          </p>
          <p className="text-[9px] uppercase tracking-wider text-muted-foreground">
            Time Saved
          </p>
        </div>
      </div>
    </div>
  );
};

export default LiveStats;
