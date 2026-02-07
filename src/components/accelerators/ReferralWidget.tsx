import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Copy,
  Check,
  MessageCircle,
  Linkedin,
  Twitter,
  Gift,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ReferralWidget = () => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const referralLink = "https://jobapp.com/ref/YOUR_CODE";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast({ title: "Link copied!", description: "Share it with your friends." });
    setTimeout(() => setCopied(false), 2000);
  };

  const shareText = encodeURIComponent(
    "I just leveled up my job search with JobApp. Use my link for $15 off your first pack!"
  );

  return (
    <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-card to-primary/5">
      <CardContent className="space-y-4 p-6">
        <div className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-bold text-foreground">
            Help a Friend Escape the Grind
          </h3>
        </div>

        <p className="text-sm leading-relaxed text-muted-foreground">
          Know someone else stuck in application hell? Give them{" "}
          <span className="font-semibold text-primary">$15 off</span> their
          first JobApp pack, and we'll give{" "}
          <span className="font-semibold text-gold">YOU $15 in credits</span>{" "}
          (or cash back) for every friend who joins.
        </p>

        {/* Referral Link */}
        <div className="flex gap-2">
          <Input
            readOnly
            value={referralLink}
            className="bg-muted/50 font-mono text-xs"
          />
          <Button
            variant="default"
            size="sm"
            className="shrink-0 gap-1.5"
            onClick={handleCopy}
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                Copy Link
              </>
            )}
          </Button>
        </div>

        {/* Share Buttons */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Share via:</span>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() =>
              window.open(
                `https://wa.me/?text=${shareText}%20${encodeURIComponent(referralLink)}`,
                "_blank"
              )
            }
          >
            <MessageCircle className="h-3.5 w-3.5" />
            WhatsApp
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() =>
              window.open(
                `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink)}`,
                "_blank"
              )
            }
          >
            <Linkedin className="h-3.5 w-3.5" />
            LinkedIn
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() =>
              window.open(
                `https://twitter.com/intent/tweet?text=${shareText}&url=${encodeURIComponent(referralLink)}`,
                "_blank"
              )
            }
          >
            <Twitter className="h-3.5 w-3.5" />
            X
          </Button>
        </div>

        <Badge variant="outline" className="text-[10px] text-muted-foreground">
          Unlimited referrals • No cap on earnings
        </Badge>
      </CardContent>
    </Card>
  );
};

export default ReferralWidget;
