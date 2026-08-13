import { useState, useEffect, useRef } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import EarningsHero from "@/components/rewards/EarningsHero";
import ReferralTool from "@/components/rewards/ReferralTool";
import ReferralPipeline from "@/components/rewards/ReferralPipeline";
import MissionCompleteModal from "@/components/rewards/MissionCompleteModal";
import CashOutToggle from "@/components/rewards/CashOutToggle";
import { PartyPopper } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { T } from "@/admin/ui/system";

interface Referral {
  id: string;
  referrer_id: string;
  referred_user_id: string | null;
  referred_email: string | null;
  status: string;            // 'pending' | 'rewarded'
  credits_earned: number;
  created_at: string;
}

const REFERRAL_REWARD = 15;

const RewardsCenter = () => {
  const { user, profile } = useAuth();
  const [showMissionModal, setShowMissionModal] = useState(false);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [jobsSubmitted, setJobsSubmitted] = useState(0);

  // Tracks completed campaigns we've already celebrated, so auto-fire happens
  // once per completion — not on every page load.
  const celebratedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;

    const fetchReferrals = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("referrals")
        .select("*")
        .eq("referrer_id", user.id)
        .order("created_at", { ascending: false });
      setReferrals((data as Referral[]) || []);
      setLoading(false);
    };

    // All-time submitted applications for this user.
    const fetchJobsSubmitted = async () => {
      const { count } = await supabase
        .from("applications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .in("status", ["submitted", "completed"]);
      setJobsSubmitted(count || 0);
    };

    fetchReferrals();
    fetchJobsSubmitted();
  }, [user]);

  // ── Auto-fire: celebrate when a campaign newly completes ──────────────
  useEffect(() => {
    if (!user) return;

    // Seed already-completed campaigns so we DON'T celebrate old ones on first load.
    let seeded = false;
    const seed = async () => {
      const { data } = await supabase
        .from("campaigns")
        .select("id, status")
        .eq("user_id", user.id)
        .eq("status", "completed");
      (data || []).forEach((c: { id: string }) => celebratedRef.current.add(c.id));
      seeded = true;
    };
    seed();

    const channel = supabase
      .channel(`rewards-campaigns-${user.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "campaigns", filter: `user_id=eq.${user.id}` },
        async (payload) => {
          const c = payload.new as { id: string; status: string };
          if (!seeded) return;
          if (c.status === "completed" && !celebratedRef.current.has(c.id)) {
            celebratedRef.current.add(c.id);
            // refresh the count, then celebrate
            const { count } = await supabase
              .from("applications")
              .select("id", { count: "exact", head: true })
              .eq("user_id", user.id)
              .in("status", ["submitted", "completed"]);
            setJobsSubmitted(count || 0);
            setShowMissionModal(true);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const referralCode = profile?.referral_code || "loading...";
  const referralLink = `https://thejobapp.online/ref/${referralCode}`;

  const rewardedReferrals = referrals.filter((r) => r.status === "rewarded");
  const pendingReferrals = referrals.filter((r) => r.status === "pending");
  const convertedCount = rewardedReferrals.length;
  const pendingCount = pendingReferrals.length;
  const referralCount = referrals.length;
  const referralCreditsEarned = rewardedReferrals.reduce((sum, r) => sum + (r.credits_earned || 0), 0);

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className={`text-[20px] font-bold tracking-[-0.01em] ${T.ink}`}>Rewards Center</h1>
            <p className={`text-[12px] ${T.muted}`}>
              Earn ${REFERRAL_REWARD} in credits for every friend who joins and makes their first purchase.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowMissionModal(true)}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border ${T.hairline}
                        px-2.5 py-1.5 text-[12px] font-medium ${T.ink} transition-colors
                        hover:bg-[#F4F4F2] dark:hover:bg-white/5`}
          >
            <PartyPopper size={13} />
            Preview celebration
          </button>
        </div>

        <EarningsHero
          totalCredits={referralCreditsEarned}
          convertedCount={convertedCount}
          pendingCount={pendingCount}
          referralCount={referralCount}
          rewardPerReferral={REFERRAL_REWARD}
          loading={loading}
        />

        <ReferralTool referralLink={referralLink} referralCode={referralCode} />

        <ReferralPipeline
          referrals={referrals}
          loading={loading}
          rewardPerReferral={REFERRAL_REWARD}
        />

        <CashOutToggle
          userId={user?.id}
          initialMode={profile?.cashout_preference || "reapply"}
          totalCredits={referralCreditsEarned}
        />

        <MissionCompleteModal
          open={showMissionModal}
          onOpenChange={setShowMissionModal}
          referralLink={referralLink}
          jobsSubmitted={jobsSubmitted}
        />
      </div>
    </DashboardLayout>
  );
};

export default RewardsCenter;