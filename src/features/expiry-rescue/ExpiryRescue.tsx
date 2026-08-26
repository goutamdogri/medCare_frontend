import { useMemo, useState } from "react";
import {
  ArrowRight,
  Boxes,
  Flame,
  PackagePlus,
  ShieldCheck,
} from "lucide-react";
import type {
  AgingBucket,
  TransferReason,
  TransferRow,
  WriteoffRow,
} from "@/types/api";
import { useApp } from "@/context/app-context";
import { useAging, useTransfers, useWriteoffs } from "@/hooks/queries";
import { Badge, ReasonBadge } from "@/components/ui/Badge";
import { SkeletonBlock } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/States";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { StatCard } from "@/components/ui/StatCard";
import { Table, Td, Th, Tr } from "@/components/ui/Table";
import { Widget } from "@/components/ui/Widget";
import { CHART_COLORS } from "@/components/charts/chartTheme";
import { cn } from "@/lib/cn";
import { formatDate, formatCompact, formatInr, formatNum } from "@/lib/format";

/** Page 4 — expiry-aware allocation: ₹ moved out of danger vs honest residual. */
export default function ExpiryRescue() {
  const { asOf } = useApp();
  const transfersQuery = useTransfers(asOf);
  const writeoffsQuery = useWriteoffs(asOf);
  const agingQuery = useAging(asOf);
  const [tab, setTab] = useState<"transfers" | "inventory">("transfers");

  return (
    <div className="animate-fade-up space-y-5 sm:space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-extrabold tracking-tight text-ink sm:text-xl">
            {tab === "transfers" ? "Transfer plan": "Inventory analysis"}
          </h1>
          <p className="mt-0.5 text-xs text-sub sm:text-sm">
            {tab === "transfers"
              ? "Stock moved out of expiry danger and what still remains at risk."
              : "Inventory ageing and residual write-off exposure."}
          </p>
        </div>
        <SegmentedControl<"transfers" | "inventory">
          options={[
            { value: "transfers", label: "Transfer plan" },
            { value: "inventory", label: "Inventory analysis" },
          ]}
          value={tab}
          onChange={setTab}
        />
      </div>
      {tab === "transfers" ? (
        <div className="space-y-5 sm:space-y-6">
          <HeadlinePair
            transfersQuery={transfersQuery}
            writeoffsQuery={writeoffsQuery}
          />
          <TransferTable query={transfersQuery} />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:gap-6 xl:grid-cols-2">
          <AgingHeatmap query={agingQuery} />
          <ResidualRisk query={writeoffsQuery} />
        </div>
      )}
    </div>
  );
}

/* ------------------------------ Headline ------------------------------ */

function HeadlinePair({
  transfersQuery,
  writeoffsQuery,
}: {
  transfersQuery: ReturnType<typeof useTransfers>;
  writeoffsQuery: ReturnType<typeof useWriteoffs>;
}) {
  const saved = transfersQuery.data?.summary.totalValueSavedInr;
  const transferCount = transfersQuery.data?.summary.totalTransfers ?? 0;
  const unitsMoved = transfersQuery.data?.summary.totalUnitsMoved;
  const residual = writeoffsQuery.data?.totals.totalResidualValueInr;
  const batchCount = writeoffsQuery.data?.totals.batchesAtRisk ?? 0;

  const loading =
    transfersQuery.isPending || writeoffsQuery.isPending ? (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {Array.from({ length: 2 }, (_, i) => (
          <div key={i} className="h-36 animate-pulse rounded-2xl bg-line/60" />
        ))}
      </div>
    ) : null;

  return (
    loading ?? (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <StatCard
          label="Moved out of expiry danger zone"
          value={
            saved != null ? (
              <span className="text-success">{formatInr(saved)}</span>
            ) : (
              "—"
            )
          }
          icon={ShieldCheck}
          accent="success"
          sub={`${transferCount} transfers · ${formatNum(unitsMoved ?? 0)} units reallocated`}
        />
        <StatCard
          label="Residual risk despite transfers"
          value={
            residual != null ? (
              <span className="text-danger">{formatInr(residual)}</span>
            ) : (
              "—"
            )
          }
          icon={Flame}
          accent="danger"
          sub={`${batchCount ?? 0} batches would still expire — honest limitation`}
        />
      </div>
    )
  );
}

/* ---------------------------- Transfer table -------------------------- */

type ReasonFilter = TransferReason | "all";

function TransferLane({ row }: { row: TransferRow }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap">
      {row.fromLocation.replace("DC_", "").replace("WH_", "")}
      <ArrowRight className="size-3.5 text-primary" />
      {row.toLocation.replace("DC_", "").replace("WH_", "")}
    </span>
  );
}

