import { useState } from 'react';
import { AlertTriangle, Lightbulb } from 'lucide-react';
import OptionCard from './OptionCard';
import FunnelLayout from './FunnelLayout';
import { FUNNEL } from './theme';

export default function QuestionStep({ step, value, onAnswer, onNext, onBack, isFirst, stepNumber }) {
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
    <FunnelLayout
      stage={step.stage}
      stepNumber={stepNumber}
      title={step.title}
      subtitle={step.subtitle}
      onBack={onBack}
      onNext={onNext}
      isFirst={isFirst}
      nextDisabled={!hasAnswer}
      nextLabel={step.ctaLabel || 'Next'}
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {step.options.map((option) => (
          <OptionCard
            key={option.value}
            option={option}
            selected={isOptionSelected(option)}
            onSelect={handleSelect}
          />
        ))}
      </div>

      {step.footerNote && (
        <div
          className="mt-6 flex gap-3 rounded-2xl p-4 text-sm"
          style={{ backgroundColor: FUNNEL.accentSoft, color: FUNNEL.body }}
        >
          <Lightbulb size={18} className="shrink-0 mt-0.5" style={{ color: FUNNEL.accent }} />
          <p>
            <span className="font-bold" style={{ color: FUNNEL.ink }}>Did you know? </span>
            {step.footerNote}
          </p>
        </div>
      )}

      {insight && (
        <div
          className="mt-6 rounded-2xl p-5 text-center"
          style={{ backgroundColor: FUNNEL.card, boxShadow: FUNNEL.cardShadow }}
        >
          <div
            className="flex items-center justify-center gap-1.5 text-[11px] font-bold uppercase tracking-wide"
            style={{ color: FUNNEL.accent }}
          >
            <AlertTriangle size={13} />
            {insight.label}
          </div>
          <p className="text-2xl font-bold mt-2" style={{ color: FUNNEL.ink }}>{insight.value}</p>
          <p className="text-xs mt-1.5" style={{ color: FUNNEL.muted }}>{insight.sub}</p>
        </div>
      )}
    </FunnelLayout>
  );
}
