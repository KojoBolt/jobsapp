import { Clock, DollarSign, TrendingDown, Zap } from 'lucide-react';
import FunnelLayout from './FunnelLayout';
import { FUNNEL } from './theme';

function StatRow({ icon: IconCmp, value, label }) {
  return (
    <div
      className="flex items-center gap-4 rounded-2xl p-4"
      style={{ backgroundColor: FUNNEL.card, boxShadow: FUNNEL.cardShadow }}
    >
      <span
        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
        style={{ backgroundColor: FUNNEL.accentSoft, color: FUNNEL.accent }}
      >
        <IconCmp size={19} strokeWidth={1.9} />
      </span>
      <div>
        <p className="font-bold text-[15px] leading-tight" style={{ color: FUNNEL.ink }}>{value}</p>
        <p className="text-xs mt-1" style={{ color: FUNNEL.muted }}>{label}</p>
      </div>
    </div>
  );
}

export default function RealityCheckSlide({ answers, onNext, onBack, isFirst, stepNumber, step }) {
  const minutes = answers.timePerApp?.numericValue || 45;
  const manualHours = ((minutes * 100) / 60).toFixed(1);
  const valueLost = Math.round((minutes * 100) / 60) * 30;
  const firstName = answers.personalize?.firstName || 'there';

  return (
    <FunnelLayout
      stage={step.stage}
      stepNumber={stepNumber}
      title="Here's your job search reality"
      subtitle={`Based on your answers, ${firstName}`}
      onBack={onBack}
      onNext={onNext}
      isFirst={isFirst}
    >
      <div className="grid grid-cols-1 gap-3">
        <StatRow icon={Clock} value={`${manualHours}+ hours`} label="Time for 100 apps manually" />
        <StatRow icon={DollarSign} value={`$${valueLost}+`} label="Value of time lost" />
        <StatRow icon={TrendingDown} value="5-10%" label="Typical response rate" />
      </div>

      <div className="rounded-2xl p-6 mt-3.5" style={{ backgroundColor: FUNNEL.ink }}>
        <p className="font-bold text-sm flex items-center gap-2" style={{ color: FUNNEL.accent }}>
          <Zap size={16} strokeWidth={2.25} /> With JobApp AI
        </p>
        <div className="grid grid-cols-3 gap-4 text-center mt-5">
          {[
            { value: '200', label: 'Applications' },
            { value: '7', label: 'Days' },
            { value: '0', label: 'Your hours' },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-2xl font-bold text-white">{s.value}</p>
              <p className="text-xs mt-1 text-white/50">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </FunnelLayout>
  );
}
