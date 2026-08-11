import { useState } from 'react';
import { CHECKOUT as C } from '../components/theme';
import { PROOF_AVATARS, TESTIMONIAL } from './proof';

/**
 * The dark left-hand panel shared by every checkout-flow page: a grayscale
 * photo under a gradient, the pitch, and two white proof cards stacked at the
 * bottom. Pages differ only in copy, photo, and an optional extra row inside
 * the first proof card.
 */
export default function EditorialPanel({
  kicker,
  title,
  blurb,
  photo,
  proofLabel = 'Join 47,000+ job seekers',
  footerRow = null,
}) {
  const [photoErrored, setPhotoErrored] = useState(false);

  return (
    <div
      className="relative rounded-3xl overflow-hidden p-7 flex flex-col min-h-[420px]"
      style={{ backgroundColor: C.panel }}
    >
      {!photoErrored && photo && (
        <img
          src={photo}
          alt=""
          onError={() => setPhotoErrored(true)}
          className="absolute inset-0 w-full h-full object-cover grayscale opacity-45"
        />
      )}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(180deg, rgba(21,21,21,0.55) 0%, rgba(21,21,21,0.92) 62%)' }}
      />

      <div className="relative">
        <p className="text-[11px] font-bold tracking-[0.14em] text-white">{kicker}</p>
        <h1 className="text-[34px] leading-[1.1] font-bold tracking-tight text-white mt-4">{title}</h1>
        {blurb && <p className="text-[13px] leading-relaxed text-white/70 mt-4 max-w-[340px]">{blurb}</p>}
      </div>

      <div className="relative mt-auto pt-8 flex flex-col gap-3">
        <div className="rounded-2xl p-4" style={{ backgroundColor: C.card }}>
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2.5 shrink-0">
              {PROOF_AVATARS.map((src) => (
                <img
                  key={src}
                  src={src}
                  alt=""
                  className="w-8 h-8 rounded-full object-cover border-2 border-white"
                  style={{ backgroundColor: C.hairline }}
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              ))}
              <span
                className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold"
                style={{ backgroundColor: C.lime, color: C.limeDeep }}
              >
                +47k
              </span>
            </div>
            <p className="text-[13px] font-semibold" style={{ color: C.ink }}>{proofLabel}</p>
          </div>

          {footerRow}
        </div>

        <div className="rounded-2xl p-4" style={{ backgroundColor: C.card }}>
          <div className="flex items-center gap-3">
            <img
              src={TESTIMONIAL.avatar}
              alt=""
              className="w-10 h-10 rounded-full object-cover shrink-0"
              style={{ backgroundColor: C.hairline }}
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <div className="min-w-0">
              <p className="text-[13px] font-bold leading-tight" style={{ color: C.ink }}>{TESTIMONIAL.name}</p>
              <p className="text-[11.5px] mt-0.5 truncate" style={{ color: C.muted }}>{TESTIMONIAL.role}</p>
            </div>
          </div>
          <p className="text-[12.5px] italic leading-relaxed mt-3" style={{ color: C.body }}>
            "{TESTIMONIAL.quote}"
          </p>
        </div>
      </div>
    </div>
  );
}
