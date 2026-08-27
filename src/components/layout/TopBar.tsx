import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut, Menu, Moon, RefreshCw, Sun } from "lucide-react";
import { useApp } from "@/context/app-context";
import { useAuth } from "@/context/auth-context";
import { cn, } from "@/lib/cn";
import { timeAgo } from "@/lib/format";

interface TopBarProps {
  title: string;
  onMenuClick: () => void;
}

export function TopBar({ title, onMenuClick }: TopBarProps) {
  const { asOf, latestAsOf, meta, setAsOf, theme, toggleTheme } = useApp();
  const { user, signout } = useAuth();
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

  const initials =
    (user?.name ?? "?")
      .split(/\s+/)
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "MC";

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

          <div className="hidden items-center gap-2 sm:flex">
            <div className="flex max-w-[180px] items-center gap-2 rounded-xl border border-line bg-card py-1.5 pr-2 pl-1.5 shadow-sm">
              <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-primary to-secondary text-[11px] font-bold text-white">
                {initials}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-xs font-semibold text-ink">
                  {user?.name}
                </span>
                <span className="block truncate text-[10px] text-sub">{user?.email}</span>
              </span>
            </div>
            <button
              type="button"
              onClick={signout}
              aria-label="Sign out"
              title="Sign out"
              className="rounded-xl border border-line bg-card p-2 text-sub shadow-sm transition-colors hover:border-danger/40 hover:text-danger"
            >
              <LogOut className="size-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={signout}
            aria-label="Sign out"
            title="Sign out"
            className="rounded-xl border border-line bg-card p-2 text-sub shadow-sm transition-colors hover:border-danger/40 hover:text-danger sm:hidden"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
