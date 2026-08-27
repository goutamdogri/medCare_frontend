import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Accent =
  | "primary"
  | "secondary"
  | "accent"
  | "success"
  | "warning"
  | "danger"
  | "info";

const ACCENT_CLASSES: Record<Accent, string> = {
  primary:
    "bg-primary-soft text-indigo-700 dark:bg-primary/15 dark:text-primary",
  secondary:
    "bg-secondary-soft text-violet-700 dark:bg-secondary/15 dark:text-secondary",
  accent: "bg-accent-soft text-teal-700 dark:bg-accent/15 dark:text-accent",
  success:
    "bg-success-soft text-emerald-700 dark:bg-success/15 dark:text-success",
  warning:
    "bg-warning-soft text-yellow-800 dark:bg-warning/15 dark:text-warning",
  danger: "bg-danger-soft text-red-700 dark:bg-danger/15 dark:text-danger",
  info: "bg-info-soft text-blue-700 dark:bg-info/15 dark:text-info",
};

interface StatCardProps {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  badge?: ReactNode;
  icon?: LucideIcon;
  accent?: Accent;
  onClick?: () => void;
  active?: boolean;
  footer?: ReactNode;
}

export function StatCard({
  label,
  value,
  sub,
  badge,
  icon: Icon,
  accent = "primary",
  onClick,
  active,
  footer,
}: StatCardProps) {
  const interactive = Boolean(onClick);
  return (
    <div
      onClick={onClick}
      className={cn(
  "animate-fade-up h-full min-h-[160px] rounded-2xl border bg-card p-5 shadow-card transition-all duration-200",
  interactive &&
    "cursor-pointer hover:-translate-y-0.5 hover:shadow-card-hover",
  active ? "border-white ring-2 ring-white/25" : "border-line",
)}
      {...(interactive ? { role: "button", tabIndex: 0 } : {})}
      onKeyDown={
        interactive
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") onClick?.();
            }
          : undefined
      }
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold tracking-wider text-sub uppercase">
          {label}
        </p>
        {Icon && (
          <span
            className={cn(
              "grid size-9 shrink-0 place-items-center rounded-xl",
              ACCENT_CLASSES[accent],
            )}
          >
            <Icon className="size-[18px]" />
          </span>
        )}
      </div>
      <p className="mt-2 text-2xl leading-tight font-extrabold tracking-tight text-ink tabular-nums sm:text-[28px]">
        {value}
      </p>
      {(badge || sub) && (
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
          {badge}
          {sub && <span className="text-xs text-sub">{sub}</span>}
        </div>
      )}
      {footer}
    </div>
  );
}
