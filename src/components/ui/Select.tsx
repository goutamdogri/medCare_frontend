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
            "w-full appearance-none rounded-xl border border-line bg-card px-3.5 py-2.5 pr-10",
            "text-sm font-medium text-ink shadow-sm",
            "transition-all duration-150",
            "hover:border-line/80 hover:bg-card-subtle",
            "focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none",
            "dark:bg-card dark:hover:bg-card-subtle",
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
        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
          <ChevronDown className="size-4 text-sub/70" strokeWidth={2.5} />
        </span>
      </span>
    </label>
  );
}
