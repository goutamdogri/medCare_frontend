import { useRef } from "react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  QueryClient,
} from "@tanstack/react-query";
import { apiGet, apiPatch, apiPost } from "@/api/client";
import type {
  AdvanceDayResponse,
  AgingResponse,
  AlertItem,
  AlertsResponse,
  DailyCurvesResponse,
  DemandPoint,
  DigestResponse,
  FluPoint,
  ForecastsResponse,
  KpiResponse,
  MetaResponse,
  ModelMetricsResponse,
  PipelineRunStatus,
  PipelineRunsResponse,
  PipelineStateResponse,
  ReplenishmentCoverage,
  ReplenishmentResponse,
  ReplenishmentSummary,
  RetryPipelineResponse,
  RunEntry,
  TransferReason,
  TransfersResponse,
  WriteoffCumulativeResponse,
  WriteoffsResponse,
} from "@/types/api";

export const ACK_USER = "csco@pharma.in";

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 2 * 60_000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          const status = (error as { status?: number }).status;
          if (status != null && status >= 400 && status < 500) return false;
          return failureCount < 2;
        },
      },
    },
  });
}

type AsOf = string | undefined;

/* -------------------------------- meta ------------------------------ */

export function useMeta() {
  return useQuery({
    queryKey: ["meta"],
    queryFn: ({ signal }) => apiGet<MetaResponse>("/api/meta", undefined, signal),
    staleTime: 10 * 60_000,
  });
}

export function useRuns(limit = 10) {
  return useQuery({
    queryKey: ["runs", limit],
    queryFn: ({ signal }) =>
      apiGet<RunEntry[]>("/api/runs", { limit }, signal),
    staleTime: 60_000,
  });
}

/* ------------------------------ command ------------------------------ */

export function useKpi(asOf: AsOf) {
  return useQuery({
    queryKey: ["kpi", asOf],
    enabled: Boolean(asOf),
    queryFn: ({ signal }) =>
      apiGet<KpiResponse>("/api/kpi", { asOf }, signal),
  });
}

export function useDailyCurves(asOf: AsOf) {
  return useQuery({
    queryKey: ["kpi", "daily-curves", asOf],
    enabled: Boolean(asOf),
    queryFn: ({ signal }) =>
      apiGet<DailyCurvesResponse>("/api/kpi/daily-curves", { asOf }, signal),
  });
}

export function useWriteoffCumulative(asOf: AsOf) {
  return useQuery({
    queryKey: ["kpi", "writeoff-cumulative", asOf],
    enabled: Boolean(asOf),
    queryFn: ({ signal }) =>
      apiGet<WriteoffCumulativeResponse>(
        "/api/kpi/writeoff-cumulative",
        { asOf },
        signal,
      ),
  });
}

export function useAging(asOf: AsOf) {
  return useQuery({
    queryKey: ["aging", asOf],
    enabled: Boolean(asOf),
    queryFn: ({ signal }) =>
      apiGet<AgingResponse>("/api/inventory/aging", { asOf }, signal),
  });
}

/* --------------------------- demand sensing -------------------------- */

export interface ForecastParams {
  skuId: string;
  region: string;
  horizonMax?: number;
}

const FORECAST_SIZE = 200;

export function useForecasts(asOf: AsOf, params: ForecastParams) {
  return useQuery({
    queryKey: ["forecasts", asOf, params.skuId, params.region, params.horizonMax ?? null],
    enabled: Boolean(asOf) && Boolean(params.skuId && params.region),
    placeholderData: keepPreviousData,
    queryFn: ({ signal }) =>
      apiGet<ForecastsResponse>(
        "/api/forecasts",
        { asOf, ...params, size: FORECAST_SIZE },
        signal,
      ),
  });
}

export function useDemandHistory(
  skuId: string,
  region: string,
  from: string | undefined,
  to: string | undefined,
) {
  return useQuery({
    queryKey: ["demand-history", skuId, region, from ?? null, to ?? null],
    enabled: Boolean(skuId && region),
    queryFn: ({ signal }) =>
      apiGet<DemandPoint[]>("/api/demand/history", { skuId, region, from, to }, signal),
  });
}

export function useFlu(region: string, from?: string, to?: string) {
  return useQuery({
    queryKey: ["flu", region, from ?? null, to ?? null],
    enabled: Boolean(region),
    queryFn: ({ signal }) =>
      apiGet<FluPoint[]>("/api/flu", { region, from, to }, signal),
  });
}

export function useModelMetrics(asOf: AsOf) {
  return useQuery({
    queryKey: ["model-metrics", asOf],
    enabled: Boolean(asOf),
    queryFn: ({ signal }) =>
      apiGet<ModelMetricsResponse>("/api/model/metrics", { asOf }, signal),
  });
}

