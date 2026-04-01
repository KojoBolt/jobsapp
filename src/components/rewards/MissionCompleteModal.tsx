import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Copy,
  Check,
  MessageCircle,
  Linkedin,
  Twitter,
  Mail,
  Rocket,
  PartyPopper,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Confetti from "@/components/accelerators/Confetti";

interface MissionCompleteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
   referralLink?: string;
}

const MissionCompleteModal = ({
  open,
  onOpenChange,
}: MissionCompleteModalProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const referralLink = "https://jobapp.com/ref/loading";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast({ title: "Copied!", description: "Share it and earn $20!" });
    setTimeout(() => setCopied(false), 2000);
  };

  const shareText = encodeURIComponent(
    "I just deployed 200 job applications with JobApp! Use my link and we both get $20."
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
      url: `mailto:?subject=${encodeURIComponent("I just deployed 200 applications!")}&body=${shareText}%20${encodeURIComponent(referralLink)}`,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-gold/30 bg-gradient-to-b from-card via-card to-gold/5 sm:max-w-lg">
        {open && <Confetti />}
        <DialogHeader className="space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gold/15 ring-2 ring-gold/30">
            <PartyPopper className="h-8 w-8 text-gold" />
          </div>
          <DialogTitle className="text-2xl font-extrabold text-foreground">
            Mission Complete: 200 Applications Deployed!
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
            While you prepare for interviews, why not help a friend escape the
            grind? Share your link and{" "}
            <span className="font-semibold text-gold">you both get $20</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Referral Link */}
          <div className="flex gap-2">
            <Input
              readOnly
              value={referralLink}
              className="border-border/50 bg-muted/50 font-mono text-sm"
            />
            <Button
              variant="gold"
              size="default"
              className="shrink-0 gap-2"
              onClick={handleCopy}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy
                </>
              )}
            </Button>
          </div>

          {/* Share buttons */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
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

          <Button
            variant="ghost"
            size="sm"
            className="w-full gap-2 text-muted-foreground"
            onClick={() => onOpenChange(false)}
          >
            <Rocket className="h-4 w-4" />
            Maybe later, I'm preparing for interviews
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MissionCompleteModal;
