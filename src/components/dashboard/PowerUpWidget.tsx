import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Zap, Plus, Info } from "lucide-react";
import { CHART, T } from "@/admin/ui/system";
import { useRamp } from "@/admin/ui/charts";

interface PowerUpWidgetProps {
  remaining?: number;
  status?: 'Active' | 'Low-Balance' | 'Depleted';
  plan?: 'free' | 'starter' | 'pro';
  hasPurchase?: boolean;
}

const PowerUpWidget = ({
  remaining = 0,
  status = 'Active',
  plan = 'free',
  hasPurchase = false,
}: PowerUpWidgetProps) => {
  const navigate = useNavigate();
  const { dark } = useRamp();

  const statusLabels = {
    'Active': 'Active',
    'Low-Balance': 'Low-Balance',
    'Depleted': 'No-Credit',
  };

  /** One line explaining what the current balance means for the user. */
  const statusHints = {
    'Active': 'Your applications are ready to deploy.',
    'Low-Balance': 'You are running low on application credits.',
    'Depleted': 'Your application credits have been used.',
  };

  const packageInfo = {
    free: { quantity: 200, price: 99.00 },
    starter: { quantity: 100, price: 29.00 },
    pro: { quantity: 1000, price: 400.00 },
  };

  const { quantity, price } = packageInfo[plan];
  const isFirstPurchase = plan === "free" && !hasPurchase;
  const showMostPopular = plan === "starter";

  const accent = dark ? CHART.accentDark : CHART.accent;
  const statusTone =
    status === 'Depleted'
      ? (dark ? CHART.criticalDark : CHART.critical)
      : status === 'Low-Balance'
      ? CHART.warning
      : (dark ? CHART.goodDark : CHART.good);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col items-start justify-between gap-4 rounded-2xl border ${T.hairline}
                  bg-white p-4 lg:flex-row lg:items-center dark:bg-[#1A1A19]`}
    >
      {/* ── Balance ──────────────────────────────────────────────────────── */}
      <div className="flex items-start gap-3.5">
        <span
          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl"
          style={{ backgroundColor: `${accent}1A`, color: accent }}
        >
          <Zap size={19} strokeWidth={2} />
        </span>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-[13.5px] font-bold ${T.ink}`}>Application Balance</span>
            <span
              className="rounded-md px-1.5 py-0.5 text-[10px] font-bold"
              style={{ backgroundColor: `${statusTone}1F`, color: statusTone }}
            >
              {statusLabels[status]}
            </span>
          </div>

          <p className={`mt-1 text-[26px] font-bold leading-none tracking-[-0.02em] ${T.ink}`}>
            {remaining.toLocaleString()}
          </p>
          <p className={`mt-1 text-[11.5px] ${T.muted}`}>applications remaining</p>

          <p className={`mt-2 flex items-center gap-1.5 text-[11px] ${T.muted}`}>
            <Info size={12} className="shrink-0" />
            {statusHints[status]}
          </p>
        </div>
      </div>

      {/* ── Top-up card ──────────────────────────────────────────────────── */}
      <div className="relative w-full shrink-0 lg:w-[300px]">
        {showMostPopular && (
          <span
            className="absolute -top-2 right-4 z-10 rounded-md px-1.5 py-0.5 text-[10px] font-bold"
            style={{
              backgroundColor: dark ? CHART.goodDark : CHART.good,
              color: dark ? "#0D0D0D" : "#FFFFFF",
            }}
          >
            Most Popular
          </span>
        )}

        <button
          type="button"
          onClick={() =>
            navigate('/checkout', {
              state: {
                // ✅ Fixed: was 'top-up' (invalid), must match PurchaseType = 'activation' | 'topup'
                purchaseType: isFirstPurchase ? 'activation' : 'topup',
                // ✅ Fixed: was string 'undefined', now real undefined so Checkout ignores it
                selectedPlan: isFirstPurchase ? undefined : plan,
              },
            })
          }
          className="flex w-full items-center gap-3 rounded-xl border p-3.5 text-left transition-colors
                     hover:bg-[#F4F4F2] dark:hover:bg-white/5"
          style={{ borderColor: accent }}
        >
          <span className="min-w-0 flex-1">
            <span className={`block text-[13.5px] font-bold ${T.ink}`}>
              {isFirstPurchase ? "Activate Applications" : "Add Applications"}
            </span>
            <span className={`mt-0.5 block text-[11.5px] ${T.muted}`}>
              {quantity.toLocaleString()} credits &nbsp;•&nbsp; ${price}
            </span>
          </span>

          <span
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg"
            style={{ backgroundColor: `${accent}1A`, color: accent }}
          >
            <Plus size={17} strokeWidth={2.5} />
          </span>
        </button>
      </div>
    </motion.div>
  );
};

export default PowerUpWidget;
