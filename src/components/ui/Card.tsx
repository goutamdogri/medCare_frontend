import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-line bg-card shadow-card transition-shadow duration-300",
        className,
      )}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  iconClassName?: string;
  actions?: ReactNode;
  className?: string;
}

export function CardHeader({
  title,
  subtitle,
  icon: Icon,
  iconClassName,
  actions,
  className,
}: CardHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-start justify-between gap-3 px-5 pt-5 sm:px-6",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        {Icon && (
          <span
            className={cn(
              "mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-primary-soft text-indigo-700 dark:bg-primary/15 dark:text-primary",
              iconClassName,
            )}
          >
            <Icon className="size-[18px]" />
          </span>
        )}
        <div>
          <h3 className="text-sm leading-tight font-semibold tracking-tight text-ink sm:text-base">
            {title}
          </h3>
          {subtitle && (
            <p className="mt-0.5 max-w-prose text-xs leading-relaxed text-sub sm:text-[13px]">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
