import { useNavigate } from 'react-router-dom';

const STAGES = ['Profile', 'Context', 'Targeting', 'Plan'];

export default function StepIndicator({ currentStage, onBack, isFirst }) {
  const currentIndex = STAGES.indexOf(currentStage);

  return (
    <div className="flex items-center justify-between px-6 sm:px-10 py-6">
      <button
        type="button"
        onClick={onBack}
        disabled={isFirst}
        className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white disabled:opacity-0 transition-colors"
      >
        <span aria-hidden="true">‹</span> Back
      </button>

      <div className="flex flex-col items-end gap-2">
        <span className="text-[11px] tracking-widest text-white/40 font-medium">
          STEP {currentIndex + 1} OF {STAGES.length}
        </span>
        <div className="flex gap-1.5 w-40 sm:w-56">
          {STAGES.map((stage, i) => (
            <div key={stage} className="h-1 flex-1 rounded-full overflow-hidden bg-white/10">
              <div
                className={`h-full bg-blue-500 transition-all duration-500 ${
                  i < currentIndex ? 'w-full' : i === currentIndex ? 'w-1/2' : 'w-0'
                }`}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
