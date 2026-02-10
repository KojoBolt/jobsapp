import { ShieldCheck, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface VaultStrengthMeterProps {
  strength: number;
}

const VaultStrengthMeter = ({ strength }: VaultStrengthMeterProps) => {
  const getLabel = () => {
    if (strength >= 80) return "Deployment Ready";
    if (strength >= 50) return "Getting There";
    return "Needs Attention";
  };

  const getColor = () => {
    if (strength >= 80) return "text-emerald-400";
    if (strength >= 50) return "text-amber-400";
    return "text-destructive";
  };

  const getBarClass = () => {
    if (strength >= 80) return "[&>div]:bg-emerald-500";
    if (strength >= 50) return "[&>div]:bg-amber-500";
    return "[&>div]:bg-destructive";
  };

  return (
    <Card className="border-border/30 bg-card/60 backdrop-blur-sm">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className={`h-5 w-5 ${getColor()}`} />
            <span className="text-sm font-semibold text-foreground">Vault Strength</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-2xl font-bold tabular-nums ${getColor()}`}>
              {strength}%
            </span>
            <Badge variant="outline" className={`text-[10px] border-current ${getColor()}`}>
              {getLabel()}
            </Badge>
          </div>
        </div>
        <Progress value={strength} className={`h-2.5 ${getBarClass()}`} />
        {strength < 80 && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <AlertCircle className="h-3 w-3" />
            Complete your LinkedIn, resume, and targeting to reach "Deployment Ready" status.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default VaultStrengthMeter;
