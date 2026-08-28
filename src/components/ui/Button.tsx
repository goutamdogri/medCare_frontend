import { LoaderCircle } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    "bg-primary text-white shadow-[0_6px_16px_-6px_rgb(79_70_229/0.55)] hover:bg-primary-strong active:scale-[.98]",
  secondary:
    "bg-secondary text-white shadow-[0_6px_16px_-6px_rgb(139_92_246/0.55)] hover:bg-violet-600 active:scale-[.98]",
  outline:
    "border border-line bg-card text-ink hover:bg-app active:scale-[.98]",
  ghost: "text-sub hover:bg-app hover:text-ink",
  danger:
    "bg-danger text-white shadow-[0_6px_16px_-6px_rgb(239_68_68/0.55)] hover:bg-red-600 active:scale-[.98]",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: "sm" | "md";
  loading?: boolean;
  children?: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold whitespace-nowrap transition-all duration-150 focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-55 relative",
        size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm",
        VARIANT_CLASSES[variant],
        className,
      )}
      disabled={disabled ?? loading}
      {...rest}
    >
      {loading && <LoaderCircle className="absolute size-4 animate-spin" />}
      <span className={cn("inline-flex items-center gap-2", loading && "invisible")}>
        {children}
      </span>
    </button>
  );
}
