import { Card, CardContent } from "@/components/ui/card";
import { Coins, Users, Clock } from "lucide-react";
import { motion } from "framer-motion";

interface EarningsHeroProps {
  totalCredits: number;       // referral credits earned ($)
  convertedCount: number;     // friends who made their first purchase
  pendingCount: number;       // friends signed up, not yet purchased
  referralCount: number;      // total referred
  rewardPerReferral: number;  // $ per converted friend
  loading?: boolean;
}

const EarningsHero = ({
  totalCredits,
  convertedCount,
  pendingCount,
  referralCount,
  rewardPerReferral,
  loading = false,
}: EarningsHeroProps) => {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Total Credits Earned */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="relative overflow-hidden border-gold/30 bg-gradient-to-br from-gold/10 via-card to-gold/5">
            <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-gold/10 blur-2xl" />
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gold/15 ring-1 ring-gold/30">
                <Coins className="h-7 w-7 text-gold" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Credits Earned from Referrals
                </p>
                <p className="text-3xl font-extrabold text-gold">
                  {loading ? "..." : `$${totalCredits}`}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Friends Converted */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card className="relative overflow-hidden border-primary/30 bg-gradient-to-br from-primary/10 via-card to-primary/5">
            <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-primary/10 blur-2xl" />
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/30">
                <Users className="h-7 w-7 text-primary" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Friends Who Purchased
                </p>
                <p className="text-3xl font-extrabold text-primary">
                  {loading ? "..." : convertedCount}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Pending referrals strip */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Card className="border-border/50 bg-card">
          <CardContent className="flex items-center justify-between gap-3 p-5">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">
                {loading
                  ? "Loading…"
                  : pendingCount > 0
                  ? `${pendingCount} friend${pendingCount === 1 ? "" : "s"} signed up — waiting on their first purchase`
                  : "No pending referrals right now"}
              </span>
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">
              {referralCount} total · ${rewardPerReferral} each
            </span>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default EarningsHero;