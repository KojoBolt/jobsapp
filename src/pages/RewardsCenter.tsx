import { useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import EarningsHero from "@/components/rewards/EarningsHero";
import ReferralTool from "@/components/rewards/ReferralTool";
import ReferralPipeline from "@/components/rewards/ReferralPipeline";
import MissionCompleteModal from "@/components/rewards/MissionCompleteModal";
import CashOutToggle from "@/components/rewards/CashOutToggle";
import { Button } from "@/components/ui/button";
import { PartyPopper } from "lucide-react";

const RewardsCenter = () => {
  const [showMissionModal, setShowMissionModal] = useState(false);

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
          totalCredits={45}
          friendsHired={2}
          referralCount={3}
          referralGoal={5}
        />

        <ReferralTool />

        <ReferralPipeline />

        <CashOutToggle />

        <MissionCompleteModal
          open={showMissionModal}
          onOpenChange={setShowMissionModal}
        />
      </div>
    </DashboardLayout>
  );
};

export default RewardsCenter;
