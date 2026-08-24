import { cn } from "@/lib/cn";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-line/70", className)} />;
}

/** Standard widget-body placeholder used while queries load. */
export function SkeletonBlock({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-3 px-5 pt-5 pb-5 sm:px-6", className)}>
      <Skeleton className="h-4 w-1/3" />
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} className={cn("h-9", i === lines - 1 ? "w-2/3" : "w-full")} />
      ))}
    </div>
  );
}
