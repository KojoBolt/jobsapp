import { Check } from 'lucide-react';
import { Icon } from '../icons';
import { FUNNEL } from './theme';

/**
 * Borderless white tile, always centre-aligned — icon options get a pale
 * circle above the label, text-only options are just centred text in a
 * shorter card. Selected = tan outline plus an orange rounded-square check
 * clipped to the top-right corner.
 */
export default function OptionCard({ option, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(option)}
      aria-pressed={selected}
      className={[
        'relative flex flex-col items-center justify-center text-center w-full rounded-2xl px-3 transition-shadow duration-150',
        option.icon ? 'py-5 gap-3 min-h-[104px]' : 'py-5 min-h-[76px]',
      ].join(' ')}
      style={{
        backgroundColor: FUNNEL.card,
        boxShadow: selected
          ? `0 0 0 1.5px ${FUNNEL.ring}, ${FUNNEL.cardShadow}`
          : FUNNEL.cardShadow,
      }}
    >
      {selected && (
        <span
          className="absolute -top-1.5 -right-1.5 w-[22px] h-[22px] rounded-[7px] flex items-center justify-center"
          style={{ backgroundColor: FUNNEL.accent }}
        >
          <Check size={13} strokeWidth={3.25} className="text-white" />
        </span>
      )}

      {option.icon && (
        <span
          className="w-[38px] h-[38px] rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: FUNNEL.iconBg, color: FUNNEL.iconFg }}
        >
          <Icon name={option.icon} size={18} strokeWidth={2} />
        </span>
      )}

      <span>
        <span className="block font-bold text-[13px] leading-tight" style={{ color: FUNNEL.ink }}>
          {option.label}
        </span>
        {option.sub && (
          <span className="block text-[11.5px] mt-1" style={{ color: FUNNEL.muted }}>
            {option.sub}
          </span>
        )}
      </span>
    </button>
  );
}
