import { Check } from 'lucide-react';
import { Icon } from '../icons';

/**
 * Plan-card style selection. Selected state = blue border + a small
 * blue circular checkmark badge floating in the top-right corner —
 * matches the reference's pricing-card pattern, not an inline radio.
 */
export default function OptionCard({ option, selected, onSelect, grid = false }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(option)}
      aria-pressed={selected}
      className={[
        'relative w-full rounded-2xl border text-left transition-all duration-150 bg-white/[0.03]',
        grid ? 'flex flex-col items-center text-center p-5 gap-2.5 min-h-[124px]' : 'flex items-center gap-4 p-4',
        selected
          ? 'border-blue-500 bg-blue-500/[0.08]'
          : 'border-white/10 hover:border-white/25 hover:bg-white/[0.05]',
      ].join(' ')}
    >
      {selected && (
        <span className="absolute -top-2.5 -right-2.5 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
          <Check size={13} strokeWidth={3} className="text-white" />
        </span>
      )}

      {option.icon && (
        <span
          className={[
            'rounded-xl flex items-center justify-center shrink-0',
            grid ? 'w-11 h-11' : 'w-10 h-10',
            selected ? 'bg-blue-500/15 text-blue-400' : 'bg-white/5 text-white/60',
          ].join(' ')}
        >
          <Icon name={option.icon} size={20} strokeWidth={1.75} />
        </span>
      )}

      <div className={grid ? 'text-center' : 'text-left'}>
        <p className="font-semibold text-white text-sm">{option.label}</p>
        {option.sub && <p className="text-xs text-white/40 mt-0.5">{option.sub}</p>}
      </div>
    </button>
  );
}
