import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Rocket, CheckCircle2, ArrowRight, LayoutDashboard, Loader2, Lightbulb, Coins, X,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CHART, T } from "@/admin/ui/system";
import { useRamp } from "@/admin/ui/charts";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

/**
 * Shown in the "how to add credits" modal. These mirror PACKAGE_CONFIG in the
 * initialize-paystack edge function, which is the authoritative source — it
 * prices the transaction server-side so the client can't tamper with it. Keep
 * the two in step; this list is display only.
 */
const CREDIT_PACKAGES = [
  { label: "Basic Activation", credits: 200, amountUsd: 99 },
  { label: "Starter Top-up", credits: 100, amountUsd: 29 },
  { label: "Pro Top-up", credits: 200, amountUsd: 299 },
];

const DeployButton = () => {
  const { user, session, profile, loading: authLoading, refreshProfile } = useAuth();
  const { dark } = useRamp();
  const [hasActiveCampaign, setHasActiveCampaign] = useState(false);
  const [isSourcing, setIsSourcing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCredits, setShowCredits] = useState(false);
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

  // Defaulted to 200 before, which meant a user with an empty account was told
  // they had 200 credits ready until their profile finished loading — and then
  // hit a toast error when they pressed Deploy. Unknown is now 0, and the panel
  // waits for `profileReady` before claiming anything about the balance.
  const credits = profile?.credits_remaining ?? 0;
  const profileReady = !authLoading && !!profile;
  const outOfCredits = profileReady && credits < 1 && !hasActiveCampaign;

  const good = dark ? CHART.goodDark : CHART.good;
  const accent = dark ? CHART.accentDark : CHART.accent;

  /* Panel copy, one entry per state. Kept together so the heading and the
     sentence under it can't drift into describing different situations. */
  const panel = !profileReady
    ? {
        title: "Getting things ready",
        body: "One moment while we load your account.",
      }
    : hasActiveCampaign
    ? {
        title: "Applications in progress",
        body: "We're writing your applications now. They'll appear in your feed as they're ready — no need to wait here.",
      }
    : outOfCredits
    ? {
        title: "You're out of credits",
        body: "Credits are what let us send applications for you — one credit sends one application. Add some and you can deploy straight away.",
      }
    : {
        title: "Ready to deploy",
        body: `${credits.toLocaleString()} application ${credits === 1 ? "credit" : "credits"} ready. AI-written, human-reviewed.`,
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
            // z-[1900] clears the sticky header at z-[1000].
            className="fixed inset-0 z-[1900] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.25 }}
              className={`relative w-full max-w-md rounded-2xl border ${T.hairline} bg-white p-7
                          text-center shadow-xl dark:bg-[#1A1A19]`}
            >
              <span
                className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full"
                style={{ backgroundColor: `${good}1F`, color: good }}
              >
                <CheckCircle2 size={26} strokeWidth={2.25} />
              </span>

              <h2 className={`text-[19px] font-bold tracking-[-0.01em] ${T.ink}`}>
                {sourcedCount > 0
                  ? `${sourcedCount} matching ${sourcedCount === 1 ? "job" : "jobs"} sourced!`
                  : "Your campaign is live!"}
              </h2>
              <p className={`mt-2 text-[12.5px] leading-relaxed ${T.muted}`}>
                We're writing your tailored cover letters now. They'll appear in your
                dashboard as they're ready — even if you close this page. No need to wait here.
              </p>

              <div className="mt-6 flex flex-col gap-1">
                <button
                  type="button"
                  onClick={goToDashboard}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#111110]
                             px-4 py-3 text-[13px] font-semibold text-white transition-opacity
                             hover:opacity-90 dark:bg-white dark:text-[#111110]"
                >
                  <LayoutDashboard size={15} />
                  Go to Dashboard
                  <ArrowRight size={15} strokeWidth={2.5} />
                </button>
                <button
                  type="button"
                  onClick={() => setShowSuccess(false)}
                  className={`py-2.5 text-[12px] font-medium ${T.muted} transition-opacity hover:opacity-70`}
                >
                  Stay here
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* How-to-add-credits modal, opened from the Tip column. Packages mirror
          PACKAGE_CONFIG in the initialize-paystack function — that server-side
          config is authoritative for price and credits, so if it changes these
          need updating with it. */}
      <AnimatePresence>
        {showCredits && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCredits(false)}
            className="fixed inset-0 z-[1900] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.22 }}
              onClick={(e) => e.stopPropagation()}
              className={`relative w-full max-w-[460px] rounded-2xl border ${T.hairline} bg-white
                          shadow-xl dark:bg-[#1A1A19]`}
            >
              <div className={`flex items-start justify-between gap-3 border-b ${T.hairline} px-5 py-4`}>
                <div className="flex items-center gap-2.5">
                  <span
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-lg"
                    style={{ backgroundColor: `${accent}1A`, color: accent }}
                  >
                    <Coins size={15} strokeWidth={2} />
                  </span>
                  <div>
                    <p className={`text-[14px] font-bold leading-tight ${T.ink}`}>Adding credits</p>
                    <p className={`text-[11px] leading-tight ${T.muted}`}>
                      One credit sends one application
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCredits(false)}
                  aria-label="Close"
                  className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${T.muted}
                              transition-colors hover:bg-[#F4F4F2] dark:hover:bg-white/5`}
                >
                  <X size={15} />
                </button>
              </div>

              <div className="px-5 py-4">
                <p className={`text-[12.5px] leading-relaxed ${T.muted}`}>
                  Credits are what let us send applications on your behalf. You currently
                  have{" "}
                  <span className={`font-bold ${T.ink}`}>{credits.toLocaleString()}</span>.
                  Pick a top-up at checkout and they land on your account as soon as payment
                  clears.
                </p>

                <ul className={`mt-4 divide-y ${T.divide}`}>
                  {CREDIT_PACKAGES.map((p) => (
                    <li key={p.label} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="min-w-0">
                        <p className={`text-[12.5px] font-semibold ${T.ink}`}>{p.label}</p>
                        <p className={`text-[11px] ${T.muted}`}>
                          {p.credits.toLocaleString()} applications
                        </p>
                      </div>
                      <span className={`shrink-0 text-[13px] font-bold ${T.ink}`}>${p.amountUsd}</span>
                    </li>
                  ))}
                </ul>

                <p className={`mt-3 text-[11px] leading-relaxed ${T.muted}`}>
                  Paid by card via Paystack. Credits never expire, and unused ones roll over
                  between campaigns.
                </p>
              </div>

              <div className={`flex flex-col gap-1 border-t ${T.hairline} px-5 py-4`}>
                <Link
                  to="/checkout"
                  onClick={() => setShowCredits(false)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#111110]
                             px-4 py-2.5 text-[12.5px] font-semibold text-white transition-opacity
                             hover:opacity-90 dark:bg-white dark:text-[#111110]"
                >
                  Add credits
                  <ArrowRight size={14} strokeWidth={2.5} />
                </Link>
                <button
                  type="button"
                  onClick={() => setShowCredits(false)}
                  className={`py-2 text-[12px] font-medium ${T.muted} transition-opacity hover:opacity-70`}
                >
                  Maybe later
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Deploy panel — two columns split by a dashed rule: the CTA on the left,
          a supporting tip on the right. Stacks below md, where the rule becomes a
          horizontal divider. */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className={`grid rounded-2xl border ${T.hairline} bg-white
                    divide-y divide-dashed divide-[#EAEAE7]
                    md:grid-cols-2 md:divide-x md:divide-y-0
                    dark:divide-white/10 dark:bg-[#1A1A19]`}
      >
        {/* ── Deploy ─────────────────────────────────────────────────────── */}
        <div className="flex flex-col items-center px-6 py-6 text-center">
          <span
            className="mb-3 grid h-10 w-10 place-items-center rounded-full"
            style={{ backgroundColor: `${accent}1A`, color: accent }}
          >
            <Rocket size={18} strokeWidth={2} />
          </span>

          <p className={`text-[14.5px] font-bold tracking-[-0.01em] ${T.ink}`}>
            {panel.title}
          </p>
          <p className={`mt-1 max-w-xs text-[11.5px] leading-relaxed ${T.muted}`}>
            {panel.body}
          </p>

          {/* With no credits the Deploy button used to stay live, and pressing it
              only produced a toast error. The action now matches the situation. */}
          {outOfCredits ? (
            <button
              type="button"
              onClick={() => setShowCredits(true)}
              className="mt-4 inline-flex items-center gap-2.5 rounded-xl bg-[#111110] px-6 py-3
                         text-[13px] font-bold text-white transition-opacity hover:opacity-90
                         dark:bg-white dark:text-[#111110]"
            >
              <Coins size={15} />
              Add credits
              <ArrowRight size={14} strokeWidth={2.5} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleDeploy}
              disabled={isSourcing || hasActiveCampaign || !profileReady}
              className="mt-4 inline-flex items-center gap-2.5 rounded-xl bg-[#111110] px-6 py-3
                         text-[13px] font-bold text-white transition-opacity hover:opacity-90
                         disabled:cursor-not-allowed disabled:opacity-40
                         dark:bg-white dark:text-[#111110]"
            >
              {isSourcing ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Sourcing jobs…
                </>
              ) : hasActiveCampaign ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Working on it…
                </>
              ) : (
                <>
                  <Rocket size={15} />
                  Deploy Applications
                  <ArrowRight size={14} strokeWidth={2.5} />
                </>
              )}
            </button>
          )}
        </div>

        {/* ── Tip ────────────────────────────────────────────────────────── */}
        <div className="flex flex-col justify-center px-6 py-6">
          <p className={`flex items-center gap-1.5 text-[13px] font-bold ${T.ink}`}>
            <Lightbulb size={14} strokeWidth={2} style={{ color: accent }} />
            Tip
          </p>
          {/* Says something the left column hasn't already said — repeating
              "you're out of credits" twice in one panel reads as a scold. */}
          <p className={`mt-1.5 max-w-sm text-[12px] leading-relaxed ${T.muted}`}>
            {outOfCredits
              ? "Every credit sends one tailored, human-reviewed application. Credits never expire, and any you don't use roll over to your next campaign."
              : hasActiveCampaign
              ? "Your campaign keeps running in the background, so there's no need to stay on this page. Applications arrive in batches — check back through the day."
              : "Add credits to deploy more applications and accelerate your job search."}
          </p>

          <button
            type="button"
            onClick={() => setShowCredits(true)}
            className={`mt-3.5 inline-flex w-fit items-center rounded-lg border ${T.hairline} px-3.5 py-2
                        text-[12px] font-semibold ${T.ink} transition-colors
                        hover:bg-[#F4F4F2] dark:hover:bg-white/5`}
          >
            Learn More
          </button>
        </div>
      </motion.div>
    </>
  );
};

export default DeployButton;