import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CHECKOUT as C } from '../components/theme';
import OfferPage from './OfferPage';

const DOWNSELL_PRODUCT = { id: 'interview-qa-downsell', name: '100 Interview Questions & Answers', price: 12 };

const HERO_PHOTO =
  'https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=900&q=80&auto=format&fit=crop';

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
    <OfferPage
      kicker="ONE TIME OFFER"
      title={<>Before <span style={{ color: C.lime }}>You Go</span></>}
      blurb={`Just ${DOWNSELL_PRODUCT.name} for $${DOWNSELL_PRODUCT.price} — our most affordable add-on.`}
      photo={HERO_PHOTO}
      productName={DOWNSELL_PRODUCT.name}
      price={DOWNSELL_PRODUCT.price}
      bodyCopy="Walk into every interview ready, with answers to the 100 questions hiring managers ask most."
      acceptLabel={`YES, ADD IT FOR $${DOWNSELL_PRODUCT.price}`}
      declineLabel="No thanks"
      onAccept={handleAccept}
      onDecline={handleDecline}
      loading={loading}
    />
  );
}
