import { X } from "lucide-react";

interface MultiSelectChipsProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

const MultiSelectChips = ({ options, selected, onChange }: MultiSelectChipsProps) => {
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
            className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-all ${
              isActive
                ? "border-primary/40 bg-primary/15 text-primary shadow-sm"
                : "border-border/40 bg-muted/20 text-muted-foreground hover:border-primary/30 hover:bg-muted/40"
            }`}
          >
            {option}
            {isActive && <X className="h-3 w-3" />}
          </button>
        );
      })}
    </div>
  );
};

export default MultiSelectChips;
