import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Zap, CreditCard, ShieldCheck, Lock, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const PowerUpWidget = () => {
  const [remaining] = useState(53);
  const [showCheckout, setShowCheckout] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();

  const handleCheckout = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setSuccess(true);
      toast({ title: "Purchase Complete! 🎉", description: "200 applications added to your balance." });
      setTimeout(() => {
        setShowCheckout(false);
        setSuccess(false);
      }, 2500);
    }, 2000);
  };

  return (
    <>
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
              <Badge variant="human" className="text-[10px]">Active</Badge>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {remaining}
              <span className="ml-1 text-sm font-normal text-muted-foreground">remaining</span>
            </p>
          </div>
        </div>

        <Button
          variant="hero"
          size="lg"
          onClick={() => setShowCheckout(true)}
          className="relative gap-2"
        >
          <Badge
            variant="interview"
            className="absolute -right-2 -top-2 px-1.5 py-0.5 text-[10px] font-bold"
          >
            Most Popular
          </Badge>
          Buy 200 More for $99
        </Button>
      </motion.div>

      {/* Checkout Modal */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="border-border/50 bg-card sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <CreditCard className="h-5 w-5 text-primary" />
              Secure Checkout
            </DialogTitle>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-4 py-10 text-center"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-status-interview/15">
                  <CheckCircle2 className="h-8 w-8 text-status-interview" />
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground">Payment Successful!</p>
                  <p className="text-sm text-muted-foreground">200 applications have been added to your account.</p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-5"
              >
                {/* Order Summary */}
                <div className="rounded-lg border border-border/30 bg-muted/20 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">200 Applications</p>
                      <p className="text-xs text-muted-foreground">Human-reviewed & AI-optimized</p>
                    </div>
                    <p className="text-xl font-bold text-foreground">$99</p>
                  </div>
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-status-interview">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    7-day satisfaction guarantee included
                  </div>
                </div>

                {/* Mock Card Form */}
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Card Number</Label>
                    <Input placeholder="4242 4242 4242 4242" className="bg-muted/50" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Expiry</Label>
                      <Input placeholder="MM / YY" className="bg-muted/50" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">CVC</Label>
                      <Input placeholder="123" className="bg-muted/50" />
                    </div>
                  </div>
                </div>

                <Button
                  variant="hero"
                  className="w-full gap-2"
                  onClick={handleCheckout}
                  disabled={processing}
                >
                  {processing ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="h-4 w-4 rounded-full border-2 border-primary-foreground border-t-transparent"
                      />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4" />
                      Pay $99 Securely
                    </>
                  )}
                </Button>

                <p className="text-center text-[10px] text-muted-foreground/60">
                  Secured by Stripe · 256-bit encryption
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PowerUpWidget;
