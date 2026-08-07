import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, ChevronRight, Package } from 'lucide-react';
import { useFunnel } from '../FunnelContext';
import { INTERN_FUNNEL_CONFIGS } from './internFunnelConfig';

export default function InternDownsellPage() {
  const { answers } = useFunnel();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);

  const track = sessionStorage.getItem('funnel_track') || answers.experienceLevel?.value || 'intern';
  const config = INTERN_FUNNEL_CONFIGS[track] || INTERN_FUNNEL_CONFIGS.intern;
  const { downsell, upsells } = config;

  const addedParam = searchParams.get('added') || '';

  const buildThankYouUrl = (accepted) => {
    const params = new URLSearchParams();
    const added = accepted
      ? addedParam ? `${addedParam},${downsell.id}` : downsell.id
      : addedParam;
    if (added) params.set('added', added);
    return `/start/checkout/thank-you?${params.toString()}`;
  };

  const handleAccept = async () => {
    setLoading(true);
    try {
      // Same 1-click pattern — reuse authorization_code if available
      navigate(buildThankYouUrl(true));
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = () => navigate(buildThankYouUrl(false));

  // Step rail — same structure as InternUpsellPage
  const railSteps = ['Checkout', ...upsells.map((u) => u.name), 'Complete'];
  const downsellRailIndex = railSteps.length - 2; // last upsell position

  return (
    <div className="relative bg-[#0A0A0A] min-h-screen overflow-hidden text-white">
      <div className="pointer-events-none absolute -top-40 -right-40 w-[480px] h-[480px] rounded-full bg-amber-600/8 blur-[120px]" />

      {/* Step rail */}
      <div className="relative border-b border-white/10 px-5 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-2 overflow-x-auto">
          {railSteps.map((s, i) => {
            const isDone = i <= downsellRailIndex - 1;
            const isCurrent = i === downsellRailIndex;
            return (
              <div key={s} className="flex items-center gap-2 shrink-0">
                <div className={`flex items-center gap-2 text-xs font-semibold ${isCurrent ? 'text-amber-400' : isDone ? 'text-emerald-400' : 'text-white/25'}`}>
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isCurrent ? 'bg-amber-500 text-white' : isDone ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/30'}`}>
                    {isDone ? <Check size={12} strokeWidth={3} /> : i + 1}
                  </span>
                  <span className="hidden sm:inline uppercase tracking-wider text-[10px]">{s}</span>
                </div>
                {i < railSteps.length - 1 && <ChevronRight size={14} className="text-white/20 shrink-0" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Hero */}
      <div className="relative bg-[#0D1B2A] border-b-4 border-amber-500 px-5 py-14 text-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 30% 60%, rgba(245,158,11,.08) 0%, transparent 60%)' }} />
        <p className="relative z-10 text-white/40 text-sm mb-2">No problem — that is completely fine.</p>
        <h1 className="relative z-10 font-bold text-3xl sm:text-4xl leading-tight max-w-lg mx-auto mb-3">
          {downsell.headline.includes('smaller option')
            ? <>Before you finish, here is a <span className="text-amber-400">smaller option</span> that still gives you a real edge.</>
            : downsell.headline}
        </h1>
        <p className="relative z-10 text-white/50 max-w-md mx-auto text-sm">{downsell.sub}</p>
      </div>

      <div className="relative max-w-lg mx-auto px-5 py-10 space-y-6">

        {/* Product card */}
        <div className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-2 border-amber-500/40 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <span className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center">
              <Package size={20} strokeWidth={1.75} className="text-amber-400" />
            </span>
            <div>
              <p className="font-bold text-white">{downsell.name}</p>
              <p className="text-white/40 text-xs">Instant access — no course required</p>
            </div>
          </div>
          <ul className="space-y-3 mb-5">
            {downsell.includes.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-white/70">
                <Check size={15} strokeWidth={2.5} className="text-emerald-400 shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
          <div className="border-t border-white/10 pt-4 text-center">
            <p className="text-4xl font-bold text-white mb-1">${downsell.price}</p>
            <p className="text-white/40 text-xs">One-time. Yours to keep.</p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <button
            type="button"
            onClick={handleAccept}
            disabled={loading}
            className="w-full bg-amber-500 disabled:opacity-60 text-[#0D1B2A] font-bold py-4 rounded-xl text-base hover:bg-amber-400 transition-colors mb-3"
          >
            {loading ? 'Adding…' : `Yes, add ${downsell.name} for $${downsell.price}`}
          </button>
          <button
            type="button"
            onClick={handleDecline}
            className="w-full text-white/30 hover:text-white/50 text-sm py-2 transition-colors"
          >
            No thanks, I am good
          </button>
        </div>

      </div>
    </div>
  );
}
