import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import { Card, CardHeader } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/States";
import { SkeletonBlock } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";

interface WidgetProps<T> {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  iconClassName?: string;
  actions?: ReactNode;
  query: UseQueryResult<T>;
  skeleton?: ReactNode;
  className?: string;
  bodyClassName?: string;
  noPadding?: boolean;
  children: (data: T) => ReactNode;
}

/**
 * Card + async-state shell: renders skeleton while loading (including
 * disabled queries waiting on `asOf`), an inline error with retry on
 * failure, and hands resolved data to children only on success.
 */
export function Widget<T>({
  title,
  subtitle,
  icon,
  iconClassName,
  actions,
  query,
  skeleton,
  className,
  bodyClassName,
  noPadding = false,
  children,
}: WidgetProps<T>) {
  let body: ReactNode;

  if (query.isError) {
    body = (
      <div className="p-5 sm:p-6">
        <ErrorState
          message={(query.error as Error)?.message}
          onRetry={() => void query.refetch()}
        />
      </div>
    );
  } else if (query.isSuccess && query.data != null) {
    body = (
      <div
        className={cn(
          !noPadding && "px-5 pt-4 pb-5 sm:px-6",
          "min-h-0 flex-1",
          bodyClassName,
        )}
      >
        {children(query.data)}
      </div>
    );
  } else {
    // Covers both "fetching" and "idle/disabled" (e.g. asOf not yet resolved).
    body = skeleton ?? <SkeletonBlock />;
  }

  return (
    <Card
      className={cn("flex flex-col", query.isError && "border-danger/40", className)}
    >
      <CardHeader
        title={title}
        subtitle={subtitle}
        icon={icon}
        iconClassName={iconClassName}
        actions={actions}
      />
      {body}
    </Card>
  );
}
