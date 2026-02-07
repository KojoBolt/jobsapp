import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ShieldCheck } from "lucide-react";

interface VerifiedHumanBadgeProps {
  variant?: "gold" | "emerald";
  size?: "sm" | "md";
}

const VerifiedHumanBadge = ({ variant = "gold", size = "sm" }: VerifiedHumanBadgeProps) => {
  const isGold = variant === "gold";
  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  const containerSize = size === "sm" ? "h-5 w-5" : "h-6 w-6";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={`inline-flex ${containerSize} shrink-0 cursor-help items-center justify-center rounded-full ${
            isGold
              ? "bg-gold/15 ring-1 ring-gold/30"
              : "bg-status-interview/15 ring-1 ring-status-interview/30"
          }`}
        >
          <ShieldCheck
            className={`${iconSize} ${
              isGold ? "text-gold" : "text-status-interview"
            }`}
          />
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[220px] text-center text-xs">
        <p className={`font-semibold ${isGold ? "text-gold" : "text-status-interview"}`}>
          Verified Human Reviewer
        </p>
        <p className="mt-0.5 text-muted-foreground">
          A career specialist has manually audited this for quality.
        </p>
      </TooltipContent>
    </Tooltip>
  );
};

export default VerifiedHumanBadge;
