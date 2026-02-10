import { useState, KeyboardEvent } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";

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

  return (
    <div className={`flex flex-wrap items-center gap-1.5 rounded-md border border-input bg-muted/40 px-3 py-2 ${className}`}>
      {values.map((val, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-medium text-primary"
        >
          {val}
          <button
            type="button"
            onClick={() => removeChip(i)}
            className="rounded-full p-0.5 hover:bg-primary/20 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <Input
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={values.length === 0 ? placeholder : ""}
        className="flex-1 min-w-[120px] border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
      />
    </div>
  );
};

export default ChipInput;
