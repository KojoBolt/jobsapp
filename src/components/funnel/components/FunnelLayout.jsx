import { useState } from 'react';
import { Icon } from '../icons';

// One curated photo per funnel stage. IDs point at Unsplash's CDN.
// onError below swaps to a clean gradient panel if a link ever breaks,
// so a bad URL degrades gracefully instead of showing a broken image.
const STAGE_IMAGES = {
  Profile: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=900&q=80&auto=format&fit=crop',
  Context: 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=900&q=80&auto=format&fit=crop',
  Targeting: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=900&q=80&auto=format&fit=crop',
  Plan: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=900&q=80&auto=format&fit=crop',
};

const STAGE_STATS = {
  Profile: { value: '47,000+', label: 'job seekers onboarded' },
  Context: { value: '2.5M+', label: 'applications sent' },
  Targeting: { value: '4.9/5', label: 'average user rating' },
  Plan: { value: '7 days', label: 'to 200 applications' },
};

function PhotoVisual({ stage, icon }) {
  const [errored, setErrored] = useState(false);
  const src = STAGE_IMAGES[stage];
  const stat = STAGE_STATS[stage];

  return (
    <div className="relative w-full h-full min-h-[420px] rounded-3xl overflow-hidden border border-white/10">
      {!errored && src ? (
        <img
          src={src}
          alt=""
          onError={() => setErrored(true)}
          className="absolute inset-0 w-full h-full object-cover opacity-50"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-[#0A0A0A] to-[#0A0A0A]" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/30 to-transparent" />

      <div className="absolute top-6 left-6 w-11 h-11 rounded-xl bg-black/40 backdrop-blur border border-white/10 flex items-center justify-center">
        <Icon name={icon} size={20} strokeWidth={1.75} className="text-white" />
      </div>

      {stat && (
        <div className="absolute bottom-6 left-6 right-6 bg-black/50 backdrop-blur-md border border-white/10 rounded-2xl px-5 py-4">
          <p className="text-white text-2xl font-bold tracking-tight">{stat.value}</p>
          <p className="text-white/50 text-xs mt-0.5">{stat.label}</p>
        </div>
      )}
    </div>
  );
}

/**
 * Two-column shell: kicker + headline + content on the left,
 * real photography (with a floating stat card) on the right.
 */
export default function FunnelLayout({ kicker, icon, title, subtitle, children, stage }) {
  return (
    <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 px-6 sm:px-10 pb-16 max-w-6xl mx-auto items-stretch">
      <div className="max-w-md">
        {kicker && (
          <div className="flex items-center gap-2 mb-5">
            <span className="w-7 h-7 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center">
              <Icon name={icon} size={15} strokeWidth={2} />
            </span>
            <span className="text-xs font-semibold tracking-widest text-blue-400 uppercase">{kicker}</span>
          </div>
        )}
        <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight tracking-tight">{title}</h1>
        {subtitle && <p className="text-white/50 mt-3 text-base">{subtitle}</p>}
        <div className="mt-8">{children}</div>
      </div>

      <div className="hidden lg:block">
        <PhotoVisual stage={stage} icon={icon} />
      </div>
    </div>
  );
}
