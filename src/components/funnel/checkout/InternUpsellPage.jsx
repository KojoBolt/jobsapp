import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, ChevronRight, ShieldCheck } from 'lucide-react';
import { useFunnel } from '../FunnelContext';
import { INTERN_FUNNEL_CONFIGS } from './internFunnelConfig';

/**
 * Single component that handles ALL upsell steps for any experience track.
 * Uses ?step=N to know which upsell in the track's config array to render.
 *
 * Flow:
 *   Accept → move to step N+1, or thank-you if last upsell
 *   Decline → move to step N+1 (same), or downsell if last upsell
 */
export default function InternUpsellPage() {
  const { answers } = useFunnel();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);

  // Read track from sessionStorage (set by InternCheckout after payment)
  // Fall back to quiz answer if session hasn't been set yet (e.g. dev refresh)
  const track = sessionStorage.getItem('funnel_track') || answers.experienceLevel?.value || 'intern';
  const config = INTERN_FUNNEL_CONFIGS[track] || INTERN_FUNNEL_CONFIGS.intern;
  const { upsells, downsell } = config;

  const stepIndex = Number(searchParams.get('step') || 0);
  const upsell = upsells[stepIndex];
  const isLastUpsell = stepIndex === upsells.length - 1;

  // Track what's been added so thank-you page can show accurate receipt
  const addedParam = searchParams.get('added') || '';

  const nextStep = (accepted) => {
    const nextAdded = accepted
      ? addedParam ? `${addedParam},${upsell.id}` : upsell.id
      : addedParam;

    if (!isLastUpsell) {
      // More upsells to show
      const nextIndex = stepIndex + 1;
      const params = new URLSearchParams({ step: String(nextIndex) });
      if (nextAdded) params.set('added', nextAdded);
      navigate(`/start/checkout/intern/upsell?${params.toString()}`);
    } else if (accepted) {
      // Last upsell accepted → go to thank-you
      const params = new URLSearchParams();
      if (nextAdded) params.set('added', nextAdded);
      navigate(`/start/checkout/thank-you?${params.toString()}`);
    } else {
      // Last upsell declined → go to downsell
      const params = new URLSearchParams();
      if (nextAdded) params.set('added', nextAdded);
      navigate(`/start/checkout/intern/downsell?${params.toString()}`);
    }
  };

  const handleAccept = async () => {
    setLoading(true);
    try {
      // ---------------------------------------------------------------
      // Reuse Paystack authorization_code for 1-click if available:
      // const authCode = sessionStorage.getItem('funnel_auth_code');
      // if (authCode) {
      //   await chargeAuthorization({ authCode, amount: upsell.price, productId: upsell.id });
      // }
      // ---------------------------------------------------------------
      nextStep(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = () => nextStep(false);

  // Build step rail labels dynamically from config
  const railSteps = ['Checkout', ...upsells.map((u) => u.name), 'Complete'];

  const badgeColors = {
    amber: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
    green: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
    blue: 'bg-blue-500/15 border-blue-500/30 text-blue-400',
  };

  if (!upsell) return null;

  return (
    <div className="relative bg-[#0A0A0A] min-h-screen overflow-hidden text-white">
      <div className="pointer-events-none absolute -top-40 -right-40 w-[480px] h-[480px] rounded-full bg-blue-600/10 blur-[120px]" />

      {/* Step rail */}
      <div className="relative border-b border-white/10 px-5 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-2 overflow-x-auto">
          {railSteps.map((s, i) => {
            const isDone = i === 0; // Checkout always done
            const isCurrent = i === stepIndex + 1; // +1 because Checkout is index 0
            return (
              <div key={s} className="flex items-center gap-2 shrink-0">
                <div className={`flex items-center gap-2 text-xs font-semibold ${isCurrent ? 'text-blue-400' : isDone ? 'text-emerald-400' : 'text-white/25'}`}>
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isCurrent ? 'bg-blue-500 text-white' : isDone ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/30'}`}>
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
      <div className="relative bg-gradient-to-br from-[#0D1B2A] to-[#1E3A5F] border-b-4 border-blue-500 px-5 py-16 text-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 65% 40%, rgba(37,99,235,.22) 0%, transparent 65%)' }} />
        <span className={`relative z-10 inline-flex items-center gap-2 border text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full mb-5 ${badgeColors[upsell.badgeTone] || badgeColors.amber}`}>
          {upsell.badge}
        </span>
        <h1 className="relative z-10 font-bold text-3xl sm:text-4xl leading-tight max-w-xl mx-auto mb-4">
          {upsell.headline}
        </h1>
        <p className="relative z-10 text-white/50 max-w-lg mx-auto text-base">{upsell.sub}</p>
      </div>

      <div className="relative max-w-2xl mx-auto px-5 py-10 space-y-6">

        {/* What's included */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
          <p className="text-xs font-bold tracking-widest text-white/40 uppercase mb-4">What is included</p>
          <ul className="space-y-3">
            {upsell.includes.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-white/70">
                <Check size={15} strokeWidth={2.5} className="text-emerald-400 shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* CTA */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 text-center">
          <p className="text-xs font-bold tracking-widest text-blue-400 uppercase mb-3">One-Time Offer</p>
          <p className="text-4xl font-bold text-white mb-1">${upsell.price}</p>
          <p className="text-white/40 text-sm mb-6">Added to your order — no card re-entry needed</p>

          <button
            type="button"
            onClick={handleAccept}
            disabled={loading}
            className="w-full bg-blue-500 disabled:opacity-60 text-white font-bold py-4 rounded-xl text-base hover:bg-blue-600 transition-colors mb-3 flex items-center justify-center gap-2"
          >
            <ShieldCheck size={18} />
            {loading ? 'Adding…' : `Yes, add ${upsell.name} for $${upsell.price}`}
          </button>
          <button
            type="button"
            onClick={handleDecline}
            className="w-full text-white/30 hover:text-white/50 text-sm py-2 transition-colors"
          >
            {upsell.declineLabel}
          </button>
        </div>

      </div>
    </div>
  );
}
