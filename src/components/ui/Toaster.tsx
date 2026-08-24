import {
  CircleAlert,
  CircleCheck,
  Info,
  X,
} from "lucide-react";
import { useToasts, type ToastKind } from "@/context/toast-context";
import { cn } from "@/lib/cn";

const KIND_STYLES: Record<ToastKind, string> = {
  success: "border-success/40 text-success",
  error: "border-danger/40 text-danger",
  info: "border-info/40 text-info",
};

const KIND_ICONS: Record<ToastKind, typeof CircleCheck> = {
  success: CircleCheck,
  error: CircleAlert,
  info: Info,
};

export function Toaster() {
  const { toasts, dismiss } = useToasts();

  return (
    <div className="pointer-events-none fixed top-4 right-4 z-[80] flex w-80 flex-col gap-2">
      {toasts.map((toast) => {
        const Icon = KIND_ICONS[toast.kind];
        return (
          <div
            key={toast.id}
            role="status"
            className={cn(
              "animate-fade-up pointer-events-auto flex items-start gap-3 rounded-xl border bg-card p-3.5 shadow-pop",
              KIND_STYLES[toast.kind],
            )}
          >
            <Icon className="mt-0.5 size-5 shrink-0" />
            <p className="flex-1 text-sm leading-snug font-medium text-ink">
              {toast.message}
            </p>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              className="rounded-md p-1 text-sub transition-colors hover:bg-app hover:text-ink"
              aria-label="Dismiss notification"
            >
              <X className="size-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