function TransferTable({ query }: { query: ReturnType<typeof useTransfers> }) {
  const { skuById } = useApp();
  const [reason, setReason] = useState<ReasonFilter>("all");

  const rows = useMemo(() => {
    const transfers = query.data?.content ?? [];
    return transfers
      .filter((t) => reason === "all" || t.reason === reason)
      .sort((a, b) => b.valueSavedInr - a.valueSavedInr);
  }, [query.data, reason]);

  return (
    <Widget
      title="Transfer plan"
      subtitle="Batch-level stock moves recommended by the allocation engine."
      icon={PackagePlus}
      iconClassName="bg-secondary-soft text-violet-700 dark:bg-secondary/15 dark:text-secondary"
      query={query}
      skeleton={<SkeletonBlock lines={5} />}
      actions={
        <SegmentedControl<ReasonFilter>
          options={[
            { value: "all", label: "All" },
            { value: "expiry_rescue", label: "Expiry" },
            { value: "shortage_rescue", label: "Shortage" },
          ]}
          value={reason}
          onChange={setReason}
          size="sm"
        />
      }
      noPadding
      bodyClassName="px-5 pt-4 pb-2 sm:px-6"
    >
      {(data) => {
        void data;
        if (rows.length === 0) {
          return (
            <EmptyState
              icon={Boxes}
              title="No transfers match this filter"
              message="Switch the reason filter to see other moves."
            />
          );
        }
        return (
          <Table>
            <thead>
                <tr>
                  <Th>Batch</Th>
                  <Th>SKU</Th>
                  <Th>Lane</Th>
                  <Th align="right">Qty</Th>
                  <Th>Expires in</Th>
                  <Th>Reason</Th>
                  <Th align="right">Value saved</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                const days = row.daysToExpiry;
                return (
                  <Tr key={`${row.id}-${row.toLocation}`}>
                    <Td className="font-mono text-xs font-medium">{row.batchId}</Td>
                    <Td>
                      <p className="text-xs font-semibold">{skuById.get(row.skuId)?.brandName ?? row.skuId}</p>
                      <p className="text-[11px] font-medium text-sub">{row.skuId}</p>
                    </Td>
                    <Td>
                      <TransferLane row={row} />
                      {row.carrier && (
                        <p className="mt-0.5 text-[10px] font-medium text-sub">
                          {row.carrier} · lead {row.transferLeadDays}d
                        </p>
                      )}
                    </Td>
                    <Td align="right" className="font-semibold tabular-nums">
                      {formatNum(row.qtyUnits)}
                    </Td>
                    <Td>
                      {days != null && (
                        <Badge variant={days < 45 ? "danger" : "warning"} className="tabular-nums">
                          {days}d{row.expiryDate ? ` · ${formatDate(row.expiryDate)}` : ""}
                        </Badge>
                      )}
                    </Td>
                    <Td>
                      <ReasonBadge reason={row.reason} />
                    </Td>
                    <Td align="right" className="font-bold text-success tabular-nums">
                      {formatInr(row.valueSavedInr)}
                    </Td>
                  </Tr>
                );
              })}
              </tbody>
            </Table>
        );
      }}
    </Widget>
  );
}

/* ------------------------------- Heatmap ------------------------------- */

const BUCKET_COLUMNS: { key: AgingBucket; label: string }[] = [
  { key: "d0_30", label: "0–30 d" },
  { key: "d31_60", label: "31–60 d" },
  { key: "d61_90", label: "61–90 d" },
  { key: "d90plus", label: "90+ d" },
];

