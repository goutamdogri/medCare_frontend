import { cn } from "@/lib/cn";

interface RangeSliderProps {
  label: string;
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
  className?: string;
}

export function RangeSlider({
  label,
  min,
  max,
  value,
  onChange,
  formatValue = (v) => String(v),
  className,
}: RangeSliderProps) {
  const fill = ((value - min) / (max - min)) * 100;
  return (
    <div className={cn("min-w-52 flex-1", className)}>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="text-xs font-semibold tracking-wide text-sub uppercase">
          {label}
        </span>
        <span className="rounded-lg bg-primary-soft px-2 py-0.5 text-xs font-bold text-indigo-700 tabular-nums dark:bg-primary/15 dark:text-primary">
          {formatValue(value)}
        </span>
      </div>
      <input
        type="range"
        className="mc-slider"
        style={{ "--fill": `${fill}%` } as React.CSSProperties}
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-label={label}
      />
    </div>
  );
}
