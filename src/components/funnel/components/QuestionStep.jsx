import { useState } from 'react';
import { AlertTriangle, Lightbulb } from 'lucide-react';
import OptionCard from './OptionCard';
import FunnelLayout from './FunnelLayout';

export default function QuestionStep({ step, value, onAnswer, onNext }) {
  const isMulti = step.type === 'multi';
  const [selected, setSelected] = useState(value ?? (isMulti ? [] : null));

  const handleSelect = (option) => {
    if (isMulti) {
      const exists = selected.some((o) => o.value === option.value);
      const next = exists ? selected.filter((o) => o.value !== option.value) : [...selected, option];
      setSelected(next);
      onAnswer(step.id, next);
    } else {
      setSelected(option);
      onAnswer(step.id, option);
    }
  };

  const isOptionSelected = (option) =>
    isMulti ? selected.some((o) => o.value === option.value) : selected?.value === option.value;

  const hasAnswer = isMulti ? selected.length > 0 : Boolean(selected);
  const insight = step.insight && !isMulti && selected ? step.insight(selected) : null;

  return (
    <FunnelLayout kicker={step.kicker} icon={step.icon} title={step.title} subtitle={step.subtitle} stage={step.stage}>
      <div className={step.grid ? 'grid grid-cols-2 gap-3' : 'flex flex-col gap-3'}>
        {step.options.map((option) => (
          <OptionCard
            key={option.value}
            option={option}
            selected={isOptionSelected(option)}
            onSelect={handleSelect}
            grid={step.grid}
          />
        ))}
      </div>

      {step.footerNote && (
        <div className="mt-5 flex gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-sm text-amber-200">
          <Lightbulb size={18} className="shrink-0 mt-0.5" />
          <p><span className="font-semibold">Did you know? </span>{step.footerNote}</p>
        </div>
      )}

      {insight && (
        <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-center">
          <div className="flex items-center justify-center gap-1.5 text-red-400 text-xs font-semibold uppercase tracking-wide">
            <AlertTriangle size={13} />
            {insight.label}
          </div>
          <p className="text-white text-2xl font-bold mt-1.5">{insight.value}</p>
          <p className="text-white/40 text-xs mt-1">{insight.sub}</p>
        </div>
      )}

      <button
        type="button"
        onClick={onNext}
        disabled={!hasAnswer}
        className="w-full mt-8 py-4 rounded-xl bg-blue-500 disabled:bg-white/10 disabled:text-white/30 text-white font-semibold hover:bg-blue-600 transition-colors"
      >
        {step.ctaLabel || 'Next'}
      </button>
    </FunnelLayout>
  );
}
