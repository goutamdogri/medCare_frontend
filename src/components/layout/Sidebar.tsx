import { NavLink } from "react-router-dom";
import { Radio } from "lucide-react";
import { usePipelineRuns, useRuns } from "@/hooks/queries";
import { cn } from "@/lib/cn";
import { timeAgo, formatDuration } from "@/lib/format";
import { NAV_ITEMS } from "@/components/layout/nav";
import { BrandMark } from "@/components/layout/BrandMark";

function PipelineChip() {
  // Live run status comes from `pipeline_run` (updated while the chain runs),
  // polled every few seconds so the chip reflects an in-flight run.
  const { data: live, isLoading: liveLoading } = usePipelineRuns(1);
  const active = live?.runs?.[0];
  const activeRunning = active?.status === "running";

  const { data: runs } = useRuns(1);
  const latest = runs?.[0];
  const ok = latest?.status === "success";

  const dotClass = liveLoading
    ? "bg-sub animate-pulse"
    : activeRunning
      ? "bg-warning animate-pulse"
      : ok
        ? "bg-success"
        : latest
          ? "bg-danger animate-pulse"
          : "bg-sub";

  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-xl border bg-app px-3 py-2.5 transition-colors",
        activeRunning
          ? "border-warning/40 shadow-[0_0_0_1px_rgb(245_158_11/0.15),0_0_18px_-6px_rgb(245_158_11/0.5)]"
          : "border-line",
      )}
    >
      <span className="relative flex size-2.5 shrink-0">
        <span className={cn("absolute inline-flex size-full rounded-full opacity-40", (activeRunning || ok) && !liveLoading && "animate-ping")} />
        <span className={cn("relative inline-flex size-2.5 rounded-full", dotClass)} />
      </span>
      <div className="min-w-0 leading-tight">
        <p className="text-[11px] font-bold text-ink">
          {liveLoading
            ? "Pipeline…"
            : activeRunning
              ? `Running · ${active?.runType ?? "pipeline"}`
              : latest
                ? `Run ${latest.status}`
                : "Pipeline idle"}
        </p>
        <p className="truncate text-[10px] font-medium text-sub tabular-nums">
          {activeRunning && active
            ? active.asOf
              ? `${active.runType} · ${active.asOf}`
              : `${(active.stepsCompleted?.length ?? 0) > 0 ? active.stepsCompleted.join(", ") : "starting"}…`
            : latest
              ? `${formatDuration(latest.durationSeconds)} · ${timeAgo(latest.createdAt)}`
              : "No runs recorded yet"}
        </p>
      </div>
      <Radio
        className={cn(
          "ml-auto size-3.5 shrink-0",
          activeRunning ? "text-warning" : "text-sub",
        )}
      />
    </div>
  );
}

interface SidebarContentProps {
  onNavigate?: () => void;
}

export function SidebarNav({ onNavigate }: SidebarContentProps) {
  return (
    <>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pt-4 pb-4">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  "group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-150",
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
        <PipelineChip />
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
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
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
