import { Link } from "react-router-dom";
import { BarChart3, Rocket, ArrowRight } from "lucide-react";
import { CHART, T } from "@/admin/ui/system";
import { useRamp } from "@/admin/ui/charts";

interface CrossSellBannerProps {
  variant: "tracker" | "deployment";
}

const CrossSellBanner = ({ variant }: CrossSellBannerProps) => {
  const { dark } = useRamp();
  const accent = dark ? CHART.accentDark : CHART.accent;

  const copy =
    variant === "tracker"
      ? {
          icon: BarChart3,
          title: "Tired of spreadsheets?",
          body: "Move these 200 apps into the Interactive Tracker for $29/mo.",
          to: "/job-tracker",
          cta: "Coming Soon",
          disabled: true,
        }
      : {
          icon: Rocket,
          title: "Low on Job Applications?",
          body: "Deploy a fresh 200-App Blitz for $99. AI + Human quality guaranteed.",
          to: "/onboarding",
          cta: "Start Blitz",
          disabled: false,
        };

  const Icon = copy.icon;

  return (
    // Same panel shell as the metric cards: white card, hairline border, 16px
    // radius — no gradient, so it sits in the page rather than shouting over it.
    <div
      className={`flex flex-col items-start justify-between gap-3 rounded-2xl border ${T.hairline}
                  bg-white p-4 sm:flex-row sm:items-center dark:bg-[#1A1A19]`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg"
          style={{ backgroundColor: `${accent}1A`, color: accent }}
        >
          <Icon size={16} strokeWidth={2} />
        </span>
        <div className="min-w-0">
          <p className={`text-[13.5px] font-bold leading-tight ${T.ink}`}>{copy.title}</p>
          <p className={`mt-0.5 text-[11.5px] leading-relaxed ${T.muted}`}>{copy.body}</p>
        </div>
      </div>

      {copy.disabled ? (
        // Not a Link: wrapping a disabled control still navigates on click.
        <span
          aria-disabled="true"
          className={`shrink-0 rounded-lg border ${T.hairline} px-3 py-1.5 text-[12px]
                      font-semibold ${T.muted} cursor-not-allowed`}
        >
          {copy.cta}
        </span>
      ) : (
        <Link
          to={copy.to}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#111110] px-3 py-1.5
                     text-[12px] font-semibold text-white transition-opacity hover:opacity-90
                     dark:bg-white dark:text-[#111110]"
        >
          {copy.cta}
          <ArrowRight size={13} strokeWidth={2.5} />
        </Link>
      )}
    </div>
  );
};

export default CrossSellBanner;
