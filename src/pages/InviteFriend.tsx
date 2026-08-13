import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ReferralWidget from "@/components/accelerators/ReferralWidget";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { T } from "@/admin/ui/system";

const InviteFriend = () => {
  return (
    <DashboardLayout>
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className={`text-[20px] font-bold tracking-[-0.01em] ${T.ink}`}>
              Invite a friend
            </h1>
            <p className={`text-[12px] ${T.muted}`}>
              Share the edge with your network and earn credits.
            </p>
          </div>

          {/* The widget can't show earnings — send people to where they're tracked. */}
          <Link
            to="/rewards"
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border ${T.hairline}
                        px-2.5 py-1.5 text-[12px] font-medium ${T.ink} transition-colors
                        hover:bg-[#F4F4F2] dark:hover:bg-white/5`}
          >
            View my rewards
            <ArrowRight size={13} />
          </Link>
        </div>

        <ReferralWidget />
      </div>
    </DashboardLayout>
  );
};

export default InviteFriend;
