import { formatCompact } from "@/lib/format";

interface TooltipEntry {
  name?: string | number;
  value?: number | string;
  color?: string;
  dataKey?: string | number;
}

interface ChartTooltipProps {
  active?: boolean;
  label?: string | number;
  payload?: TooltipEntry[];
  /** Defaults to compact INR-ish formatting; pass custom per chart. */
  valueFormatter?: (value: number) => string;
}

export function ChartTooltip({ active, label, payload, valueFormatter }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const fmt = valueFormatter ?? formatCompact;
  return (
    <div
      className="rounded-xl border border-line/60 bg-card/90 px-3.5 py-2.5 shadow-pop backdrop-blur-md"
      style={{ minWidth: 148 }}
    >
      {label !== undefined && (
        <p className="mb-2 text-[10px] font-semibold tracking-widest text-sub uppercase">{label}</p>
      )}
      <div className="space-y-1.5">
        {payload.map((entry, index) => (
          <div key={`${entry.dataKey ?? index}`} className="flex items-center gap-2 text-xs">
            <span
              aria-hidden
              className="size-[7px] shrink-0 rounded-full ring-[1.5px] ring-white/20"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sub">{entry.name}</span>
            <span className="ml-auto pl-4 font-semibold text-ink tabular-nums">
              {typeof entry.value === "number" ? fmt(entry.value) : String(entry.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
