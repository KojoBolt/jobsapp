import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Check, ShieldCheck, Clock3, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useFunnel } from '../FunnelContext';
import { CHECKOUT as C } from '../components/theme';
import EditorialPanel from './EditorialPanel';

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

const HERO_PHOTO =
  'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=900&q=80&auto=format&fit=crop';

/** Amount-preset pill, matching the reference's selected/idle treatment. */
function PricePill({ label, price, badge, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className="relative flex-1 rounded-xl px-4 py-3.5 text-sm font-bold transition-colors"
      style={{
        backgroundColor: selected ? C.lime : C.card,
        color: C.ink,
        boxShadow: selected ? 'none' : `inset 0 0 0 1px ${C.hairline}`,
      }}
    >
      {badge && (
        <span
          className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[9px] font-bold tracking-wide px-2 py-0.5 rounded-md whitespace-nowrap"
          style={{ backgroundColor: C.limeDeep, color: C.lime }}
        >
          {badge}
        </span>
      )}
      <span className="block">${price}</span>
      <span className="block text-[10.5px] font-medium mt-0.5" style={{ color: selected ? C.limeDeep : C.muted }}>
        {label}
      </span>
    </button>
  );
}

function FieldLabel({ children }) {
  return (
    <p className="text-[13px] font-bold mb-2" style={{ color: C.ink }}>
      {children}
    </p>
  );
}

