import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check, MessageCircle, Linkedin, Twitter, Mail, Link2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

interface ReferralToolProps {
  referralLink: string;
  referralCode: string;
}

const ReferralTool = ({ referralLink, referralCode }: ReferralToolProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast({ title: "Copied!", description: "Your referral link is ready to share." });
    setTimeout(() => setCopied(false), 2000);
  };

  const shareText = encodeURIComponent(
    "I just leveled up my job search with JobApp. Use my link for $15 off your first pack!"
  );

  const shareChannels = [
    {
      label: "WhatsApp",
      icon: MessageCircle,
      url: `https://wa.me/?text=${shareText}%20${encodeURIComponent(referralLink)}`,
    },
    {
      label: "LinkedIn",
      icon: Linkedin,
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink)}`,
    },
    {
      label: "X",
      icon: Twitter,
      url: `https://twitter.com/intent/tweet?text=${shareText}&url=${encodeURIComponent(referralLink)}`,
    },
    {
      label: "Email",
      icon: Mail,
      url: `mailto:?subject=${encodeURIComponent("Check out JobApp!")}&body=${shareText}%20${encodeURIComponent(referralLink)}`,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
    >
      <Card className="border-gold/20 bg-gradient-to-br from-gold/5 via-card to-gold/5">
        <CardContent className="space-y-5 p-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold/15">
              <Link2 className="h-5 w-5 text-gold" />
            </div>
            <h3 className="text-lg font-bold text-foreground">
              Your Unique Referral Link
            </h3>
          </div>

          <div className="flex gap-2">
            <Input
              readOnly
              value={referralLink}
              className="border-border/50 bg-muted/50 font-mono text-sm"
            />
            <Button
              variant="gold"
              size="lg"
              className="shrink-0 gap-2 px-6"
              onClick={handleCopy}
            >
              {copied ? (
                <><Check className="h-4 w-4" />Copied!</>
              ) : (
                <><Copy className="h-4 w-4" />Copy Link</>
              )}
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              One-Click Share:
            </span>
            {shareChannels.map((channel) => (
              <Button
                key={channel.label}
                variant="outline"
                size="sm"
                className="gap-1.5 border-border/50 text-xs hover:border-gold/40 hover:text-gold"
                onClick={() => window.open(channel.url, "_blank")}
              >
                <channel.icon className="h-3.5 w-3.5" />
                {channel.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ReferralTool;