/* --------------------------- replenishment --------------------------- */

export interface ReplenishmentFilters {
  status?: string;
  criticality?: string;
  region?: string;
  sort?: "dos" | "default";
}

/** 192 rows per run — fetch the whole set once and filter client-side. */
const REPL_SIZE = 500;

export function useReplenishment(asOf: AsOf, filters: ReplenishmentFilters) {
  return useQuery({
    queryKey: ["replenishment", asOf, filters],
    enabled: Boolean(asOf),
    queryFn: ({ signal }) =>
      apiGet<ReplenishmentResponse>(
        "/api/replenishment",
        {
          asOf,
          status: filters.status,
          criticality: filters.criticality,
          region: filters.region,
          sort: filters.sort === "dos" ? "dos" : undefined,
          size: REPL_SIZE,
        },
        signal,
      ),
  });
}

export function useReplenishmentSummary(asOf: AsOf) {
  return useQuery({
    queryKey: ["replenishment", "summary", asOf],
    enabled: Boolean(asOf),
    queryFn: ({ signal }) =>
      apiGet<ReplenishmentSummary>("/api/replenishment/summary", { asOf }, signal),
  });
}

/**
 * Order-to-transfer reconciliation for one SKU × region — powers the
 * "recommended transfer plan / remaining to order" section of the order-book
 * audit drawer.
 */
export function useSkuCoverage(asOf: AsOf, skuId: string, region: string) {
  return useQuery({
    queryKey: ["replenishment", "coverage", asOf, skuId, region],
    enabled: Boolean(asOf && skuId && region),
    queryFn: ({ signal }) =>
      apiGet<ReplenishmentCoverage>(
        `/api/replenishment/${encodeURIComponent(skuId)}/${encodeURIComponent(region)}/coverage`,
        { asOf },
        signal,
      ),
  });
}

/* ------------------------- transfers/writeoffs ----------------------- */

const ALLOC_SIZE = 500;

export function useTransfers(asOf: AsOf, reason?: TransferReason) {
  return useQuery({
    queryKey: ["transfers", asOf, reason ?? null],
    enabled: Boolean(asOf),
    queryFn: ({ signal }) =>
      apiGet<TransfersResponse>("/api/transfers", { asOf, reason, size: ALLOC_SIZE }, signal),
  });
}

export function useWriteoffs(asOf: AsOf) {
  return useQuery({
    queryKey: ["writeoffs", asOf],
    enabled: Boolean(asOf),
    queryFn: ({ signal }) =>
      apiGet<WriteoffsResponse>("/api/writeoffs", { asOf, size: ALLOC_SIZE }, signal),
  });
}

/* ------------------------------- alerts ------------------------------ */

export function useAlerts(asOf: AsOf) {
  return useQuery({
    queryKey: ["alerts", asOf],
    enabled: Boolean(asOf),
    queryFn: ({ signal }) =>
      apiGet<AlertsResponse>("/api/alerts", { asOf, size: REPL_SIZE }, signal),
  });
}

export function useAcknowledgeAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiPatch<AlertItem>(`/api/alerts/${id}/acknowledge`, { user: ACK_USER }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["alerts"] });
      qc.invalidateQueries({ queryKey: ["digest"] });
    },
  });
}

/* ------------------------------- digest ------------------------------ */

export function useDigest(asOf: AsOf) {
  return useQuery({
    queryKey: ["digest", asOf],
    enabled: Boolean(asOf),
    queryFn: ({ signal }) => apiGet<DigestResponse>("/api/digest", { asOf }, signal),
  });
}

/* ------------------------------ pipeline ----------------------------- */

/**
 * Invalidate every snapshot-keyed query and the meta payload so the UI
 * reflects the freshly produced date after an advance-day / retry run.
 *
 * Called at trigger time (roll back the stale view) and again once the run
 * actually completes (the data is only readable after the chain finishes).
 */
function invalidatePipelineQueries(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: ["meta"] });
  void queryClient.invalidateQueries({ queryKey: ["runs"] });
  void queryClient.invalidateQueries({ queryKey: ["pipeline", "run-status"] });
  // Let the live chip && global watcher rediscover the just-started run so the
  // running-state polling kicks in immediately (no manual reload).
  void queryClient.invalidateQueries({ queryKey: ["pipeline", "runs"] });
  void queryClient.invalidateQueries({ queryKey: ["pipeline", "active-run"] });
  // Every endpoint keyed by the selected as-of date reads regenerated rows,
  // so the whole set must be invalidated for the new data to appear.
  void queryClient.invalidateQueries({ queryKey: ["kpi"] });
  void queryClient.invalidateQueries({ queryKey: ["aging"] });
  void queryClient.invalidateQueries({ queryKey: ["forecasts"] });
  void queryClient.invalidateQueries({ queryKey: ["replenishment"] });
  void queryClient.invalidateQueries({ queryKey: ["transfers"] });
  void queryClient.invalidateQueries({ queryKey: ["writeoffs"] });
  void queryClient.invalidateQueries({ queryKey: ["alerts"] });
  void queryClient.invalidateQueries({ queryKey: ["digest"] });
  void queryClient.invalidateQueries({ queryKey: ["demand-history"] });
  void queryClient.invalidateQueries({ queryKey: ["flu"] });
  void queryClient.invalidateQueries({ queryKey: ["model-metrics"] });
}

