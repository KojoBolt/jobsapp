import { useState } from "react";
import { motion } from "framer-motion";
import {
  X, Copy, Check, MessageCircle, Linkedin, Twitter, Mail, Rocket, PartyPopper,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Confetti from "@/components/accelerators/Confetti";
import { CHART, T } from "@/admin/ui/system";
import { useRamp } from "@/admin/ui/charts";

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
  const { dark } = useRamp();
  const hasDeployed = jobsSubmitted > 0;
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const accent = dark ? CHART.accentDark : CHART.accent;

  const handleCopy = async () => {
    if (!referralLink) return;
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast({ title: "Copied", description: `Share it — you both get $${REFERRAL_REWARD}.` });
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

  if (!open) return null;

  const Icon = hasDeployed ? PartyPopper : Rocket;

  return (
    <div className="fixed inset-0 z-[1900] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />

      {/* Outside the card: the card animates its transform, which would make
          Confetti's `fixed` positioning resolve against it and clip to it. */}
      <Confetti />

      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        role="dialog"
        aria-modal="true"
        className={`relative w-full max-w-[460px] overflow-hidden rounded-2xl border ${T.hairline}
                    bg-white shadow-xl dark:bg-[#1A1A19]`}
      >
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          aria-label="Close"
          className={`absolute right-3 top-3 z-10 grid h-7 w-7 place-items-center rounded-lg
                      ${T.ink2} transition-colors hover:bg-[#F4F4F2] dark:hover:bg-white/5`}
        >
          <X size={15} />
        </button>

        <div className="px-6 pb-6 pt-8 text-center">
          <span
            className="mx-auto grid h-12 w-12 place-items-center rounded-xl"
            style={{ backgroundColor: `${accent}1A`, color: accent }}
          >
            <Icon size={22} />
          </span>

          <h2 className={`mt-4 text-[18px] font-bold leading-snug tracking-[-0.01em] ${T.ink}`}>
            {hasDeployed
              ? `${jobsSubmitted} application${jobsSubmitted === 1 ? "" : "s"} deployed`
              : "Your job hunt starts here"}
          </h2>

          <p className={`mx-auto mt-1.5 max-w-[340px] text-[12.5px] leading-relaxed ${T.muted}`}>
            {hasDeployed ? (
              <>
                While you prepare for interviews, help a friend escape the grind. Share your link
                and <span className={`font-semibold ${T.ink2}`}>you both get ${REFERRAL_REWARD}</span>.
              </>
            ) : (
              <>
                You haven't deployed any applications yet — but you can still earn. Invite a friend
                and <span className={`font-semibold ${T.ink2}`}>you both get ${REFERRAL_REWARD}</span>{" "}
                when they make their first purchase.
              </>
            )}
          </p>
        </div>

        <div className={`space-y-3 border-t ${T.hairline} px-6 py-5`}>
          <div className="flex gap-2">
            <input
              readOnly
              value={referralLink || "Loading your link…"}
              onFocus={(e) => e.currentTarget.select()}
              className={`min-w-0 flex-1 rounded-lg border ${T.hairline} bg-[#FAFAF8] px-3 py-2
                          font-mono text-[12px] ${T.ink2} outline-none dark:bg-white/[0.03]`}
            />
            <button
              type="button"
              onClick={handleCopy}
              disabled={!referralLink}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#111110] px-3.5
                         py-2 text-[12px] font-semibold text-white transition-opacity
                         hover:opacity-90 disabled:opacity-40 dark:bg-white dark:text-[#111110]"
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {shareChannels.map((channel) => {
              const ChannelIcon = channel.icon;
              return (
                <button
                  key={channel.label}
                  type="button"
                  disabled={!referralLink}
                  onClick={() => window.open(channel.url, "_blank", "noopener,noreferrer")}
                  className={`inline-flex items-center justify-center gap-1.5 rounded-lg border
                              ${T.hairline} px-2 py-1.5 text-[12px] font-medium ${T.ink}
                              transition-colors hover:bg-[#F4F4F2] disabled:opacity-40
                              dark:hover:bg-white/5`}
                >
                  <ChannelIcon size={13} style={{ color: accent }} />
                  {channel.label}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className={`w-full rounded-lg py-2 text-[12px] font-medium ${T.muted}
                        transition-colors hover:bg-[#F4F4F2] dark:hover:bg-white/5`}
          >
            Maybe later — I'm preparing for interviews
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default MissionCompleteModal;
