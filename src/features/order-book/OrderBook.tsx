import { useMemo, useState } from "react";
import { CircleCheck, ClipboardList, Download } from "lucide-react";
import type {
  Criticality,
  ReplenishmentRow,
  ReplenishmentStatus,
} from "@/types/api";
import { useApp } from "@/context/app-context";
import { useReplenishment, useReplenishmentSummary } from "@/hooks/queries";
import { Button } from "@/components/ui/Button";
import { CriticalityChip, StatusBadge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Drawer } from "@/components/ui/Drawer";
import { Select } from "@/components/ui/Select";
import { SkeletonBlock } from "@/components/ui/Skeleton";
import { StatCard } from "@/components/ui/StatCard";
import { Table, Td, Th, Tr, SortableTh, type SortDirection } from "@/components/ui/Table";
import { Widget } from "@/components/ui/Widget";
import { EmptyState } from "@/components/ui/States";
import { ReplenishmentDetails } from "@/components/domain/ReplenishmentDetails";
import { downloadCsv } from "@/lib/csv";
import { formatInr, formatNum, numOrNull } from "@/lib/format";

type SortKey = "dos" | "orderValueInr" | "orderQty" | "criticality" | "region" | "status";

const CRITICALITY_ORDER: Record<Criticality, number> = {
  critical: 0,
  high: 1,
  standard: 2,
  low: 3,
};

