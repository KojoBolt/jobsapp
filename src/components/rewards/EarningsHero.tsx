import { Coins, Users, Clock } from "lucide-react";
import { CHART, T } from "@/admin/ui/system";
import { useRamp } from "@/admin/ui/charts";

interface EarningsHeroProps {
  totalCredits: number;       // referral credits earned ($)
  convertedCount: number;     // friends who made their first purchase
  pendingCount: number;       // friends signed up, not yet purchased
  referralCount: number;      // total referred
  rewardPerReferral: number;  // $ per converted friend
  loading?: boolean;
}

/** One figure per tile: micro-label, tinted icon, value, then its caption. */
const RewardTile = ({
  icon: Icon,
  label,
  value,
  caption,
  tint,
  loading,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  caption: string;
  tint: string;
  loading: boolean;
}) => (
  <div className={`rounded-2xl border ${T.hairline} bg-white p-4 dark:bg-[#1A1A19]`}>
    <div className="flex items-start justify-between gap-2">
      <span
        className={`truncate text-[10.5px] font-semibold uppercase tracking-[0.08em] ${T.muted}`}
      >
        {label}
      </span>
      <span
        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg"
        style={{ backgroundColor: `${tint}1A`, color: tint }}
      >
        <Icon size={15} strokeWidth={2} />
      </span>
    </div>

    {loading ? (
      <div className="mt-3 space-y-2">
        <div className="h-6 w-20 animate-pulse rounded bg-[#EFEFEC] dark:bg-white/10" />
        <div className="h-3 w-24 animate-pulse rounded bg-[#EFEFEC] dark:bg-white/10" />
      </div>
    ) : (
      <>
        <p className={`mt-2.5 text-[26px] font-bold leading-none tracking-[-0.02em] ${T.ink}`}>
          {value}
        </p>
        <p className={`mt-2 truncate text-[11px] ${T.muted}`}>{caption}</p>
      </>
    )}
  </div>
);

const EarningsHero = ({
  totalCredits,
  convertedCount,
  pendingCount,
  referralCount,
  rewardPerReferral,
  loading = false,
}: EarningsHeroProps) => {
  const { dark } = useRamp();
  const accent = dark ? CHART.accentDark : CHART.accent;
  const good = dark ? CHART.goodDark : CHART.good;

  // Real conversion rate — measured from the referral rows, not asserted.
  const converted = referralCount > 0 ? Math.round((convertedCount / referralCount) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <RewardTile
          icon={Coins}
          label="Credits earned"
          value={`$${totalCredits}`}
          caption={`$${rewardPerReferral} per converted friend`}
          tint={good}
          loading={loading}
        />
        <RewardTile
          icon={Users}
          label="Friends purchased"
          value={String(convertedCount)}
          caption={`of ${referralCount} referred`}
          tint={accent}
          loading={loading}
        />
        <RewardTile
          icon={Clock}
          label="Awaiting purchase"
          value={String(pendingCount)}
          caption={
            pendingCount > 0
              ? `worth $${pendingCount * rewardPerReferral} once they buy`
              : "nothing pending right now"
          }
          tint={CHART.warning}
          loading={loading}
        />
      </div>

      {/* Conversion bar. Only shown once someone has actually been referred —
          a 0-of-0 bar reads as failure rather than "not started". */}
      {!loading && referralCount > 0 && (
        <div className={`rounded-2xl border ${T.hairline} bg-white p-4 dark:bg-[#1A1A19]`}>
          <div className="flex items-center justify-between gap-3">
            <span
              className={`text-[10.5px] font-semibold uppercase tracking-[0.08em] ${T.muted}`}
            >
              Referral conversion
            </span>
            <span className={`text-[12px] font-bold tabular-nums ${T.ink}`}>
              {convertedCount}/{referralCount}
              <span className={`ml-1.5 font-medium ${T.muted}`}>{converted}%</span>
            </span>
          </div>

          {/* Magnitude as length, not hue — the numbers above carry the reading. */}
          <span className="mt-2.5 block h-1.5 overflow-hidden rounded-full bg-[#EFEFEC] dark:bg-white/10">
            <span
              className="block h-full rounded-full transition-[width] duration-500"
              style={{ width: `${converted}%`, backgroundColor: accent }}
            />
          </span>
        </div>
      )}
    </div>
  );
};

export default EarningsHero;
