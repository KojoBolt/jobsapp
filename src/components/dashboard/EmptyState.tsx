import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";

const EmptyState = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-card mx-auto max-w-md rounded-xl p-8 text-center"
    >
      <div className="mb-4 flex justify-center">
        <div className="flex h-12 w-12 animate-spin items-center justify-center rounded-full border-2 border-primary/30 border-t-primary">
          <Loader2 className="h-5 w-5 text-primary" />
        </div>
      </div>
      <h3 className="mb-2 text-lg font-semibold text-foreground">
        Queueing your first 50 applications...
      </h3>
      <p className="mb-6 text-sm text-muted-foreground">
        Our team is reviewing your profile and preparing personalized applications.
        You'll see updates here in real-time.
      </p>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Progress</span>
          <span className="text-primary">23%</span>
        </div>
        <Progress value={23} className="h-2" />
      </div>
    </motion.div>
  );
};

export default EmptyState;
