import { Info } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { UseQueryResult } from "@tanstack/react-query";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table, Td, Th, Tr } from "@/components/ui/Table";
import { SkeletonBlock } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/States";
import {
  AXIS_PROPS,
  CHART_COLORS,
  GRID_STROKE,
} from "@/components/charts/chartTheme";
import { num, numOrNull } from "@/lib/format";
import type { ForecastsResponse, ModelMetricsResponse, RunEntry } from "@/types/api";

/* ------------------------- Sensing factor table ---------------------- */

const FACT_DOCS: Record<string, string> = {
  momentumU:
    "Recent demand momentum vs baseline — a ratio above ×1 means demand is accelerating.",
  fluRatio:
    "ILI (flu) index now vs 14 days ago — the leading indicator of demand spikes.",
  senseAdjustment:
    "Total sensing uplift applied to the base model output for this SKU/region.",
};

function avg(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

interface SensingTableProps {
  query: UseQueryResult<ForecastsResponse>;
  skuId: string;
  region: string;
  windowDays: number;
}

export function SensingTable({ query, skuId, region, windowDays }: SensingTableProps) {
  const render = () => {
    if (query.isPending) return <SkeletonBlock lines={2} />;
    if (query.isError)
      return <ErrorState message={(query.error as Error)?.message} onRetry={() => void query.refetch()} />;

    const rows = query.data?.content ?? [];
    const momentum = avg(rows.map((r) => num(r.momentumU)));
    const fluRatio = avg(rows.map((r) => num(r.fluRatio)));
    const uplift = avg(rows.map((r) => num(r.senseAdjustment)));

    const cells: { key: string; label: string; display: string }[] = [
      { key: "momentumU", label: "Momentum", display: `×${(momentum ?? 0).toFixed(2)}` },
      { key: "fluRatio", label: "Flu ratio", display: `${(fluRatio ?? 0).toFixed(1)}×` },
      {
        key: "senseAdjustment",
        label: "Sense adjustment",
        display: `+${((uplift ?? 0) * 100).toFixed(1)}% uplift`,
      },
    ];

    return (
      <Table>
        <thead>
          <tr>
            <Th>Factor</Th>
            <Th align="right">Avg over {windowDays}-day horizon</Th>
            <Th align="right">
              <span className="inline-flex items-center gap-1">
                What it means <Info className="size-3.5" />
              </span>
            </Th>
          </tr>
        </thead>
        <tbody>
          {cells.map((cell) => (
            <Tr key={cell.key}>
              <Td className="font-semibold">{cell.label}</Td>
              <Td align="right" className="font-bold text-info tabular-nums">
                {cell.display}
              </Td>
              <Td align="right" className="max-w-sm text-xs text-sub normal-case whitespace-normal">
                {FACT_DOCS[cell.key]}
              </Td>
            </Tr>
          ))}
        </tbody>
      </Table>
    );
  };

  return (
    <Card>
      <CardHeader
        title={`Sensing factors · ${skuId} @ ${region}`}
        subtitle="Leading indicators averaged across the forecast horizon."
      />
      <div className="px-5 pt-3 pb-5 sm:px-6">{render()}</div>
    </Card>
  );
}

/* --------------------------- Model mix donut ------------------------- */

export function ModelMixDonut({
  query,
}: {
  query: UseQueryResult<ForecastsResponse>;
}) {
  const mix = query.data?.modelMix;
  const lgbm = numOrNull(mix?.lgbm);
  const chronos = numOrNull(mix?.chronos);
  const data =
    lgbm != null && chronos != null
      ? [
          { name: "LightGBM", value: Math.round(lgbm * 100), color: CHART_COLORS.secondary },
          { name: "Chronos", value: Math.round(chronos * 100), color: CHART_COLORS.primary },
        ]
      : [];

  return (
    <Card className="flex flex-col">
      <CardHeader
        title="Ensemble model mix"
        subtitle="Gradient boosting + foundation time-series."
      />
      <div className="flex flex-1 flex-col items-center px-5 pt-2 pb-5 sm:px-6">
        {data.length === 0 ? (
          <div className="h-44 w-full animate-pulse rounded-xl bg-line/70" />
        ) : (
          <>
            <div className="relative h-44 w-full max-w-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    dataKey="value"
                    innerRadius={52}
                    outerRadius={76}
                    paddingAngle={3}
                    cornerRadius={6}
                    strokeWidth={0}
                    startAngle={90}
                    endAngle={450}
                  >
                    {data.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value) => `${String(value)}%`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
                <div>
                  <p className="text-xl font-extrabold text-ink tabular-nums">
                    {data[0].value}/{data[1].value}
                  </p>
                  <p className="text-[10px] font-semibold tracking-wider text-sub uppercase">
                    LGBM / Chronos
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-3 flex gap-4">
              {data.map((entry) => (
                <Badge key={entry.name} variant={entry.name === "Chronos" ? "primary" : "secondary"}>
                  {entry.name} {entry.value}%
                </Badge>
              ))}
            </div>
          </>
        )}
      </div>
    </Card>
  );
}

/* ----------------------------- WMAPE note ---------------------------- */

export function WmapeNote({
  runsQuery,
  metricsQuery,
}: {
  runsQuery: UseQueryResult<RunEntry[]>;
  metricsQuery: UseQueryResult<ModelMetricsResponse>;
}) {
  const runsWmape = numOrNull(runsQuery.data?.[0]?.wmape);
  const runAsOf = runsQuery.data?.[0]?.asOfDate;
  const runStatus = runsQuery.data?.[0]?.status;
  const ensembleMetrics = metricsQuery.data?.models?.ensemble;
  const metricsWmape = ensembleMetrics?.wmape != null ? num(ensembleMetrics.wmape) * 100 : null;
  const metricsR2 = ensembleMetrics?.r_squared != null ? num(ensembleMetrics.r_squared) : null;
  const metricsMae = ensembleMetrics?.mae != null ? num(ensembleMetrics.mae) : null;
  const metricsRmse = ensembleMetrics?.rmse != null ? num(ensembleMetrics.rmse) : null;

  const displayWmape = metricsWmape ?? runsWmape;

  return (
    <Card className="p-5 sm:p-6">
      <p className="text-xs font-semibold tracking-wide text-sub uppercase">
        Realized accuracy
      </p>
      <p className="mt-2 text-2xl font-extrabold text-ink tabular-nums">
        {displayWmape != null ? `${displayWmape.toFixed(2)}%` : "\u2014"}
      </p>
      <p className="mt-1 text-xs leading-relaxed text-sub">
        {displayWmape != null ? (
          <>WMAPE from model evaluation (training-time backtest).</>
        ) : (
          <>WMAPE pending \u2014 first actuals not yet available for this run.</>
        )}
      </p>
      {ensembleMetrics && (
        <div className="mt-3 grid grid-cols-3 gap-2">
          {metricsR2 != null && (
            <div className="rounded-lg bg-app px-2.5 py-2 text-center">
              <p className="text-[10px] font-semibold text-sub uppercase">R\u00B2</p>
              <p className="mt-0.5 text-sm font-bold text-ink tabular-nums">{metricsR2.toFixed(3)}</p>
            </div>
          )}
          {metricsMae != null && (
            <div className="rounded-lg bg-app px-2.5 py-2 text-center">
              <p className="text-[10px] font-semibold text-sub uppercase">MAE</p>
              <p className="mt-0.5 text-sm font-bold text-ink tabular-nums">{metricsMae.toFixed(1)}</p>
            </div>
          )}
          {metricsRmse != null && (
            <div className="rounded-lg bg-app px-2.5 py-2 text-center">
              <p className="text-[10px] font-semibold text-sub uppercase">RMSE</p>
              <p className="mt-0.5 text-sm font-bold text-ink tabular-nums">{metricsRmse.toFixed(1)}</p>
            </div>
          )}
        </div>
      )}
      {runAsOf && (
        <p className="mt-2 text-[11px] text-sub">
          Run {runAsOf} \u00B7 {runStatus === "success" ? "Success" : runStatus ?? "\u2014"}
        </p>
      )}
    </Card>
  );
}

/* ---------------------- Factor importance chart --------------------- */

const FACTOR_COLORS: Record<string, string> = {
  momentumU: CHART_COLORS.info,
  fluRatio: CHART_COLORS.warning,
  senseAdjustment: CHART_COLORS.accent,
};

export function FactorImportanceBar({
  query,
}: {
  query: UseQueryResult<ForecastsResponse>;
}) {
  const render = () => {
    if (query.isPending) return <SkeletonBlock lines={3} />;
    if (query.isError)
      return (
        <ErrorState
          message={(query.error as Error)?.message}
          onRetry={() => void query.refetch()}
        />
      );

    const rows = query.data?.content ?? [];
    const factors: { key: string; field: "momentumU" | "fluRatio" | "senseAdjustment"; label: string }[] = [
      { key: "momentumU", field: "momentumU", label: "Momentum" },
      { key: "fluRatio", field: "fluRatio", label: "Flu ratio" },
      { key: "senseAdjustment", field: "senseAdjustment", label: "Sense adj." },
    ];
    const means = factors.map((f) => {
      const vals = rows.map((r) => Math.abs(num(r[f.field])));
      const avg = vals.length > 0 ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
      return { key: f.key, label: f.label, value: avg };
    });
    const maxVal = Math.max(...means.map((m) => m.value), 0.001);
    const barData = means.map((m) => ({
      ...m,
      pct: Math.round((m.value / maxVal) * 100),
    }));

    return (
      <div className="px-5 pt-3 pb-5 sm:px-6">
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={barData}
              layout="vertical"
              margin={{ top: 0, right: 8, bottom: 0, left: 0 }}
              barCategoryGap="25%"
            >
              <CartesianGrid stroke={GRID_STROKE} horizontal={false} />
              <XAxis
                type="number"
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
                {...AXIS_PROPS}
                axisLine={false}
              />
              <YAxis
                type="category"
                dataKey="label"
                width={72}
                {...AXIS_PROPS}
                axisLine={false}
                tickLine={false}
              />
              <Bar dataKey="pct" radius={[0, 6, 6, 0]} barSize={18}>
                {barData.map((entry) => (
                  <Cell
                    key={entry.key}
                    fill={FACTOR_COLORS[entry.key] ?? CHART_COLORS.secondary}
                    fillOpacity={0.85}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader
        title="Factor importance"
        subtitle="Average absolute sensing contribution across the forecast horizon."
      />
      {render()}
    </Card>
  );
}
