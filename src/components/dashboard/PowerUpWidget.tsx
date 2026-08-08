import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap } from "lucide-react";
import UpgradeIcon from '@mui/icons-material/Upgrade';

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

  const statusLabels = {
    'Active': 'Active',
    'Low-Balance': 'Low-Balance',
    'Depleted': 'No-Credit',
  };

  const planLabels = {
    free: "basic",
    starter: "starter",
    pro: "pro",
  };

  const packageInfo = {
    free: { quantity: 200, price: 99.00 },
    starter: { quantity: 100, price: 29.00 },
    pro: { quantity: 1000, price: 400.00 },
  };

  const { quantity, price } = packageInfo[plan];
  const isFirstPurchase = plan === "free" && !hasPurchase;
  const showMostPopular = plan === "starter";

  const buttonText = isFirstPurchase
    ? "Activate 200 Credits for $99"
    : `Buy ${quantity} More for $${price}`;

  const displayPlan = planLabels[plan];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card flex flex-col items-start justify-between gap-4 rounded-xl p-5 sm:flex-row sm:items-center"
    >
      <div className="flex items-center gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
          <Zap className="h-5 w-5 text-primary" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">Application Balance</span>
            <Badge variant="human" className="text-[10px]">{statusLabels[status]}</Badge>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {remaining}
            <span className="ml-1 text-sm font-normal text-muted-foreground">remaining</span>
          </p>
        </div>
      </div>

      <Button
        variant="gold"
        size="lg"
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
        className="relative gap-2"
      >
        {showMostPopular && (
          <Badge
            variant="interview"
            className="absolute -right-2 -top-2 px-1.5 py-0.5 text-[10px] font-bold"
          >
            Most Popular
          </Badge>
        )}
        {buttonText} <UpgradeIcon className="w-4 h-4" />
      </Button>
    </motion.div>
  );
};

export default PowerUpWidget;