import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Rocket, Radar } from "lucide-react";
import ProgressRing from "./deploy/ProgressRing";
import DeployTerminal from "./deploy/DeployTerminal";
import PriorityVisualizer from "./deploy/PriorityVisualizer";
import ApplicationGrid from "./deploy/ApplicationGrid";
import ReviewerActivity from "./deploy/ReviewerActivity";
import ReviewerQueue from "./deploy/ReviewerQueue";
import HumanQualityCounter from "./deploy/HumanQualityCounter";
import LiveStats from "./deploy/LiveStats";
import CompletionModal from "./deploy/CompletionModal";

type Phase = "idle" | "init" | "priority" | "orchestration" | "complete";

interface SlotStatus {
  state: "empty" | "ai" | "human" | "verified";
}

const DeployButton = () => {
  const [phase, setPhase] = useState<Phase>("idle");
  const [initProgress, setInitProgress] = useState(0);
  const [priorityFilled, setPriorityFilled] = useState(0);
  const [slots, setSlots] = useState<SlotStatus[]>(
    Array.from({ length: 170 }, () => ({ state: "empty" as const }))
  );
  const [totalProcessed, setTotalProcessed] = useState(0);
  const [humanStamps, setHumanStamps] = useState(0);
  const orchestrationRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cleanup = useCallback(() => {
    if (orchestrationRef.current) {
      clearInterval(orchestrationRef.current);
      orchestrationRef.current = null;
    }
  }, []);

  // Phase 1: Initiation (5 seconds)
  useEffect(() => {
    if (phase !== "init") return;
    setInitProgress(0);
    const duration = 5000;
    const steps = 100;
    const interval = duration / steps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      setInitProgress(step);
      if (step >= steps) {
        clearInterval(timer);
        setPhase("priority");
      }
    }, interval);

    return () => clearInterval(timer);
  }, [phase]);

  // Phase 2: Priority 30 (fills 30 slots)
  useEffect(() => {
    if (phase !== "priority") return;
    setPriorityFilled(0);
    let count = 0;

    const timer = setInterval(() => {
      count++;
      setPriorityFilled(count);
      setTotalProcessed(count);
      setHumanStamps(Math.floor(count * 0.8));
      if (count >= 30) {
        clearInterval(timer);
        setPhase("orchestration");
      }
    }, 200);

    return () => clearInterval(timer);
  }, [phase]);

  // Phase 3: AI + Human Orchestration (170 slots)
  useEffect(() => {
    if (phase !== "orchestration") return;

    // Reset slots
    setSlots(Array.from({ length: 170 }, () => ({ state: "empty" as const })));
    let processed = 30;

    orchestrationRef.current = setInterval(() => {
      setSlots((prev) => {
        const newSlots = [...prev];
        // Find slots to advance
        let changed = false;

        // Advance some verified
        for (let i = 0; i < newSlots.length && !changed; i++) {
          if (newSlots[i].state === "human") {
            if (Math.random() > 0.3) {
              newSlots[i] = { state: "verified" };
              processed++;
              changed = true;
            }
          }
        }

        // Advance some AI to human
        for (let i = 0; i < newSlots.length; i++) {
          if (newSlots[i].state === "ai" && Math.random() > 0.5) {
            newSlots[i] = { state: "human" };
          }
        }

        // Start new AI slots (batch of 2-4)
        const batchSize = 2 + Math.floor(Math.random() * 3);
        let started = 0;
        for (let i = 0; i < newSlots.length && started < batchSize; i++) {
          if (newSlots[i].state === "empty") {
            newSlots[i] = { state: "ai" };
            started++;
          }
        }

        const verifiedCount = newSlots.filter((s) => s.state === "verified").length;
        setTotalProcessed(30 + verifiedCount);
        setHumanStamps(Math.floor((30 + verifiedCount) * 0.85));

        // Check completion
        if (verifiedCount >= 170) {
          cleanup();
          setTimeout(() => setPhase("complete"), 500);
        }

        return newSlots;
      });
    }, 150);

    return cleanup;
  }, [phase, cleanup]);

  const handleDeploy = () => {
    setTotalProcessed(0);
    setHumanStamps(0);
    setPriorityFilled(0);
    setPhase("init");
  };

  const handleComplete = () => {
    setPhase("idle");
    setTotalProcessed(0);
    setHumanStamps(0);
    setPriorityFilled(0);
    setSlots(Array.from({ length: 170 }, () => ({ state: "empty" as const })));
  };

  const isActive = phase !== "idle" && phase !== "complete";

  return (
    <>
      {/* Completion Modal */}
      <AnimatePresence>
        {phase === "complete" && <CompletionModal onClose={handleComplete} />}
      </AnimatePresence>

      {/* Mission Control Overlay */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-50 overflow-y-auto bg-background/98 backdrop-blur-md"
          >
            {/* Subtle grid pattern */}
            <div className="pointer-events-none absolute inset-0 grid-pattern opacity-30" />

            <div className="relative mx-auto max-w-5xl px-4 py-6 sm:px-6">
              {/* Header */}
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/30 bg-primary/10"
                  >
                    <Radar className="h-5 w-5 text-primary" />
                  </motion.div>
                  <div>
                    <h1 className="text-lg font-bold text-foreground">Mission Control</h1>
                    <p className="text-[11px] uppercase tracking-wider text-primary">
                      {phase === "init" && "System Initializing..."}
                      {phase === "priority" && "Targeting Priority Roles"}
                      {phase === "orchestration" && "AI + Human Orchestration Active"}
                    </p>
                  </div>
                </div>

                {/* Live indicator */}
                <div className="flex items-center gap-2 rounded-full border border-status-interview/30 bg-status-interview/10 px-3 py-1">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-status-interview" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-status-interview">
                    Live
                  </span>
                </div>
              </div>

              {/* Live Stats */}
              <div className="mb-6">
                <LiveStats totalProcessed={totalProcessed} humanStamps={humanStamps} />
              </div>

              {/* Main Layout */}
              <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
                {/* Left Column */}
                <div className="space-y-4">
                  {/* Init Phase: Progress Ring + Terminal */}
                  {phase === "init" && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col items-center gap-6"
                    >
                      <ProgressRing
                        progress={initProgress}
                        label={initProgress < 100 ? "Initializing" : "Ready"}
                        size={180}
                      />
                    </motion.div>
                  )}

                  {/* Priority Phase */}
                  {(phase === "priority" || phase === "orchestration") && (
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <PriorityVisualizer filledCount={phase === "orchestration" ? 30 : priorityFilled} />
                    </motion.div>
                  )}

                  {/* Orchestration Phase */}
                  {phase === "orchestration" && (
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <ApplicationGrid slots={slots} />
                    </motion.div>
                  )}

                  {/* Terminal always visible */}
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <DeployTerminal />
                  </motion.div>
                </div>

                {/* Right Column: Reviewer Widgets */}
                <div className="space-y-4">
                  {(phase === "priority" || phase === "orchestration") && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <ReviewerActivity
                        industry="Engineering"
                        onVerified={() => setHumanStamps((prev) => prev + 1)}
                      />
                    </motion.div>
                  )}

                  {phase === "orchestration" && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <ReviewerQueue
                        totalProcessed={totalProcessed}
                        industry="Engineering"
                      />
                    </motion.div>
                  )}

                  {(phase === "priority" || phase === "orchestration") && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <HumanQualityCounter count={humanStamps} />
                    </motion.div>
                  )}

                  {/* Progress ring (smaller, in sidebar during orchestration) */}
                  {phase === "orchestration" && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-center"
                    >
                      <ProgressRing
                        progress={(totalProcessed / 200) * 100}
                        label="Overall"
                        size={120}
                      />
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CTA Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative flex justify-center"
      >
        {/* Pulsing glow */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="absolute h-20 w-64 animate-pulse-glow rounded-xl" />
        </div>

        <Button
          variant="hero"
          size="xl"
          onClick={handleDeploy}
          disabled={isActive}
          className="relative gap-3 px-12 text-base font-bold animate-pulse-glow hover:animate-none"
        >
          <Rocket className="h-5 w-5" />
          Deploy My 200 Applications
          <Radar className="h-4 w-4 animate-spin" style={{ animationDuration: "3s" }} />
        </Button>
      </motion.div>
    </>
  );
};

export default DeployButton;
