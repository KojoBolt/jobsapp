import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User } from "lucide-react";

const reviewerNames = ["Sarah", "David", "Elena", "Marcus", "Priya", "James", "Aisha", "Chen"];
const companies = ["Google", "SpaceX", "Stripe", "Meta", "Apple", "Notion", "Vercel", "Airbnb", "Linear", "Figma"];
const actions = [
  "is perfecting your {company} Cover Letter...",
  "is verifying the LinkedIn URL for {company}...",
  "is auditing your {company} application...",
  "is tailoring keywords for {company}...",
  "is optimizing your {company} resume match...",
  "is reviewing your {company} submission...",
  "has approved your {company} application ✓",
  "is adding personal touches for {company}...",
];

const generateActivity = () => {
  const name = reviewerNames[Math.floor(Math.random() * reviewerNames.length)];
  const company = companies[Math.floor(Math.random() * companies.length)];
  const action = actions[Math.floor(Math.random() * actions.length)].replace("{company}", company);
  return { name, action, id: Math.random().toString(36).slice(2) };
};

const ReviewerActivity = () => {
  const [activities, setActivities] = useState(() =>
    Array.from({ length: 4 }, generateActivity)
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setActivities((prev) => [generateActivity(), ...prev.slice(0, 5)]);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full rounded-lg border border-border/30 bg-muted/10 p-3">
      <div className="mb-2 flex items-center gap-2">
        <div className="relative">
          <User className="h-3.5 w-3.5 text-status-interview" />
          <div className="absolute -right-0.5 -top-0.5 h-2 w-2 animate-pulse rounded-full bg-status-interview" />
        </div>
        <span className="text-[11px] font-semibold text-foreground">Reviewer Activity</span>
        <span className="text-[9px] text-status-interview">LIVE</span>
      </div>
      <div className="space-y-1.5 overflow-hidden">
        {activities.slice(0, 5).map((activity, i) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: -10, height: 0 }}
            animate={{ opacity: 1 - i * 0.15, x: 0, height: "auto" }}
            transition={{ duration: 0.3 }}
            className="flex items-start gap-2 text-[10px]"
          >
            <span className="shrink-0 font-semibold text-primary">{activity.name}</span>
            <span className="text-muted-foreground">{activity.action}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ReviewerActivity;
