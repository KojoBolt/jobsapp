import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

const DOWNSELL_PRODUCT = { id: 'interview-qa-downsell', name: '100 Interview Questions & Answers', price: 12 };

export default function DownsellPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    setLoading(true);
    try {
      // Same pattern as UpsellPage.jsx — reuse stored authorization_code
      // for Paystack, or route to a fresh checkout for Cryptomus.
      navigate('/start/checkout/thank-you?added=downsell');
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = () => navigate('/start/checkout/thank-you');

  return (
    <div className="bg-black min-h-screen px-5 pt-12 pb-10 text-white flex flex-col">
      <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-4">
        <Sparkles size={22} strokeWidth={1.75} className="text-blue-400" />
      </div>
      <h1 className="text-2xl font-bold text-center">Before You Go</h1>
      <p className="text-white/50 text-center mt-2 mb-8">
        Just {DOWNSELL_PRODUCT.name} for ${DOWNSELL_PRODUCT.price} — our most affordable add-on.
      </p>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex-1">
        <p className="text-white/70">
          Walk into every interview ready, with answers to the 100 questions hiring managers ask most.
        </p>
      </div>

      <button
        type="button"
        onClick={handleAccept}
        disabled={loading}
        className="w-full bg-indigo-500 disabled:opacity-60 text-white font-semibold py-4 rounded-full text-lg mt-6"
      >
        {loading ? 'Adding…' : `Yes, add it for $${DOWNSELL_PRODUCT.price}`}
      </button>
      <button
        type="button"
        onClick={handleDecline}
        className="w-full text-white/40 py-4 text-sm"
      >
        No thanks
      </button>
    </div>
  );
}
