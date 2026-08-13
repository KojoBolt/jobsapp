import { ShieldCheck, AlertCircle } from "lucide-react";
import { CHART, T } from "@/admin/ui/system";
import { useRamp } from "@/admin/ui/charts";

interface VaultStrengthMeterProps {
  strength: number;
}

const VaultStrengthMeter = ({ strength }: VaultStrengthMeterProps) => {
  const { dark } = useRamp();

  const label =
    strength >= 80 ? "Deployment ready" : strength >= 50 ? "Getting there" : "Needs attention";

  // Status colours, selected per mode rather than lightened from one value.
  const tone =
    strength >= 80
      ? (dark ? CHART.goodDark : CHART.good)
      : strength >= 50
      ? CHART.warning
      : (dark ? CHART.criticalDark : CHART.critical);

  return (
    <div className={`rounded-2xl border ${T.hairline} bg-white p-4 dark:bg-[#1A1A19]`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg"
            style={{ backgroundColor: `${tone}1A`, color: tone }}
          >
            <ShieldCheck size={15} strokeWidth={2} />
          </span>
          <span className={`text-[13.5px] font-bold ${T.ink}`}>Vault strength</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[22px] font-bold leading-none tabular-nums" style={{ color: tone }}>
            {strength}%
          </span>
          {/* The word sits beside the colour, so the state never depends on hue alone. */}
          <span
            className="rounded-md px-1.5 py-0.5 text-[10px] font-bold"
            style={{ backgroundColor: `${tone}1F`, color: tone }}
          >
            {label}
          </span>
        </div>
      </div>

      <div
        className="mt-3 h-1.5 w-full overflow-hidden rounded-full"
        style={{ backgroundColor: dark ? "#2C2C2A" : "#EFEFEC" }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.min(100, Math.max(0, strength))}%`, backgroundColor: tone }}
        />
      </div>

      {strength < 80 && (
        <p className={`mt-2.5 flex items-start gap-1.5 text-[11.5px] ${T.muted}`}>
          <AlertCircle size={12} className="mt-px shrink-0" />
          Add your LinkedIn, resume and targeting to reach deployment ready.
        </p>
      )}
    </div>
  );
};

export default VaultStrengthMeter;
