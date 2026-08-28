import { useEffect, useRef, useState } from "react";
import { CalendarPlus, RotateCcw } from "lucide-react";
import { useApp } from "@/context/app-context";
import { useToasts } from "@/context/toast-context";
import {
  useAdvanceDay,
  usePipelineRunStatus,
  useRetryPipeline,
} from "@/hooks/queries";
import { formatDateLong } from "@/lib/format";
import { Button } from "@/components/ui/Button";

/**
 * Live rollover controls shown in the top bar.
 *
 *  - "Advance day": moves the simulated clock forward one day (persisted in
 *    `pipeline_state` by the backend) and runs the whole chain for the new date.
 *  - "Retry date": purges the previously generated output for the currently
 *    selected date and re-runs the chain for it, without moving the clock.
 */
type RunSource = "advance" | "retry";

export function PipelineControls() {
  const { asOf, resetToLatest } = useApp();
  const { success, error } = useToasts();

  const advance = useAdvanceDay();
  const retry = useRetryPipeline();

  // Track which action owns the active run so the correct button shows the
  // spinner (instead of both / the wrong one).
  const [runSource, setRunSource] = useState<RunSource | null>(null);

  const advanceRunId = advance.data?.runId ?? null;
  const retryRunId = retry.data?.runId ?? null;

  // The run we are polling is the one from the owning action.
  const activeRunId = runSource === "retry" ? retryRunId : advanceRunId;
  const status = usePipelineRunStatus(activeRunId);

  const running = status.data?.status === "running";

  // Prevent the completion/failure toast from firing on every render: only
  // fire when the status actually transitions to a terminal state.
  const prevStatusRef = useRef<string | undefined>(undefined);

  const triggerError = advance.error ?? retry.error;

  // Surface trigger/transport failures as toasts.
  useEffect(() => {
    if (triggerError) {
      error(triggerError instanceof Error ? triggerError.message : "Pipeline action failed");
    }
  }, [triggerError, error]);

  useEffect(() => {
    const s = status.data?.status;
    if (!s) return;
    // Reset the transition baseline whenever a run becomes active so a
    // subsequent run can fire its own completion toast.
    if (s === "running") {
      prevStatusRef.current = "running";
      return;
    }
    // Only react to a real transition into a terminal state.
    if (s === prevStatusRef.current) return;
    prevStatusRef.current = s;
    if (s === "completed") {
      success("Pipeline run completed");
    } else if (s === "failed") {
      const reason = status.data?.error ? `: ${status.data.error}` : "";
      error(`Pipeline run failed${reason}`);
    }
    // Data refresh on completion is handled globally by useActivePipelineRun.
  }, [status.data?.status, status.data?.error, success, error]);

  const handleAdvance = () => {
    setRunSource("advance");
    advance.mutate(undefined, {
      onSuccess: (data) => {
        success(
          `Advanced to ${formatDateLong(data.to)}${
            data.sidecarTriggered ? " · forecast running" : " · sidecar unreachable — use Retry"
          }`,
        );
        // The clock moved; snap the picker back to the new latest date.
        resetToLatest();
      },
    });
  };

  const handleRetry = () => {
    if (!asOf) {
      error("No date selected to retry");
      return;
    }
    setRunSource("retry");
    retry.mutate(asOf, {
      onSuccess: (data) => {
        const purged = Object.values(data.purged ?? {}).some((n) => n > 0);
        success(
          `${purged ? "Removed previous run data and " : ""}regenerating ${formatDateLong(data.asOf)}${
            data.sidecarTriggered ? "" : " — sidecar unreachable"
          }`,
        );
      },
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        size="sm"
        variant="primary"
        loading={advance.isPending || (running && runSource === "advance")}
        disabled={running || advance.isPending}
        onClick={handleAdvance}
        title="Advance the simulated date by one day and run the forecast chain"
      >
        <CalendarPlus className="size-4" />
        <span className="hidden sm:inline">Advance day</span>
      </Button>

      <Button
        type="button"
        size="sm"
        variant="outline"
        loading={retry.isPending || (running && runSource === "retry")}
        disabled={running || retry.isPending || !asOf}
        onClick={handleRetry}
        title={
          asOf
            ? `Re-run the whole pipeline for ${formatDateLong(asOf)} (wipes its previous output first)`
            : "Select a date to retry"
        }
      >
        <RotateCcw className="size-4" />
        <span className="hidden sm:inline">Retry</span>
      </Button>
    </div>
  );
}
