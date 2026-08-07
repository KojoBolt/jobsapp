import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, Users, Sparkles } from "lucide-react";

const proofItems = [
  {
    icon: TrendingUp,
    text: "John just landed a $15K raise using our Salary Playbook strategies.",
  },
  {
    icon: Users,
    text: "Sarah referred 3 friends and earned $45 in credits.",
  },
  {
    icon: Sparkles,
    text: "Michael just upgraded to Premium System collections.",
  },
  {
    icon: TrendingUp,
    text: "Bella just got herself 100 Behavioral Interview Q&A ",
  },
  {
    icon: Users,
    text: "David shared his referral link and 2 friends joined this week.",
  },
  {
    icon: Sparkles,
    text: "Emma just unlocked the exclusive Career Accelerator bundle.",
  },
];

const SocialProofTicker = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % proofItems.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const current = proofItems[currentIndex];
  const Icon = current.icon;

  return (
    <div className="relative overflow-hidden rounded-lg border border-border/50 bg-card/50 px-5 py-3">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="flex items-center gap-3"
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Icon className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="text-sm text-muted-foreground">{current.text}</span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default SocialProofTicker;
