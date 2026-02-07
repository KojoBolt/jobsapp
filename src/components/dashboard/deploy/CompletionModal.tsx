import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ShieldCheck, BarChart3, Brain } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Confetti from "@/components/accelerators/Confetti";

interface CompletionModalProps {
  onClose: () => void;
}

const CompletionModal = ({ onClose }: CompletionModalProps) => {
  const navigate = useNavigate();

  return (
    <>
      <Confetti />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-[60] flex items-center justify-center bg-background/95 backdrop-blur-md"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mx-4 w-full max-w-md rounded-2xl border border-border/30 bg-card p-8 text-center"
          style={{ boxShadow: "0 0 60px hsl(213 94% 55% / 0.15), 0 0 120px hsl(142 71% 45% / 0.1)" }}
        >
          {/* Badge */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full border-2 border-gold/30 bg-gold/10"
            style={{ boxShadow: "0 0 30px hsl(43 96% 56% / 0.3)" }}
          >
            <ShieldCheck className="h-12 w-12 text-gold" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="mb-2 text-2xl font-bold text-foreground">
              Mission Deployed 🚀
            </h2>
            <p className="mb-1 text-sm text-muted-foreground">
              All 200 applications have been queued and verified.
            </p>
            <div className="mx-auto mb-6 mt-3 inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/10 px-3 py-1">
              <ShieldCheck className="h-3.5 w-3.5 text-gold" />
              <span className="text-[11px] font-semibold text-gold">
                Verified by Human Review Team
              </span>
            </div>
          </motion.div>

          {/* Stats summary */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mb-6 grid grid-cols-3 gap-3"
          >
            <div className="rounded-lg bg-muted/30 p-3">
              <p className="font-mono text-lg font-bold text-foreground">200</p>
              <p className="text-[9px] uppercase text-muted-foreground">Deployed</p>
            </div>
            <div className="rounded-lg bg-muted/30 p-3">
              <p className="font-mono text-lg font-bold text-gold">200</p>
              <p className="text-[9px] uppercase text-muted-foreground">Human Verified</p>
            </div>
            <div className="rounded-lg bg-muted/30 p-3">
              <p className="font-mono text-lg font-bold text-status-interview">100h</p>
              <p className="text-[9px] uppercase text-muted-foreground">Time Saved</p>
            </div>
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="flex flex-col gap-2 sm:flex-row"
          >
            <Button
              variant="hero"
              size="lg"
              className="flex-1 gap-2"
              onClick={() => {
                onClose();
                navigate("/dashboard");
              }}
            >
              <BarChart3 className="h-4 w-4" />
              View Tracking Dashboard
            </Button>
            <Button
              variant="heroOutline"
              size="lg"
              className="flex-1 gap-2"
              onClick={() => {
                onClose();
                navigate("/dashboard");
              }}
            >
              <Brain className="h-4 w-4" />
              Prepare for Interviews
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>
    </>
  );
};

export default CompletionModal;
