import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

interface Referral {
  id: string;
  referred_user_id: string | null;
  referred_email: string | null;
  status: string;          // 'pending' | 'rewarded'
  credits_earned: number;
  created_at: string;
}

interface ReferralPipelineProps {
  referrals: Referral[];
  loading?: boolean;
}

const statusConfig: Record<string, { label: string; icon: React.ElementType; className: string }> = {
  pending: {
    label: "Signed Up",
    icon: Clock,
    className: "border-status-reviewing/40 bg-status-reviewing/10 text-status-reviewing",
  },
  rewarded: {
    label: "Purchased — Earned",
    icon: CheckCircle2,
    className: "border-status-interview/40 bg-status-interview/10 text-status-interview",
  },
};

// New rows have no email (attribution stores referred_user_id). Build a stable
// label from whatever we have, without ever crashing on null.
function labelFor(referral: Referral): { initials: string; name: string } {
  if (referral.referred_email) {
    return {
      initials: referral.referred_email.slice(0, 2).toUpperCase(),
      name: referral.referred_email.split("@")[0],
    };
  }
  if (referral.referred_user_id) {
    return { initials: referral.referred_user_id.slice(0, 2).toUpperCase(), name: "Friend" };
  }
  return { initials: "??", name: "Friend" };
}

const ReferralPipeline = ({ referrals, loading = false }: ReferralPipelineProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
    >
      <Card className="border-border/50">
        <CardContent className="p-0">
          <div className="border-b border-border/50 px-6 py-4">
            <h3 className="text-lg font-bold text-foreground">Referral Pipeline</h3>
            <p className="text-xs text-muted-foreground">
              Friends earn you ${15} in credits once they make their first purchase.
            </p>
          </div>

          {loading ? (
            <div className="p-6 text-center text-sm text-muted-foreground">Loading referrals...</div>
          ) : referrals.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No referrals yet. Share your link to get started!
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/50 hover:bg-transparent">
                      <TableHead className="text-xs font-semibold uppercase tracking-wider">Friend</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider">Status</TableHead>
                      <TableHead className="text-right text-xs font-semibold uppercase tracking-wider">Your Reward</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {referrals.map((referral) => {
                      const config = statusConfig[referral.status] || statusConfig.pending;
                      const StatusIcon = config.icon;
                      const earned = referral.status === "rewarded";
                      const { initials, name } = labelFor(referral);

                      return (
                        <TableRow key={referral.id} className="border-border/30 hover:bg-muted/30">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                                {initials}
                              </div>
                              <span className="text-sm font-medium text-foreground">{name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`gap-1.5 ${config.className}`}>
                              <StatusIcon className="h-3 w-3" />
                              {config.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={`text-sm font-bold ${earned ? "text-gold" : "text-muted-foreground"}`}>
                              {earned ? `+$${referral.credits_earned}` : "Pending"}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile cards */}
              <div className="space-y-2 p-4 md:hidden">
                {referrals.map((referral) => {
                  const config = statusConfig[referral.status] || statusConfig.pending;
                  const StatusIcon = config.icon;
                  const earned = referral.status === "rewarded";
                  const { initials, name } = labelFor(referral);

                  return (
                    <div key={referral.id} className="flex items-center justify-between rounded-lg border border-border/30 bg-muted/20 p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                          {initials}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{name}</p>
                          <Badge variant="outline" className={`mt-1 gap-1 text-[10px] ${config.className}`}>
                            <StatusIcon className="h-2.5 w-2.5" />
                            {config.label}
                          </Badge>
                        </div>
                      </div>
                      <span className={`text-sm font-bold ${earned ? "text-gold" : "text-muted-foreground"}`}>
                        {earned ? `+$${referral.credits_earned}` : "Pending"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ReferralPipeline;