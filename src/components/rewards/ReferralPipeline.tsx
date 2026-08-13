import { format } from "date-fns";
import { Users, Clock, CheckCircle2 } from "lucide-react";
import { CHART, T, Panel, PanelHeader, Th, Avatar, EmptyState } from "@/admin/ui/system";

interface Referral {
  id: string;
  referred_user_id: string | null;
  referred_email: string | null;
  status: string;          // 'pending' | 'rewarded'
  credits_earned: number;
  created_at: string;
}

interface ReferralPipelineProps {
  referrals: Referral[];
  loading?: boolean;
  rewardPerReferral?: number;
}

/** Status is a dot + its own words — colour never carries the meaning alone. */
const STATUS: Record<string, { label: string; tone: string; icon: React.ElementType }> = {
  pending:  { label: "Signed up",  tone: CHART.warning, icon: Clock },
  rewarded: { label: "Purchased",  tone: CHART.good,    icon: CheckCircle2 },
};

// New rows have no email (attribution stores referred_user_id). Build a stable
// label from whatever we have, without ever crashing on null.
function nameFor(referral: Referral): string {
  if (referral.referred_email) return referral.referred_email.split("@")[0];
  return "Friend";
}

const StatusCell = ({ status }: { status: string }) => {
  const s = STATUS[status] || STATUS.pending;
  const Icon = s.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11.5px] font-medium ${T.ink2}`}>
      <Icon size={12} style={{ color: s.tone }} className="shrink-0" />
      {s.label}
    </span>
  );
};

const RewardCell = ({ referral }: { referral: Referral }) =>
  referral.status === "rewarded" ? (
    <span className={`text-[12.5px] font-bold tabular-nums ${T.ink}`}>
      +${referral.credits_earned}
    </span>
  ) : (
    <span className={`text-[12.5px] ${T.muted}`}>Pending</span>
  );

const ReferralPipeline = ({
  referrals,
  loading = false,
  rewardPerReferral = 15,
}: ReferralPipelineProps) => {
  return (
    <Panel className="overflow-hidden">
      <PanelHeader
        icon={Users}
        title="Referral pipeline"
        right={
          <span className={`text-[11px] ${T.muted}`}>
            ${rewardPerReferral} per first purchase
          </span>
        }
      />

      {loading ? (
        <div className="space-y-2 px-5 pb-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-11 animate-pulse rounded-lg bg-[#F7F7F5] dark:bg-white/[0.03]"
            />
          ))}
        </div>
      ) : referrals.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No referrals yet"
          hint="Share your link above — you'll see every friend land here as they sign up."
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block">
            <table className="w-full">
              <thead className={`border-y ${T.hairline}`}>
                <tr>
                  <Th>Friend</Th>
                  <Th>Status</Th>
                  <Th>Joined</Th>
                  <Th className="text-right">Your reward</Th>
                </tr>
              </thead>
              <tbody className={`divide-y ${T.divide}`}>
                {referrals.map((referral) => (
                  <tr key={referral.id} className={T.hover}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={nameFor(referral)} size={28} />
                        <span className={`truncate text-[12.5px] font-semibold ${T.ink}`}>
                          {nameFor(referral)}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <StatusCell status={referral.status} />
                    </td>
                    <td className={`px-5 py-3 text-[12px] ${T.muted}`}>
                      {format(new Date(referral.created_at), "d MMM yyyy")}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <RewardCell referral={referral} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile rows */}
          <div className={`divide-y ${T.divide} border-t ${T.hairline} md:hidden`}>
            {referrals.map((referral) => (
              <div key={referral.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <Avatar name={nameFor(referral)} size={28} />
                  <div className="min-w-0">
                    <p className={`truncate text-[12.5px] font-semibold ${T.ink}`}>
                      {nameFor(referral)}
                    </p>
                    <StatusCell status={referral.status} />
                  </div>
                </div>
                <RewardCell referral={referral} />
              </div>
            ))}
          </div>
        </>
      )}
    </Panel>
  );
};

export default ReferralPipeline;
