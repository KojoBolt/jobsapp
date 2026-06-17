import { useEffect, useState } from "react";
import { GraduationCap, Sprout, TrendingUp, Briefcase, Crown } from "lucide-react";

// Single source of truth for the five stages — imported by the sections scaffold
// too, so card IDs and section IDs can never drift apart.
export const LADDER_STAGES = [
  { id: "intern-track",    label: "Intern Track",    icon: GraduationCap,
    text: "text-teal-700",   iconColor: "text-teal-600",   idleBg: "bg-teal-50",   idleBorder: "border-teal-200",   activeBorder: "border-teal-500" },
  { id: "entry-level",     label: "Entry Level",     icon: Sprout,
    text: "text-blue-700",   iconColor: "text-blue-600",   idleBg: "bg-blue-50",   idleBorder: "border-blue-200",   activeBorder: "border-blue-500" },
  { id: "early-career",    label: "Early Career",    icon: TrendingUp,
    text: "text-amber-700",  iconColor: "text-amber-600",  idleBg: "bg-amber-50",  idleBorder: "border-amber-200",  activeBorder: "border-amber-500" },
  { id: "mid-level",       label: "Mid-Level",       icon: Briefcase,
    text: "text-violet-700", iconColor: "text-violet-600", idleBg: "bg-violet-50", idleBorder: "border-violet-200", activeBorder: "border-violet-500" },
  { id: "senior-director", label: "Senior/Director", icon: Crown,
    text: "text-rose-700",   iconColor: "text-rose-600",   idleBg: "bg-rose-50",   idleBorder: "border-rose-200",   activeBorder: "border-rose-500" },
];

const CareerLadderNavigator = () => {
  const [activeId, setActiveId] = useState<string>(LADDER_STAGES[0].id);

  // Scroll-spy: highlight whichever section is currently in the upper-middle
  // of the viewport. Only attaches to sections that actually exist on the page.
  useEffect(() => {
    const sections = LADDER_STAGES
      .map((s) => document.getElementById(s.id))
      .filter(Boolean) as HTMLElement[];
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      // The "active band" is roughly the top third of the viewport.
      { rootMargin: "-25% 0px -60% 0px", threshold: [0, 0.25, 0.5, 1] }
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  const handleJump = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    setActiveId(id);
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    // Desktop: equal-width row. Mobile: horizontal scroll, no wrap (~160px cards).
    <div className="flex gap-3 overflow-x-auto pb-1 md:overflow-visible">
      {LADDER_STAGES.map((stage) => {
        const active = activeId === stage.id;
        return (
          <button
            key={stage.id}
            onClick={() => handleJump(stage.id)}
            aria-current={active ? "true" : undefined}
            // border-2 always, so toggling active never shifts layout by 1px.
            className={`flex min-w-[160px] flex-1 flex-col items-center gap-1 rounded-xl border-2 px-4 py-3 text-center transition-all duration-200 ${stage.idleBg} ${
              active ? `${stage.activeBorder} shadow-md` : `${stage.idleBorder} shadow-none`
            }`}
          >
            <stage.icon className={`h-5 w-5 ${stage.iconColor}`} strokeWidth={2.2} />
            <span className={`text-sm font-bold leading-tight ${stage.text}`}>{stage.label}</span>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Tap to jump ↓
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default CareerLadderNavigator;