import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Check, ArrowRight, ShieldCheck, Clock3 } from 'lucide-react';
import { useFunnel } from '../FunnelContext';
import { CHECKOUT as C } from '../components/theme';
import EditorialPanel from './EditorialPanel';

const HERO_PHOTO =
  'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=900&q=80&auto=format&fit=crop';

/**
 * Landing page for Paystack's callback_url after a funnel purchase.
 *
 * NOTE: Paystack redirects here after the payment *attempt* — arriving is not
 * proof the charge succeeded. Until a server-side verify runs (see
 * paystack-webhook's /transaction/verify call), treat this as optimistic.
 */
export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { answers } = useFunnel();

  const reference = searchParams.get('reference') || searchParams.get('trxref');
  const firstName = answers.personalize?.firstName || 'there';

  return (
    <div className="min-h-screen p-4 sm:p-6 flex items-center justify-center" style={{ backgroundColor: C.page }}>
      <div className="w-full max-w-[1000px] grid md:grid-cols-[46fr_54fr] gap-4 sm:gap-5">
        <EditorialPanel
          kicker="PAYMENT RECEIVED"
          title={<>You're <span style={{ color: C.lime }}>in</span>, {firstName}!</>}
          blurb="Your order is being set up right now. Your applications start going out as soon as your plan is live."
          photo={HERO_PHOTO}
          proofLabel="You're in good company"
        />

        <div className="rounded-3xl p-6 sm:p-7 flex flex-col" style={{ backgroundColor: C.card }}>
          <span
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ backgroundColor: C.lime }}
          >
            <Check size={26} strokeWidth={3} style={{ color: C.limeDeep }} />
          </span>

          <h2 className="text-[24px] font-bold leading-snug tracking-tight mt-5" style={{ color: C.ink }}>
            Payment successful
          </h2>
          <p className="text-[13px] leading-relaxed mt-2" style={{ color: C.muted }}>
            Thanks {firstName} — we've received your payment and your order is confirmed.
          </p>

          {reference && (
            <div className="rounded-2xl p-4 mt-6" style={{ backgroundColor: C.page }}>
              <p className="text-[11px] font-bold tracking-[0.1em]" style={{ color: C.muted }}>
                REFERENCE
              </p>
              <p className="text-[13px] font-semibold mt-1.5 break-all" style={{ color: C.ink }}>
                {reference}
              </p>
            </div>
          )}

          <div className="mt-auto pt-7">
            <button
              type="button"
              onClick={() => navigate('/start/checkout/upsell')}
              className="w-full py-4 rounded-xl flex items-center justify-center gap-2.5 text-[13.5px] font-bold tracking-wide transition-opacity hover:opacity-90"
              style={{ backgroundColor: C.limeDeep, color: C.card }}
            >
              CONTINUE — SEE WHAT'S NEXT
              <ArrowRight size={17} strokeWidth={2.5} />
            </button>

            <Link
              to="/dashboard"
              className="block w-full py-3.5 mt-1 text-center text-[12.5px] font-semibold transition-opacity hover:opacity-70"
              style={{ color: C.muted }}
            >
              Skip and go to my dashboard
            </Link>

            <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 mt-2 text-[11.5px]" style={{ color: C.muted }}>
              <span className="flex items-center gap-1.5"><ShieldCheck size={13} /> 30-day money back guarantee</span>
              <span className="flex items-center gap-1.5"><Clock3 size={13} /> 7-day turnaround</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
