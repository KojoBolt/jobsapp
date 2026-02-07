import { motion } from "framer-motion";
import { Send, CheckCircle2, MessageSquare, TrendingUp } from "lucide-react";

interface StatCard {
  label: string;
  value: string;
  change: string;
  icon: typeof Send;
  positive: boolean;
}

const stats: StatCard[] = [
  {
    label: "Applications Sent",
    value: "147",
    change: "+23 this week",
    icon: Send,
    positive: true,
  },
  {
    label: "Confirmations",
    value: "89",
    change: "60.5% rate",
    icon: CheckCircle2,
    positive: true,
  },
  {
    label: "Interview Requests",
    value: "12",
    change: "+3 this week",
    icon: MessageSquare,
    positive: true,
  },
  {
    label: "Response Rate",
    value: "8.2%",
    change: "+1.4% vs avg",
    icon: TrendingUp,
    positive: true,
  },
];

const StatsCards = () => {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
