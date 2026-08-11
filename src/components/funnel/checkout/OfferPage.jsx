import { ShieldCheck, Clock3 } from 'lucide-react';
import { CHECKOUT as C } from '../components/theme';
import EditorialPanel from './EditorialPanel';

/**
 * Shared shell for the one-time offer pages (upsell / downsell), built to the
 * same two-panel language as the checkout: a dark editorial panel carrying the
 * pitch and social proof, beside a white panel carrying the price and the
 * accept / decline pair.
 *
 * Purely presentational — every page keeps its own accept/decline handlers.
 */
export default function OfferPage({
  kicker,
  title,
  blurb,
  photo,
  productName,
  price,
  bodyCopy,
  acceptLabel,
  declineLabel,
  onAccept,
  onDecline,
  loading = false,
}) {
  return (
    <div className="min-h-screen p-4 sm:p-6 flex items-center justify-center" style={{ backgroundColor: C.page }}>
      <div className="w-full max-w-[1000px] grid md:grid-cols-[46fr_54fr] gap-4 sm:gap-5">
        <EditorialPanel kicker={kicker} title={title} blurb={blurb} photo={photo} />

        {/* ---------------- Right: offer panel ---------------- */}
        <div className="rounded-3xl p-6 sm:p-7 flex flex-col" style={{ backgroundColor: C.card }}>
          <div className="rounded-xl p-1 flex" style={{ backgroundColor: C.page }}>
            <span
              className="flex-1 rounded-lg py-2.5 text-center text-[13px] font-bold"
              style={{ backgroundColor: C.lime, color: C.ink }}
            >
              One time offer
            </span>
            <span className="flex-1 py-2.5 text-center text-[13px] font-bold truncate px-2" style={{ color: C.muted }}>
              {productName}
            </span>
          </div>

          <div className="mt-7">
            <h2 className="text-[21px] font-bold leading-snug tracking-tight" style={{ color: C.ink }}>
              {productName}
            </h2>
            <p className="mt-3 flex items-baseline gap-2">
              <span className="text-[38px] font-bold leading-none" style={{ color: C.ink }}>${price}</span>
              <span className="text-[13px] font-semibold" style={{ color: C.muted }}>one-time</span>
            </p>
          </div>

          <div
            className="rounded-2xl p-4 mt-6 text-[13px] leading-relaxed"
            style={{ backgroundColor: C.page, color: C.body }}
          >
            {bodyCopy}
          </div>

          <div className="mt-auto pt-7">
            <button
              type="button"
              onClick={onAccept}
              disabled={loading}
              className="w-full py-4 rounded-xl text-[13.5px] font-bold tracking-wide transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: C.limeDeep, color: C.card }}
            >
              {loading ? 'ADDING…' : acceptLabel}
            </button>

            <button
              type="button"
              onClick={onDecline}
              className="w-full py-3.5 mt-1 text-[12.5px] font-semibold transition-opacity hover:opacity-70"
              style={{ color: C.muted }}
            >
              {declineLabel}
            </button>

            <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 mt-2 text-[11.5px]" style={{ color: C.muted }}>
              <span className="flex items-center gap-1.5"><ShieldCheck size={13} /> 30-day money back guarantee</span>
              <span className="flex items-center gap-1.5"><Clock3 size={13} /> Cancel anytime</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
