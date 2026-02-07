import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ReferralWidget from "@/components/accelerators/ReferralWidget";

const InviteFriend = () => {
  return (
    <DashboardLayout>
      <div className="mx-auto max-w-2xl space-y-6 py-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Invite a Friend</h1>
          <p className="text-sm text-muted-foreground">
            Share the edge with your network and earn rewards.
          </p>
        </div>
        <ReferralWidget />
      </div>
    </DashboardLayout>
  );
};

export default InviteFriend;
