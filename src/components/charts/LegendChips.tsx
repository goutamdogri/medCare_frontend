import { cn } from "@/lib/cn";

interface LegendChipsProps {
  items: { label: string; color: string; dashed?: boolean }[];
  className?: string;
}

/** Inline legend chips for chart cards. */
export function LegendChips({ items, className }: LegendChipsProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-x-5 gap-y-2", className)}>
      {items.map((item) => (
        <span
          key={item.label}
          className="inline-flex items-center gap-2 text-[11px] font-medium text-sub"
        >
          <span
            aria-hidden
            className="h-[2px] w-5 shrink-0 rounded-full"
            style={{
              backgroundColor: item.dashed ? "transparent" : item.color,
              backgroundImage: item.dashed
                ? `repeating-linear-gradient(90deg, ${item.color} 0 5px, transparent 5px 9px)`
                : undefined,
              opacity: item.dashed ? 0.75 : 1,
            }}
          />
          {item.label}
        </span>
      ))}
    </div>
  );
}
