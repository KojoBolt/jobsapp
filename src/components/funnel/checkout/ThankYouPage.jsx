import { useSearchParams, Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { useFunnel } from '../FunnelContext';

const PRODUCT_LABELS = {
  upsell: { name: 'Salary Negotiation Masterclass', price: 47 },
  downsell: { name: '100 Interview Questions & Answers', price: 12 },
};

export default function ThankYouPage() {
  const [searchParams] = useSearchParams();
  const added = searchParams.get('added'); // 'upsell' | 'downsell' | null
  const { answers } = useFunnel();
  const firstName = answers.personalize?.firstName || 'there';

  const addOn = added ? PRODUCT_LABELS[added] : null;

  // NOTE: for production, replace this with a real read from your
  // `purchases` table (filtered by user_id or session) so the receipt
  // is accurate even if someone refreshes this page or opens it later
  // from an email link, rather than relying on the `added` query param.

  return (
    <div className="bg-black min-h-screen px-5 pt-16 pb-10 text-white flex flex-col items-center text-center">
      <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-6">
        <span className="text-3xl"><Check size={28} strokeWidth={2.5} className="text-emerald-400" /></span>
      </div>
      <h1 className="text-2xl font-bold">You're all set, {firstName}!</h1>
      <p className="text-white/50 mt-2 mb-8">Your order is confirmed and your plan is ready.</p>

      <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-left mb-8">
        <div className="flex justify-between py-2 border-b border-white/10">
          <span className="text-white/70">200-App Blitz</span>
          <span className="font-semibold">$99</span>
        </div>
        {addOn && (
          <div className="flex justify-between py-2">
            <span className="text-white/70">{addOn.name}</span>
            <span className="font-semibold">${addOn.price}</span>
          </div>
        )}
      </div>

      <Link
        to="/dashboard"
        className="w-full bg-indigo-500 text-white font-semibold py-4 rounded-full text-lg"
      >
        Go to my dashboard
      </Link>
    </div>
  );
}
