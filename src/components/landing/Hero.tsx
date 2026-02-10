import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Rocket, BarChart3, Shield, Bot, Sparkles, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const Hero = () => {
  return (
    <section className="relative min-h-screen overflow-hidden pt-24 pb-16">
      {/* Background split */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-y-0 left-0 w-1/2 bg-background" />
        <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-br from-[hsl(250_40%_12%)] to-[hsl(230_45%_8%)]" />
        {/* Center divider glow */}
        <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-primary/30 to-transparent hidden lg:block" />
      </div>

      {/* Grid pattern overlay */}
      <div className="pointer-events-none absolute inset-0 grid-pattern opacity-20" />

      <div className="container relative mx-auto px-6">
        {/* Top badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <Badge variant="outline" className="gap-2 border-primary/30 px-4 py-1.5 text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Two Ways to Win Your Career
          </Badge>
        </motion.div>

        {/* Split Cards */}
        <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-2">
          {/* Side A: Mission Launch */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/50 bg-card/80 p-8 backdrop-blur-sm transition-all hover:border-primary/40 hover:shadow-[0_0_40px_hsl(213_94%_55%/0.1)]"
          >
            {/* Accent corner */}
            <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-primary/10 blur-3xl" />

            <div>
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                <Rocket className="h-7 w-7 text-primary" />
              </div>

              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary">
                One-Time · $99
              </p>
              <h2
                className="mb-3 text-3xl font-bold text-foreground lg:text-4xl"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                The 200-App Blitz
              </h2>
              <p className="mb-6 text-base leading-relaxed text-muted-foreground">
                One-time deployment. AI speed. Human quality. Get 200 apps out in 7 days.
              </p>

              {/* Trust badge */}
              <div className="mb-6 flex items-center gap-2 rounded-lg border border-status-interview/20 bg-status-interview/5 px-3 py-2">
                <Shield className="h-4 w-4 text-status-interview" />
                <span className="text-xs font-medium text-status-interview">
                  Includes Human Review by Career Specialists
                </span>
              </div>

              <ul className="mb-8 space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-primary" />
                  7-day turnaround
                </li>
                <li className="flex items-center gap-2">
                  <Bot className="h-3.5 w-3.5 text-primary" />
                  AI + Human team personalization
                </li>
                <li className="flex items-center gap-2">
                  <Shield className="h-3.5 w-3.5 text-primary" />
                  Human-Touch Quality Guarantee
                </li>
              </ul>
            </div>

            <Link to="/onboarding">
              <Button variant="hero" size="xl" className="group/btn w-full">
                Start My Mission
                <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
              </Button>
            </Link>
          </motion.div>

          {/* Side B: Career Command Center */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35, duration: 0.6 }}
            className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/50 p-8 backdrop-blur-sm transition-all hover:border-accent/40 hover:shadow-[0_0_40px_hsl(250_40%_50%/0.1)]"
            style={{
              background: "linear-gradient(145deg, hsl(250 35% 14%) 0%, hsl(230 40% 10%) 100%)",
            }}
          >
            {/* Accent corner */}
            <div className="absolute -left-12 -top-12 h-32 w-32 rounded-full bg-accent/10 blur-3xl" />

            <div>
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-accent/10">
                <BarChart3 className="h-7 w-7 text-accent" />
              </div>

              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-accent">
                Monthly · From $29/mo
              </p>
              <h2
                className="mb-3 text-3xl font-bold text-foreground lg:text-4xl"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                The Job Tracker
              </h2>
              <p className="mb-6 text-base leading-relaxed text-muted-foreground">
                Stay organized. Track interviews. Get Prep-Bot cheat sheets. Your career, managed.
              </p>

              {/* Trust badge */}
              <div className="mb-6 flex items-center gap-2 rounded-lg border border-accent/20 bg-accent/5 px-3 py-2">
                <BarChart3 className="h-4 w-4 text-accent" />
                <span className="text-xs font-medium text-accent">
                  Persistent Dashboard & Prep-Bot Access
                </span>
              </div>

              <ul className="mb-8 space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <BarChart3 className="h-3.5 w-3.5 text-accent" />
                  Interactive status tracking
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-accent" />
                  AI-powered prep cheat sheets
                </li>
                <li className="flex items-center gap-2">
                  <Shield className="h-3.5 w-3.5 text-accent" />
                  Cancel anytime
                </li>
              </ul>
            </div>

            <Link to="/job-tracker">
              <Button variant="heroOutline" size="xl" className="w-full">
                Open My Tracker
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>

        {/* Bottom social proof */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="mt-12 text-center text-sm text-muted-foreground"
        >
          Trusted by 2,400+ job seekers · AI + Human quality assurance
        </motion.p>
      </div>
    </section>
  );
};

export default Hero;
