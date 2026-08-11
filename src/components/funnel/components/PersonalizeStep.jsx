import { useState } from 'react';
import { Mail, User as UserIcon } from 'lucide-react';
import OptionCard from './OptionCard';
import FunnelLayout from './FunnelLayout';
import { FUNNEL } from './theme';

const InputField = ({ icon: IconCmp, ...props }) => (
  <div className="relative">
    {IconCmp && (
      <span className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: FUNNEL.muted }}>
        <IconCmp size={17} strokeWidth={1.9} />
      </span>
    )}
    <input
      {...props}
      className={`w-full rounded-2xl py-4 text-sm font-medium outline-none transition-shadow focus:shadow-[0_0_0_1.5px_#EFC59B] ${
        IconCmp ? 'pl-12 pr-4' : 'px-4'
      }`}
      style={{
        backgroundColor: FUNNEL.card,
        color: FUNNEL.ink,
        boxShadow: FUNNEL.cardShadow,
      }}
    />
  </div>
);

export default function PersonalizeStep({ step, value, onAnswer, onNext, onBack, isFirst, stepNumber }) {
  const [firstName, setFirstName] = useState(value?.firstName || '');
  const [email, setEmail] = useState(value?.email || '');
  const [industry, setIndustry] = useState(value?.industry || null);

  const isValidEmail = /\S+@\S+\.\S+/.test(email);
  const isValid = firstName.trim().length > 0 && isValidEmail && Boolean(industry);

  const handleContinue = () => {
    if (!isValid) return;
    onAnswer(step.id, { firstName: firstName.trim(), email: email.trim(), industry });
    onNext();
  };

  return (
    <FunnelLayout
      stage={step.stage}
      stepNumber={stepNumber}
      title={step.title}
      subtitle={step.subtitle}
      onBack={onBack}
      onNext={handleContinue}
      isFirst={isFirst}
      nextDisabled={!isValid}
    >
      <div className="flex flex-col gap-3">
        <InputField icon={Mail} type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} />
        <InputField icon={UserIcon} type="text" placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
      </div>

      {/* Second question on the same screen, matching the reference's stacked layout */}
      <div className="mt-7">
        <p className="text-[19px] sm:text-[21px] font-bold tracking-tight mb-4" style={{ color: FUNNEL.ink }}>
          {step.multiSelectField.label}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {step.multiSelectField.options.map((option) => (
            <OptionCard
              key={option.value}
              option={option}
              selected={industry?.value === option.value}
              onSelect={setIndustry}
            />
          ))}
        </div>
      </div>
    </FunnelLayout>
  );
}
