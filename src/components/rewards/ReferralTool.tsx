import { useState } from "react";
import { Copy, Check, MessageCircle, Linkedin, Twitter, Mail, Link2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CHART, T, Panel, PanelHeader } from "@/admin/ui/system";
import { useRamp } from "@/admin/ui/charts";

interface ReferralToolProps {
  referralLink: string;
  referralCode: string;
}

const ReferralTool = ({ referralLink, referralCode }: ReferralToolProps) => {
  const { dark } = useRamp();
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const accent = dark ? CHART.accentDark : CHART.accent;
  // The profile hasn't loaded yet — don't hand the user a broken link to share.
  const ready = Boolean(referralCode) && referralCode !== "loading...";

  const handleCopy = async () => {
    if (!ready) return;
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast({ title: "Copied", description: "Your referral link is ready to share." });
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
    <Panel>
      <PanelHeader icon={Link2} title="Your referral link" />

      <div className="space-y-3.5 px-5 pb-5">
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            readOnly
            value={ready ? referralLink : "Generating your link…"}
            onFocus={(e) => e.currentTarget.select()}
            className={`min-w-0 flex-1 rounded-lg border ${T.hairline} bg-[#FAFAF8] px-3 py-2
                        font-mono text-[12px] ${T.ink2} outline-none
                        focus:border-[#C9C8C2] dark:bg-white/[0.03] dark:focus:border-white/25`}
          />
          <button
            type="button"
            onClick={handleCopy}
            disabled={!ready}
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg
                       bg-[#111110] px-4 py-2 text-[12px] font-semibold text-white
                       transition-opacity hover:opacity-90 disabled:opacity-40
                       dark:bg-white dark:text-[#111110]"
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? "Copied" : "Copy link"}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={`mr-1 text-[10.5px] font-semibold uppercase tracking-[0.08em] ${T.muted}`}
          >
            Share via
          </span>
          {shareChannels.map((channel) => {
            const Icon = channel.icon;
            return (
              <button
                key={channel.label}
                type="button"
                disabled={!ready}
                onClick={() => window.open(channel.url, "_blank", "noopener,noreferrer")}
                className={`inline-flex items-center gap-1.5 rounded-lg border ${T.hairline}
                            px-2.5 py-1.5 text-[12px] font-medium ${T.ink} transition-colors
                            hover:bg-[#F4F4F2] disabled:opacity-40 dark:hover:bg-white/5`}
              >
                <Icon size={13} style={{ color: accent }} />
                {channel.label}
              </button>
            );
          })}
        </div>

        <p className={`text-[11px] ${T.muted}`}>
          Your code is{" "}
          <span className={`font-mono font-semibold ${T.ink2}`}>{referralCode}</span>. Friends who
          sign up through it are attributed to you automatically.
        </p>
      </div>
    </Panel>
  );
};

export default ReferralTool;
