import type {
  AgingResponse,
  AlertItem,
  AlertsResponse,
  DailyCurvesResponse,
  DemandPoint,
  DigestResponse,
  FluPoint,
  ForecastRow,
  ForecastsResponse,
  KpiResponse,
  MetaResponse,
  ModelMetricsResponse,
  ReplenishmentResponse,
  ReplenishmentSummary,
  RunEntry,
  TransfersResponse,
  WriteoffCumulativeResponse,
  WriteoffsResponse,
} from "@/types/api";

export const MOCK_AS_OF = "2026-08-26";

const locations = [
  { locationId: "DC_DELHI", name: "Delhi DC", type: "DC" },
  { locationId: "DC_MUMBAI", name: "Mumbai DC", type: "DC" },
  { locationId: "WH_INDORE", name: "Indore Warehouse", type: "WH" },
  { locationId: "WH_KOLKATA", name: "Kolkata Warehouse", type: "WH" },
];

const skus = [
  { skuId: "N02BE-01", brandName: "Paracetamol 500mg", atcCode: "N02BE", criticality: "critical" as const, unitCostInr: 2.4 },
  { skuId: "J01CA-02", brandName: "Amoxicillin 500mg", atcCode: "J01CA", criticality: "high" as const, unitCostInr: 8.75 },
  { skuId: "R03AC-03", brandName: "Salbutamol Inhaler", atcCode: "R03AC", criticality: "high" as const, unitCostInr: 42 },
  { skuId: "A10BA-04", brandName: "Metformin 500mg", atcCode: "A10BA", criticality: "standard" as const, unitCostInr: 1.8 },
];

