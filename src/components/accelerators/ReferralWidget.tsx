import { useState, useEffect } from "react";
import { Copy, Check, MessageCircle, Linkedin, Twitter, Mail, Gift, Infinity as InfinityIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CHART, T, Panel, PanelHeader } from "@/admin/ui/system";
import { useRamp } from "@/admin/ui/charts";

const REFERRAL_REWARD = 15; // keep in sync with the backend payout

/** What actually has to happen before credits land — stated plainly. */
const STEPS = [
  "Share your link with a friend",
  `They get $${REFERRAL_REWARD} off their first pack`,
  `You get $${REFERRAL_REWARD} in credits once they buy`,
];

const ReferralWidget = () => {
  const { dark } = useRamp();
  const [copied, setCopied] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const accent = dark ? CHART.accentDark : CHART.accent;

  // Load the logged-in user's real referral code.
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("referral_code")
        .eq("id", user.id)
        .single();
      setReferralCode(profile?.referral_code ?? null);
      setLoading(false);
    })();
  }, []);

  const referralLink = referralCode
    ? `https://thejobapp.online/ref/${referralCode}`
    : "";

  const handleCopy = async () => {
    if (!referralLink) return;
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast({ title: "Copied", description: "Your referral link is ready to share." });
    setTimeout(() => setCopied(false), 2000);
  };

  const shareText = encodeURIComponent(
    `I just leveled up my job search with JobApp. Use my link for $${REFERRAL_REWARD} off your first pack!`
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
      <PanelHeader icon={Gift} title="Invite a friend" />

      <div className="space-y-4 px-5 pb-5">
        <p className={`text-[12.5px] leading-relaxed ${T.ink2}`}>
          Know someone stuck in application hell? They get{" "}
          <span className="font-semibold" style={{ color: accent }}>
            ${REFERRAL_REWARD} off
          </span>{" "}
          their first pack, and you earn{" "}
          <span className={`font-semibold ${T.ink}`}>${REFERRAL_REWARD} in credits</span> for every
          friend who joins and makes their first purchase.
        </p>

        {/* Numbered steps so the payout condition isn't buried in prose. */}
        <ol className="grid gap-2 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <li
              key={step}
              className={`flex items-start gap-2 rounded-xl border ${T.hairline} p-3`}
            >
              <span
                className="mt-px grid h-4 w-4 shrink-0 place-items-center rounded-full text-[9.5px] font-bold"
                style={{ backgroundColor: `${accent}1F`, color: accent }}
              >
                {i + 1}
              </span>
              <span className={`text-[11.5px] leading-snug ${T.ink2}`}>{step}</span>
            </li>
          ))}
        </ol>

        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            readOnly
            value={
              loading
                ? "Generating your link…"
                : referralLink || "Sign in to get your link"
            }
            onFocus={(e) => e.currentTarget.select()}
            className={`min-w-0 flex-1 rounded-lg border ${T.hairline} bg-[#FAFAF8] px-3 py-2
                        font-mono text-[12px] ${T.ink2} outline-none
                        focus:border-[#C9C8C2] dark:bg-white/[0.03] dark:focus:border-white/25`}
          />
          <button
            type="button"
            onClick={handleCopy}
            disabled={!referralLink}
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
                disabled={!referralLink}
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

        <p className={`flex items-center gap-1.5 text-[11px] ${T.muted}`}>
          <InfinityIcon size={12} className="shrink-0" />
          Unlimited referrals — no cap on what you can earn.
        </p>
      </div>
    </Panel>
  );
};

export default ReferralWidget;