/** Page 5 — the replenishment plan planners receive every morning. */
export default function OrderBook() {
  const { asOf } = useApp();
  const replQuery = useReplenishment(asOf, {});
  const summaryQuery = useReplenishmentSummary(asOf);

  const [statusFilter, setStatusFilter] = useState<ReplenishmentStatus | "all">("all");
  const [critFilter, setCritFilter] = useState<Criticality | "all">("all");
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("criticality");
  const [sortDir, setSortDir] = useState<SortDirection>("asc");
  const [selected, setSelected] = useState<ReplenishmentRow | null>(null);

  const rows = useMemo(() => {
    const content = replQuery.data?.content ?? [];
    const filtered = content.filter(
      (row) =>
        (statusFilter === "all" || row.status === statusFilter) &&
        (critFilter === "all" || row.criticality === critFilter) &&
        (regionFilter === "all" || row.region === regionFilter),
    );
    const dir = sortDir === "asc" ? 1 : -1;
    return filtered.sort((a, b) => {
      switch (sortKey) {
        case "dos": {
          const av = numOrNull(a.daysOfSupplyOnHand);
          const bv = numOrNull(b.daysOfSupplyOnHand);
          return ((av ?? Number.POSITIVE_INFINITY) - (bv ?? Number.POSITIVE_INFINITY)) * dir;
        }
        case "orderValueInr":
          return (a.orderValueInr - b.orderValueInr) * dir;
        case "orderQty":
          return (a.orderQty - b.orderQty) * dir;
        case "region":
          return a.region.localeCompare(b.region) * dir;
        case "status":
          return a.status.localeCompare(b.status) * dir;
        default:
          return (
            (CRITICALITY_ORDER[a.criticality] - CRITICALITY_ORDER[b.criticality]) * dir ||
            (numOrNull(a.daysOfSupplyOnHand) ?? Infinity) -
              (numOrNull(b.daysOfSupplyOnHand) ?? Infinity)
          );
      }
    });
  }, [replQuery.data, statusFilter, critFilter, regionFilter, sortKey, sortDir]);

  const { skuById, regionById } = useApp();

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir(key === "criticality" || key === "region" ? "asc" : "desc");
    }
  };

  const exportCsv = () => {
    downloadCsv(
      `medcare-order-book-${asOf ?? "latest"}.csv`,
      rows.map((row) => ({
        sku_id: row.skuId,
        brand: skuById.get(row.skuId)?.brandName ?? "",
        atc_code: skuById.get(row.skuId)?.atcCode ?? "",
        region: row.region,
        criticality: row.criticality,
        status: row.status,
        service_level: row.serviceLevel,
        lead_time_days: row.leadTimeDays,
        mu_daily: String(row.muDaily),
        sigma_daily: String(row.sigmaDaily),
        safety_stock: row.safetyStock,
        target_position: row.targetPosition,
        on_hand: row.onHand,
        order_qty: row.orderQty,
        order_value_inr: row.orderValueInr,
        days_of_supply_on_hand: String(row.daysOfSupplyOnHand),
      })),
    );
  };

  const regionOptions = [
    { value: "all", label: "All regions" },
    ...(replQuery.data?.content
      ? [...new Set(replQuery.data.content.map((r) => r.region))].map((region) => ({
          value: region,
          label: regionById.get(region)?.name ?? region,
        }))
      : []),
  ];

  return (
    <div className="animate-fade-up space-y-5 sm:space-y-6">
      <SummaryBar query={summaryQuery} />

      <Card className="p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Select
            label="Status"
            id="ob-status"
            options={[
              { value: "all", label: "All statuses" },
              { value: "stockout_risk", label: "Stock-out risk" },
              { value: "low", label: "Low" },
              { value: "ok", label: "OK" },
            ]}
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as never)}
          />
          <Select
            label="Criticality"
            id="ob-crit"
            options={[
              { value: "all", label: "All criticalities" },
              { value: "critical", label: "Critical" },
              { value: "high", label: "High" },
              { value: "standard", label: "Standard" },
              { value: "low", label: "Low" },
            ]}
            value={critFilter}
            onChange={(event) => setCritFilter(event.target.value as never)}
          />
          <Select
            label="Region"
            id="ob-region"
            options={regionOptions}
            value={regionFilter}
            onChange={(event) => setRegionFilter(event.target.value)}
          />
          <div className="flex items-end justify-between gap-3 lg:flex-col lg:items-stretch xl:flex-row xl:items-end">
            <p className="text-xs text-sub">
              Showing{" "}
              <b className="text-ink tabular-nums">{rows.length}</b> of{" "}
              <b className="text-ink tabular-nums">{replQuery.data?.totalElements ?? "…"}</b>{" "}
              positions
            </p>
            <Button variant="secondary" size="sm" onClick={exportCsv} disabled={rows.length === 0}>
              <Download className="size-4" />
              Export CSV
            </Button>
          </div>
        </div>
      </Card>

      <Widget
        title="Order book"
        subtitle="Full reorder plan — click any header to re-sort, any row to audit the math."
        icon={ClipboardList}
        iconClassName="bg-secondary-soft text-violet-700 dark:bg-secondary/15 dark:text-secondary"
        query={replQuery}
        skeleton={<SkeletonBlock lines={8} />}
        noPadding
        bodyClassName="px-5 pt-4 pb-2 sm:px-6"
      >
        {(data) => {
          void data;
          if (rows.length === 0) {
            return (
              <EmptyState
                icon={CircleCheck}
                title="No orders match the filters"
                message="Loosen the status / criticality / region filters to see more of the plan."
              />
            );
          }
          return (
            <>
              <Table>
                <thead>
                  <tr>
                    <SortableTh label="SKU" active={sortKey === "region"} direction="asc" onSort={() => handleSort("region")} />
                    <Th>Brand</Th>
                    <Th>Criticality</Th>
                    <Th>Status</Th>
                    <SortableTh
                      label="Days of supply"
                      active={sortKey === "dos"}
                      direction={sortDir}
                      onSort={() => handleSort("dos")}
                    />
                    <SortableTh
                      label="Order qty"
                      active={sortKey === "orderQty"}
                      direction={sortDir}
                      align="right"
                      onSort={() => handleSort("orderQty")}
                    />
                    <SortableTh
                      label="Order value"
                      active={sortKey === "orderValueInr"}
                      direction={sortDir}
                      align="right"
                      onSort={() => handleSort("orderValueInr")}
                    />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const sku = skuById.get(row.skuId);
                    const dos = numOrNull(row.daysOfSupplyOnHand);
                    return (
                      <Tr key={`${row.skuId}-${row.region}`} onClick={() => setSelected(row)}>
                        <Td className="font-semibold">{row.skuId}</Td>
                        <Td className="text-xs font-medium text-sub">{sku?.brandName ?? "—"}</Td>
                        <Td>
                          <CriticalityChip criticality={row.criticality} />
                        </Td>
                        <Td>
                          <StatusBadge status={row.status} />
                        </Td>
                        <Td>
                          <span
                            className={
                              dos == null || dos < row.leadTimeDays
                                ? "font-bold text-danger tabular-nums"
                                : "font-semibold tabular-nums"
                            }
                          >
                            {dos == null ? "0.0" : dos.toFixed(1)} d
                          </span>
                        </Td>
                        <Td align="right" className="text-xs font-semibold tabular-nums">
                          {formatNum(row.orderQty)}
                        </Td>
                        <Td align="right" className="font-bold tabular-nums">
                          {formatInr(row.orderValueInr)}
                        </Td>
                      </Tr>
                    );
                  })}
                </tbody>
              </Table>
              <p className="px-4 py-3 text-[11px] text-sub">
                Click a row to open the planner audit drawer.
              </p>
            </>
          );
        }}
      </Widget>

      <Drawer
        open={selected != null}
        onClose={() => setSelected(null)}
        title={selected ? `${skuById.get(selected.skuId)?.brandName ?? ""} · ${selected.skuId}` : ""}
        subtitle={selected ? `@ ${regionById.get(selected.region)?.name ?? selected.region}` : undefined}
        meta={
          selected ? (
            <span className="inline-flex items-center rounded-full border border-line bg-app px-2 py-0.5 text-[11px] font-medium text-sub">
              Service {Math.round((selected.serviceLevel ?? 0) * 100)}%
            </span>
          ) : undefined
        }
      >
        {selected && <ReplenishmentDetails row={selected} />}
      </Drawer>
    </div>
  );
}

