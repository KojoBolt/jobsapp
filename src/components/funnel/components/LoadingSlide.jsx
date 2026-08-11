import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import FunnelLayout from './FunnelLayout';
import { FUNNEL } from './theme';

const STAGES = ['Analyzing your profile', 'Matching with opportunities', 'Optimizing for success', 'Creating your plan'];

export default function LoadingSlide({ firstName, onComplete, stage = 'Plan' }) {
  const [doneCount, setDoneCount] = useState(0);

  useEffect(() => {
    if (doneCount >= STAGES.length) {
      const t = setTimeout(onComplete, 500);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setDoneCount((c) => c + 1), 650);
    return () => clearTimeout(t);
  }, [doneCount, onComplete]);

  const progressPct = (doneCount / STAGES.length) * 100;

  return (
    <FunnelLayout
      stage={stage}
      title={`Hang tight, ${firstName}!`}
      subtitle="We're building your personalised job search plan"
    >
      <div
        className="rounded-2xl p-6 sm:p-8 max-w-xl"
        style={{ backgroundColor: FUNNEL.card, boxShadow: FUNNEL.cardShadow }}
      >
        <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: FUNNEL.hairline }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${progressPct}%`, backgroundColor: FUNNEL.accent }}
          />
        </div>

        <div className="flex flex-col gap-4 mt-7">
          {STAGES.map((label, i) => {
            const done = i < doneCount;
            const current = i === doneCount;
            return (
              <div key={label} className="flex items-center gap-3.5">
                <span
                  className="w-[26px] h-[26px] rounded-full flex items-center justify-center shrink-0"
                  style={
                    done
                      ? { backgroundColor: FUNNEL.accent }
                      : current
                      ? { border: `2px solid ${FUNNEL.accent}` }
                      : { border: `1.5px solid ${FUNNEL.hairline}` }
                  }
                >
                  {done && <Check size={14} strokeWidth={3} className="text-white" />}
                  {current && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: FUNNEL.accent }} />}
                </span>
                <span
                  className="text-sm"
                  style={{
                    color: done || current ? FUNNEL.ink : FUNNEL.muted,
                    fontWeight: done || current ? 700 : 500,
                  }}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </FunnelLayout>
  );
}
