import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target } from 'lucide-react';

const UPSELL_PRODUCT = { id: 'salary-negotiation-upsell', name: 'Salary Negotiation Masterclass', price: 47 };

export default function UpsellPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    setLoading(true);
    try {
      // ---------------------------------------------------------------
      // If the core purchase was via Paystack, reuse the stored
      // authorization_code for a true 1-click charge here:
      //
      // const authCode = sessionStorage.getItem('funnel_auth_code');
      // if (authCode) {
      //   await chargeAuthorization({ authCode, amount: UPSELL_PRODUCT.price, productId: UPSELL_PRODUCT.id });
      // } else {
      //   // Cryptomus payers (or no stored auth code) — send to a fresh checkout instead
      //   navigate('/start/checkout/upsell-payment');
      //   return;
      // }
      // ---------------------------------------------------------------

      navigate('/start/checkout/thank-you?added=upsell');
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = () => navigate('/start/checkout/downsell');

  return (
    <div className="bg-black min-h-screen px-5 pt-12 pb-10 text-white flex flex-col">
      <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-4">
        <Target size={22} strokeWidth={1.75} className="text-blue-400" />
      </div>
      <h1 className="text-2xl font-bold text-center">Wait — One More Thing</h1>
      <p className="text-white/50 text-center mt-2 mb-8">
        Add {UPSELL_PRODUCT.name} for just ${UPSELL_PRODUCT.price} — shown one time only.
      </p>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex-1">
        <p className="text-white/70">
          Negotiate a stronger starting offer using the same scripts our top users relied on to
          raise their average offer by thousands of dollars.
        </p>
      </div>

      <button
        type="button"
        onClick={handleAccept}
        disabled={loading}
        className="w-full bg-indigo-500 disabled:opacity-60 text-white font-semibold py-4 rounded-full text-lg mt-6"
      >
        {loading ? 'Adding…' : `Yes, add it for $${UPSELL_PRODUCT.price}`}
      </button>
      <button
        type="button"
        onClick={handleDecline}
        className="w-full text-white/40 py-4 text-sm"
      >
        No thanks, I'll skip this
      </button>
    </div>
  );
}
