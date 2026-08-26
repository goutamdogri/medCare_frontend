import { Warehouse } from "lucide-react";
import type { UseQueryResult } from "@tanstack/react-query";
import { Widget } from "@/components/ui/Widget";
import {
  CHART_COLORS,
} from "@/components/charts/chartTheme";
import { LegendChips } from "@/components/charts/LegendChips";
import { useApp } from "@/context/app-context";
import { formatInr, num } from "@/lib/format";
import type { AgingBucket, AgingResponse } from "@/types/api";

const BUCKETS: {
  key: AgingBucket;
  label: string;
  color: string;
}[] = [
  { key: "d0_30", label: "0–30 d", color: CHART_COLORS.danger },
  { key: "d31_60", label: "31–60 d", color: CHART_COLORS.warning },
  { key: "d61_90", label: "61–90 d", color: CHART_COLORS.secondary },
  { key: "d90plus", label: "90+ d", color: CHART_COLORS.success },
];

/** Page-1 side panel: stock value parked per location, split by expiry freshness.
 *  Metro DCs hoarding danger/warning buckets = the story hook. */
export function UtilizationStrip({ query }: { query: UseQueryResult<AgingResponse> }) {
  const { regionById } = useApp();

  return (
    <Widget
      title="Network inventory freshness"
      subtitle="Stock value on hand per location by days-to-expiry bucket — metro DCs sit on soon-to-expire stock."
      icon={Warehouse}
      iconClassName="bg-secondary-soft text-violet-700 dark:bg-secondary/15 dark:text-secondary"
      query={query}
      skeleton={
        <div className="space-y-4 px-5 pt-5 pb-6 sm:px-6">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="h-9 animate-pulse rounded-lg bg-line/70" />
          ))}
        </div>
      }
      bodyClassName="pt-4"
    >
      {(data) => {
        const rows = data.byLocation
          .map((rollup) => {
            const buckets = BUCKETS.map((b) => ({
              ...b,
              value: num(rollup.buckets[b.key]?.valueInr ?? 0),
            }));
            return {
              location: rollup.location,
              name: regionById.get(rollup.location)?.name ?? rollup.location,
              total: num(rollup.totalValueInr),
              buckets,
            };
          })
          .sort((a, b) => b.total - a.total);
        const max = Math.max(...rows.map((r) => r.total), 1);

        return (
          <div className="flex h-full flex-col justify-between gap-4">
            <div className="space-y-3.5">
              {rows.map((row) => (
                <div key={row.location}>
                  <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
                    <span className="truncate font-semibold text-ink">{row.name}</span>
                    <span className="font-bold text-sub tabular-nums">
                      {formatInr(row.total)}
                    </span>
                  </div>
                  <div
                    className="flex h-5 w-full overflow-hidden rounded-full bg-app"
                    title={`${row.name}: ${formatInr(row.total)} total`}
                  >
                    {row.buckets.map((bucket) => {
                      const pct = (bucket.value / max) * 100;
                      if (pct <= 0.05) return null;
                      return (
                        <div
                          key={bucket.key}
                          style={{ width: `${pct}%`, backgroundColor: bucket.color }}
                          className="h-full first:rounded-l-full last:rounded-r-full"
                          title={`${bucket.label}: ${formatInr(bucket.value)}`}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <LegendChips
              items={BUCKETS.map((b) => ({ label: b.label, color: b.color }))}
              className="border-t border-line pt-3"
            />
          </div>
        );
      }}
    </Widget>
  );
}
