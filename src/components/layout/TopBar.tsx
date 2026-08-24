import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Menu, Moon, RefreshCw, Sun } from "lucide-react";
import { useApp } from "@/context/app-context";
import { cn, } from "@/lib/cn";
import { timeAgo } from "@/lib/format";

interface TopBarProps {
  title: string;
  onMenuClick: () => void;
}

export function TopBar({ title, onMenuClick }: TopBarProps) {
  const { asOf, latestAsOf, meta, setAsOf, theme, toggleTheme } = useApp();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const run = meta?.latestRun;

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
          {run && (
            <p className="hidden items-center gap-2 text-xs font-medium text-sub xl:flex">
              <span className="size-2 rounded-full bg-success" />
              Data as of{" "}
              <span className="font-bold text-ink tabular-nums">{asOf ?? meta?.asOf}</span>
              {" · "}run {run.status} · {timeAgo(run.ranAt)}
            </p>
          )}

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

          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className="rounded-xl border border-line bg-card p-2 text-sub shadow-sm transition-colors hover:text-ink"
          >
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
        </div>
      </div>
    </header>
  );
}
