import { LogOut, Moon, Sun } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useApp } from "@/context/app-context";
import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/cn";

export function UserMenu() {
  const { user, signout } = useAuth();
  const { theme, toggleTheme } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const initials =
    (user?.name ?? "?")
      .split(/\s+/)
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "MC";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Account menu"
        aria-haspopup="menu"
        aria-expanded={open}
        className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-secondary text-sm font-bold text-white shadow-sm ring-2 ring-transparent transition-all hover:ring-primary/30 focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:outline-none"
      >
        {initials}
      </button>

      {open && (
        <div
          role="menu"
          className="animate-fade-up absolute top-full right-0 z-40 mt-2 w-60 overflow-hidden rounded-xl border border-line bg-card shadow-pop"
        >
          <div className="flex items-center gap-3 border-b border-line px-4 py-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-secondary text-sm font-bold text-white">
              {initials}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-ink">
                {user?.name}
              </span>
              <span className="block truncate text-xs text-sub">{user?.email}</span>
            </span>
          </div>

          <button
            type="button"
            role="menuitem"
            onClick={toggleTheme}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-app"
          >
            {theme === "dark" ? (
              <Sun className="size-4 text-sub" />
            ) : (
              <Moon className="size-4 text-sub" />
            )}
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={signout}
            className={cn(
              "flex w-full items-center gap-2.5 border-t border-line px-4 py-2.5 text-sm font-medium",
              "text-danger transition-colors hover:bg-app",
            )}
          >
            <LogOut className="size-4" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