function AgingHeatmap({ query }: { query: ReturnType<typeof useAging> }) {
  const { regionById } = useApp();

  return (
    <Widget
      title="Inventory ageing heatmap"
      subtitle="Stock value by location × freshness bucket — hot metro rows drained by transfers."
      icon={Boxes}
      iconClassName="bg-danger-soft text-red-700 dark:bg-danger/15 dark:text-danger"
      query={query}
      skeleton={<SkeletonBlock lines={5} />}
    >
      {(data) => {
        const entries = (data.byLocation ?? []).map((rollup) => ({
          location: rollup.location,
          name: regionById.get(rollup.location)?.name ?? rollup.location,
          cells: BUCKET_COLUMNS.map((col) => ({ ...col, value: rollup.buckets[col.key]?.valueInr ?? 0 })),
          total: rollup.totalValueInr,
        }));
        if (entries.length === 0) {
          return <EmptyState icon={Boxes} title="No inventory snapshot for this date" />;
        }
        entries.sort((a, b) => b.total - a.total);
        const maxCell = Math.max(
          ...entries.flatMap((row) => row.cells.map((c) => c.value)),
          1,
        );

        return (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="pb-2 text-left text-[10px] font-bold tracking-wider text-sub uppercase">
                      Location
                    </th>
                    {BUCKET_COLUMNS.map((col) => (
                      <th
                        key={col.key}
                        className="px-1 pb-2 text-right text-[10px] font-bold tracking-wider text-sub uppercase"
                      >
                        {col.label}
                      </th>
                    ))}
                    <th className="px-1 pb-2 text-right text-[10px] font-bold tracking-wider text-sub uppercase">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((row) => (
                    <tr key={row.location}>
                      <td className="py-1 pr-2 align-middle">
                        <p className="truncate text-xs font-semibold text-ink" title={row.name}>
                          {row.name}
                        </p>
                      </td>
                      {row.cells.map((cell) => {
                        const ratio = cell.value / maxCell;
                        const alpha = cell.value === 0 ? 0 : 0.07 + Math.pow(ratio, 0.65) * 0.88;
                        return (
                          <td key={cell.key} className="p-0.5">
                            <div
                              className={cn(
                                "rounded-lg px-2 py-2.5 text-right text-[11px] font-bold tabular-nums transition-transform hover:scale-[1.04]",
                                cell.value === 0 && "bg-app text-sub/40",
                              )}
                              style={
                                cell.value === 0
                                  ? undefined
                                  : {
                                      backgroundColor: `rgba(239, 68, 68, ${alpha.toFixed(3)})`,
                                      color: ratio > 0.45 ? "#fff" : undefined,
                                    }
                              }
                              title={`${row.name} · ${cell.label}: ${formatInr(cell.value)}`}
                            >
                              {cell.value === 0 ? "—" : formatCompact(cell.value)}
                            </div>
                          </td>
                        );
                      })}
                      <td className="px-1 py-1 text-right text-xs font-extrabold text-ink tabular-nums">
                        {formatCompact(row.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <span className="h-2.5 flex-1 rounded-full bg-gradient-to-r from-[rgba(239,68,68,0.07)] to-danger" />
              <span className="text-[10px] font-semibold tracking-wide text-sub uppercase">
                ₹ value density
              </span>
              <span className="flex items-center gap-1.5 text-[11px] text-sub">
                <span
                  className="inline-block size-2.5 rounded-sm"
                  style={{ backgroundColor: CHART_COLORS.danger }}
                />
                soonest-to-expire bucket drives heat
              </span>
            </div>
          </div>
        );
      }}
    </Widget>
  );
}

/* --------------------------- Residual risk table ----------------------- */

function ResidualRisk({ query }: { query: ReturnType<typeof useWriteoffs> }) {
  return (
    <Widget
      title="Residual write-off risk · top 10"
      subtitle="Batches still expected to expire even after the transfer plan — what we could not rescue."
      icon={Flame}
      iconClassName="bg-warning-soft text-yellow-800 dark:bg-warning/15 dark:text-warning"
      query={query}
      skeleton={<SkeletonBlock lines={5} />}
      noPadding
      bodyClassName="px-5 pt-4 pb-2 sm:px-6"
    >
      {(data) => {
        void data;
        const rows: WriteoffRow[] = [...(data.content ?? [])]
          .sort((a, b) => b.residualValueInr - a.residualValueInr)
          .slice(0, 10);
        if (rows.length === 0) {
          return <EmptyState icon={ShieldCheck} title="No residual risk found" />;
        }
        return (
          <Table>
            <thead>
              <tr>
                <Th>Batch</Th>
                <Th>SKU @ location</Th>
                <Th align="right">Write-off</Th>
                <Th>Expires</Th>
                <Th align="right">₹ at risk</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <Tr key={row.id}>
                  <Td className="font-mono text-xs font-medium">{row.batchId}</Td>
                  <Td>
                    <p className="text-xs font-semibold">{row.skuId}</p>
                    <p className="text-[11px] text-sub">{row.location}</p>
                  </Td>
                  <Td align="right" className="text-xs font-semibold tabular-nums">
                    {formatNum(row.residualWriteoffUnits)} u
                  </Td>
                  <Td>
                    <Badge variant={row.daysToExpiry < 45 ? "danger" : "warning"} className="tabular-nums">
                      {row.daysToExpiry}d · {formatDate(row.expiryDate)}
                    </Badge>
                  </Td>
                  <Td align="right" className="font-bold text-danger tabular-nums">
                    {formatInr(row.residualValueInr)}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        );
      }}
    </Widget>
  );
}
