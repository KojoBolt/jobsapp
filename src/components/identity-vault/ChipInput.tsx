import { useState, KeyboardEvent } from "react";
import { X } from "lucide-react";
import { CHART, T } from "@/admin/ui/system";
import { useRamp } from "@/admin/ui/charts";

interface ChipInputProps {
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  className?: string;
}

const ChipInput = ({ values, onChange, placeholder, className }: ChipInputProps) => {
  const [inputValue, setInputValue] = useState("");

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === "Enter" || e.key === ",") && inputValue.trim()) {
      e.preventDefault();
      if (!values.includes(inputValue.trim())) {
        onChange([...values, inputValue.trim()]);
      }
      setInputValue("");
    }
    if (e.key === "Backspace" && !inputValue && values.length > 0) {
      onChange(values.slice(0, -1));
    }
  };

  const removeChip = (index: number) => {
    onChange(values.filter((_, i) => i !== index));
  };

  const { dark } = useRamp();
  const accent = dark ? CHART.accentDark : CHART.accent;

  return (
    <div
      className={`flex flex-wrap items-center gap-1.5 rounded-lg border ${T.hairline}
                  bg-transparent px-2.5 py-2 focus-within:ring-2 focus-within:ring-[#2a78d6]/30
                  ${className || ""}`}
    >
      {values.map((val, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold"
          style={{ backgroundColor: `${accent}1A`, color: accent }}
        >
          {val}
          <button
            type="button"
            onClick={() => removeChip(i)}
            aria-label={`Remove ${val}`}
            className="transition-opacity hover:opacity-60"
          >
            <X size={11} />
          </button>
        </span>
      ))}
      <input
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={values.length === 0 ? placeholder : ""}
        className={`min-w-[140px] flex-1 bg-transparent px-1 py-0.5 text-[12.5px] ${T.ink}
                    placeholder:text-[#9A9995] focus:outline-none`}
      />
    </div>
  );
};

export default ChipInput;
