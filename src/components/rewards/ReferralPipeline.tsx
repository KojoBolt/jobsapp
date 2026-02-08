import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Clock, CheckCircle2, UserPlus } from "lucide-react";
import { motion } from "framer-motion";

interface Referral {
  name: string;
  initials: string;
  status: "signed_up" | "pack_purchased" | "mission_complete";
  reward: number;
}

const mockReferrals: Referral[] = [
  { name: "James K.", initials: "JK", status: "mission_complete", reward: 15 },
  { name: "Sarah M.", initials: "SM", status: "pack_purchased", reward: 15 },
  { name: "Tunde A.", initials: "TA", status: "signed_up", reward: 15 },
  { name: "Priya R.", initials: "PR", status: "pack_purchased", reward: 15 },
  { name: "Michael C.", initials: "MC", status: "signed_up", reward: 15 },
];

const statusConfig = {
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
  mission_complete: {
    label: "Mission Complete",
    icon: CheckCircle2,
    className: "border-status-interview/40 bg-status-interview/10 text-status-interview",
  },
};

const ReferralPipeline = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
    >
      <Card className="border-border/50">
        <CardContent className="p-0">
          <div className="border-b border-border/50 px-6 py-4">
            <h3 className="text-lg font-bold text-foreground">
              Referral Pipeline
            </h3>
            <p className="text-xs text-muted-foreground">
              Track where your friends are in their journey.
            </p>
          </div>

          {/* Desktop table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="text-xs font-semibold uppercase tracking-wider">
                    Friend
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider">
                    Status
                  </TableHead>
                  <TableHead className="text-right text-xs font-semibold uppercase tracking-wider">
                    Your Reward
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockReferrals.map((referral, i) => {
                  const config = statusConfig[referral.status];
                  const StatusIcon = config.icon;
                  const earned = referral.status !== "signed_up";

                  return (
                    <TableRow
                      key={i}
                      className="border-border/30 hover:bg-muted/30"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                            {referral.initials}
                          </div>
                          <span className="text-sm font-medium text-foreground">
                            {referral.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`gap-1.5 ${config.className}`}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {config.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={`text-sm font-bold ${
                            earned ? "text-gold" : "text-muted-foreground"
                          }`}
                        >
                          {earned ? `+$${referral.reward}` : "Pending"}
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
            {mockReferrals.map((referral, i) => {
              const config = statusConfig[referral.status];
              const StatusIcon = config.icon;
              const earned = referral.status !== "signed_up";

              return (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg border border-border/30 bg-muted/20 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                      {referral.initials}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {referral.name}
                      </p>
                      <Badge
                        variant="outline"
                        className={`mt-1 gap-1 text-[10px] ${config.className}`}
                      >
                        <StatusIcon className="h-2.5 w-2.5" />
                        {config.label}
                      </Badge>
                    </div>
                  </div>
                  <span
                    className={`text-sm font-bold ${
                      earned ? "text-gold" : "text-muted-foreground"
                    }`}
                  >
                    {earned ? `+$${referral.reward}` : "Pending"}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ReferralPipeline;
