import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Coins, Users, Trophy } from "lucide-react";
import { motion } from "framer-motion";

interface EarningsHeroProps {
  totalCredits: number;
  friendsHired: number;
  referralCount: number;
  referralGoal: number;
}

const EarningsHero = ({
  totalCredits,
  friendsHired,
  referralCount,
  referralGoal,
}: EarningsHeroProps) => {
  const progressPercent = Math.min((referralCount / referralGoal) * 100, 100);

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
                  Total Credits Earned
                </p>
                <p className="text-3xl font-extrabold text-gold">
                  ${totalCredits}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Friends Hired */}
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
                  Friends Hired
                </p>
                <p className="text-3xl font-extrabold text-primary">
                  {friendsHired}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Progress toward free pack */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Card className="border-border/50 bg-card">
          <CardContent className="space-y-3 p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-gold" />
                <span className="text-sm font-semibold text-foreground">
                  Next Free 200-App Pack
                </span>
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                {referralCount}/{referralGoal} referrals
              </span>
            </div>
            <Progress
              value={progressPercent}
              className="h-3 bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Refer{" "}
              <span className="font-semibold text-gold">
                {Math.max(referralGoal - referralCount, 0)} more friend
                {referralGoal - referralCount !== 1 ? "s" : ""}
              </span>{" "}
              to unlock your next pack for free!
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default EarningsHero;
