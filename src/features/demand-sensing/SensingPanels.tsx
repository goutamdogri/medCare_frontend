import { Info } from "lucide-react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts";
import type { UseQueryResult } from "@tanstack/react-query";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table, Td, Th, Tr } from "@/components/ui/Table";
import { SkeletonBlock } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/States";
import { CHART_COLORS } from "@/components/charts/chartTheme";
import { num, numOrNull } from "@/lib/format";
import type { ForecastsResponse, RunEntry } from "@/types/api";

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
              <Td align="right" className="font-bold text-primary tabular-nums">
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

export function WmapeNote({ runsQuery }: { runsQuery: UseQueryResult<RunEntry[]> }) {
  const wmape = numOrNull(runsQuery.data?.[0]?.wmape);
  return (
    <Card className="p-5 sm:p-6">
      <p className="text-xs font-semibold tracking-wide text-sub uppercase">
        Realized accuracy
      </p>
      <p className="mt-2 text-2xl font-extrabold text-ink tabular-nums">
        {wmape != null ? `${wmape.toFixed(2)}%` : "—"}
      </p>
      <p className="mt-1 text-xs leading-relaxed text-sub">
        {wmape != null ? (
          <>WMAPE on past forecasts vs actuals (latest run).</>
        ) : (
          <>WMAPE pending — first actuals not yet available for this run.</>
        )}
      </p>
    </Card>
  );
}
