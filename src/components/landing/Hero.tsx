import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Shield, Users } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { HeroGeometric } from "@/components/ui/shape-landing-hero";

const Hero = () => {
  return (
    <HeroGeometric
      title1="Stop Spending Hours on Job Applications."
      title2="Start Getting Interviews."
    >
      {/* Trust badges */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="mb-8 flex items-center justify-center gap-3"
      >
        <Badge variant="human" className="gap-1.5 px-3 py-1">
          <Shield className="h-3 w-3" />
          Human-Verified
        </Badge>
        <Badge variant="outline" className="gap-1.5 px-3 py-1 text-muted-foreground">
          <Users className="h-3 w-3" />
          2,400+ Interviews Generated
        </Badge>
      </motion.div>

      {/* Subheadline */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground md:text-xl"
      >
        Upload your resume once. Our AI + human team crafts personalized applications 
        and deploys them to 200+ companies. You focus on preparing for interviews.
      </motion.p>

      {/* CTAs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="flex flex-col items-center justify-center gap-4 sm:flex-row"
      >
        <Link to="/onboarding">
          <Button variant="hero" size="xl" className="group">
            Start Your Campaign
            <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </Link>
        <a href="#process">
          <Button variant="heroOutline" size="xl">
            See How It Works
          </Button>
        </a>
      </motion.div>

      {/* Social proof */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="mt-8 text-sm text-muted-foreground"
      >
        7-day money-back guarantee · No subscription · Pay once
      </motion.p>
    </HeroGeometric>
  );
};

export default Hero;
