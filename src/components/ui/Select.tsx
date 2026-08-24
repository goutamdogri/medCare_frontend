import { ChevronDown } from "lucide-react";
import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
}

export function Select({ label, options, className, id, ...rest }: SelectProps) {
  return (
    <label className={cn("block", className)} htmlFor={id}>
      {label && (
        <span className="mb-1.5 block text-xs font-semibold tracking-wide text-sub uppercase">
          {label}
        </span>
      )}
      <span className="relative block">
        <select
          id={id}
          className={cn(
            "w-full appearance-none rounded-xl border border-line bg-card px-3.5 py-2.5 pr-9 text-sm font-medium text-ink shadow-sm transition-colors focus:border-primary focus:ring-2 focus:ring-primary/25 focus:outline-none",
            className,
          )}
          {...rest}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-sub" />
      </span>
    </label>
  );
}
