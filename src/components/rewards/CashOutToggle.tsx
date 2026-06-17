import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wallet, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

interface CashOutToggleProps {
  userId?: string;
  initialMode?: "reapply" | "cashout";
  totalCredits?: number;
}

// NOTE: Cash payouts are NOT built yet (no payout infrastructure). For v1 the
// reward is credits-only. The cash option is shown as "coming soon" and is
// disabled so we never promise a payout we can't deliver.
const CashOutToggle = ({ userId, initialMode = "reapply" }: CashOutToggleProps) => {
  const [mode, setMode] = useState<"reapply" | "cashout">(
    initialMode === "cashout" ? "reapply" : initialMode
  );
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSelectReapply = async () => {
    setMode("reapply");
    if (!userId) return;
    setSaving(true);
    await supabase.from("profiles").update({ cashout_preference: "reapply" }).eq("id", userId);
    setSaving(false);
    toast({
      title: "Credits will apply to your next pack",
      description: "Your earned credits automatically discount your next purchase.",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.5 }}
    >
      <Card className="border-border/50">
        <CardContent className="space-y-4 p-6">
          <div className="flex items-center gap-2.5">
            <Wallet className="h-5 w-5 text-gold" />
            <h3 className="text-lg font-bold text-foreground">How Your Rewards Work</h3>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {/* Reapply — the active, real option */}
            <button
              onClick={handleSelectReapply}
              disabled={saving}
              className={`group relative flex flex-col items-start gap-3 rounded-xl border p-5 text-left transition-all ${
                mode === "reapply"
                  ? "border-primary/50 bg-primary/5 ring-1 ring-primary/30"
                  : "border-border/50 bg-card hover:border-primary/30"
              }`}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15">
                <RotateCcw className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Apply to Your Next Purchase</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Earned credits automatically discount your next pack.
                </p>
              </div>
              {mode === "reapply" && (
                <Badge className="absolute right-3 top-3 bg-primary/20 text-primary">Active</Badge>
              )}
            </button>

            {/* Cash — coming soon, disabled */}
            <div className="relative flex cursor-not-allowed flex-col items-start gap-3 rounded-xl border border-border/50 bg-card/50 p-5 text-left opacity-60">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/15">
                <Wallet className="h-5 w-5 text-gold" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Request Cash Payout</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Withdraw earnings directly. Coming soon.
                </p>
              </div>
              <Badge className="absolute right-3 top-3 bg-muted text-muted-foreground">Coming soon</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default CashOutToggle;