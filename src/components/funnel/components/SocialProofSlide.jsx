import FunnelLayout from './FunnelLayout';

// pravatar.cc serves stable, real (anonymized) face photos specifically
// intended for UI mockup/testimonial use — swap for real customer
// photos (with permission) before this goes fully live.
const TESTIMONIALS = [
  { name: 'Sarah M.', role: 'Software Engineer @ Google', stat: '200 apps · 12 interviews', quote: 'Got 12 interviews in 2 weeks. Landed my dream job!', avatar: 'https://i.pravatar.cc/80?img=47' },
  { name: 'James K.', role: 'Product Manager @ Meta', stat: '40 hours saved', quote: 'Saved me 40+ hours. The AI responses were impressive.', avatar: 'https://i.pravatar.cc/80?img=12' },
  { name: 'Emily R.', role: 'Data Scientist @ Netflix', stat: '3x more responses', quote: 'Finally broke through after months of silence.', avatar: 'https://i.pravatar.cc/80?img=32' },
];

export default function SocialProofSlide({ onNext, step }) {
  return (
    <FunnelLayout
      kicker={step.kicker}
      icon={step.icon}
      title="Join 47,000+ Job Seekers"
      subtitle="Who landed their dream jobs"
      stage={step.stage}
    >
      <div className="flex flex-col gap-3">
        {TESTIMONIALS.map((t) => (
          <div key={t.name} className="bg-white/[0.03] border border-white/10 rounded-2xl p-4">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-3">
                <img
                  src={t.avatar}
                  alt=""
                  className="w-9 h-9 rounded-full object-cover bg-white/10"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
                <div>
                  <p className="text-white font-semibold text-sm">{t.name}</p>
                  <p className="text-white/30 text-xs">{t.role}</p>
                </div>
              </div>
              <span className="text-emerald-400 text-xs bg-emerald-400/10 rounded-full px-2.5 py-1 whitespace-nowrap font-medium">
                {t.stat}
              </span>
            </div>
            <p className="text-white/50 text-sm italic">"{t.quote}"</p>
          </div>
        ))}
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