/* ------------------------------ Summary bar ---------------------------- */

function SummaryBar({
  query,
}: {
  query: ReturnType<typeof useReplenishmentSummary>;
}) {
  if (query.isPending) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl bg-line/60" />
        ))}
      </div>
    );
  }
  const summary = query.data;
  if (!summary) return null;

  const byCrit = [...summary.byCriticality].sort(
    (a, b) => CRITICALITY_ORDER[a.criticality] - CRITICALITY_ORDER[b.criticality],
  );
  const critTotal = Math.max(...byCrit.map((c) => c.count), 1);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Total order value"
        value={formatInr(summary.totalOrderValueInr)}
        accent="success"
        icon={CircleCheck}
        sub="proposed plan · this snapshot"
      />
      <StatCard
        label="Orders placed"
        value={summary.byStatus.stockout_risk + summary.byStatus.low}
        accent="primary"
        icon={ClipboardList}
        sub="rows requiring action today"
      />
      <StatCard
        label="No-op rows"
        value={summary.byStatus.ok}
        accent="secondary"
        icon={CircleCheck}
        sub="stock covers target position"
      />
      <Card className="animate-fade-up p-5 shadow-card">
        <p className="text-xs font-semibold tracking-wider text-sub uppercase">
          Split by criticality
        </p>
        <div className="mt-3 space-y-2">
          {byCrit.map((entry) => (
            <div key={entry.criticality} className="flex items-center gap-2 text-xs">
              <span className="w-16 shrink-0 font-semibold capitalize text-ink">
                {entry.criticality}
              </span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-app">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(entry.count / critTotal) * 100}%`,
                    backgroundColor:
                      entry.criticality === "critical"
                        ? "var(--danger)"
                        : entry.criticality === "high"
                          ? "var(--warning)"
                          : entry.criticality === "standard"
                            ? "var(--secondary)"
                            : "var(--sub)",
                  }}
                />
              </div>
              <span className="w-7 text-right font-bold text-ink tabular-nums">
                {entry.count}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
