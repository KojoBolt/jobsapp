import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import Confetti from "@/components/accelerators/Confetti";
import ReferralWidget from "@/components/accelerators/ReferralWidget";
import SocialProofTicker from "@/components/accelerators/SocialProofTicker";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Library,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";

const PurchaseSuccess = () => {
  const [searchParams] = useSearchParams();
  const productName =
    searchParams.get("product") || "Career Accelerator Product";
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, delay: 0.2 + i * 0.15, ease: [0.25, 0.4, 0.25, 1] as [number, number, number, number] },
    }),
  };

  return (
    <DashboardLayout>
      {showConfetti && <Confetti />}

      <div className="mx-auto max-w-2xl space-y-8 py-8">
        {/* Celebration Header */}
        <motion.div
          className="text-center"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={0}
        >
          <motion.div
            className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-status-interview/15"
            animate={{
              boxShadow: [
                "0 0 0 0 hsl(142 71% 45% / 0.3)",
                "0 0 0 20px hsl(142 71% 45% / 0)",
              ],
            }}
            transition={{
              duration: 1.5,
              repeat: 3,
              ease: "easeOut",
            }}
          >
            <CheckCircle2 className="h-10 w-10 text-status-interview" />
          </motion.div>

          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            You're officially ahead of the competition.
          </h1>
          <p className="mt-3 text-base text-muted-foreground">
            Your{" "}
            <span className="font-semibold text-foreground">
              {productName}
            </span>{" "}
            has been added to your Library. You now have the tools that 90% of
            applicants are missing.
          </p>
        </motion.div>

        {/* Library Access */}
        <motion.div
          className="flex flex-col items-center gap-2"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={1}
        >
          <Button variant="hero" size="xl" asChild>
            <Link to="/accelerators?tab=library" className="gap-2">
              <Library className="h-5 w-5" />
              Go to My Library
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Badge
            variant="outline"
            className="gap-1 text-[10px] text-muted-foreground"
          >
            <ShieldCheck className="h-3 w-3" />
            100% Secure Access
          </Badge>
        </motion.div>

        {/* Referral Widget */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={2}
        >
          <ReferralWidget />
        </motion.div>

        {/* Social Proof Ticker */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={3}
        >
          <SocialProofTicker />
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default PurchaseSuccess;