export default function ProfessionalCheckout() {
  const { answers } = useFunnel();
  const navigate = useNavigate();
  const [bumpSelected, setBumpSelected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const total = CORE_PRODUCT.price + (bumpSelected ? BUMP_PRODUCT.price : 0);
  const firstName = answers.personalize?.firstName || '';

  const handlePurchase = async () => {
    // The funnel runs outside the auth guard, so the only email we have is the
    // one collected in the quiz. Without it Paystack can't initialise.
    const email = answers.personalize?.email;
    if (!email) {
      setError('We need your email address before checkout. Please go back and complete the quiz.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const items = bumpSelected ? [CORE_PRODUCT, BUMP_PRODUCT] : [CORE_PRODUCT];

      // Only item IDs go over the wire — prices live in the function's
      // server-side catalog so the amount can't be tampered with. The function
      // also creates the buyer's auth user, which payments.user_id requires.
      const { data, error: fnError } = await supabase.functions.invoke('initialize-paystack-funnel', {
        body: {
          email,
          firstName: answers.personalize?.firstName || '',
          itemIds: items.map((i) => i.id),
          // Paystack sends the buyer back here with ?reference=&trxref=
          callbackUrl: `${window.location.origin}/start/checkout/success`,
        },
      });

      if (fnError) {
        // supabase-js wraps non-2xx responses; the function's own message is on
        // `context`, so without this the real reason never reaches the surface.
        const body = await fnError.context?.json?.().catch(() => null);
        throw new Error(body?.error || fnError.message || 'Checkout could not be started.');
      }
      if (!data?.authorization_url) throw new Error('No checkout URL returned.');

      // Hand off to Paystack — no setLoading(false), this page is unloading.
      window.location.href = data.authorization_url;
    } catch (err) {
      console.error('Funnel checkout failed:', err);
      setError(err?.message || 'Something went wrong starting your payment. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 flex items-center justify-center" style={{ backgroundColor: C.page }}>
      <div className="w-full max-w-[1000px] grid md:grid-cols-[46fr_54fr] gap-4 sm:gap-5">
        <EditorialPanel
          kicker="LIMITED TIME OFFER"
          title={<>Start <span style={{ color: C.lime }}>Landing Interviews</span> Today</>}
          blurb={`${firstName ? `${firstName}, join` : 'Join'} 47,000+ job seekers who got hired faster. We send 200 tailored applications on your behalf — you just take the calls.`}
          photo={HERO_PHOTO}
          footerRow={
            <div className="flex items-center justify-between mt-4 text-[12px]">
              <span className="font-bold" style={{ color: C.ink }}>7-day turnaround</span>
              <span style={{ color: C.muted }}>200 applications</span>
            </div>
          }
        />

        {/* ---------------- Right: order panel ---------------- */}
        <div className="rounded-3xl p-6 sm:p-7 flex flex-col" style={{ backgroundColor: C.card }}>
          <div className="flex justify-end -mt-1 -mr-1 mb-1">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-black/5"
              style={{ color: C.muted }}
              aria-label="Close"
            >
              <X size={17} strokeWidth={2.25} />
            </button>
          </div>

          <div className="rounded-xl p-1 flex" style={{ backgroundColor: C.page }}>
            <span
              className="flex-1 rounded-lg py-2.5 text-center text-[13px] font-bold"
              style={{ backgroundColor: C.lime, color: C.ink }}
            >
              One Time
            </span>
            <span className="flex-1 py-2.5 text-center text-[13px] font-bold" style={{ color: C.muted }}>
              {CORE_PRODUCT.name}
            </span>
          </div>

          <div className="mt-7">
            <FieldLabel>Choose your package</FieldLabel>
            <div className="flex gap-2.5">
              <PricePill
                label="Blitz only"
                price={CORE_PRODUCT.price}
                selected={!bumpSelected}
                onClick={() => setBumpSelected(false)}
              />
              <PricePill
                label="Blitz + Prep"
                price={CORE_PRODUCT.price + BUMP_PRODUCT.price}
                badge="MOST POPULAR"
                selected={bumpSelected}
                onClick={() => setBumpSelected(true)}
              />
            </div>
          </div>

          <p className="flex items-center gap-2 text-[12.5px] font-semibold mt-3.5" style={{ color: C.limeDeep }}>
            <Zap size={14} strokeWidth={2.25} />
            Your ${total} deploys {CORE_PRODUCT.name.toLowerCase()} in 7 days
          </p>

          <div className="mt-6">
            <FieldLabel>What's included</FieldLabel>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5">
              {CORE_FEATURES.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-[12.5px]" style={{ color: C.body }}>
                  <span
                    className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-px"
                    style={{ backgroundColor: C.lime }}
                  >
                    <Check size={10} strokeWidth={3.5} style={{ color: C.limeDeep }} />
                  </span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6 pt-5" style={{ borderTop: `1px solid ${C.hairline}` }}>
            <div className="flex items-center justify-between text-[13px]" style={{ color: C.body }}>
              <span>{CORE_PRODUCT.name}</span>
              <span>${CORE_PRODUCT.price}</span>
            </div>
            {bumpSelected && (
              <div className="flex items-center justify-between text-[13px] mt-2" style={{ color: C.body }}>
                <span className="pr-4">{BUMP_PRODUCT.name}</span>
                <span>${BUMP_PRODUCT.price}</span>
              </div>
            )}
            <div className="flex items-center justify-between mt-3.5">
              <span className="text-[13px] font-bold" style={{ color: C.ink }}>Total due today</span>
              <span className="text-[22px] font-bold" style={{ color: C.ink }}>${total}</span>
            </div>
          </div>

          {error && (
            <p className="text-[12.5px] mt-4 font-semibold" style={{ color: '#C0392B' }} role="alert">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={handlePurchase}
            disabled={loading}
            className="w-full mt-6 py-4 rounded-xl text-[13.5px] font-bold tracking-wide transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ backgroundColor: C.limeDeep, color: C.card }}
          >
            {loading ? 'PROCESSING…' : `COMPLETE PURCHASE — $${total}`}
          </button>

          <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 mt-4 text-[11.5px]" style={{ color: C.muted }}>
            <span className="flex items-center gap-1.5"><ShieldCheck size={13} /> 30-day money back guarantee</span>
            <span className="flex items-center gap-1.5"><Clock3 size={13} /> Cancel anytime</span>
          </div>
        </div>
      </div>
    </div>
  );
}