function dateOffset(offset: number): string {
  const date = new Date(`${MOCK_AS_OF}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}

function paginated<T>(content: T[], size = content.length) {
  return { content, page: 0, size, totalElements: content.length };
}

export const mockMeta: MetaResponse = {
  asOf: MOCK_AS_OF,
  latestRun: {
    ranAt: "2026-08-26T05:45:00.000Z",
    status: "success",
    modelsUsed: ["lightgbm", "chronos"],
    lgbmWeight: "0.62",
    chronosWeight: "0.38",
    wmape: "0.087",
    durationSeconds: 184,
  },
  skus,
  regions: locations,
};

export const mockRuns: RunEntry[] = [
  {
    asOfDate: MOCK_AS_OF,
    previousAsOfDate: dateOffset(-1),
    modelsUsed: ["lightgbm", "chronos"],
    lgbmWeight: "0.62",
    chronosWeight: "0.38",
    wmape: "0.087",
    forecastRows: 672,
    status: "success",
    errorMessage: null,
    durationSeconds: 184,
    triggeredBy: "daily_pipeline",
    createdAt: "2026-08-26T05:45:00.000Z",
  },
  {
    asOfDate: dateOffset(-1),
    previousAsOfDate: dateOffset(-2),
    modelsUsed: ["lightgbm", "chronos"],
    lgbmWeight: "0.6",
    chronosWeight: "0.4",
    wmape: "0.091",
    forecastRows: 672,
    status: "success",
    errorMessage: null,
    durationSeconds: 191,
    triggeredBy: "daily_pipeline",
    createdAt: "2026-08-25T05:42:00.000Z",
  },
];

function makeCurves(): DailyCurvesResponse {
  const proposed = Array.from({ length: 42 }, (_, index) => {
    const demand = 1180 + Math.round(Math.sin(index / 4) * 90) + index * 5;
    return {
      date: dateOffset(index + 1), demand, fulfilled: demand - 18 - (index % 5),
      unfulfilled: 18 + (index % 5), expiredValueInr: 800 + index * 140,
      avgEndingInventory: 6200 - index * 24,
    };
  });
  const statusQuo = proposed.map((point, index) => ({
    ...point,
    fulfilled: point.demand - 70 - (index % 8),
    unfulfilled: 70 + (index % 8),
    expiredValueInr: 1500 + index * 310,
    avgEndingInventory: 7000 - index * 18,
  }));
  return { asOf: MOCK_AS_OF, series: { proposed, statusQuo } };
}

export const mockCurves = makeCurves();
export const mockKpi: KpiResponse = {
  asOf: MOCK_AS_OF,
  proposed: { fillRatePct: 98.4, criticalFillRatePct: 97.1, stockoutUnits: 412, criticalStockoutSitedays: 9, writeoffValueInr: 58400 },
  statusQuo: { fillRatePct: 94.8, criticalFillRatePct: 90.2, stockoutUnits: 1680, criticalStockoutSitedays: 31, writeoffValueInr: 134700 },
  improvement: { fillRatePctDelta: 3.6, criticalFillRatePctDelta: 6.9, stockoutUnitReductionPct: 75.5, writeoffSavingInr: 76300 },
};

export const mockCumulative: WriteoffCumulativeResponse = {
  asOf: MOCK_AS_OF,
  series: {
    proposed: mockCurves.series.proposed.map((point) => ({ date: point.date, cumulativeExpiredValueInr: point.expiredValueInr })),
    statusQuo: mockCurves.series.statusQuo.map((point) => ({ date: point.date, cumulativeExpiredValueInr: point.expiredValueInr })),
  },
};

export const mockAging: AgingResponse = {
  asOf: MOCK_AS_OF,
  snapshotDate: MOCK_AS_OF,
  buckets: locations.flatMap((location, locationIndex) => skus.map((sku, skuIndex) => ({
    location: location.locationId, skuId: sku.skuId, bucket: (["d0_30", "d31_60", "d61_90", "d90plus"] as const)[(locationIndex + skuIndex) % 4],
    units: 120 + locationIndex * 35 + skuIndex * 18, valueInr: (120 + locationIndex * 35 + skuIndex * 18) * sku.unitCostInr,
  }))),
  byLocation: locations.map((location, locationIndex) => {
    const base = 18000 + locationIndex * 6500;
    return {
      location: location.locationId,
      buckets: {
        d0_30: { units: 240 + locationIndex * 22, valueInr: base * 0.28 },
        d31_60: { units: 310 + locationIndex * 18, valueInr: base * 0.31 },
        d61_90: { units: 210 + locationIndex * 12, valueInr: base * 0.23 },
        d90plus: { units: 150 + locationIndex * 8, valueInr: base * 0.18 },
      },
      totalUnits: 910 + locationIndex * 60, totalValueInr: base,
    };
  }),
  statusDistribution: [
    { status: "available", batches: 68, units: 4200, valueInr: 64000 },
    { status: "near_expiry", batches: 19, units: 910, valueInr: 18500 },
    { status: "blocked", batches: 6, units: 240, valueInr: 5900 },
  ],
};

export function makeForecasts(skuId = "N02BE-01", region = "WH_INDORE"): ForecastsResponse {
  const sku = skus.find((item) => item.skuId === skuId) ?? skus[0];
  const regionFactor = region === "WH_INDORE" ? 1.12 : 0.94;
  const content: ForecastRow[] = Array.from({ length: 42 }, (_, index) => {
    const p50 = Math.round((92 + Math.sin(index / 5) * 12 + index * 0.8) * regionFactor);
    return {
      skuId: sku.skuId, region, atcCode: sku.atcCode, forecastDate: dateOffset(index + 1), horizon: index + 1,
      p10: Math.max(0, p50 - 18 - Math.round(index * 0.4)), p50, p90: p50 + 22 + Math.round(index * 0.5),
      momentumU: (1.08 + Math.sin(index / 7) * 0.08).toFixed(3), fluRatio: (1.15 + Math.sin(index / 6) * 0.1).toFixed(3), senseAdjustment: (0.06 + (index % 4) * 0.006).toFixed(3),
    };
  });
  return { ...paginated(content), asOf: MOCK_AS_OF, modelMix: { lgbm: "0.62", chronos: "0.38" } };
}

export function makeHistory(skuId = "N02BE-01"): DemandPoint[] {
  return Array.from({ length: 60 }, (_, index) => ({ date: dateOffset(index - 59), units: 95 + (skuId === "N02BE-01" ? 18 : 8) + Math.round(Math.sin(index / 4) * 14) + (index % 7) * 3 }));
}

export function makeFlu(region = "WH_INDORE"): FluPoint[] {
  return Array.from({ length: 102 }, (_, index) => ({ date: dateOffset(index - 59), region, indexValue: Number((1.05 + Math.sin(index / 8) * 0.18 + (region === "WH_INDORE" ? 0.16 : 0)).toFixed(2)) }));
}

const replRows = locations.flatMap((location, locationIndex) => skus.map((sku, skuIndex) => {
  const muDaily = 42 + skuIndex * 15 + locationIndex * 5;
  const onHand = skuIndex === 0 && locationIndex === 2 ? 18 : 260 - skuIndex * 24 + locationIndex * 18;
  const orderQty = Math.max(0, 420 - onHand + skuIndex * 12);
  const days = onHand === 18 ? null : Number((onHand / muDaily).toFixed(1));
  return {
    skuId: sku.skuId, region: location.locationId, criticality: sku.criticality, leadTimeDays: 4 + locationIndex,
    serviceLevel: sku.criticality === "critical" ? 0.99 : 0.95, muDaily: muDaily.toFixed(1), sigmaDaily: (muDaily * 0.28).toFixed(1),
    safetyStock: Math.round(muDaily * 2.2), targetPosition: Math.round(muDaily * 9), onHand, orderQty,
    orderValueInr: Math.round(orderQty * sku.unitCostInr), daysOfSupplyOnHand: days,
    status: days == null || days < 5 ? "stockout_risk" as const : days < 8 ? "low" as const : "ok" as const,
  };
}));

export const mockReplenishment: ReplenishmentResponse = { asOf: MOCK_AS_OF, ...paginated(replRows) };
export const mockReplenishmentSummary: ReplenishmentSummary = {
  asOf: MOCK_AS_OF,
  byStatus: { ok: replRows.filter((row) => row.status === "ok").length, low: replRows.filter((row) => row.status === "low").length, stockout_risk: replRows.filter((row) => row.status === "stockout_risk").length },
  totalOrderValueInr: replRows.reduce((total, row) => total + row.orderValueInr, 0),
  byCriticality: ["critical", "high", "standard", "low"].map((criticality) => ({ criticality: criticality as ReplenishmentSummary["byCriticality"][number]["criticality"], count: replRows.filter((row) => row.criticality === criticality).length, orderValueInr: replRows.filter((row) => row.criticality === criticality).reduce((total, row) => total + row.orderValueInr, 0) })),
};

export const mockTransfers: TransfersResponse = {
  asOf: MOCK_AS_OF,
  content: [
    { id: 1, batchId: "B-DEL-442", skuId: "N02BE-01", fromLocation: "DC_DELHI", toLocation: "WH_INDORE", qtyUnits: 420, expiryDate: dateOffset(12), daysToExpiry: 12, transferLeadDays: 2, valueSavedInr: 1008, reason: "expiry_rescue", srcDaysOfSupplyBefore: "3.2", carrier: "MedRoute" },
    { id: 2, batchId: "B-MUM-118", skuId: "J01CA-02", fromLocation: "DC_MUMBAI", toLocation: "WH_KOLKATA", qtyUnits: 180, expiryDate: dateOffset(28), daysToExpiry: 28, transferLeadDays: 3, valueSavedInr: 1575, reason: "shortage_rescue", srcDaysOfSupplyBefore: "4.8", carrier: "SwiftMed" },
    { id: 3, batchId: "B-IND-901", skuId: "R03AC-03", fromLocation: "WH_INDORE", toLocation: "DC_DELHI", qtyUnits: 75, expiryDate: dateOffset(19), daysToExpiry: 19, transferLeadDays: 2, valueSavedInr: 3150, reason: "expiry_rescue", srcDaysOfSupplyBefore: "2.1", carrier: null },
  ],
  summary: { totalTransfers: 3, totalUnitsMoved: 675, totalValueSavedInr: 5733, countByReason: { expiry_rescue: 2, shortage_rescue: 1 }, byLane: [{ lane: "DC_DELHI → WH_INDORE", count: 1, unitsMoved: 420 }, { lane: "DC_MUMBAI → WH_KOLKATA", count: 1, unitsMoved: 180 }] },
};

export const mockWriteoffs: WriteoffsResponse = {
  asOf: MOCK_AS_OF,
  content: [
    { id: 1, batchId: "B-KOL-220", skuId: "N02BE-01", location: "WH_KOLKATA", qtyUnits: 120, leftover: 120, residualWriteoffUnits: 120, unitCostInr: 2.4, residualValueInr: 288, expiryDate: dateOffset(3), daysToExpiry: 3 },
    { id: 2, batchId: "B-DEL-774", skuId: "A10BA-04", location: "DC_DELHI", qtyUnits: 350, leftover: 350, residualWriteoffUnits: 350, unitCostInr: 1.8, residualValueInr: 630, expiryDate: dateOffset(6), daysToExpiry: 6 },
  ],
  totals: { batchesAtRisk: 2, totalResidualUnits: 470, totalResidualValueInr: 918 },
};

export const mockAlerts: AlertItem[] = [
  { id: 101, severity: "RED", type: "shortage_risk", skuId: "N02BE-01", region: "WH_INDORE", facts: { criticality: "critical", days_of_supply: 0, lead_time_days: 6, order_value_inr: 964, recommended_order_units: 402 }, action: "Release replenishment order today.", acknowledged: false, acknowledgedBy: null, acknowledgedAt: null, createdAt: "2026-08-26T06:02:00.000Z" },
  { id: 102, severity: "AMBER", type: "expiry_writeoff_risk", skuId: "A10BA-04", region: "DC_DELHI", facts: { criticality: "standard", days_of_supply: 12, order_value_inr: 630 }, action: "Review transfer lane before expiry.", acknowledged: false, acknowledgedBy: null, acknowledgedAt: null, createdAt: "2026-08-26T06:04:00.000Z" },
  { id: 103, severity: "AMBER", type: "demand_surge_detected", skuId: "R03AC-03", region: "WH_INDORE", facts: { flu_ratio: 1.32, momentum_u: 1.18 }, action: "Increase review cadence for this region.", acknowledged: true, acknowledgedBy: "csco@pharma.in", acknowledgedAt: "2026-08-26T06:20:00.000Z", createdAt: "2026-08-26T05:58:00.000Z" },
];

export const mockDigest: DigestResponse = { asOf: MOCK_AS_OF, reviewMode: "DAILY_SURGE_MODE", surgeRegions: ["WH_INDORE"], redAlertCount: 1, digestText: "Indore is above the top-quartile flu threshold. One critical paracetamol position is at immediate stock-out risk; release the proposed order and review daily until the signal normalizes.", modelUsed: "rules + ensemble forecast" };
export const mockMetrics: ModelMetricsResponse = { as_of_date: MOCK_AS_OF, models: { ensemble: { wmape: 0.087, r_squared: 0.91, mae: 12.4, rmse: 18.7 }, lightgbm: { wmape: 0.094, r_squared: 0.89 }, chronos: { wmape: 0.103, r_squared: 0.86 } }, by_horizon: { "7": { ensemble: { wmape: 0.072 } }, "14": { ensemble: { wmape: 0.081 } }, "42": { ensemble: { wmape: 0.108 } } } };

export function mockGet(path: string, params: Record<string, unknown> = {}): unknown {
  if (path === "/api/meta") return mockMeta;
  if (path === "/api/runs") return mockRuns.slice(0, Number(params.limit ?? 10));
  if (path === "/api/kpi") return mockKpi;
  if (path === "/api/kpi/daily-curves") return mockCurves;
  if (path === "/api/kpi/writeoff-cumulative") return mockCumulative;
  if (path === "/api/inventory/aging") return mockAging;
  if (path === "/api/forecasts") return makeForecasts(String(params.skuId ?? "N02BE-01"), String(params.region ?? "WH_INDORE"));
  if (path === "/api/demand/history") return makeHistory(String(params.skuId ?? "N02BE-01"));
  if (path === "/api/flu") return makeFlu(String(params.region ?? "WH_INDORE"));
  if (path === "/api/model/metrics") return mockMetrics;
  if (path === "/api/replenishment") return mockReplenishment;
  if (path === "/api/replenishment/summary") return mockReplenishmentSummary;
  if (path === "/api/transfers") return { ...mockTransfers, content: params.reason ? mockTransfers.content.filter((row) => row.reason === params.reason) : mockTransfers.content };
  if (path === "/api/writeoffs") return mockWriteoffs;
  if (path === "/api/alerts") return { asOf: MOCK_AS_OF, ...paginated(mockAlerts) } satisfies AlertsResponse;
  if (path === "/api/digest") return mockDigest;
  throw new Error(`Mock API endpoint not implemented: ${path}`);
}

export function mockAcknowledge(id: number, user: string): AlertItem {
  const alert = mockAlerts.find((item) => item.id === id);
  if (!alert) throw new Error(`Alert ${id} not found`);
  alert.acknowledged = true;
  alert.acknowledgedBy = user;
  alert.acknowledgedAt = new Date().toISOString();
  return alert;
}
