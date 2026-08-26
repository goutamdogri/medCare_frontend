import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  QueryClient,
} from "@tanstack/react-query";
import { apiGet, apiPatch } from "@/api/client";
import type {
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
  ReplenishmentResponse,
  ReplenishmentSummary,
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
