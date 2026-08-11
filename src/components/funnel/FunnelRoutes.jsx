import { Routes, Route } from 'react-router-dom';
import { FunnelProvider } from './FunnelContext';
import OnboardingQuiz from './OnboardingQuiz';

// Professional track
import ProfessionalCheckout from './checkout/ProfessionalCheckout';
import UpsellPage from './checkout/UpsellPage';
import DownsellPage from './checkout/DownsellPage';

// Intern/experience track — single dynamic component handles all 5 tracks
// and all upsell steps via ?step=N query param
import InternCheckout from './checkout/InternCheckout';
import InternUpsellPage from './checkout/InternUpsellPage';
import InternDownsellPage from './checkout/InternDownsellPage';

// Shared
import PaymentSuccessPage from './checkout/PaymentSuccessPage';
import ThankYouPage from './checkout/ThankYouPage';

/**
 * Mount under /start/* in your main App.jsx router, OUTSIDE any auth guard.
 *
 *   <Route path="/start/*" element={<FunnelRoutes />} />
 *
 * Professional track (experienceLevel.track === 'professional'):
 *   /start → quiz → /start/checkout
 *   → /start/checkout/upsell
 *   → accept: /start/checkout/thank-you
 *   → decline: /start/checkout/downsell → /start/checkout/thank-you
 *
 * All other tracks (intern, entry, mid, senior, executive):
 *   /start → quiz → /start/checkout/intern
 *   → /start/checkout/intern/upsell?step=0  (first upsell from config)
 *   → /start/checkout/intern/upsell?step=1  (second upsell if config has one)
 *   → decline last upsell: /start/checkout/intern/downsell
 *   → all paths end at: /start/checkout/thank-you
 *
 * The track (intern/entry/mid/senior/executive) is stored in sessionStorage
 * after the core purchase so InternUpsellPage and InternDownsellPage can
 * load the correct config without needing it in the URL.
 */
export default function FunnelRoutes() {
  return (
    <FunnelProvider>
      <Routes>
        {/* Shared quiz */}
        <Route index element={<OnboardingQuiz />} />

        {/* Professional track */}
        <Route path="checkout" element={<ProfessionalCheckout />} />
        <Route path="checkout/upsell" element={<UpsellPage />} />
        <Route path="checkout/downsell" element={<DownsellPage />} />

        {/* All non-professional tracks share these 3 routes.
            InternCheckout reads experienceLevel from FunnelContext to
            pick the right config. InternUpsellPage iterates upsells[]
            via ?step=N — no separate route per upsell step needed. */}
        <Route path="checkout/intern" element={<InternCheckout />} />
        <Route path="checkout/intern/upsell" element={<InternUpsellPage />} />
        <Route path="checkout/intern/downsell" element={<InternDownsellPage />} />

        {/* Paystack callback_url lands here after the core purchase, then the
            buyer continues into the upsell chain from the Continue button. */}
        <Route path="checkout/success" element={<PaymentSuccessPage />} />

        {/* Shared thank-you — both tracks land here */}
        <Route path="checkout/thank-you" element={<ThankYouPage />} />
      </Routes>
    </FunnelProvider>
  );
}
