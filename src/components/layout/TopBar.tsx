import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Menu, RefreshCw } from "lucide-react";
import { useApp } from "@/context/app-context";
import { PipelineControls } from "@/components/layout/PipelineControls";
import { UserMenu } from "@/components/layout/UserMenu";
import { cn } from "@/lib/cn";

interface TopBarProps {
  title: string;
  onMenuClick: () => void;
}

export function TopBar({ title, onMenuClick }: TopBarProps) {
  const { asOf, latestAsOf, setAsOf } = useApp();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    void queryClient.invalidateQueries({
      predicate: (query) => query.queryKey[0] !== "meta",
    });
    window.setTimeout(() => setRefreshing(false), 700);
  };

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-app/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-xl border border-line bg-card p-2 text-sub transition-colors hover:text-ink lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="size-5" />
        </button>

        <h1 className="text-base font-extrabold tracking-tight text-ink sm:text-lg">
          {title}
        </h1>

        <div className="ml-auto flex flex-wrap items-center gap-2 sm:gap-3">
          <PipelineControls />

          <label className="relative flex items-center">
            <span className="sr-only">Snapshot date</span>
            <input
              type="date"
              value={asOf ?? ""}
              max={latestAsOf}
              onChange={(event) => {
                if (event.target.value && latestAsOf) setAsOf(event.target.value);
              }}
              disabled={!latestAsOf}
              className={cn(
                "rounded-xl border border-line bg-card px-3 py-2 text-xs font-semibold text-ink shadow-sm",
                "transition-colors focus:border-primary focus:ring-2 focus:ring-primary/25 focus:outline-none disabled:opacity-50",
                "[&::-webkit-calendar-picker-indicator]:cursor-pointer dark:[color-scheme:dark]",
              )}
            />
          </label>

          <button
            type="button"
            onClick={handleRefresh}
            aria-label="Refresh data"
            className="rounded-xl border border-line bg-card p-2 text-sub shadow-sm transition-colors hover:text-ink"
          >
            <RefreshCw className={cn("size-4", refreshing && "animate-spin")} />
          </button>

          <UserMenu />
        </div>
      </div>
    </header>
  );
}