/** POST /api/pipeline/advance-day — advance the clock by one day + run chain. */
export function useAdvanceDay() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiPost<AdvanceDayResponse>("/api/pipeline/advance-day", {}),
    onSuccess: () => invalidatePipelineQueries(queryClient),
  });
}

/** POST /api/pipeline/retry — purge + re-run the chain for a selected date. */
export function useRetryPipeline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (date: string) =>
      apiPost<RetryPipelineResponse>("/api/pipeline/retry", { date }),
    onSuccess: () => invalidatePipelineQueries(queryClient),
  });
}

/**
 * Manually force re-fetch of every snapshot-keyed query once a pipeline run
 * finishes. The trigger-time invalidation above runs while the chain is still
 * executing, so a second invalidation here guarantees the UI reflects the
 * freshly written rows (otherwise the dashboard stays stale until a reload).
 */
export function useRefreshPipelineData() {
  const queryClient = useQueryClient();
  return () => invalidatePipelineQueries(queryClient);
}

/** GET /api/pipeline/state — current simulated clock. */
export function usePipelineState() {
  return useQuery({
    queryKey: ["pipeline", "state"],
    queryFn: ({ signal }) =>
      apiGet<PipelineStateResponse>("/api/pipeline/state", undefined, signal),
    staleTime: 60_000,
  });
}

/** GET /api/pipeline/runs — persisted ML run history (pipeline_run). */
export function usePipelineRuns(limit = 10) {
  return useQuery({
    queryKey: ["pipeline", "runs", limit],
    queryFn: ({ signal }) =>
      apiGet<PipelineRunsResponse>("/api/pipeline/runs", { limit }, signal),
    // Poll while the newest run is still active so the UI goes live the moment
    // a run starts and settles the moment it finishes — no manual reload needed.
    refetchInterval: (query) =>
      query.state.data?.runs?.[0]?.status === "running" ? 2000 : false,
    staleTime: 5_000,
  });
}

/**
 * Global watcher for the latest persisted run. Polls `/api/pipeline/runs`
 * while any run is active and calls `refreshPipelineData()` exactly once when
 * a run transitions `running → completed/failed`.
 *
 * Mounting this at the app root makes completion-driven data refresh robust
 * across full page reloads and from any page — it does not depend on the
 * component that originally triggered the run (whose mutation state is lost
 * on refresh). Run state lives in `pipeline_run` (PostgreSQL), so an in-flight
 * run is rediscovered here after a reload.
 */
export function useActivePipelineRun() {
  const refreshPipelineData = useRefreshPipelineData();
  const handledRef = useRef<string | null>(null);

  return useQuery<PipelineRunsResponse>({
    queryKey: ["pipeline", "active-run"],
    queryFn: ({ signal }) =>
      apiGet<PipelineRunsResponse>("/api/pipeline/runs", { limit: 1 }, signal),
    refetchInterval: (query) => {
      const latest = query.state.data?.runs?.[0];
      // Fast poll while active; slower heartbeat when idle so a run started
      // from another session (cron / another tab) is picked up without reload.
      return latest?.status === "running" ? 2000 : 15_000;
    },
    select: (data) => {
      const latest = data.runs?.[0];
      if (latest) {
        if (latest.status === "running") {
          // Track the in-flight run id; when it completes we refresh below.
          handledRef.current = null;
        } else if (handledRef.current !== latest.runId) {
          // Terminal state for a run we haven't already handled → refresh and
          // mark it done so the invalidation fires only once per run.
          handledRef.current = latest.runId;
          refreshPipelineData();
        }
      }
      return data;
    },
  });
}

/**
 * Poll a single run. The interval is derived from the last known status so
 * polling stops automatically once the sidecar reports completion/failure.
 */
export function usePipelineRunStatus(runId: string | null) {
  return useQuery<PipelineRunStatus>({
    queryKey: ["pipeline", "run-status", runId],
    enabled: Boolean(runId),
    refetchInterval: (query) =>
      ((query.state.data as PipelineRunStatus | undefined)?.status ?? "") ===
      "running"
        ? 2000
        : false,
    queryFn: ({ signal }) =>
      apiGet<PipelineRunStatus>(`/api/pipeline/status/${runId}`, undefined, signal),
  });
}
