import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Rocket, Radar, CheckCircle2 } from "lucide-react";
import Confetti from "@/components/accelerators/Confetti";

const DeployButton = () => {
  const [deploying, setDeploying] = useState(false);
  const [deployed, setDeployed] = useState(false);
  const [filledSlots, setFilledSlots] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  const handleDeploy = () => {
    setDeploying(true);
    setFilledSlots(0);

    // Animate slots filling up
    const totalSlots = 200;
    const duration = 4000;
    const interval = duration / totalSlots;

    let current = 0;
    const timer = setInterval(() => {
      current += 1;
      setFilledSlots(current);
      if (current >= totalSlots) {
        clearInterval(timer);
        setDeployed(true);
        setShowConfetti(true);
        setTimeout(() => {
          setDeploying(false);
          setDeployed(false);
          setShowConfetti(false);
        }, 5000);
      }
    }, interval);
  };

  return (
    <>
      {showConfetti && <Confetti />}

      {/* Full-screen deployment overlay */}
      <AnimatePresence>
        {deploying && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm"
          >
            <div className="flex flex-col items-center gap-8 text-center">
              {!deployed ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-primary/30 bg-primary/10"
                  >
                    <Radar className="h-12 w-12 text-primary" />
                  </motion.div>

                  <div>
                    <h2 className="text-2xl font-bold text-foreground">
                      Deploying Applications...
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Human + AI team is targeting your matched roles
                    </p>
                  </div>

                  {/* Slot Counter */}
                  <div className="w-80">
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-mono font-bold text-primary">
                        {filledSlots}/200
                      </span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-muted">
                      <motion.div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${(filledSlots / 200) * 100}%` }}
                        transition={{ duration: 0.05 }}
                      />
                    </div>
                  </div>

                  {/* Visual Grid */}
                  <div className="grid grid-cols-20 gap-[3px]">
                    {Array.from({ length: 200 }).map((_, i) => (
                      <motion.div
                        key={i}
                        className={`h-2.5 w-2.5 rounded-sm transition-colors duration-100 ${
                          i < filledSlots
                            ? "bg-primary shadow-sm shadow-primary/30"
                            : "bg-muted/50"
                        }`}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex flex-col items-center gap-4"
                >
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-status-interview/15">
                    <CheckCircle2 className="h-10 w-10 text-status-interview" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">
                    Campaign Deployed! 🚀
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    200 applications queued. Your Human + AI team is on it.
                  </p>
                </motion.div>
              )}
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
        {/* Pulsing rings */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="absolute h-20 w-64 animate-pulse-glow rounded-xl" />
        </div>

        <Button
          variant="hero"
          size="xl"
          onClick={handleDeploy}
          disabled={deploying}
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
