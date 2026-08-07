import { Clock, DollarSign, TrendingDown, Zap } from 'lucide-react';
import FunnelLayout from './FunnelLayout';

function StatRow({ icon: IconCmp, tone, value, label }) {
  const tones = {
    red: 'bg-red-500/10 border-red-500/20 text-red-400',
    amber: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
  };
  return (
    <div className={`flex items-center gap-3.5 rounded-xl border p-3.5 ${tones[tone]}`}>
      <IconCmp size={20} strokeWidth={1.75} />
      <div>
        <p className="text-white font-bold">{value}</p>
        <p className="text-white/40 text-xs">{label}</p>
      </div>
    </div>
  );
}

export default function RealityCheckSlide({ answers, onNext, step }) {
  const minutes = answers.timePerApp?.numericValue || 45;
  const manualHours = ((minutes * 100) / 60).toFixed(1);
  const valueLost = Math.round((minutes * 100) / 60) * 30;
  const firstName = answers.personalize?.firstName || 'there';

  return (
    <FunnelLayout
      kicker={step.kicker}
      icon={step.icon}
      title="Here's Your Job Search Reality"
      subtitle={`Based on your answers, ${firstName}`}
      stage={step.stage}
    >
      <div className="flex flex-col gap-2.5">
        <StatRow icon={Clock} tone="red" value={`${manualHours}+ hours`} label="Time for 100 apps manually" />
        <StatRow icon={DollarSign} tone="amber" value={`$${valueLost}+`} label="Value of time lost" />
        <StatRow icon={TrendingDown} tone="amber" value="5-10%" label="Typical response rate" />

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mt-1.5">
          <p className="text-blue-300 font-semibold text-sm flex items-center gap-1.5 mb-3">
            <Zap size={15} /> With JobApp AI
          </p>
          <div className="flex justify-between text-center">
            <div><p className="text-xl font-bold text-white">200</p><p className="text-white/40 text-xs">Applications</p></div>
            <div><p className="text-xl font-bold text-white">7</p><p className="text-white/40 text-xs">Days</p></div>
            <div><p className="text-xl font-bold text-white">0</p><p className="text-white/40 text-xs">Your hours</p></div>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onNext}
        className="w-full mt-8 py-4 rounded-xl bg-blue-500 text-white font-semibold hover:bg-blue-600 transition-colors"
      >
        Next
      </button>
    </FunnelLayout>
  );
}
