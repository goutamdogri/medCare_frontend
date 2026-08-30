import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { Warehouse } from "lucide-react";
import type { UseQueryResult } from "@tanstack/react-query";

import { Widget } from "@/components/ui/Widget";
import { LegendChips } from "@/components/charts/LegendChips";
import { useApp } from "@/context/app-context";
import { formatInr, num } from "@/lib/format";
import type { AgingBucket, AgingResponse } from "@/types/api";

const BUCKETS: {
  key: AgingBucket;
  label: string;
  color: string;
}[] = [
  {
    key: "d0_30",
    label: "0–30 d",
    color: "#F87171",
  },
  {
    key: "d31_60",
    label: "31–60 d",
    color: "#FBBF24",
  },
  {
    key: "d61_90",
    label: "61–90 d",
    color: "#8B5CF6",
  },
  {
    key: "d90plus",
    label: "90+ d",
    color: "#34D399",
  },
];

/** Page-1 side panel: stock value parked per location, split by expiry freshness.
 *  Metro DCs hoarding danger/warning buckets = the story hook. */
export function UtilizationStrip({
  query,
}: {
  query: UseQueryResult<AgingResponse>;
}) {
  const { regionById } = useApp();

  // Frontend-only refs for GSAP animation.
  const segmentRefs = useRef<(HTMLDivElement | null)[]>([]);

  useLayoutEffect(() => {
    if (query.isPending || !query.data) return;

    const segments = segmentRefs.current.filter(
      (segment): segment is HTMLDivElement => segment !== null,
    );

    if (!segments.length) return;

    // Reset before animation.
    gsap.set(segments, {
      width: "0%",
    });

    const ctx = gsap.context(() => {
      gsap.to(segments, {
        width: (index) =>
          segments[index]?.dataset.targetWidth ?? "0%",
        duration: 0.85,
        ease: "power3.out",
        stagger: 0.07,
      });
    });

    return () => {
      ctx.revert();
    };
  }, [query.data, query.isPending]);

  return (
    <Widget
      title="Network inventory freshness"
      subtitle="On-hand stock value by location and expiry age."
      icon={Warehouse}
      iconClassName="bg-secondary-soft text-violet-700 dark:bg-secondary/15 dark:text-secondary"
      query={query}
      skeleton={
        <div className="space-y-4 px-5 pt-5 pb-6 sm:px-6">
          {Array.from({ length: 6 }, (_, i) => (
            <div
              key={i}
              className="h-9 animate-pulse rounded-lg bg-line/70"
            />
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
              value: num(
                rollup.buckets[b.key]?.valueInr ?? 0,
              ),
            }));

            return {
              location: rollup.location,
              name:
                regionById.get(rollup.location)?.name ??
                rollup.location,
              total: num(rollup.totalValueInr),
              buckets,
            };
          })
          .sort((a, b) => b.total - a.total);

        const max = Math.max(
          ...rows.map((r) => r.total),
          1,
        );

        return (
          <div className="flex h-full flex-col justify-between gap-5">
            <div className="space-y-5">
              {rows.map((row, rowIndex) => (
                <div
                  key={row.location}
                  className="group"
                >
                  {/* Location + value */}
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="truncate text-sm font-semibold text-ink">
                      {row.name}
                    </span>

                    <span className="shrink-0 text-sm font-bold text-sub tabular-nums">
                      {formatInr(row.total)}
                    </span>
                  </div>

                  {/* Bar track */}
                  <div
                    className="
                      relative
                      h-4
                      w-full
                      overflow-hidden
                      rounded-full
                      bg-slate-100
                      ring-1
                      ring-black/[0.03]
                    "
                    title={`${row.name}: ${formatInr(row.total)} total`}
                  >
                    {/* Colored segments */}
                    <div className="flex h-full">
                      {row.buckets.map((bucket, bucketIndex) => {
                        const pct =
                          (bucket.value / max) * 100;

                        if (pct <= 0.05) return null;

                        /*
                         * Use a deterministic ref index so React
                         * does not keep pushing duplicate refs.
                         */
                        const refIndex =
                          rowIndex * BUCKETS.length +
                          bucketIndex;

                        return (
                          <div
                            key={bucket.key}
                            ref={(el) => {
                              segmentRefs.current[refIndex] =
                                el;
                            }}
                            data-target-width={`${pct}%`}
                            style={{
                              width: `${pct}%`,
                              backgroundColor:
                                bucket.color,
                            }}
                            className="
                              h-full
                              shrink-0
                              border-r
                              border-white/60
                              transition-all
                              duration-200
                              hover:brightness-105
                              hover:saturate-[1.08]
                            "
                            title={`${bucket.label}: ${formatInr(
                              bucket.value,
                            )}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Legend */}
            <LegendChips
              items={BUCKETS.map((b) => ({
                label: b.label,
                color: b.color,
              }))}
              className="border-t border-line pt-4"
            />
          </div>
        );
      }}
    </Widget>
  );
}