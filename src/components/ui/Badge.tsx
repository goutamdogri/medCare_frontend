import { TrendingDown, TrendingUp } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import type {
  Criticality,
  Policy,
  ReplenishmentStatus,
  Severity,
  TransferReason,
} from "@/types/api";

export type BadgeVariant =
  | "success"
  | "danger"
  | "warning"
  | "secondary"
  | "primary"
  | "accent"
  | "info"
  | "gray";

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  success:
    "bg-success-soft text-emerald-700 dark:bg-success/15 dark:text-success",
  danger: "bg-danger-soft text-red-700 dark:bg-danger/15 dark:text-danger",
  warning:
    "bg-warning-soft text-yellow-800 dark:bg-warning/15 dark:text-warning",
  primary:
    "bg-primary-soft text-indigo-700 dark:bg-primary/15 dark:text-primary",
  secondary:
    "bg-secondary-soft text-violet-700 dark:bg-secondary/15 dark:text-secondary",
  accent: "bg-accent-soft text-teal-700 dark:bg-accent/15 dark:text-accent",
  info: "bg-info-soft text-blue-700 dark:bg-info/15 dark:text-info",
  gray: "bg-app text-sub dark:bg-white/8 dark:text-sub",
};

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
  dot?: boolean;
}

export function Badge({
  variant = "gray",
  children,
  className,
  dot,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] leading-none font-semibold whitespace-nowrap",
        VARIANT_CLASSES[variant],
        className,
      )}
    >
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

/* ------------------------- domain-specific badges -------------------- */

const SEVERITY_VARIANT: Record<Severity, BadgeVariant> = {
  RED: "danger",
  AMBER: "warning",
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <Badge variant={SEVERITY_VARIANT[severity]} dot>
      {severity}
    </Badge>
  );
}

const STATUS_META: Record<
  ReplenishmentStatus,
  { variant: BadgeVariant; label: string }
> = {
  stockout_risk: { variant: "danger", label: "Stock-out risk" },
  low: { variant: "warning", label: "Low" },
  ok: { variant: "gray", label: "OK" },
};

export function StatusBadge({ status }: { status: ReplenishmentStatus }) {
  const meta = STATUS_META[status];
  return (
    <Badge variant={meta.variant} dot>
      {meta.label}
    </Badge>
  );
}

const CRITICALITY_META: Record<Criticality, BadgeVariant> = {
  critical: "danger",
  high: "warning",
  standard: "info",
  low: "gray",
};

export function CriticalityChip({ criticality }: { criticality: Criticality }) {
  return (
    <Badge variant={CRITICALITY_META[criticality] ?? "gray"} dot>
      {criticality[0].toUpperCase() + criticality.slice(1)}
    </Badge>
  );
}

const REASON_META: Record<
  TransferReason,
  { variant: BadgeVariant; label: string }
> = {
  expiry_rescue: { variant: "accent", label: "Expiry rescue" },
  shortage_rescue: { variant: "secondary", label: "Shortage rescue" },
};

export function ReasonBadge({ reason }: { reason: TransferReason }) {
  const meta = REASON_META[reason];
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}

export function PolicyBadge({ policy }: { policy: Policy }) {
  return (
    <Badge variant={policy === "proposed" ? "info" : "gray"} dot>
      {policy === "proposed" ? "Proposed" : "Status quo"}
    </Badge>
  );
}

/** Delta chip: "+9.1 pts", "−60.9%", "₹17.9L saved". Green when favourable. */
export function DeltaBadge({
  value,
  suffix,
  prefix,
  goodDirection = "up",
}: {
  /** Signed number to render when no custom prefix is given. */
  value?: number;
  suffix?: string;
  /** Overrides the numeric part entirely, e.g. "₹17.9L saved" */
  prefix?: string;
  goodDirection?: "up" | "down";
}) {
  const shown = prefix ?? `${value != null && value >= 0 ? "+" : ""}${value != null ? Number(value.toFixed(2)) : ""}${suffix ? ` ${suffix}` : ""}`;
  const isGood =
    value == null ? true : goodDirection === "up" ? value >= 0 : value <= 0;
  const Icon = (value ?? 0) >= 0 ? TrendingUp : TrendingDown;
  return (
    <Badge variant={isGood ? "success" : "danger"} className="tabular-nums">
      <Icon className="size-3" />
      {shown}
    </Badge>
  );
}
