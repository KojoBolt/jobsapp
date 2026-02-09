import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Crown, Zap, Check, Lock, Sparkles, BarChart3, Users, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const plans = [
  {
    id: "plan_1",
    name: "The Tracker",
    price: "$29.99",
    period: "/mo",
    icon: BarChart3,
    features: [
      "Interactive Job Dashboard",
      "10 Manual Job Submissions / month",
      "Color-coded status tracking",
      "Notes & job URL storage",
    ],
    cta: "Start Tracking",
  },
  {
    id: "plan_2",
    name: "The Pro Hunter",
    price: "$49.99",
    period: "/mo",
    icon: Crown,
    popular: true,
    features: [
      "Everything in The Tracker",
      "50 Submissions / month",
      "AI + Human Team Discovery mode",
      "Priority application processing",
      "Advanced analytics & insights",
    ],
    cta: "Go Pro",
  },
];

const UpgradePaywall = () => {
  const [loading, setLoading] = useState<string | null>(null);
  const [guestEmail, setGuestEmail] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSelectPlan = async (planId: string) => {
    const email = user?.email || guestEmail;
    if (!email) {
      toast({ title: "Email required", description: "Please enter your email to proceed.", variant: "destructive" });
      return;
    }

    setLoading(planId);
    try {
      const { data, error } = await supabase.functions.invoke("subscription-checkout", {
        body: { plan: planId, callbackUrl: `${window.location.origin}/job-tracker?subscribed=true`, email },
      });

      if (error) throw error;
      if (data?.authorization_url) {
        window.location.href = data.authorization_url;
      }
    } catch (err: any) {
      toast({ title: "Checkout failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent">
          <Sparkles className="h-8 w-8 text-primary-foreground" />
        </div>
        <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
          Upgrade to Job Trackr
        </h1>
        <p className="mx-auto mt-2 max-w-lg text-muted-foreground">
          Take control of your job search with an interactive tracking dashboard, smart limits, and AI-powered discovery.
        </p>
      </motion.div>

      {/* Guest email input */}
      {!user && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mx-auto max-w-sm"
        >
          <Input
            type="email"
            placeholder="Enter your email to get started"
            value={guestEmail}
            onChange={(e) => setGuestEmail(e.target.value)}
            className="text-center"
          />
        </motion.div>
      )}

      {/* Pricing Cards */}
      <div className="mx-auto grid max-w-3xl gap-6 md:grid-cols-2">
        {plans.map((plan, i) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.15 }}
          >
            <Card
              className={`relative overflow-hidden border-border/50 transition-all hover:border-primary/40 ${
                plan.popular ? "ring-2 ring-primary/50" : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute right-4 top-4">
                  <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
                </div>
              )}
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <plan.icon className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription>
                  <span className="text-3xl font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
                    {plan.price}
                  </span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  variant={plan.popular ? "hero" : "outline"}
                  className="w-full"
                  size="lg"
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={loading !== null}
                >
                  {loading === plan.id ? "Processing..." : plan.cta}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Blurred Demo Preview */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="relative mx-auto max-w-4xl overflow-hidden rounded-xl border border-border/30"
      >
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-md">
          <div className="text-center">
            <Lock className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-lg font-semibold text-foreground">Premium Dashboard Preview</p>
            <p className="text-sm text-muted-foreground">Subscribe to unlock the full interactive tracker</p>
          </div>
        </div>
        {/* Fake demo data */}
        <div className="p-6">
          <div className="mb-4 grid grid-cols-4 gap-3">
            {["Total Apps", "Active", "Interviews", "Offers"].map((l) => (
              <div key={l} className="rounded-lg bg-card p-4">
                <p className="text-xs text-muted-foreground">{l}</p>
                <p className="text-2xl font-bold text-foreground">{Math.floor(Math.random() * 30 + 5)}</p>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between rounded-lg bg-card p-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-muted" />
                  <div>
                    <div className="h-3 w-32 rounded bg-muted" />
                    <div className="mt-1 h-2 w-20 rounded bg-muted" />
                  </div>
                </div>
                <div className="h-5 w-16 rounded-full bg-muted" />
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default UpgradePaywall;
