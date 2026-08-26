import { useState } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Waves } from "lucide-react";
import type { UseQueryResult } from "@tanstack/react-query";
import { Widget } from "@/components/ui/Widget";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { ChartTooltip } from "@/components/charts/ChartTooltip";
import {
  AXIS_PROPS,
  CHART_COLORS,
  GRID_STROKE,
  GRID_OPACITY,
  GRADIENT_STOPS,
} from "@/components/charts/chartTheme";
import { LegendChips } from "@/components/charts/LegendChips";
import { formatCompact, formatDate, formatNum, num } from "@/lib/format";
import type { DailyCurvesResponse, Policy } from "@/types/api";

const POLICY_OPTIONS: { value: Policy; label: string }[] = [
  { value: "proposed", label: "Proposed" },
  { value: "status_quo", label: "Status quo" },
];

export function ServedVsDemand({ query }: { query: UseQueryResult<DailyCurvesResponse> }) {
  const [policy, setPolicy] = useState<Policy>("proposed");

  return (
    <Widget
      className="xl:col-span-2"
      title="Served vs demand · 42-day horizon"
      subtitle="How much forecast demand each policy fulfils."
      icon={Waves}
      iconClassName="bg-primary-soft text-indigo-700 dark:bg-primary/15 dark:text-primary"
      query={query}
      actions={
        <SegmentedControl options={POLICY_OPTIONS} value={policy} onChange={setPolicy} />
      }
    >
      {(data) => {
        const series = policy === "proposed" ? data.series.proposed : data.series.statusQuo;
        const rows = (series ?? []).map((point) => ({
          date: point.date,
          demand: Math.round(num(point.demand)),
          fulfilled: Math.round(num(point.fulfilled)),
        }));
        // Policy colors: proposed = info blue, status quo = neutral gray.
        const stroke =
          policy === "proposed" ? CHART_COLORS.info : "var(--sub)";

        return (
          <div className="flex flex-1 flex-col">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={rows} margin={{ top: 10, right: 6, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id={`fill-fulfilled-${policy}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={policy === "proposed" ? GRADIENT_STOPS.info.stop1 : GRADIENT_STOPS.sub.stop1} stopOpacity={1} />
                      <stop offset="100%" stopColor={policy === "proposed" ? GRADIENT_STOPS.info.stop2 : GRADIENT_STOPS.sub.stop2} stopOpacity={1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={GRID_STROKE} strokeOpacity={GRID_OPACITY} vertical={false} strokeDasharray="3 6" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    interval="preserveStartEnd"
                    minTickGap={28}
                    {...AXIS_PROPS}
                    tickMargin={8}
                  />
                  <YAxis
                    width={44}
                    tickFormatter={formatCompact}
                    {...AXIS_PROPS}
                    tickMargin={4}
                  />
                  <Tooltip
                    content={
                      <ChartTooltip
                        valueFormatter={(v) => `${formatNum(v)} u`}
                      />
                    }
                    cursor={{ stroke: GRID_STROKE, strokeOpacity: 0.7, strokeWidth: 1 }}
                  />
                  <Area
                    type="monotoneX"
                    name={`Fulfilled (${policy === "proposed" ? "proposed" : "status quo"})`}
                    dataKey="fulfilled"
                    stroke={stroke}
                    strokeWidth={2}
                    fill={`url(#fill-fulfilled-${policy})`}
                    activeDot={{ r: 4, strokeWidth: 0, fill: stroke }}
                  />
                  <Line
                    type="monotoneX"
                    name="Forecast demand"
                    dataKey="demand"
                    stroke="var(--sub)"
                    strokeWidth={1.5}
                    strokeDasharray="5 5"
                    strokeOpacity={0.7}
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <LegendChips
              className="mt-auto pt-3"
              items={[
                { label: `Fulfilled (${policy === "proposed" ? "proposed" : "status quo"})`, color: stroke },
                { label: "Forecast demand", color: "var(--sub)", dashed: true },
              ]}
            />
          </div>
        );
      }}
    </Widget>
  );
}
