import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Rocket, Radar, CheckCircle2, ArrowRight, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const DeployButton = () => {
  const { user, session, profile, refreshProfile } = useAuth();
  const [hasActiveCampaign, setHasActiveCampaign] = useState(false);
  const [isSourcing, setIsSourcing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [sourcedCount, setSourcedCount] = useState(0);

  // On mount, note whether a campaign is already running (prevents double deploy).
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("campaigns")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "running")
        .limit(1)
        .maybeSingle();
      setHasActiveCampaign(!!data);
    })();
  }, [user]);

  const validateBeforeDeploy = useCallback(() => {
    if (!user) { toast.error("Please sign in first."); return false; }
    if (hasActiveCampaign) {
      toast.error("You already have an active campaign running!");
      return false;
    }
    if ((profile?.credits_remaining || 0) < 1) {
      toast.error("You have no credits remaining. Please top up to deploy.");
      return false;
    }
    if (!profile?.identity_vault_data?.personalInfo?.linkedinUrl) {
      toast.error("LinkedIn URL missing. Please update your Identity Vault.");
      return false;
    }
    return true;
  }, [user, profile, hasActiveCampaign]);

  const handleDeploy = useCallback(async () => {
    if (!validateBeforeDeploy()) return;

    const userCredits = profile?.credits_remaining || 0;
    const maxJobsToTarget = Math.min(userCredits, 200);
    setIsSourcing(true);

    let currentCampaignId: string | null = null;
    try {
      if (!session?.access_token) {
        throw new Error("Session expired. Please sign out and sign back in.");
      }

      const { data: camp, error: campErr } = await supabase
        .from("campaigns")
        .insert({
          user_id: user!.id,
          status: "running",
          total_jobs: 0,
          processed_jobs: 0,
          logs: ["Campaign initialized..."],
          batch_size: 10,
          interval_hours: 2,
          current_batch_index: 1,
          next_batch_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        })
        .select()
        .single();

      if (campErr) throw campErr;
      currentCampaignId = camp.id;

      const response = await fetch(`${SUPABASE_URL}/functions/v1/start-campaign`, {
        method: "POST",
        headers: new Headers({
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
          "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        }),
        body: JSON.stringify({ campaignId: currentCampaignId, limit: maxJobsToTarget }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to start campaign");

      // How many jobs were actually sourced into this campaign.
      const { count } = await supabase
        .from("applications")
        .select("id", { count: "exact", head: true })
        .eq("campaign_id", currentCampaignId);

      setSourcedCount(count ?? result.jobsFound ?? 0);
      setHasActiveCampaign(true);
      setShowSuccess(true);
      await refreshProfile();
    } catch (error: any) {
      console.error("Deploy failed:", error);
      toast.error(error.message || "Campaign failed. Please try again.");
      if (currentCampaignId) {
        await supabase.from("campaigns").update({ status: "failed" }).eq("id", currentCampaignId);
        await refreshProfile();
      }
    } finally {
      setIsSourcing(false);
    }
  }, [validateBeforeDeploy, user, session, profile, refreshProfile]);

  // Hard reload guarantees the dashboard shows the new campaign + applications,
  // even when this button already lives on the dashboard page.
  const goToDashboard = () => {
    window.location.href = "/dashboard";
  };

  return (
    <>
      {/* Success modal — brief confirmation after sourcing */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.25 }}
              className="relative w-full max-w-md rounded-2xl border border-border/50 bg-card p-8 text-center shadow-2xl"
            >
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 ring-2 ring-emerald-500/30">
                <CheckCircle2 className="h-8 w-8 text-emerald-400" />
              </div>

              <h2 className="text-xl font-bold text-foreground">
                {sourcedCount > 0
                  ? `${sourcedCount} matching ${sourcedCount === 1 ? "job" : "jobs"} sourced!`
                  : "Your campaign is live!"}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                We're writing your tailored cover letters now. They'll appear in your
                dashboard as they're ready — even if you close this page. No need to wait here.
              </p>

              <div className="mt-6 flex flex-col gap-2">
                <Button variant="hero" size="lg" className="w-full gap-2" onClick={goToDashboard}>
                  <LayoutDashboard className="h-4 w-4" />
                  Go to Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <button
                  onClick={() => setShowSuccess(false)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Stay here
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Deploy button — original design preserved */}
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
          disabled={isSourcing}
          className="relative gap-3 px-12 text-base font-bold animate-pulse-glow hover:animate-none"
        >
          <Rocket className="h-5 w-5" />
          Deploy My {profile?.credits_remaining ?? 200} Applications
          <Radar className="h-4 w-4 animate-spin" style={{ animationDuration: "3s" }} />
        </Button>
      </motion.div>
    </>
  );
};

export default DeployButton;