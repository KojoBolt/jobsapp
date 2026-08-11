import { ArrowLeft, ArrowRight, Check, Sparkles } from 'lucide-react';
import { FUNNEL, STAGES } from './theme';

function Brand() {
  return (
    <div className="flex items-center gap-2">
      <span
        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
        style={{ backgroundColor: FUNNEL.hairline }}
      >
        <Sparkles size={14} strokeWidth={2.25} style={{ color: FUNNEL.muted }} />
      </span>
      <span className="text-[17px] font-bold tracking-tight" style={{ color: FUNNEL.brandText }}>
        JobApp AI
      </span>
    </div>
  );
}

/**
 * Vertical stepper: filled orange check = done, orange ring + dot = current,
 * hollow tan dot = upcoming. The connector below a step is orange once that
 * step has been reached.
 */
function Stepper({ currentIndex }) {
  return (
    <ol className="mt-6">
      {STAGES.map((stage, i) => {
        const done = i < currentIndex;
        const current = i === currentIndex;
        const isLast = i === STAGES.length - 1;

        return (
          <li key={stage.name} className="relative flex gap-2.5 pb-7 last:pb-0">
            {/* Connector runs orange up to and including the current step. */}
            {!isLast && (
              <span
                className="absolute left-[10.25px] top-[22px] bottom-0 w-[1.5px]"
                style={{ backgroundColor: i <= currentIndex ? FUNNEL.accent : FUNNEL.hairline }}
                aria-hidden="true"
              />
            )}

            <span
              className="relative z-10 w-[22px] h-[22px] rounded-full flex items-center justify-center shrink-0"
              style={
                done
                  ? { backgroundColor: FUNNEL.accent }
                  : current
                  ? { backgroundColor: FUNNEL.sidebar, border: `2.5px solid ${FUNNEL.accent}` }
                  : { backgroundColor: FUNNEL.sidebar, border: `1.5px solid ${FUNNEL.hairline}` }
              }
            >
              {done && <Check size={12} strokeWidth={3.5} className="text-white" />}
              {current && (
                <span className="w-[8px] h-[8px] rounded-full" style={{ backgroundColor: FUNNEL.accent }} />
              )}
              {!done && !current && (
                <span className="w-[7px] h-[7px] rounded-full" style={{ backgroundColor: FUNNEL.dot }} />
              )}
            </span>

            {/* Titles stay dark at every state — only the circle carries progress. */}
            <div className="-mt-px">
              <p className="text-[13px] font-bold leading-tight" style={{ color: FUNNEL.ink }}>
                {stage.name}
              </p>
              <p className="text-[11px] leading-[1.6] mt-1" style={{ color: FUNNEL.muted }}>
                {stage.description}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/** Stands in for the sidebar below `md`, where the rail is hidden. */
function MobileProgress({ currentIndex }) {
  return (
    <div className="md:hidden mb-7">
      <div className="flex items-center justify-between gap-4">
        <Brand />
        <span className="text-[11px] font-bold tracking-wide" style={{ color: FUNNEL.muted }}>
          STEP {currentIndex + 1} OF {STAGES.length}
        </span>
      </div>
      <div className="flex gap-1.5 mt-4">
        {STAGES.map((stage, i) => (
          <span
            key={stage.name}
            className="h-1 flex-1 rounded-full"
            style={{ backgroundColor: i <= currentIndex ? FUNNEL.accent : FUNNEL.hairline }}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Funnel shell — one rounded app card floating on a dark backdrop, split
 * into a white rail (brand, headline, vertical stepper) and a cream panel
 * holding the current question plus the Back / Next footer. The footer only
 * renders when `onNext` is supplied, so passive slides can opt out.
 */
export default function FunnelLayout({
  stage,
  stepNumber,
  title,
  subtitle,
  children,
  onBack,
  onNext,
  nextLabel = 'Next',
  nextDisabled = false,
  isFirst = false,
}) {
  const currentIndex = Math.max(STAGES.findIndex((s) => s.name === stage), 0);

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: FUNNEL.page }}>
      <aside
        className="hidden md:flex md:flex-col w-[29%] min-w-[268px] max-w-[400px] shrink-0 px-7 py-7"
        style={{ backgroundColor: FUNNEL.sidebar, borderRight: `1px solid ${FUNNEL.hairline}` }}
      >
        <Brand />
        <h1 className="text-[29px] leading-[1.15] font-bold tracking-tight mt-6" style={{ color: FUNNEL.ink }}>
          Land your next role, faster
        </h1>
        <p className="text-[11px] leading-[1.6] mt-3" style={{ color: FUNNEL.muted }}>
          Follow the {STAGES.length} simple steps to fill in your information so we can build your
          personalised job search plan
        </p>
        <Stepper currentIndex={currentIndex} />
      </aside>

      <main
        className="flex-1 min-w-0 flex flex-col px-6 sm:px-10 md:px-0 py-8 md:pt-14 md:pb-12"
        style={{ backgroundColor: FUNNEL.page }}
      >
        <MobileProgress currentIndex={currentIndex} />

        {/* The question column is ~66% of the panel and sits centred in it,
            so the grid and the footer buttons share one right edge. */}
        <div className="w-full md:w-[66%] md:min-w-[300px] md:max-w-[720px] md:mx-auto">
          {title && (
            <div className="flex items-center justify-between gap-5">
              <h2 className="text-[19px] sm:text-[21px] font-bold leading-snug tracking-tight" style={{ color: FUNNEL.ink }}>
                {title}
              </h2>
              {stepNumber != null && (
                <span
                  className="shrink-0 w-[30px] h-[30px] rounded-full flex items-center justify-center text-[11.5px] font-bold"
                  style={{ backgroundColor: FUNNEL.hairline, color: FUNNEL.muted }}
                >
                  {String(stepNumber).padStart(2, '0')}
                </span>
              )}
            </div>
          )}
          {subtitle && (
            <p className="text-[13px] mt-1.5" style={{ color: FUNNEL.muted }}>
              {subtitle}
            </p>
          )}

          <div className={title ? 'mt-4' : ''}>{children}</div>
        </div>

        {onNext && (
          <div className="w-full md:w-[66%] md:min-w-[300px] md:max-w-[720px] md:mx-auto mt-auto pt-10 flex items-center justify-end gap-7">
            {!isFirst && (
              <button
                type="button"
                onClick={onBack}
                className="flex items-center gap-2.5 text-sm font-bold transition-opacity hover:opacity-70"
                style={{ color: FUNNEL.ink }}
              >
                <ArrowLeft size={17} strokeWidth={2.5} />
                Back
              </button>
            )}

            <button
              type="button"
              onClick={onNext}
              disabled={nextDisabled}
              className="flex items-center gap-2.5 rounded-2xl px-7 py-3.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ backgroundColor: FUNNEL.ink }}
            >
              {nextLabel}
              <ArrowRight size={17} strokeWidth={2.5} />
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
