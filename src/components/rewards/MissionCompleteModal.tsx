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
import { Copy, Check, MessageCircle, Linkedin, Twitter, Mail, Rocket, PartyPopper } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Confetti from "@/components/accelerators/Confetti";

const REFERRAL_REWARD = 15; // keep in sync with the backend payout

interface MissionCompleteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  referralLink: string;
  jobsSubmitted: number;
}

const MissionCompleteModal = ({
  open,
  onOpenChange,
  referralLink,
  jobsSubmitted,
}: MissionCompleteModalProps) => {
  const hasDeployed = jobsSubmitted > 0;
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    if (!referralLink) return;
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast({ title: "Copied!", description: `Share it — you both get $${REFERRAL_REWARD}!` });
    setTimeout(() => setCopied(false), 2000);
  };

  const shareText = encodeURIComponent(
    `I just deployed ${jobsSubmitted} job applications with JobApp! Use my link and we both get $${REFERRAL_REWARD}.`
  );

  const shareChannels = [
    { label: "WhatsApp", icon: MessageCircle, url: `https://wa.me/?text=${shareText}%20${encodeURIComponent(referralLink)}` },
    { label: "LinkedIn", icon: Linkedin, url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink)}` },
    { label: "X", icon: Twitter, url: `https://twitter.com/intent/tweet?text=${shareText}&url=${encodeURIComponent(referralLink)}` },
    { label: "Email", icon: Mail, url: `mailto:?subject=${encodeURIComponent("I just deployed my applications!")}&body=${shareText}%20${encodeURIComponent(referralLink)}` },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-gold/30 bg-gradient-to-b from-card via-card to-gold/5 sm:max-w-lg">
        {open && <Confetti />}
        <DialogHeader className="space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gold/15 ring-2 ring-gold/30">
              {hasDeployed ? (
                <PartyPopper className="h-8 w-8 text-gold" />
              ) : (
                <Rocket className="h-8 w-8 text-gold" />
              )}
          </div>
         <DialogTitle className="text-2xl font-extrabold text-foreground">
              {hasDeployed
                ? `Mission Underway: ${jobsSubmitted} Application${jobsSubmitted === 1 ? "" : "s"} Deployed`
                : "Your Job Hunt Starts Here"}
            </DialogTitle>

            <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
              {hasDeployed ? (
                <>
                  While you prepare for interviews, why not help a friend escape the grind?
                  Share your link and{" "}
                  <span className="font-semibold text-gold">you both get ${REFERRAL_REWARD}</span>.
                </>
              ) : (
                <>
                  You haven't deployed any applications yet — but you can still earn. Invite a
                  friend and{" "}
                  <span className="font-semibold text-gold">you both get ${REFERRAL_REWARD}</span>{" "}
                  when they make their first purchase.
                </>
              )}
            </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="flex gap-2">
            <Input
              readOnly
              value={referralLink || "Loading your link…"}
              className="border-border/50 bg-muted/50 font-mono text-sm"
            />
            <Button variant="gold" size="default" className="shrink-0 gap-2" onClick={handleCopy} disabled={!referralLink}>
              {copied ? (<><Check className="h-4 w-4" />Copied!</>) : (<><Copy className="h-4 w-4" />Copy</>)}
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {shareChannels.map((channel) => (
              <Button
                key={channel.label}
                variant="outline"
                size="sm"
                className="gap-1.5 border-border/50 text-xs hover:border-gold/40 hover:text-gold"
                disabled={!referralLink}
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