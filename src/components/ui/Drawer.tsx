import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  /** Small badge rendered inline, right beside the title. */
  meta?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

/** Right-hand slide-over panel with backdrop, ESC-to-close and scroll lock. */
export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  meta,
  children,
  footer,
  className,
}: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label="Close panel"
        onClick={onClose}
        className="animate-backdrop-in absolute inset-0 cursor-default bg-black/45 backdrop-blur-[2px]"
      />
      <div
        className={cn(
          "animate-slide-in-right relative flex h-dvh w-full max-w-lg flex-col border-l border-line bg-card shadow-pop",
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-base font-bold tracking-tight text-ink">{title}</h3>
              {meta}
            </div>
            {subtitle && <p className="mt-0.5 text-xs text-sub">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-sub transition-colors hover:bg-app hover:text-ink"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="border-t border-line px-6 py-4">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
