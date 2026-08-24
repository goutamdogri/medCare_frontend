import { cn } from "@/lib/cn";

interface LegendChipsProps {
  items: { label: string; color: string; dashed?: boolean }[];
  className?: string;
}

/** Inline legend chips for chart cards. */
export function LegendChips({ items, className }: LegendChipsProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-x-4 gap-y-1.5", className)}>
      {items.map((item) => (
        <span
          key={item.label}
          className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-sub"
        >
          <span
            aria-hidden
            className="h-0.5 w-4 rounded-full"
            style={{
              backgroundColor: item.dashed ? "transparent" : item.color,
              backgroundImage: item.dashed
                ? `repeating-linear-gradient(90deg, ${item.color} 0 4px, transparent 4px 7px)`
                : undefined,
            }}
          />
          {item.label}
        </span>
      ))}
    </div>
  );
}
