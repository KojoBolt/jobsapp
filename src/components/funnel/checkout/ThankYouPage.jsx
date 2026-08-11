import { useSearchParams, Link } from 'react-router-dom';
import { Check, ShieldCheck, Clock3 } from 'lucide-react';
import { useFunnel } from '../FunnelContext';
import { CHECKOUT as C } from '../components/theme';
import EditorialPanel from './EditorialPanel';

const CORE_LINE = { name: '200-App Blitz', price: 99 };

const PRODUCT_LABELS = {
  upsell: { name: 'Salary Negotiation Masterclass', price: 47 },
  downsell: { name: '100 Interview Questions & Answers', price: 12 },
};

const HERO_PHOTO =
  'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=900&q=80&auto=format&fit=crop';

export default function ThankYouPage() {
  const [searchParams] = useSearchParams();
  const added = searchParams.get('added'); // 'upsell' | 'downsell' | null
  const { answers } = useFunnel();
  const firstName = answers.personalize?.firstName || 'there';

  const addOn = added ? PRODUCT_LABELS[added] : null;
  const total = CORE_LINE.price + (addOn ? addOn.price : 0);

  // NOTE: for production, replace this with a real read from your
  // `purchases` table (filtered by user_id or session) so the receipt
  // is accurate even if someone refreshes this page or opens it later
  // from an email link, rather than relying on the `added` query param.

  return (
    <div className="min-h-screen p-4 sm:p-6 flex items-center justify-center" style={{ backgroundColor: C.page }}>
      <div className="w-full max-w-[1000px] grid md:grid-cols-[46fr_54fr] gap-4 sm:gap-5">
        <EditorialPanel
          kicker="ORDER CONFIRMED"
          title={<>You're <span style={{ color: C.lime }}>all set</span>, {firstName}!</>}
          blurb="Your order is confirmed and your plan is ready. Head to your dashboard to watch your applications go out."
          photo={HERO_PHOTO}
          proofLabel="You're in good company"
        />

        {/* ---------------- Right: receipt panel ---------------- */}
        <div className="rounded-3xl p-6 sm:p-7 flex flex-col" style={{ backgroundColor: C.card }}>
          <span
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ backgroundColor: C.lime }}
          >
            <Check size={26} strokeWidth={3} style={{ color: C.limeDeep }} />
          </span>

          <h2 className="text-[21px] font-bold leading-snug tracking-tight mt-5" style={{ color: C.ink }}>
            Order summary
          </h2>
          <p className="text-[13px] mt-1.5" style={{ color: C.muted }}>
            A copy of this receipt is available any time from your dashboard.
          </p>

          <div className="rounded-2xl p-5 mt-6" style={{ backgroundColor: C.page }}>
            <div className="flex items-center justify-between text-[13px]" style={{ color: C.body }}>
              <span>{CORE_LINE.name}</span>
              <span className="font-semibold" style={{ color: C.ink }}>${CORE_LINE.price}</span>
            </div>

            {addOn && (
              <div className="flex items-center justify-between text-[13px] mt-2.5" style={{ color: C.body }}>
                <span className="pr-4">{addOn.name}</span>
                <span className="font-semibold" style={{ color: C.ink }}>${addOn.price}</span>
              </div>
            )}

            <div
              className="flex items-center justify-between mt-4 pt-4"
              style={{ borderTop: `1px solid ${C.hairline}` }}
            >
              <span className="text-[13px] font-bold" style={{ color: C.ink }}>Total paid</span>
              <span className="text-[22px] font-bold" style={{ color: C.ink }}>${total}</span>
            </div>
          </div>

          <div className="mt-auto pt-7">
            <Link
              to="/dashboard"
              className="block w-full py-4 rounded-xl text-center text-[13.5px] font-bold tracking-wide transition-opacity hover:opacity-90"
              style={{ backgroundColor: C.limeDeep, color: C.card }}
            >
              GO TO MY DASHBOARD
            </Link>

            <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 mt-4 text-[11.5px]" style={{ color: C.muted }}>
              <span className="flex items-center gap-1.5"><ShieldCheck size={13} /> 30-day money back guarantee</span>
              <span className="flex items-center gap-1.5"><Clock3 size={13} /> 7-day turnaround</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
