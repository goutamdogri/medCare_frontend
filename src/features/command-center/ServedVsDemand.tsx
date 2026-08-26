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
import { RawJsonToggle } from "@/components/ui/RawJsonToggle";
import { ChartTooltip } from "@/components/charts/ChartTooltip";
import {
  AXIS_PROPS,
  CHART_COLORS,
  GRID_STROKE,
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
      subtitle="Daily network-wide units — how much forecast demand each policy actually fulfils."
      icon={Waves}
      iconClassName="bg-primary-soft text-indigo-700 dark:bg-primary/15 dark:text-primary"
      query={query}
      actions={
        <>
          <SegmentedControl options={POLICY_OPTIONS} value={policy} onChange={setPolicy} />
          <RawJsonToggle data={query.data} />
        </>
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
          <div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={rows} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
                  <CartesianGrid stroke={GRID_STROKE} vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    interval="preserveStartEnd"
                    minTickGap={28}
                    {...AXIS_PROPS}
                  />
                  <YAxis width={46} tickFormatter={formatCompact} {...AXIS_PROPS} axisLine={false} />
                  <Tooltip
                    content={
                      <ChartTooltip
                        valueFormatter={(v) => `${formatNum(v)} u`}
                      />
                    }
                    cursor={{ stroke: GRID_STROKE }}
                  />
                  <Area
                    type="monotone"
                    name="Fulfilled"
                    dataKey="fulfilled"
                    stroke={stroke}
                    strokeWidth={2.5}
                    fill={stroke}
                    fillOpacity={0.16}
                    activeDot={{ r: 4, strokeWidth: 0 }}
                  />
                  <Line
                    type="monotone"
                    name="Demand"
                    dataKey="demand"
                    stroke="var(--sub)"
                    strokeWidth={2}
                    strokeDasharray="6 4"
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <LegendChips
              className="mt-3"
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
