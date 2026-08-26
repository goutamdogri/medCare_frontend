import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Activity as ActivityIcon } from "lucide-react";
import type { UseQueryResult } from "@tanstack/react-query";
import { Widget } from "@/components/ui/Widget";
import { RawJsonToggle } from "@/components/ui/RawJsonToggle";
import {
  AXIS_PROPS,
  CHART_COLORS,
  GRID_STROKE,
} from "@/components/charts/chartTheme";
import { LegendChips } from "@/components/charts/LegendChips";
import { formatCompact, formatDate, formatNum } from "@/lib/format";
import type {
  DailyCurvesResponse,
  DemandPoint,
  FluPoint,
  ForecastsResponse,
} from "@/types/api";

export interface BandRow {
  date: string;
  actual?: number;
  p50?: number;
  bandLow?: number;
  bandSpan?: number;
  flu?: number;
}

interface Props {
  forecastQuery: UseQueryResult<ForecastsResponse>;
  historyQuery: UseQueryResult<DemandPoint[]>;
  fluQuery: UseQueryResult<FluPoint[]>;
  curvesQuery: UseQueryResult<DailyCurvesResponse>;
  asOf: string;
  windowDays: number;
  onWindowChange: (days: number) => void;
}

function buildRows(
  history: DemandPoint[],
  forecasts: ForecastsResponse["content"],
  flu: FluPoint[],
): BandRow[] {
  const byDate = new Map<string, BandRow>();
  const firstForecastDate = forecasts[0]?.forecastDate;

  for (const h of history) {
    // Avoid overlapping the forecast series on its first day.
    if (firstForecastDate && h.date >= firstForecastDate) continue;
    byDate.set(h.date, { date: h.date, actual: h.units });
  }
  for (const f of forecasts) {
    const row = byDate.get(f.forecastDate) ?? { date: f.forecastDate };
    row.p50 = f.p50;
    row.bandLow = f.p10;
    row.bandSpan = Math.max(0, f.p90 - f.p10);
    byDate.set(f.forecastDate, row);
  }
  for (const point of flu) {
    const row = byDate.get(point.date);
    if (row) row.flu = point.indexValue;
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

/** Hero widget: actuals → uncertainty band (P10–P90) with P50 and ILI overlay. */
export function ForecastBand({
  forecastQuery,
  historyQuery,
  fluQuery,
  curvesQuery,
  asOf,
  windowDays,
  onWindowChange,
}: Props) {
  return (
    <Widget
      title="Demand forecast · sensing band"
      subtitle={`Actuals up to ${formatDate(asOf)}, then ensemble P10–P90 band with median. Flu index (right axis) leads the demand curve.`}
      icon={ActivityIcon}
      iconClassName="bg-primary-soft text-indigo-700 dark:bg-primary/15 dark:text-primary"
      query={forecastQuery}
      actions={
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs font-semibold text-sub">
            Window
            <input
              type="range"
              className="mc-slider w-32"
              style={{ "--fill": `${((windowDays - 1) / 41) * 100}%` } as React.CSSProperties}
              min={1}
              max={42}
              value={windowDays}
              onChange={(event) => onWindowChange(Number(event.target.value))}
              aria-label="Forecast window days"
            />
            <span className="rounded-lg bg-primary-soft px-2 py-0.5 font-bold text-indigo-700 tabular-nums dark:bg-primary/15 dark:text-primary">
              {windowDays}d
            </span>
          </label>
          <RawJsonToggle data={forecastQuery.data} />
        </div>
      }
    >
      {(forecasts) => {
        if (!historyQuery.data || !fluQuery.data || !curvesQuery.data) {
          return (
            <div className="flex h-80 items-center justify-center">
              <div className="h-80 w-full animate-pulse rounded-xl bg-line/70" />
            </div>
          );
        }
        const rows = buildRows(
          historyQuery.data,
          forecasts.content,
          fluQuery.data,
        );

        return (
          <BandChartInner
            rows={rows}
            curvesQuery={curvesQuery}
            asOf={asOf}
          />
        );
      }}
    </Widget>
  );
}

function BandChartInner({
  rows,
  curvesQuery,
  asOf,
}: {
  rows: BandRow[];
  curvesQuery: UseQueryResult<DailyCurvesResponse>;
  asOf: string;
}) {
  return (
    <div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={rows} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
            <CartesianGrid stroke={GRID_STROKE} vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              interval="preserveStartEnd"
              minTickGap={30}
              {...AXIS_PROPS}
            />
            <YAxis
              yAxisId="units"
              width={46}
              tickFormatter={formatCompact}
              {...AXIS_PROPS}
              axisLine={false}
            />
            <YAxis
              yAxisId="flu"
              orientation="right"
              width={38}
              domain={[0, (max: number) => Math.ceil(max * 1.15)]}
              {...AXIS_PROPS}
              tick={{ fill: CHART_COLORS.warning, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <RechartsTooltip
              cursor={{ stroke: GRID_STROKE }}
              content={<BandTooltip />}
            />
            <ReferenceLine
              yAxisId="units"
              x={curvesQuery.data?.series.proposed?.[0]?.date ?? asOf}
              stroke="var(--sub)"
              strokeDasharray="4 4"
              label={{
                value: "as of",
                position: "insideTopLeft",
                fontSize: 10,
                fill: "var(--sub)",
              }}
            />
            <Area
              yAxisId="units"
              dataKey="bandLow"
              stackId="band"
              name="_low"
              stroke="none"
              fill="none"
              legendType="none"
              tooltipType="none"
            />
            <Area
              yAxisId="units"
              dataKey="bandSpan"
              stackId="band"
              name="P10–P90 band"
              stroke="none"
              fill={CHART_COLORS.accent}
              fillOpacity={0.16}
              legendType="none"
            />
            <Line
              yAxisId="units"
              type="monotone"
              name="Actual units"
              dataKey="actual"
              stroke="var(--ink)"
              strokeWidth={2.5}
              dot={false}
              connectNulls={false}
            />
            <Line
              yAxisId="units"
              type="monotone"
              name="P50 forecast"
              dataKey="p50"
              stroke={CHART_COLORS.info}
              strokeWidth={2.5}
              dot={false}
              connectNulls={false}
            />
            <Line
              yAxisId="flu"
              type="monotone"
              name="Flu index"
              dataKey="flu"
              stroke={CHART_COLORS.warning}
              strokeWidth={1.75}
              strokeDasharray="7 5"
              dot={false}
              connectNulls
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <LegendChips
        className="mt-2 justify-center sm:justify-start"
        items={[
          { label: "Actual units", color: "var(--ink)" },
          { label: "P50 forecast", color: CHART_COLORS.info },
          { label: "P10–P90 band", color: CHART_COLORS.accent },
          { label: "Flu index (ILI)", color: CHART_COLORS.warning, dashed: true },
        ]}
      />
    </div>
  );
}

function BandTooltip({
  active,
  label,
  payload,
}: {
  active?: boolean;
  label?: string | number;
  payload?: { dataKey?: string | number; value?: number | string; color?: string; name?: string }[];
}) {
  if (!active || !payload?.length) return null;
  const get = (key: string) =>
    payload.find((entry) => entry.dataKey === key)?.value;

  const actual = get("actual");
  const p50 = get("p50");
  const lowEntry = payload.find((entry) => entry.dataKey === "bandLow");
  const spanEntry = payload.find((entry) => entry.dataKey === "bandSpan");
  const lowNum = Number(lowEntry?.value ?? NaN);
  const spanNum = Number(spanEntry?.value ?? NaN);
  const low = lowEntry?.value != null ? lowNum : NaN;
  const high = lowEntry?.value != null && spanEntry?.value != null ? lowNum + spanNum : NaN;
  const flu = get("flu");

  return (
    <div className="rounded-xl border border-line bg-card px-3.5 py-2.5 shadow-pop">
      <p className="mb-1.5 text-[11px] font-bold tracking-wide text-sub uppercase">
        {typeof label === "string" ? formatDate(label) : label}
      </p>
      <div className="space-y-1 text-xs">
        <Row color="var(--ink)" label="Actual" value={actual != null ? `${formatNum(Number(actual))} u` : "—"} />
        <Row color={CHART_COLORS.info} label="P50" value={p50 != null ? `${formatNum(Number(p50))} u` : "—"} />
        <Row
          color={CHART_COLORS.accent}
          label="P10–P90"
          value={Number.isFinite(low) && Number.isFinite(high) ? `${formatNum(low)} – ${formatNum(high)} u` : "—"}
        />
        {flu != null && (
          <Row color={CHART_COLORS.warning} label="Flu index" value={String(Math.round(Number(flu) * 100) / 100)} />
        )}
      </div>
    </div>
  );
}

function Row({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span aria-hidden className="size-2 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-sub">{label}</span>
      <span className="ml-auto pl-4 font-bold text-ink tabular-nums">{value}</span>
    </div>
  );
}
