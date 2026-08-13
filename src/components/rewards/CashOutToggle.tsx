import { useState } from "react";
import { Wallet, RotateCcw, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CHART, T, Panel, PanelHeader } from "@/admin/ui/system";
import { useRamp } from "@/admin/ui/charts";

interface CashOutToggleProps {
  userId?: string;
  initialMode?: "reapply" | "cashout";
  totalCredits?: number;
}

// NOTE: Cash payouts are NOT built yet (no payout infrastructure). For v1 the
// reward is credits-only. The cash option is shown as "coming soon" and is
// disabled so we never promise a payout we can't deliver.
const CashOutToggle = ({ userId, initialMode = "reapply" }: CashOutToggleProps) => {
  const { dark } = useRamp();
  const [mode, setMode] = useState<"reapply" | "cashout">(
    initialMode === "cashout" ? "reapply" : initialMode
  );
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const accent = dark ? CHART.accentDark : CHART.accent;

  const handleSelectReapply = async () => {
    setMode("reapply");
    if (!userId) return;
    setSaving(true);
    await supabase.from("profiles").update({ cashout_preference: "reapply" }).eq("id", userId);
    setSaving(false);
    toast({
      title: "Credits will apply to your next pack",
      description: "Your earned credits automatically discount your next purchase.",
    });
  };

  const active = mode === "reapply";

  return (
    <Panel>
      <PanelHeader icon={Wallet} title="How your rewards work" />

      <div className="grid gap-3 px-5 pb-5 sm:grid-cols-2">
        {/* Reapply — the active, real option */}
        <button
          type="button"
          onClick={handleSelectReapply}
          disabled={saving}
          className={`relative rounded-xl border p-4 text-left transition-colors
                      disabled:opacity-60 ${
                        active
                          ? "border-transparent"
                          : `${T.hairline} hover:bg-[#FAFAF8] dark:hover:bg-white/5`
                      }`}
          style={
            active
              ? { backgroundColor: `${accent}0F`, boxShadow: `inset 0 0 0 1.5px ${accent}` }
              : undefined
          }
        >
          <div className="flex items-start justify-between gap-2">
            <span
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg"
              style={{ backgroundColor: `${accent}1A`, color: accent }}
            >
              <RotateCcw size={16} />
            </span>
            {active && (
              <span
                className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold"
                style={{ backgroundColor: `${accent}1F`, color: accent }}
              >
                <Check size={10} strokeWidth={3} />
                Active
              </span>
            )}
          </div>

          <p className={`mt-3 text-[13px] font-bold ${T.ink}`}>Apply to your next purchase</p>
          <p className={`mt-1 text-[11.5px] leading-relaxed ${T.muted}`}>
            Earned credits automatically discount your next pack.
          </p>
        </button>

        {/* Cash — coming soon, disabled */}
        <div
          aria-disabled
          className={`relative rounded-xl border ${T.hairline} p-4 text-left opacity-60`}
        >
          <div className="flex items-start justify-between gap-2">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#F4F4F2] text-[#6B6A66] dark:bg-white/5 dark:text-[#C3C2B7]">
              <Wallet size={16} />
            </span>
            <span
              className={`rounded-md bg-[#F4F4F2] px-1.5 py-0.5 text-[10.5px] font-semibold
                          ${T.muted} dark:bg-white/5`}
            >
              Coming soon
            </span>
          </div>

          <p className={`mt-3 text-[13px] font-bold ${T.ink}`}>Request cash payout</p>
          <p className={`mt-1 text-[11.5px] leading-relaxed ${T.muted}`}>
            Withdraw earnings directly. Not available yet.
          </p>
        </div>
      </div>
    </Panel>
  );
};

export default CashOutToggle;
