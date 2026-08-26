/**
 * DTOs mirroring docs/backend-spec.md as served by the live mock API.
 * MySQL DECIMAL columns arrive as strings → numeric fields are `NumLike`
 * and must go through num()/numOrNull() from lib/format before arithmetic.
 */

export type NumLike = number | string | null | undefined;

export type Criticality = "critical" | "high" | "standard" | "low";
export type ReplenishmentStatus = "ok" | "low" | "stockout_risk";
export type Severity = "RED" | "AMBER";
export type AlertType =
  | "shortage_risk"
  | "expiry_writeoff_risk"
  | "demand_surge_detected";
export type Policy = "proposed" | "status_quo";
export type TransferReason = "expiry_rescue" | "shortage_rescue";
export type ReviewMode = "DAILY_SURGE_MODE" | "WEEKLY_STANDARD";
export type AgingBucket = "d0_30" | "d31_60" | "d61_90" | "d90plus";

export interface Paginated<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
}

/* ----------------------------- /api/meta ---------------------------- */

export interface SkuMaster {
  skuId: string;
  brandName: string;
  atcCode: string;
  criticality: Criticality;
  unitCostInr: number;
}

export interface RegionMaster {
  locationId: string;
  name: string;
  type: string;
}

export interface LatestRun {
  ranAt: string;
  status: string;
  modelsUsed: string[] | null;
  lgbmWeight: NumLike;
  chronosWeight: NumLike;
  wmape: NumLike;
  durationSeconds: number | null;
}

export interface MetaResponse {
  asOf: string;
  latestRun: LatestRun;
  skus: SkuMaster[];
  regions: RegionMaster[];
}

/* ------------------------- /api/runs (audit) ------------------------ */

export interface RunEntry {
  asOfDate: string;
  previousAsOfDate: string | null;
  modelsUsed: string[] | null;
  lgbmWeight: NumLike;
  chronosWeight: NumLike;
  wmape: NumLike;
  forecastRows: number | null;
  status: "success" | "partial" | "failed";
  errorMessage: string | null;
  durationSeconds: number | null;
  triggeredBy: string;
  createdAt: string;
}

/* ------------------------------ KPIs -------------------------------- */

export interface PolicyKpi {
  fillRatePct: NumLike;
  criticalFillRatePct: NumLike;
  stockoutUnits: number;
  criticalStockoutSitedays: number;
  writeoffValueInr: number;
}

export interface KpiImprovement {
  fillRatePctDelta: number;
  criticalFillRatePctDelta: number;
  stockoutUnitReductionPct: number;
  writeoffSavingInr: number;
}

export interface KpiResponse {
  asOf: string;
  proposed: PolicyKpi;
  statusQuo: PolicyKpi;
  improvement: KpiImprovement;
}

export interface CurvePoint {
  date: string;
  demand: number;
  fulfilled: number;
  unfulfilled: number;
  expiredValueInr: number;
  avgEndingInventory: number;
}

export interface DailyCurvesResponse {
  asOf: string;
  series: { proposed: CurvePoint[]; statusQuo: CurvePoint[] };
}

export interface CumulativePoint {
  date: string;
  cumulativeExpiredValueInr: number;
}

export interface WriteoffCumulativeResponse {
  asOf: string;
  series: { proposed: CumulativePoint[]; statusQuo: CumulativePoint[] };
}

/* ---------------------------- Forecasts ------------------------------ */

export interface ForecastRow {
  skuId: string;
  region: string;
  atcCode: string;
  forecastDate: string;
  horizon: number;
  p10: number;
  p50: number;
  p90: number;
  momentumU: NumLike;
  fluRatio: NumLike;
  senseAdjustment: NumLike;
}

export interface ModelMix {
  lgbm: NumLike;
  chronos: NumLike;
}

export interface ForecastsResponse extends Paginated<ForecastRow> {
  modelMix: ModelMix;
  asOf: string;
}

/* ----------------------- History & flu index ------------------------ */

export interface DemandPoint {
  date: string;
  units: number;
}

export interface FluPoint {
  date: string;
  region: string;
  indexValue: number;
}

/* -------------------------- Replenishment --------------------------- */

