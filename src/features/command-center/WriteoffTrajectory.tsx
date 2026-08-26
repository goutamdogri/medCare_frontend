import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Flame } from "lucide-react";
import type { UseQueryResult } from "@tanstack/react-query";
import { Widget } from "@/components/ui/Widget";
import { Badge } from "@/components/ui/Badge";
import { ChartTooltip } from "@/components/charts/ChartTooltip";
import {
  AXIS_PROPS,
  CHART_COLORS,
  GRID_STROKE,
} from "@/components/charts/chartTheme";
import { LegendChips } from "@/components/charts/LegendChips";
import { formatCompact, formatDate, formatInr } from "@/lib/format";
import type { WriteoffCumulativeResponse } from "@/types/api";

interface Props {
  query: UseQueryResult<WriteoffCumulativeResponse>;
  savingInr?: number;
}

export function WriteoffTrajectory({ query, savingInr }: Props) {
  return (
    <Widget
      title="Expiry write-off trajectory"
      subtitle="Cumulative expired stock value per policy across the simulated horizon."
      icon={Flame}
      iconClassName="bg-danger-soft text-red-700 dark:bg-danger/15 dark:text-danger"
      query={query}
      actions={
        savingInr != null && (
          <Badge variant="success" className="px-3 py-1.5 text-xs">
            {formatInr(savingInr)} saved by expiry-aware planning
          </Badge>
        )
      }
    >
      {(data) => {
        const proposed = data.series.proposed ?? [];
        const statusQuo = data.series.statusQuo ?? [];
        const dates = Array.from(
          new Set([...proposed.map((p) => p.date), ...statusQuo.map((s) => s.date)]),
        ).sort();
        const rows = dates.map((date) => ({
          date,
          proposed: proposed.find((p) => p.date === date)?.cumulativeExpiredValueInr ?? 0,
          statusQuo: statusQuo.find((s) => s.date === date)?.cumulativeExpiredValueInr ?? 0,
        }));

        return (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="gradQuo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_COLORS.danger} stopOpacity={0.22} />
                    <stop offset="100%" stopColor={CHART_COLORS.danger} stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gradProp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_COLORS.success} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={CHART_COLORS.success} stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={GRID_STROKE} vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  interval="preserveStartEnd"
                  minTickGap={32}
                  {...AXIS_PROPS}
                />
                <YAxis width={52} tickFormatter={(v) => formatCompact(v)} {...AXIS_PROPS} axisLine={false} />
                <RechartsTooltip
                  content={<ChartTooltip valueFormatter={formatInr} />}
                  cursor={{ stroke: GRID_STROKE }}
                />
                <Area
                  type="monotone"
                  name="Status quo"
                  dataKey="statusQuo"
                  stroke={CHART_COLORS.danger}
                  strokeWidth={2}
                  fill="url(#gradQuo)"
                />
                <Area
                  type="monotone"
                  name="Proposed"
                  dataKey="proposed"
                  stroke={CHART_COLORS.success}
                  strokeWidth={2.5}
                  fill="url(#gradProp)"
                />
              </AreaChart>
            </ResponsiveContainer>
            <LegendChips
              className="mt-2 mb-1 justify-center sm:justify-start"
              items={[
                { label: "Status quo write-offs", color: CHART_COLORS.danger },
                { label: "Proposed write-offs", color: CHART_COLORS.success },
              ]}
            />
          </div>
        );
      }}
    </Widget>
  );
}
