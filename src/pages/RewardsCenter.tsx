import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import EarningsHero from "@/components/rewards/EarningsHero";
import ReferralTool from "@/components/rewards/ReferralTool";
import ReferralPipeline from "@/components/rewards/ReferralPipeline";
import MissionCompleteModal from "@/components/rewards/MissionCompleteModal";
import CashOutToggle from "@/components/rewards/CashOutToggle";
import { Button } from "@/components/ui/button";
import { PartyPopper } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const REFERRAL_GOAL = 5;

const RewardsCenter = () => {
  const { user, profile } = useAuth();
  const [showMissionModal, setShowMissionModal] = useState(false);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchReferrals = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("referrals")
        .select("*")
        .eq("referrer_id", user.id)
        .order("created_at", { ascending: false });
      setReferrals(data || []);
      setLoading(false);
    };
    fetchReferrals();
  }, [user]);

  const referralCode = profile?.referral_code || "loading...";
  const referralLink = `https://jobapp.com/ref/${referralCode}`;
  const totalCredits = profile?.total_credits_earned || 0;
  const friendsHired = profile?.friends_hired || 0;
  const referralCount = referrals.length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Rewards Center
            </h1>
            <p className="text-sm text-muted-foreground">
              Earn credits, share with friends, and unlock free packs.
            </p>
          </div>
          <Button
            variant="gold"
            size="sm"
            className="gap-2"
            onClick={() => setShowMissionModal(true)}
          >
            <PartyPopper className="h-4 w-4" />
            Preview Celebration
          </Button>
        </div>

        <EarningsHero
          totalCredits={totalCredits}
          friendsHired={friendsHired}
          referralCount={referralCount}
          referralGoal={REFERRAL_GOAL}
          loading={loading}
        />

        <ReferralTool
          referralLink={referralLink}
          referralCode={referralCode}
        />

        <ReferralPipeline
          referrals={referrals}
          loading={loading}
        />

        <CashOutToggle
          userId={user?.id}
          initialMode={profile?.cashout_preference || "reapply"}
          totalCredits={totalCredits}
        />

        <MissionCompleteModal
          open={showMissionModal}
          onOpenChange={setShowMissionModal}
          referralLink={referralLink}
        />
      </div>
    </DashboardLayout>
  );
};

export default RewardsCenter;