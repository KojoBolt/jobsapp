import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock, CheckCircle2, UserPlus } from "lucide-react";
import { motion } from "framer-motion";

interface ReferralPipelineProps {
  referrals: any[];
  loading?: boolean;
}

const statusConfig = {
  pending: {
    label: "Signed Up",
    icon: Clock,
    className: "border-status-reviewing/40 bg-status-reviewing/10 text-status-reviewing",
  },
  signed_up: {
    label: "Signed Up",
    icon: Clock,
    className: "border-status-reviewing/40 bg-status-reviewing/10 text-status-reviewing",
  },
  pack_purchased: {
    label: "Pack Purchased",
    icon: UserPlus,
    className: "border-primary/40 bg-primary/10 text-primary",
  },
  hired: {
    label: "Mission Complete",
    icon: CheckCircle2,
    className: "border-status-interview/40 bg-status-interview/10 text-status-interview",
  },
};

const ReferralPipeline = ({ referrals, loading = false }: ReferralPipelineProps) => {
  const getInitials = (email: string) => {
    return email.slice(0, 2).toUpperCase();
  };

  const getDisplayName = (email: string) => {
    return email.split("@")[0];
  };

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
              Track where your friends are in their journey.
            </p>
          </div>

          {loading ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              Loading referrals...
            </div>
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
                      const status = referral.status as keyof typeof statusConfig;
                      const config = statusConfig[status] || statusConfig.pending;
                      const StatusIcon = config.icon;
                      const earned = referral.status !== "pending" && referral.status !== "signed_up";

                      return (
                        <TableRow key={referral.id} className="border-border/30 hover:bg-muted/30">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                                {getInitials(referral.referred_email)}
                              </div>
                              <span className="text-sm font-medium text-foreground">
                                {getDisplayName(referral.referred_email)}
                              </span>
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
                  const status = referral.status as keyof typeof statusConfig;
                  const config = statusConfig[status] || statusConfig.pending;
                  const StatusIcon = config.icon;
                  const earned = referral.status !== "pending" && referral.status !== "signed_up";

                  return (
                    <div key={referral.id} className="flex items-center justify-between rounded-lg border border-border/30 bg-muted/20 p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                          {getInitials(referral.referred_email)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {getDisplayName(referral.referred_email)}
                          </p>
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