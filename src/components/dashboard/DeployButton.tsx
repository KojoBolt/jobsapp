import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Rocket, Radar } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const BATCH_SIZE = 3;

const DeployButton = () => {
  const { user, session, profile, refreshProfile } = useAuth();
  const [phase, setPhase] = useState<Phase>("idle");
  const [initProgress, setInitProgress] = useState(0);
  const [priorityFilled, setPriorityFilled] = useState(0);
  const [slots, setSlots] = useState<SlotStatus[]>(
    Array.from({ length: 170 }, () => ({ state: "empty" as const }))
  );
  const [totalProcessed, setTotalProcessed] = useState(0);
  const [humanStamps, setHumanStamps] = useState(0);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [completedCount, setCompletedCount] = useState(0);
  const orchestrationRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const jobsRef = useRef<any[]>([]);

  const cleanup = useCallback(() => {
    if (orchestrationRef.current) {
      clearInterval(orchestrationRef.current);
      orchestrationRef.current = null;
    }
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const addLog = useCallback((message: string) => {
    setTerminalLogs((prev) => [...prev.slice(-20), message]);
  }, []);

  const startPolling = useCallback((campId: string) => {
    pollRef.current = setInterval(async () => {
      const { data } = await supabase
        .from("campaigns")
        .select("processed_jobs, total_jobs, status, logs")
        .eq("id", campId)
        .single();

      if (!data) return;

      const processed = data.processed_jobs || 0;
      setTotalProcessed(processed);
      setHumanStamps(Math.floor(processed * 0.85));
      setCompletedCount(processed);

      if (data.logs?.length) {
        const latestLog = data.logs[data.logs.length - 1];
        addLog(latestLog.replace(/^\[.*?\] /, ""));
      }

      setSlots((prev) => {
        const newSlots = [...prev];
        const toFill = Math.min(processed - 30, 170);
        for (let i = 0; i < toFill; i++) {
          if (newSlots[i].state !== "verified") {
            newSlots[i] = { state: "verified" };
          }
        }
        return newSlots;
      });

      if (data.status === "completed" || processed >= data.total_jobs) {
        cleanup();
        setTimeout(() => setPhase("complete"), 500);
      }

      if (data.status === "failed") {
        cleanup();
        setPhase("idle");
        toast.error("Campaign failed. Credits have been refunded.");
        await refreshProfile();
      }
    }, 3000);
  }, [addLog, cleanup, refreshProfile]);

  const processJobs = useCallback(async (
    campId: string,
    userId: string,
    jobs: any[],
    resumeText: string,
    tone: string
  ) => {
    const batches = [];
    for (let i = 0; i < jobs.length; i += BATCH_SIZE) {
      batches.push(jobs.slice(i, i + BATCH_SIZE));
    }
    for (const batch of batches) {
      await Promise.all(
        batch.map((job: any) =>
          fetch(`${SUPABASE_URL}/functions/v1/process-job`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
              campaignId: campId,
              userId,
              job,
              resumeText,
              tone,
            }),
          })
        )
      );
    }
    await new Promise(resolve => setTimeout(resolve, 6000));

  }, []);

  const validateBeforeDeploy = useCallback(() => {
    if (!user) {
      toast.error("Please sign in first.");
      return false;
    }
    if ((profile?.credits_remaining || 0) < 200) {
      toast.error(`Insufficient credits. You need 200 credits, you have ${profile?.credits_remaining || 0}.`);
      return false;
    }
    if (!profile?.identity_vault_data?.personalInfo?.linkedinUrl) {
      toast.error("LinkedIn URL missing. Please update your Identity Vault.");
      return false;
    }
    return true;
  }, [user, profile]);

  const handleDeploy = useCallback(async () => {
    if (!validateBeforeDeploy()) return;

    // Reset state
    setTotalProcessed(0);
    setHumanStamps(0);
    setPriorityFilled(0);
    setTerminalLogs([]);
    setCampaignId(null);
    setSlots(Array.from({ length: 170 }, () => ({ state: "empty" as const })));
    setPhase("init");
    setInitProgress(0);

    let currentCampaignId: string | null = null;

    try {
      addLog("Syncing Identity Vault...");
      console.log("Session object:", session);
  console.log("Access token:", session?.access_token?.slice(0, 50));

      if (!session?.access_token) {
        throw new Error("Session expired. Please sign out and sign back in.");
      }

      // 1. Call start-campaign Edge Function
      addLog("Connecting to job sourcing engine...");
     const accessToken = session.access_token;
console.log("Sending token:", accessToken.slice(0, 30));

const response = await fetch(`${SUPABASE_URL}/functions/v1/start-campaign`, {
  method: "POST",
  headers: new Headers({
    "Content-Type": "application/json",
    "Authorization": `Bearer ${accessToken}`,
    "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  }),
  body: JSON.stringify({}),
});

      const result = await response.json();
      console.log("Full result:", result);
console.log("Campaign ID:", result.campaignId);
console.log("Jobs count:", result.jobs?.length);
console.log("First job:", result.jobs?.[0]);
console.log("Resume text length:", result.resumeText?.length);
console.log("Tone:", result.tone);

      if (!response.ok) {
        throw new Error(result.error || "Failed to start campaign");
      }

      const { campaignId: campId, jobs, resumeText, tone } = result;
      currentCampaignId = campId;
      setCampaignId(campId);
      jobsRef.current = jobs;

      addLog(`Campaign created. Found ${jobs.length} matching jobs.`);
      addLog("Starting cover letter generation...");

      // 2. Start polling DB for real progress
      startPolling(campId);

      // 3. Move to priority phase after init
      setTimeout(() => {
        setPhase("priority");
        let count = 0;
        const priorityTimer = setInterval(() => {
          count++;
          setPriorityFilled(count);
          setTotalProcessed(count);
          if (count >= 30) {
            clearInterval(priorityTimer);
            setPhase("orchestration");
          }
        }, 200);
      }, 5000);

      // 4. Process all jobs in background
      await processJobs(campId, user!.id, jobs, resumeText, tone);

    } catch (error: any) {
      console.error("Deploy failed:", error);
      addLog(`Error: ${error.message}`);
      toast.error(error.message || "Campaign failed. Please try again.");
      cleanup();
      setPhase("idle");

      // Mark campaign as failed and refund credits
      if (currentCampaignId) {
        await supabase
          .from("campaigns")
          .update({ status: "failed" })
          .eq("id", currentCampaignId);
        await refreshProfile();
      }
    }
  }, [validateBeforeDeploy, addLog, startPolling, processJobs, cleanup, user, session, refreshProfile]);

  const handleComplete = useCallback(() => {
    setPhase("idle");
    setTotalProcessed(0);
    setHumanStamps(0);
    setPriorityFilled(0);
    setCampaignId(null);
    setCompletedCount(0);
    setTerminalLogs([]);
    setSlots(Array.from({ length: 170 }, () => ({ state: "empty" as const })));
    refreshProfile();
  }, [refreshProfile]);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const isActive = phase !== "idle" && phase !== "complete";

  return (
    <>
      <AnimatePresence>
        {phase === "complete" && (
          <CompletionModal
            onClose={handleComplete}
            totalDeployed={completedCount}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-50 overflow-y-auto bg-background/98 backdrop-blur-md"
          >
            <div className="pointer-events-none absolute inset-0 grid-pattern opacity-30" />

            <div className="relative mx-auto max-w-5xl px-4 py-6 sm:px-6">
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
                <div className="flex items-center gap-2 rounded-full border border-status-interview/30 bg-status-interview/10 px-3 py-1">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-status-interview" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-status-interview">
                    Live
                  </span>
                </div>
              </div>

              <div className="mb-6">
                <LiveStats totalProcessed={totalProcessed} humanStamps={humanStamps} />
              </div>

              <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
                <div className="space-y-4">
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

                  {(phase === "priority" || phase === "orchestration") && (
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <PriorityVisualizer
                        filledCount={phase === "orchestration" ? 30 : priorityFilled}
                      />
                    </motion.div>
                  )}

                  {phase === "orchestration" && (
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <ApplicationGrid slots={slots} />
                    </motion.div>
                  )}

                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <DeployTerminal logs={terminalLogs} />
                  </motion.div>
                </div>

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

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative flex justify-center"
      >
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