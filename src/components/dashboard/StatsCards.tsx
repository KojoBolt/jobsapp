import { DashboardStats } from "@/hooks/useDashboardData";
import { motion } from "framer-motion";
import { Send, CheckCircle2 } from "lucide-react";

interface StatsCardsProps { 
  data: DashboardStats | null;
}

interface StatCard {
  label: string;
  value: string;
  change: string;
  icon: typeof Send;
  positive: boolean;
}


const StatsCards = ({ data }: StatsCardsProps) => {

  if (!data) {
    return null;
  }

  const stats: StatCard[] = [ 
    {
      label: "Applications Sent",
      value: String(data.total_sent),
      change: `+${data.sent_this_week} this week`,
      icon: Send,
      positive: true,
    },
    { 
      label: "Confirmations",
      value: String(data.total_confirmations),
      change: `${data.confirmation_rate}% rate`,
      icon: CheckCircle2,
      positive: true,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: i * 0.08 }}
          className="glass-card rounded-xl p-5"
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {stat.label}
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <stat.icon className="h-4 w-4 text-primary" />
            </div>
          </div>
          <p className="text-3xl font-bold text-foreground">{stat.value}</p>
          <p className="mt-1 text-xs text-primary">{stat.change}</p>
        </motion.div>
      ))}
    </div>
  );
};

export default StatsCards;