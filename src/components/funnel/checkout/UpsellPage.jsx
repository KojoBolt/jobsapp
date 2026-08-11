import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CHECKOUT as C } from '../components/theme';
import OfferPage from './OfferPage';

const UPSELL_PRODUCT = { id: 'salary-negotiation-upsell', name: 'Salary Negotiation Masterclass', price: 47 };

const HERO_PHOTO =
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=900&q=80&auto=format&fit=crop';

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
    <OfferPage
      kicker="ONE TIME OFFER"
      title={<>Wait — <span style={{ color: C.lime }}>One More Thing</span></>}
      blurb={`Add ${UPSELL_PRODUCT.name} for just $${UPSELL_PRODUCT.price} — shown one time only.`}
      photo={HERO_PHOTO}
      productName={UPSELL_PRODUCT.name}
      price={UPSELL_PRODUCT.price}
      bodyCopy="Negotiate a stronger starting offer using the same scripts our top users relied on to raise their average offer by thousands of dollars."
      acceptLabel={`YES, ADD IT FOR $${UPSELL_PRODUCT.price}`}
      declineLabel="No thanks, I'll skip this"
      onAccept={handleAccept}
      onDecline={handleDecline}
      loading={loading}
    />
  );
}
