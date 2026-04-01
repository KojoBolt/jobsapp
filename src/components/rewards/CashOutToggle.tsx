import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet, RotateCcw, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

interface CashOutToggleProps {
  userId?: string;
  initialMode?: "reapply" | "cashout";
  totalCredits?: number;
}

const CashOutToggle = ({
  userId,
  initialMode = "reapply",
  totalCredits = 0,
}: CashOutToggleProps) => {
  const [mode, setMode] = useState<"reapply" | "cashout">(initialMode);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSelect = async (selected: "reapply" | "cashout") => {
    setMode(selected);
    if (!userId) return;

    setSaving(true);
    await supabase
      .from("profiles")
      .update({ cashout_preference: selected })
      .eq("id", userId);
    setSaving(false);

    toast({
      title: selected === "reapply"
        ? "Credits will apply to your next pack"
        : "Cash payout requested",
      description: selected === "reapply"
        ? "Your earned credits will automatically discount your next 200-App Pack."
        : "We'll process your payout via Paystack within 48 hours.",
    });
  };

  const handleRequestPayout = async () => {
    if (!userId || totalCredits <= 0) {
      toast({
        title: "No credits to cash out",
        description: "Earn credits by referring friends first.",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Payout requested!",
      description: `$${totalCredits} will be processed via Paystack within 48 hours.`,
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
            <h3 className="text-lg font-bold text-foreground">
              How Would You Like Your Rewards?
            </h3>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              onClick={() => handleSelect("reapply")}
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
                <p className="text-sm font-semibold text-foreground">Apply to Next 200 Pack</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Credits auto-apply as a discount on your next application pack.
                </p>
              </div>
              {mode === "reapply" && (
                <Badge className="absolute right-3 top-3 bg-primary/20 text-primary">Active</Badge>
              )}
            </button>

            <button
              onClick={() => handleSelect("cashout")}
              disabled={saving}
              className={`group relative flex flex-col items-start gap-3 rounded-xl border p-5 text-left transition-all ${
                mode === "cashout"
                  ? "border-gold/50 bg-gold/5 ring-1 ring-gold/30"
                  : "border-border/50 bg-card hover:border-gold/30"
              }`}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/15">
                <Wallet className="h-5 w-5 text-gold" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Request Cash Payout</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Withdraw your earnings directly via Paystack.
                </p>
              </div>
              {mode === "cashout" && (
                <Badge className="absolute right-3 top-3 bg-gold/20 text-gold">Active</Badge>
              )}
            </button>
          </div>

          {mode === "cashout" && (
            <Button
              variant="gold"
              size="lg"
              className="w-full gap-2"
              onClick={handleRequestPayout}
              disabled={totalCredits <= 0}
            >
              <Wallet className="h-4 w-4" />
              Request Payout {totalCredits > 0 ? `($${totalCredits})` : ""}
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default CashOutToggle;