export interface ReplenishmentRow {
  skuId: string;
  region: string;
  criticality: Criticality;
  leadTimeDays: number;
  serviceLevel: number;
  muDaily: NumLike;
  sigmaDaily: NumLike;
  safetyStock: number;
  targetPosition: number;
  onHand: number;
  orderQty: number;
  orderValueInr: number;
  /** NULL when already stocked out → ∞ days of supply consumed. */
  daysOfSupplyOnHand: NumLike;
  status: ReplenishmentStatus;
}

export interface ReplenishmentResponse extends Paginated<ReplenishmentRow> {
  asOf: string;
}

export interface CriticalitySummary {
  criticality: Criticality;
  count: number;
  orderValueInr: number;
}

export interface ReplenishmentSummary {
  asOf: string;
  byStatus: Record<ReplenishmentStatus, number>;
  totalOrderValueInr: number;
  byCriticality: CriticalitySummary[];
}

/* --------------------- Transfers & write-offs ------------------------ */

export interface TransferLaneSummary {
  lane: string;
  count: number;
}

export interface TransfersSummary {
  totalUnits: number;
  totalValueSavedInr: number;
  count: number;
  byReason: Partial<Record<TransferReason, number>>;
  byLane?: TransferLaneSummary[];
}

export interface TransferRow {
  id: number;
  batchId: string | null;
  skuId: string;
  fromLocation: string;
  toLocation: string;
  qtyUnits: number;
  expiryDate: string | null;
  daysToExpiry: number | null;
  transferLeadDays: number;
  valueSavedInr: number;
  reason: TransferReason;
  srcDaysOfSupplyBefore: NumLike;
  carrier: string | null;
}

export interface TransfersResponse {
  asOf: string;
  transfers: TransferRow[];
  summary: TransfersSummary;
}

export interface WriteoffRow {
  id: number;
  batchId: string;
  skuId: string;
  location: string;
  qtyUnits: number;
  leftover: number;
  residualWriteoffUnits: number;
  unitCostInr: number;
  residualValueInr: number;
  expiryDate: string;
  daysToExpiry: number;
}

export interface WriteoffsResponse {
  asOf: string;
  totalResidualExposureInr: number;
  writeoffs: WriteoffRow[];
}

/* ------------------------- Inventory aging --------------------------- */

export interface AgingRow {
  location: string;
  skuId: string;
  bucket: AgingBucket;
  units: number;
  valueInr: number;
}

/** Rolled-up-by-location shape served alongside detail rows. */
export interface AgingLocationRollup {
  location: string;
  buckets: {
    d0_30: { units: number; valueInr: number };
    d31_60: { units: number; valueInr: number };
    d61_90: { units: number; valueInr: number };
    d90plus: { units: number; valueInr: number };
  };
  totalUnits: number;
  totalValueInr: number;
}

export interface AgingStatusRow {
  status: string;
  batches: number;
  units: number;
  valueInr: number;
}

export interface AgingResponse {
  asOf: string;
  snapshotDate: string;
  buckets: AgingRow[];
  byLocation: AgingLocationRollup[];
  statusDistribution: AgingStatusRow[];
}

/* ------------------------------- Alerts ------------------------------ */

/** facts JSON uses snake_case keys (backend passes DB JSON through). */
export interface AlertFacts {
  criticality?: Criticality;
  days_of_supply?: number | null;
  lead_time_days?: number | null;
  order_value_inr?: number | null;
  recommended_order_units?: number | null;
  [key: string]: unknown;
}

export interface AlertItem {
  id: number;
  severity: Severity;
  type: AlertType;
  skuId: string;
  region: string;
  facts: AlertFacts | null;
  action: string | null;
  acknowledged: boolean;
  acknowledgedBy: string | null;
  acknowledgedAt: string | null;
  createdAt: string;
}

export interface AlertsResponse extends Paginated<AlertItem> {
  asOf: string;
}

/* ------------------------------- Digest ------------------------------ */

export interface DigestResponse {
  asOf: string;
  reviewMode: ReviewMode;
  surgeRegions: string[];
  redAlertCount: number;
  digestText: string;
  modelUsed: string | null;
}

/* ----------------------- Model evaluation metrics ------------------- */

export interface ModelMetricsResponse {
  as_of_date: string | null;
  models: Record<string, Record<string, number | null>>;
  by_horizon: Record<string, Record<string, Record<string, number | null>>>;
}
