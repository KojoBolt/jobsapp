import { LADDER_STAGES } from "./CareerLadderNavigator";

// Scaffold of the five anchored sections the navigator jumps to. The IDs here
// MUST match the navigator's (they're imported from the same source, so they do).
// Drop your real product cards in place of each placeholder block.
//
// scroll-mt-32 keeps the section heading clear of the sticky strip/nav when
// jumped to. If your sticky header is taller/shorter, adjust this value.
const CareerLadderSections = () => {
  return (
    <div className="space-y-12">
      {LADDER_STAGES.map((stage) => (
        <section key={stage.id} id={stage.id} className="scroll-mt-32">
          <div className="mb-4 flex items-center gap-2">
            <stage.icon className={`h-6 w-6 ${stage.iconColor}`} strokeWidth={2.2} />
            <h2 className={`text-xl font-bold ${stage.text}`}>{stage.label}</h2>
          </div>

          {/* TODO: replace with the product cards for this stage */}
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-10 text-center text-sm text-slate-400">
            {stage.label} products go here.
          </div>
        </section>
      ))}
    </div>
  );
};

export default CareerLadderSections;