import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Star, Check, ShieldCheck, Clock3 } from 'lucide-react';
import { useFunnel } from '../FunnelContext';
import { INTERN_FUNNEL_CONFIGS } from './internFunnelConfig';

const STEP_LABELS = ['Checkout', 'Upsell 1', 'Upsell 2', 'Complete'];

export default function InternCheckout() {
  const { answers } = useFunnel();
  const navigate = useNavigate();
  const [bumpSelected, setBumpSelected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Derive config from the experience level the user selected in the quiz.
  // Falls back to 'intern' if something unexpected comes through.
  const track = answers.experienceLevel?.value || 'intern';
  const config = INTERN_FUNNEL_CONFIGS[track] || INTERN_FUNNEL_CONFIGS.intern;
  const { core, bump } = config;

  const total = core.price + (bumpSelected ? bump.price : 0);
  const firstName = answers.personalize?.firstName || '';

  const handlePurchase = async () => {
    setLoading(true);
    setError(null);
    try {
      // ---------------------------------------------------------------
      // Call your existing payment function — same as ProfessionalCheckout.
      //
      // const result = await purchaseProduct({
      //   userEmail: answers.personalize?.email,
      //   userName: firstName,
      //   items: bumpSelected ? [core, bump] : [core],
      //   amount: total,
      //   track,
      // });
      // if (result.authorizationCode) {
      //   sessionStorage.setItem('funnel_auth_code', result.authorizationCode);
      // }
      // sessionStorage.setItem('funnel_track', track); // so upsell pages know which config to load
      // ---------------------------------------------------------------

      // Persist track so the upsell pages can read the right config
      sessionStorage.setItem('funnel_track', track);
      navigate('/start/checkout/intern/upsell?step=0');
    } catch (err) {
      setError('Something went wrong processing your payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative bg-[#0A0A0A] min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute -top-40 -right-40 w-[480px] h-[480px] rounded-full bg-blue-600/10 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 w-[480px] h-[480px] rounded-full bg-blue-600/5 blur-[120px]" />

      <div className="relative max-w-5xl mx-auto px-5 pt-6 pb-16 text-white">

        {/* Top bar */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2 text-white/40 text-xs">
            <ShieldCheck size={14} /> Secure Checkout
          </div>
          <button type="button" onClick={() => navigate('/')} className="text-white/30 hover:text-white/60 transition-colors text-2xl leading-none" aria-label="Close">×</button>
        </div>

        {/* Step rail — dynamic based on how many upsells this track has */}
        <div className="flex items-center gap-2 mb-10 overflow-x-auto pb-1">
          {['Checkout', ...config.upsells.map((u, i) => u.name), 'Complete'].map((s, i, arr) => (
            <div key={s} className="flex items-center gap-2 shrink-0">
              <div className={`flex items-center gap-2 text-xs font-semibold ${i === 0 ? 'text-blue-400' : 'text-white/25'}`}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-blue-500 text-white' : 'bg-white/10 text-white/30'}`}>
                  {i + 1}
                </span>
                <span className="hidden sm:inline uppercase tracking-wider text-[10px]">{s}</span>
              </div>
              {i < arr.length - 1 && <span className="text-white/20 text-sm">›</span>}
            </div>
          ))}
        </div>

        {/* Urgency banner */}
        <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-8">
          <Zap size={18} className="text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-300 font-semibold text-sm">Your applications go out in 24 hours.</p>
            <p className="text-amber-200/60 text-xs mt-0.5">Make sure your materials are optimised before they do. This is the last chance to add the {bump.name} before checkout.</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_340px] gap-6 items-start">

          {/* LEFT — core product + bump */}
          <div>
            {/* Core product card */}
            <div className="relative bg-white/[0.03] border-2 border-blue-500 rounded-2xl p-6 mb-5">
              <span className="absolute -top-3 right-5 bg-blue-500 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                <Star size={11} strokeWidth={2} fill="currentColor" /> MOST POPULAR
              </span>
              <div>
                <p className="font-bold text-white text-lg">{core.name}</p>
                <p className="text-white/40 text-xs mt-0.5 mb-4">{core.subtitle}</p>
              </div>
              <p className="text-4xl font-bold text-white mb-1">
                ${core.price} <span className="text-base font-normal text-white/40">one-time</span>
              </p>
              <ul className="mt-5 space-y-2.5">
                {core.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-white/70">
                    <Check size={15} strokeWidth={2.5} className="text-emerald-400 shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Order bump */}
            <div className="bg-white/[0.03] border-2 border-amber-500/40 rounded-2xl overflow-hidden mb-5">
              <div className="bg-amber-500/15 border-b border-amber-500/20 px-5 py-3 flex items-center gap-3">
                <span className="bg-[#0A0A0A] text-amber-400 text-xs font-bold px-2.5 py-1 rounded-full border border-amber-500/30">ADD TO ORDER</span>
                <p className="text-amber-300 font-semibold text-sm">{bump.name}</p>
              </div>
              <div className="p-5">
                <label className="flex items-start gap-4 bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 mb-5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bumpSelected}
                    onChange={(e) => setBumpSelected(e.target.checked)}
                    className="mt-1 w-5 h-5 accent-amber-500 shrink-0 cursor-pointer"
                  />
                  <div>
                    <p className="font-bold text-white text-sm">
                      YES, add {bump.name} for just{' '}
                      <span className="text-amber-400">${bump.price}</span>{' '}
                      <span className="text-white/30 line-through">${bump.originalPrice}</span>
                    </p>
                    <p className="text-white/50 text-xs mt-1">{bump.description}</p>
                  </div>
                </label>
                <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
                  <p className="text-xs font-bold tracking-widest text-white/40 uppercase mb-3">What is included</p>
                  <ul className="space-y-2">
                    {bump.includes.map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-sm text-white/60">
                        <Check size={14} strokeWidth={2.5} className="text-emerald-400 shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT — order summary + payment */}
          <div className="lg:sticky lg:top-6">
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-4">
              <p className="text-xs font-bold tracking-widest text-white/40 uppercase mb-4">Your Order</p>
              <div className="space-y-3">
                <div className="flex justify-between items-start text-sm pb-3 border-b border-white/10">
                  <div>
                    <p className="text-white font-medium">{core.name}</p>
                    <p className="text-white/40 text-xs mt-0.5">{core.subtitle}</p>
                  </div>
                  <span className="text-blue-400 font-bold whitespace-nowrap ml-4">${core.price}</span>
                </div>
                {bumpSelected && (
                  <div className="flex justify-between items-start text-sm pb-3 border-b border-white/10">
                    <div>
                      <p className="text-white font-medium">{bump.name}</p>
                      <p className="text-white/40 text-xs mt-0.5">One-time add-on</p>
                    </div>
                    <span className="text-amber-400 font-bold whitespace-nowrap ml-4">${bump.price}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-1">
                  <span className="font-bold text-white">Total</span>
                  <span className="text-2xl font-bold text-white">${total}.00</span>
                </div>
              </div>
            </div>

            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5">
              <p className="font-bold text-white text-sm mb-4">Payment Details</p>
              <div className="space-y-3 mb-4">
                <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white/30 text-sm flex items-center justify-between">
                  <span>Card number</span>
                  <div className="flex gap-1.5">
                    <span className="w-7 h-5 bg-white/20 rounded" />
                    <span className="w-7 h-5 bg-white/20 rounded" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white/30 text-sm">MM / YY</div>
                  <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white/30 text-sm">CVV</div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white/30 text-sm">Name on card</div>
              </div>

              {error && <p className="text-red-400 text-sm mb-4 text-center" role="alert">{error}</p>}

              <button
                type="button"
                onClick={handlePurchase}
                disabled={loading}
                className="w-full bg-blue-500 disabled:opacity-60 text-white font-bold py-4 rounded-xl text-base hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
              >
                <ShieldCheck size={18} />
                {loading ? 'Processing…' : `Complete Purchase $${total}.00`}
              </button>

              <div className="flex items-center justify-center gap-4 mt-4 text-white/30 text-xs">
                <span className="flex items-center gap-1"><ShieldCheck size={12} /> 7-day money-back guarantee</span>
                <span className="flex items-center gap-1"><Clock3 size={12} /> No recurring charges</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
