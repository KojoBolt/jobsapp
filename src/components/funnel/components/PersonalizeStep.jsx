import { useState } from 'react';
import { Mail, User as UserIcon } from 'lucide-react';
import OptionCard from './OptionCard';
import FunnelLayout from './FunnelLayout';

const InputField = ({ icon: IconCmp, ...props }) => (
  <div className="relative pl-80">
    {IconCmp && (
      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30"
      style={{
      marginLeft: "10px"
      }}
      >
        <IconCmp size={16} strokeWidth={1.75} />
      </span>
    )}
    <input
      {...props}
      className={`w-full bg-white/5 border border-white/10 rounded-xl py-4 text-white placeholder-white/30 outline-none focus:border-blue-500 transition-colors
        ${
        IconCmp ? 'pl-10 pr-4' : 'px-4'
      }`
      
    }
    />
  </div>
);

export default function PersonalizeStep({ step, value, onAnswer, onNext }) {
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
    <FunnelLayout kicker={step.kicker} icon={step.icon} title={step.title} subtitle={step.subtitle} stage={step.stage}>
      <div className="flex flex-col gap-4">
        <InputField icon={Mail} type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} />
        <InputField icon={UserIcon} type="text" placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />

        <div className="mt-2">
          <p className="text-sm font-semibold text-white/70 mb-3">{step.multiSelectField.label}</p>
          <div className="grid grid-cols-2 gap-3">
            {step.multiSelectField.options.map((option) => (
              <OptionCard
                key={option.value}
                option={option}
                selected={industry?.value === option.value}
                onSelect={setIndustry}
                grid
              />
            ))}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleContinue}
        disabled={!isValid}
        className="w-full mt-8 py-4 rounded-xl bg-blue-500 disabled:bg-white/10 disabled:text-white/30 text-white font-semibold hover:bg-blue-600 transition-colors"
      >
        Next
      </button>
    </FunnelLayout>
  );
}
