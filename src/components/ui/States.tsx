import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { CircleAlert } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  message,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  message?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line px-6 py-10 text-center">
      {Icon && <Icon className="mb-1 size-8 text-sub/60" />}
      <p className="text-sm font-semibold text-ink">{title}</p>
      {message && <p className="max-w-sm text-xs text-sub">{message}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message?: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-danger/40 bg-danger/5 px-6 py-10 text-center">
      <CircleAlert className="size-8 text-danger" />
      <p className="text-sm font-semibold text-ink">Something went wrong</p>
      <p className="max-w-sm text-xs text-sub">
        {message ?? "The data could not be loaded. Check that the API is reachable."}
      </p>
      <Button variant="outline" size="sm" className="mt-2" onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
}
