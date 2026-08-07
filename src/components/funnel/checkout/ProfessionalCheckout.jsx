import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Star, Check, ShieldCheck, Clock3 } from 'lucide-react';
import { useFunnel } from '../FunnelContext';

// TODO: swap these for your real product config (e.g. fetched from Supabase `products` table)
const CORE_PRODUCT = { id: '200-app-blitz', name: '200-App Blitz', price: 99 };
const BUMP_PRODUCT = { id: 'interview-prep-bump', name: '48-Hour Interview Prep Crash Course', price: 19 };

const CORE_FEATURES = [
  '200 personalized applications',
  'AI + human-reviewed responses',
  'Cover letters included',
  '7-day turnaround',
  'Real-time tracking dashboard',
  'Email support',
];

export default function ProfessionalCheckout() {
  const { answers } = useFunnel();
  const navigate = useNavigate();
  const [bumpSelected, setBumpSelected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const total = CORE_PRODUCT.price + (bumpSelected ? BUMP_PRODUCT.price : 0);

  const handlePurchase = async () => {
    setLoading(true);
    setError(null);
    try {
      // ---------------------------------------------------------------
      // Wire this up to your EXISTING checkout/payment function.
      // Don't write a new payment implementation here — call the same
      // one your in-app checkout already uses, just with these params.
      //
      // Example:
      // const result = await purchaseProduct({
      //   userEmail: answers.personalize?.email,
      //   userName: answers.personalize?.firstName,
      //   items: bumpSelected ? [CORE_PRODUCT, BUMP_PRODUCT] : [CORE_PRODUCT],
      //   amount: total,
      // });
      // if (result.authorizationCode) {
      //   sessionStorage.setItem('funnel_auth_code', result.authorizationCode); // for 1-click upsell
      // }
      // ---------------------------------------------------------------

      navigate('/start/checkout/upsell');
    } catch (err) {
      setError('Something went wrong processing your payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#0A0A0A] min-h-screen px-5 pt-6 pb-10 text-white max-w-lg mx-auto">
      <div className="flex justify-end mb-2">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="text-white/40 text-2xl leading-none hover:text-white/70"
          aria-label="Close"
        >
          ×
        </button>
      </div>

      <div className="text-center mb-6">
        <span className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
          <Zap size={13} strokeWidth={2} /> LIMITED TIME OFFER
        </span>
        <h1 className="text-2xl font-bold">Start Landing Interviews</h1>
        <p className="text-white/50 mt-2">Join 47,000+ job seekers who got hired faster</p>
      </div>

      <div className="border-2 border-blue-500 rounded-2xl p-5 relative mb-4 bg-blue-500/5">
        <span className="absolute -top-3 right-4 bg-blue-500 text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
          <Star size={11} strokeWidth={2} fill="currentColor" /> MOST POPULAR
        </span>
        <h2 className="text-lg font-bold mt-2">{CORE_PRODUCT.name}</h2>
        <p className="text-white/50 text-sm mt-1">Deploy 200 tailored applications in 7 days</p>
        <p className="text-3xl font-bold mt-4">
          ${CORE_PRODUCT.price} <span className="text-base font-normal text-white/40">one-time</span>
        </p>
        <ul className="mt-4 space-y-2 text-sm text-white/80">
          {CORE_FEATURES.map((feature) => (
            <li key={feature} className="flex items-center gap-2">
              <Check size={15} strokeWidth={2.5} className="text-emerald-400 shrink-0" />
              {feature}
            </li>
          ))}
        </ul>
      </div>

      <label className="flex items-start gap-3 bg-white/5 border border-white/10 rounded-2xl p-4 mb-6 cursor-pointer">
        <input
          type="checkbox"
          checked={bumpSelected}
          onChange={(e) => setBumpSelected(e.target.checked)}
          className="mt-1 w-5 h-5 accent-blue-500"
        />
        <div>
          <p className="font-semibold">
            Add {BUMP_PRODUCT.name} — +${BUMP_PRODUCT.price}
          </p>
          <p className="text-white/50 text-sm">One-time add-on, charged together with your order today</p>
        </div>
      </label>

      {error && (
        <p className="text-red-400 text-sm mb-4 text-center" role="alert">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handlePurchase}
        disabled={loading}
        className="w-full bg-blue-500 disabled:opacity-60 text-white font-semibold py-4 rounded-xl text-lg hover:bg-blue-600 transition-colors"
      >
        {loading ? 'Processing…' : `Complete Purchase — $${total}`}
      </button>

      <div className="flex justify-center gap-6 mt-4 text-white/40 text-xs">
        <span className="flex items-center gap-1.5"><ShieldCheck size={14} /> 30-day money back guarantee</span>
        <span className="flex items-center gap-1.5"><Clock3 size={14} /> Cancel anytime</span>
      </div>
    </div>
  );
}
