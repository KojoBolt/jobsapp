import { X } from "lucide-react";
import { CHART, T } from "@/admin/ui/system";
import { useRamp } from "@/admin/ui/charts";

interface MultiSelectChipsProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

const MultiSelectChips = ({ options, selected, onChange }: MultiSelectChipsProps) => {
  const { dark } = useRamp();
  const accent = dark ? CHART.accentDark : CHART.accent;

  const toggle = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter((s) => s !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isActive = selected.includes(option);
        return (
          <button
            key={option}
            type="button"
            onClick={() => toggle(option)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11.5px]
                        transition-colors ${
                          isActive
                            ? "font-semibold"
                            : `${T.hairline} font-medium ${T.ink2} hover:bg-[#F4F4F2] dark:hover:bg-white/5`
                        }`}
            style={
              isActive
                ? { backgroundColor: `${accent}1A`, borderColor: accent, color: accent }
                : undefined
            }
          >
            {option}
            {isActive && <X size={11} />}
          </button>
        );
      })}
    </div>
  );
};

export default MultiSelectChips;
