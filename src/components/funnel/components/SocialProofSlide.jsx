import FunnelLayout from './FunnelLayout';
import { FUNNEL } from './theme';

// pravatar.cc serves stable, real (anonymized) face photos specifically
// intended for UI mockup/testimonial use — swap for real customer
// photos (with permission) before this goes fully live.
const TESTIMONIALS = [
  { name: 'Sarah M.', role: 'Software Engineer @ Google', stat: '200 apps · 12 interviews', quote: 'Got 12 interviews in 2 weeks. Landed my dream job!', avatar: 'https://i.pravatar.cc/80?img=47' },
  { name: 'James K.', role: 'Product Manager @ Meta', stat: '40 hours saved', quote: 'Saved me 40+ hours. The AI responses were impressive.', avatar: 'https://i.pravatar.cc/80?img=12' },
  { name: 'Emily R.', role: 'Data Scientist @ Netflix', stat: '3x more responses', quote: 'Finally broke through after months of silence.', avatar: 'https://i.pravatar.cc/80?img=32' },
];

export default function SocialProofSlide({ onNext, onBack, isFirst, stepNumber, step }) {
  return (
    <FunnelLayout
      stage={step.stage}
      stepNumber={stepNumber}
      title="Join 47,000+ job seekers"
      subtitle="Who landed their dream jobs"
      onBack={onBack}
      onNext={onNext}
      isFirst={isFirst}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {TESTIMONIALS.map((t) => (
          <div
            key={t.name}
            className="rounded-2xl p-5"
            style={{ backgroundColor: FUNNEL.card, boxShadow: FUNNEL.cardShadow }}
          >
            <div className="flex items-center gap-3">
              <img
                src={t.avatar}
                alt=""
                className="w-10 h-10 rounded-full object-cover shrink-0"
                style={{ backgroundColor: FUNNEL.hairline }}
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
              <div className="min-w-0">
                <p className="font-bold text-[13.5px] leading-tight" style={{ color: FUNNEL.ink }}>{t.name}</p>
                <p className="text-xs mt-0.5 truncate" style={{ color: FUNNEL.muted }}>{t.role}</p>
              </div>
            </div>

            <p className="text-sm mt-3.5 leading-relaxed" style={{ color: FUNNEL.body }}>"{t.quote}"</p>

            <span
              className="inline-block text-[11px] font-bold rounded-full px-3 py-1.5 mt-3.5"
              style={{ backgroundColor: FUNNEL.accentSoft, color: FUNNEL.accent }}
            >
              {t.stat}
            </span>
          </div>
        ))}
      </div>
    </FunnelLayout>
  );
}
