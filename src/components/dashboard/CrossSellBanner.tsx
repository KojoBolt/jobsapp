import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BarChart3, Rocket, ArrowRight } from "lucide-react";

interface CrossSellBannerProps {
  variant: "tracker" | "deployment";
}

const CrossSellBanner = ({ variant }: CrossSellBannerProps) => {
  if (variant === "tracker") {
    return (
      <div className="flex flex-col items-center justify-between gap-4 rounded-xl border border-accent/20 bg-gradient-to-r from-[hsl(250_35%_14%)] to-[hsl(230_40%_10%)] p-5 sm:flex-row">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10">
            <BarChart3 className="h-5 w-5 text-accent" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              Tired of spreadsheets?
            </p>
            <p className="text-xs text-muted-foreground">
              Move these 200 apps into the Interactive Tracker for $29/mo.
            </p>
          </div>
        </div>
        <Link to="/job-tracker">
          <Button variant="heroOutline" size="sm" className="shrink-0 gap-1.5">
            Open Tracker
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-between gap-4 rounded-xl border border-primary/20 bg-gradient-to-r from-card to-secondary/30 p-5 sm:flex-row">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Rocket className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">
            Low on Job Applications?
          </p>
          <p className="text-xs text-muted-foreground">
            Deploy a fresh 200-App Blitz for $99. AI + Human quality guaranteed.
          </p>
        </div>
      </div>
      <Link to="/onboarding">
        <Button variant="hero" size="sm" className="shrink-0 gap-1.5">
          Start Blitz
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </Link>
    </div>
  );
};

export default CrossSellBanner;
