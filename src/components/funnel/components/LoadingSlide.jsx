import { useEffect, useState } from 'react';
import { Brain, Check } from 'lucide-react';

const STAGES = ['Analyzing your profile', 'Matching with opportunities', 'Optimizing for success', 'Creating your plan'];

export default function LoadingSlide({ firstName, onComplete }) {
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
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-8 text-center max-w-md mx-auto">
      <div className="w-20 h-20 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-8">
        <Brain size={32} strokeWidth={1.5} className="text-blue-400" />
      </div>
      <h1 className="text-2xl font-bold text-white">Hang tight, {firstName}!</h1>
      <p className="text-white/40 mt-2 mb-10">We're building your personalized job search plan</p>

      <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mb-8">
        <div className="h-full bg-blue-500 transition-all duration-700" style={{ width: `${progressPct}%` }} />
      </div>

      <div className="flex flex-col gap-4 w-full">
        {STAGES.map((stage, i) => (
          <div key={stage} className="flex items-center gap-3 text-left">
            <span
              className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                i < doneCount ? 'bg-emerald-500 text-white' : i === doneCount ? 'border-2 border-blue-500 text-blue-400' : 'bg-white/5 text-white/20'
              }`}
            >
              {i < doneCount && <Check size={14} strokeWidth={3} />}
            </span>
            <span className={i < doneCount ? 'text-emerald-400' : i === doneCount ? 'text-white font-medium' : 'text-white/30'}>
              {stage}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
