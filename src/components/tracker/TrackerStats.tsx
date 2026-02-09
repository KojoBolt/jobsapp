import { motion } from "framer-motion";
import { Briefcase, Target, MessageSquare, Award } from "lucide-react";

interface TrackerStatsProps {
  totalApps: number;
  activeMissions: number;
  interviews: number;
  offers: number;
}

const TrackerStats = ({ totalApps, activeMissions, interviews, offers }: TrackerStatsProps) => {
  const stats = [
    { label: "Total Apps", value: totalApps, icon: Briefcase, color: "text-primary" },
    { label: "Active Missions", value: activeMissions, icon: Target, color: "text-status-reviewing" },
    { label: "Interviews", value: interviews, icon: MessageSquare, color: "text-status-interview" },
    { label: "Offers", value: offers, icon: Award, color: "text-gold" },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
          className="glass-card rounded-xl p-5"
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {stat.label}
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </div>
          <p className="text-3xl font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
            {stat.value}
          </p>
        </motion.div>
      ))}
    </div>
  );
};

export default TrackerStats;
