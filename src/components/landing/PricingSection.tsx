import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Shield, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const features = [
  "200 personalized applications",
  "AI-crafted cover letters",
  "Human reviewer on every application",
  "Real-time tracking dashboard",
  "HR contact referral list",
  "Insider email templates",
  "Human-Touch Quality Guarantee",
];

const PricingSection = () => {
  return (
    <section id="pricing" className="relative py-24 md:py-32">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <p className="mb-3 text-sm font-medium uppercase tracking-widest text-primary">
            Pricing
          </p>
          <h2 className="text-3xl font-bold text-foreground md:text-4xl">
            One price. <span className="gradient-text">No surprises.</span>
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mx-auto max-w-lg"
        >
          <div className="glass-card relative overflow-hidden rounded-2xl p-8 md:p-10">
            {/* Glow effect */}
            <div className="absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-primary/20 blur-[80px]" />

            <div className="relative">
              {/* Badges */}
              <div className="mb-6 flex flex-wrap gap-2">
                <Badge variant="human" className="gap-1.5">
                  <Shield className="h-3 w-3" />
                  Human-Reviewed
                </Badge>
                <Badge variant="outline" className="text-muted-foreground">
                  Quality Guarantee
                </Badge>
              </div>

              {/* Price */}
              <div className="mb-2">
                <span className="text-6xl font-bold text-foreground">$99</span>
                <span className="ml-2 text-lg text-muted-foreground">one-time</span>
              </div>
              <p className="mb-8 text-muted-foreground">
                200 applications deployed across your target industries
              </p>

              {/* Features */}
              <ul className="mb-8 space-y-3">
                {features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm text-foreground/90">
                    <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/15">
                      <Check className="h-3 w-3 text-primary" />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link to="/onboarding">
                <Button variant="hero" size="xl" className="group w-full">
                  Start Your Campaign
                  <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>

              <p className="mt-4 text-center text-xs text-muted-foreground">
                No subscription. No hidden fees. See our <a href="/refund-policy" className="underline hover:text-foreground">Refund & Satisfaction Policy</a>.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default PricingSection;
