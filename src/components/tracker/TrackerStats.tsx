import { motion } from "framer-motion";
import { Briefcase, Activity, MessageSquare, Award } from "lucide-react";

interface TrackerStatsProps {
  totalApps: number;
  activeApps: number;
  interviews: number;
  offers: number;
}

const TrackerStats = ({ totalApps, activeApps, interviews, offers }: TrackerStatsProps) => {
  const stats = [
    { label: "Total Applications", value: totalApps, icon: Briefcase, color: "text-tracker-applied" },
    { label: "Active Applications", value: activeApps, icon: Activity, color: "text-tracker-screening" },
    { label: "Interviews", value: interviews, icon: MessageSquare, color: "text-tracker-interview" },
    { label: "Offers", value: offers, icon: Award, color: "text-tracker-offer" },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
          className="rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 p-5 transition-all hover:bg-white/15"
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-white/60">
              {stat.label}
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </div>
          <p className="text-3xl font-bold text-white" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            {stat.value}
          </p>
        </motion.div>
      ))}
    </div>
  );
};

export default TrackerStats;
