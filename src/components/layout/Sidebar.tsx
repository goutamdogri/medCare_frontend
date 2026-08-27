import { useRef } from "react";
import { NavLink } from "react-router-dom";
import { Radio } from "lucide-react";
import gsap from "gsap";
import { usePipelineRuns, useRuns } from "@/hooks/queries";
import { useApp } from "@/context/app-context";
import { cn } from "@/lib/cn";
import { timeAgo, formatDuration } from "@/lib/format";
import { NAV_ITEMS } from "@/components/layout/nav";
import { BrandMark } from "@/components/layout/BrandMark";

function PipelineChip() {
  const { meta } = useApp();
  const lastRun = meta?.latestRun;

  const { data: live, isLoading: liveLoading } = usePipelineRuns(1);
  const active = live?.runs?.[0];
  const activeRunning = active?.status === "running";

  const { data: runs, isLoading } = useRuns(1);
  const latest = runs?.[0];
  const ok = latest?.status === "success";

  const dotClass = liveLoading
    ? "bg-sub animate-pulse"
    : activeRunning
      ? "bg-success animate-pulse"
      : ok
        ? "bg-success"
        : latest
          ? "bg-danger animate-pulse"
          : "bg-sub";

  const lastRan = activeRunning ? "Pipeline running" : "Pipeline idle";

  const detail = activeRunning
    ? `Last run ${timeAgo(active.startedAt)}`
    : lastRun
      ? `Last run ${timeAgo(lastRun.ranAt)}`
      : latest
        ? `${formatDuration(latest.durationSeconds)} · ${timeAgo(latest.createdAt)}`
        : "No runs recorded yet";

  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-line bg-app px-3 py-2.5">
      <span className="relative flex size-2.5 shrink-0">
        <span className={cn("absolute inline-flex size-full rounded-full opacity-40", ok && !isLoading && "animate-ping")} />
        <span className={cn("relative inline-flex size-2.5 rounded-full", dotClass)} />
      </span>

      <div className="min-w-0 leading-tight">
        <p className="truncate text-[11px] font-bold text-ink tabular-nums">
          {liveLoading ? "Pipeline…" : lastRan}
        </p>
        <p className="truncate text-[10px] font-medium text-sub tabular-nums">
          {detail}
        </p>
      </div>
      <Radio className="ml-auto size-3.5 shrink-0 text-sub" />
    </div>
  );
}

interface SidebarContentProps {
  onNavigate?: () => void;
}

export function SidebarNav({ onNavigate }: SidebarContentProps) {
  const linkRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  const handleMouseEnter = (index: number) => {
    const link = linkRefs.current[index];

    if (!link) return;

    gsap.to(link, {
      y: -2,
      scale: 1.02,
      duration: 0.2,
      ease: "power2.out",
    });
  };

  const handleMouseLeave = (index: number) => {
    const link = linkRefs.current[index];

    if (!link) return;

    gsap.to(link, {
      y: 0,
      scale: 1,
      duration: 0.25,
      ease: "power2.out",
    });
  };

  return (
    <>
      <nav className="flex-1 space-y-2 overflow-y-auto px-3 pt-5 pb-4">
        {NAV_ITEMS.map((item, index) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onNavigate}
              ref={(el) => {
                linkRefs.current[index] = el;
              }}
              onMouseEnter={() => handleMouseEnter(index)}
              onMouseLeave={() => handleMouseLeave(index)}
              className={({ isActive }) =>
                cn(
                  "group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors duration-150 will-change-transform",
                  isActive
                    ? "bg-primary text-white shadow-[0_8px_18px_-8px_rgb(79_70_229/0.7)]"
                    : "text-sub hover:bg-app hover:text-ink",
                )
              }
            >
              <Icon className="size-[18px] shrink-0" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-line p-3">
        <PipelineStatus />
      </div>
    </>
  );
}

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-line bg-card lg:flex">
      <div className="border-b border-line px-5 py-4">
        <BrandMark />
      </div>

      <SidebarNav />
    </aside>
  );
}

/** Mobile navigation drawer (controlled by AppShell). */
export function MobileSidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 lg:hidden"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        aria-label="Close navigation"
        onClick={onClose}
        className="animate-backdrop-in absolute inset-0 cursor-default bg-black/45 backdrop-blur-[2px]"
      />

      <aside className="animate-slide-in-right absolute inset-y-0 left-0 flex w-72 flex-col border-r border-line bg-card shadow-pop">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <BrandMark />
        </div>

        <SidebarNav onNavigate={onClose} />
      </aside>
    </div>
  );
}