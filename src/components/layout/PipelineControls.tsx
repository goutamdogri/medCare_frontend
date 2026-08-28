import { useEffect } from "react";
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
export function PipelineControls() {
  const { asOf, resetToLatest } = useApp();
  const { success, error } = useToasts();

  const advance = useAdvanceDay();
  const retry = useRetryPipeline();

  // The run currently executing belongs to the most recent action.
  const activeRunId = advance.data?.runId ?? retry.data?.runId ?? null;
  const status = usePipelineRunStatus(activeRunId);

  const running = status.data?.status === "running" || advance.isPending || retry.isPending;

  const triggerError = advance.error ?? retry.error;

  // Surface trigger/transport failures and run completion as toasts.
  useEffect(() => {
    if (triggerError) {
      error(triggerError instanceof Error ? triggerError.message : "Pipeline action failed");
    }
  }, [triggerError, error]);

  useEffect(() => {
    const s = status.data?.status;
    if (!s || s === "running") return;
    if (s === "completed") {
      success(activeRunId ? `Pipeline run completed` : "Pipeline run completed");
    } else if (s === "failed") {
      const reason = status.data?.error ? `: ${status.data.error}` : "";
      error(`Pipeline run failed${reason}`);
    }
  }, [status.data, activeRunId, success, error]);

  const handleAdvance = () => {
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
        loading={advance.isPending || status.data?.status === "running"}
        disabled={running}
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
        loading={retry.isPending}
        disabled={running || !asOf}
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
