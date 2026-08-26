import { useMemo, useState } from "react";
import { ArrowRight, CircleCheck, TriangleAlert, PackageX, Boxes } from "lucide-react";
import type { AlertItem, ReplenishmentRow, ReplenishmentStatus } from "@/types/api";
import { useApp } from "@/context/app-context";
import {
  useAcknowledgeAlert,
  useAlerts,
  useReplenishment,
  useReplenishmentSummary,
} from "@/hooks/queries";
import { useToasts } from "@/context/toast-context";
import {
  Badge,
  CriticalityChip,
  SeverityBadge,
} from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { SkeletonBlock } from "@/components/ui/Skeleton";
import { StatCard } from "@/components/ui/StatCard";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Table, Td, Th, Tr, SortableTh, type SortDirection } from "@/components/ui/Table";
import { Widget } from "@/components/ui/Widget";
import { RawJsonToggle } from "@/components/ui/RawJsonToggle";
import { ReplenishmentDetails } from "@/components/domain/ReplenishmentDetails";
import { ACK_USER } from "@/hooks/queries";
import { formatInr, formatNum, numOrNull } from "@/lib/format";

type Tab = "watchlist" | "escalation";

/** Page 3 — fewer stock-outs of critical SKUs + live ack workflow. */
export default function ShortageWatchlist() {
  const { asOf } = useApp();
  const replQuery = useReplenishment(asOf, { sort: "dos" });
  const summaryQuery = useReplenishmentSummary(asOf);
  const alertsQuery = useAlerts(asOf);

  const [tab, setTab] = useState<Tab>("watchlist");
  const [statusFilter, setStatusFilter] = useState<ReplenishmentStatus | "all">("stockout_risk");
  const [selected, setSelected] = useState<ReplenishmentRow | null>(null);

  return (
    <div className="animate-fade-up space-y-5 sm:space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-extrabold tracking-tight text-ink sm:text-xl">
            {tab === "watchlist" ? "Stockout Watchlist" : "Escalation Board"}
          </h1>
          <p className="mt-0.5 text-xs text-sub sm:text-sm">
            {tab === "watchlist"
              ? "Monitor SKU-level stock positions and plan replenishment orders."
              : "Machine-generated shortage & expiry alerts awaiting review."}
          </p>
        </div>
        <SegmentedControl
          options={[
            { value: "watchlist" as Tab, label: "Watchlist" },
            { value: "escalation" as Tab, label: "Escalation Board" },
          ]}
          value={tab}
          onChange={setTab}
        />
      </div>

      {tab === "watchlist" ? (
        <>
          <StatusTiles
            summaryQuery={summaryQuery}
            active={statusFilter}
            onSelect={setStatusFilter}
          />
          <RiskGrid
            query={replQuery}
            statusFilter={statusFilter}
            onRowSelect={setSelected}
          />
          <RiskDrawer
            row={selected}
            onClose={() => setSelected(null)}
            alerts={alertsQuery.data?.content ?? []}
          />
        </>
      ) : (
        <AlertBoard alertsQuery={alertsQuery} />
      )}
    </div>
  );
}

/* ------------------------------ Status tiles -------------------------- */

function StatusTiles({
  summaryQuery,
  active,
  onSelect,
}: {
  summaryQuery: ReturnType<typeof useReplenishmentSummary>;
  active: ReplenishmentStatus | "all";
  onSelect: (status: ReplenishmentStatus | "all") => void;
}) {
  if (summaryQuery.isPending) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl bg-line/60" />
        ))}
      </div>
    );
  }
  if (summaryQuery.isError) {
    return (
      <ErrorState
        message={(summaryQuery.error as Error)?.message}
        onRetry={() => void summaryQuery.refetch()}
      />
    );
  }

  const summary = summaryQuery.data;
  if (!summary) return null;

  const tiles: {
    status: ReplenishmentStatus;
    label: string;
    icon: typeof TriangleAlert;
    accent: "danger" | "warning" | "secondary";
  }[] = [
    { status: "stockout_risk", label: "Stock-out risk", icon: PackageX, accent: "danger" },
    { status: "low", label: "Low cover", icon: TriangleAlert, accent: "warning" },
    { status: "ok", label: "Healthy", icon: Boxes, accent: "secondary" },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {tiles.map((tile) => (
        <StatCard
          key={tile.status}
          label={tile.label}
          value={summary.byStatus[tile.status] ?? 0}
          icon={tile.icon}
          accent={tile.accent}
          sub={active === tile.status ? "filtering grid" : "click to filter"}
          active={active === tile.status}
          onClick={() => onSelect(active === tile.status ? "all" : tile.status)}
        />
      ))}
    </div>
  );
}

/* -------------------------------- Risk grid --------------------------- */

function dosCell(row: ReplenishmentRow) {
  const dos = numOrNull(row.daysOfSupplyOnHand);
  const atRisk = dos == null || dos < row.leadTimeDays;
  return (
    <Badge variant={atRisk ? "danger" : "success"} className="tabular-nums">
      {dos == null ? "0.0" : dos.toFixed(1)} d
    </Badge>
  );
}

function RiskGrid({
  query,
  statusFilter,
  onRowSelect,
}: {
  query: ReturnType<typeof useReplenishment>;
  statusFilter: ReplenishmentStatus | "all";
  onRowSelect: (row: ReplenishmentRow) => void;
}) {
  const { skuById, regionById } = useApp();
  const [dosDir, setDosDir] = useState<SortDirection>("asc");

  const rows = useMemo(() => {
    const content = query.data?.content ?? [];
    const filtered =
      statusFilter === "all" ? content : content.filter((r) => r.status === statusFilter);
    const sorted = [...filtered];
    sorted.sort((a, b) => {
      const av = a.daysOfSupplyOnHand == null ? Infinity : Number(a.daysOfSupplyOnHand);
      const bv = b.daysOfSupplyOnHand == null ? Infinity : Number(b.daysOfSupplyOnHand);
      return dosDir === "asc" ? av - bv : bv - av;
    });
    return sorted;
  }, [query.data, statusFilter, dosDir]);

  return (
    <Widget
      title="Shortage watchlist"
      subtitle={`${rows.length} ${statusFilter === "stockout_risk" ? "stock-out risk" : statusFilter === "low" ? "low cover" : statusFilter === "ok" ? "healthy" : "total"} SKU×region positions — sorted by days-of-supply.`}
      icon={TriangleAlert}
      iconClassName="bg-danger-soft text-red-700 dark:bg-danger/15 dark:text-danger"
      query={query}
      skeleton={<SkeletonBlock lines={6} />}
      actions={<RawJsonToggle data={query.data} />}
      noPadding
      bodyClassName="px-5 pt-4 pb-2 sm:px-6"
    >
      {(data) => {
        void data;
        if (rows.length === 0) {
          return (
            <EmptyState
              icon={CircleCheck}
              title="No rows for this filter"
              message="Pick another status tile or reset the filter."
            />
          );
        }
        return (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>SKU</Th>
                  <Th>Region</Th>
                  <Th>Criticality</Th>
                  <SortableTh
                    label="Days of supply"
                    active
                    direction={dosDir}
                    onSort={() => setDosDir((d) => (d === "asc" ? "desc" : "asc"))}
                  />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const sku = skuById.get(row.skuId);
                  return (
                    <Tr key={`${row.skuId}-${row.region}`} onClick={() => onRowSelect(row)}>
                      <Td>
                        <p className="font-semibold">{sku?.brandName ?? row.skuId}</p>
                        <p className="text-[11px] font-medium text-sub">{row.skuId}</p>
                      </Td>
                      <Td className="text-xs font-medium">
                        {regionById.get(row.region)?.name ?? row.region}
                      </Td>
                      <Td>
                        <CriticalityChip criticality={row.criticality} />
                      </Td>
                      <Td>{dosCell(row)}</Td>
                    </Tr>
                  );
                })}
              </tbody>
            </Table>
            <p className="px-4 py-3 text-[11px] text-sub">
              Click a row for the full safety-stock audit and related alerts.
            </p>
          </>
        );
      }}
    </Widget>
  );
}

/* ------------------------------- Detail drawer ------------------------- */

function RiskDrawer({
  row,
  onClose,
  alerts,
}: {
  row: ReplenishmentRow | null;
  onClose: () => void;
  alerts: AlertItem[];
}) {
  const { skuById, regionById } = useApp();
  const related = row
    ? alerts.filter(
        (alert) =>
          !alert.acknowledged &&
          alert.type === "shortage_risk" &&
          alert.skuId === row.skuId &&
          alert.region === row.region,
      )
    : [];

  return (
    <Drawer
      open={row != null}
      onClose={onClose}
      title={
        row ? `${skuById.get(row.skuId)?.brandName ?? row.skuId} · ${row.skuId}` : ""
      }
      subtitle={row ? `@ ${regionById.get(row.region)?.name ?? row.region}` : undefined}
    >
      {row && (
        <div className="space-y-5">
          <ReplenishmentDetails row={row} />
          {related.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold tracking-wide text-sub uppercase">
                Related open alerts
              </p>
              <ul className="space-y-2">
                {related.map((alert) => (
                  <li
                    key={alert.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-line px-3 py-2"
                  >
                    <span className="text-xs font-semibold text-ink">
                      #{alert.id} {alert.severity}
                    </span>
                    <SeverityBadge severity={alert.severity} />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Drawer>
  );
}

/* ------------------------------- Alert board --------------------------- */

function AlertBoard({
  alertsQuery,
}: {
  alertsQuery: ReturnType<typeof useAlerts>;
}) {
  const { skuById, regionById } = useApp();
  const toast = useToasts();
  const acknowledge = useAcknowledgeAlert();

  const all = alertsQuery.data?.content ?? [];
  const unacked = [...all]
    .filter((a) => !a.acknowledged)
    .sort((a, b) => (a.severity === b.severity ? a.id - b.id : a.severity === "RED" ? -1 : 1));
  const acked = all.filter((a) => a.acknowledged);

  const handleAck = (alert: AlertItem) => {
    acknowledge.mutate(alert.id, {
      onSuccess: () =>
        toast.notify("success", `Alert #${alert.id} acknowledged as ${ACK_USER}`),
      onError: () =>
        toast.notify("error", `Could not acknowledge alert #${alert.id} — try again`),
    });
  };

  return (
    <Widget
      title="Escalation board"
      subtitle="Machine-generated shortage & expiry alerts awaiting review."
      icon={TriangleAlert}
      iconClassName="bg-warning-soft text-yellow-800 dark:bg-warning/15 dark:text-warning"
      query={alertsQuery}
      skeleton={<SkeletonBlock lines={4} />}
    >
      {(data) => {
        void data;
        return (
          <div className="space-y-4">
            {unacked.length === 0 ? (
              <EmptyState
                icon={CircleCheck}
                title="All clear"
                message="No unacknowledged alerts for this snapshot."
              />
            ) : (
              <div className="space-y-3">
                {unacked.map((alert) => {
                  const facts = alert.facts ?? {};
                  const brand = skuById.get(alert.skuId)?.brandName;
                  const isRed = alert.severity === "RED";
                  return (
                    <div
                      key={alert.id}
                      className="animate-fade-up overflow-hidden rounded-xl border border-line transition-colors hover:bg-card-subtle"
                    >
                      {/* Row 1 — info bar */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
                        {/* Severity stripe */}
                        <span
                          className={`h-8 w-1 shrink-0 rounded-full ${isRed ? "bg-danger" : "bg-warning"}`}
                        />

                        {/* Identity */}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-ink">
                            {brand ?? alert.skuId}
                            <span className="ml-1.5 font-mono text-[11px] font-medium text-sub">
                              @{regionById.get(alert.region)?.name ?? alert.region}
                            </span>
                          </p>
                          <p className="mt-0.5 text-[11px] capitalize text-sub">
                            {alert.type.replaceAll("_", " ")} · #{alert.id}
                          </p>
                        </div>

                        {/* Fact badges */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          {facts.criticality && (
                            <CriticalityChip criticality={facts.criticality} />
                          )}
                          {facts.days_of_supply != null && (
                            <Badge variant="gray" className="tabular-nums">
                              DOS {Number(facts.days_of_supply).toFixed(1)}d
                            </Badge>
                          )}
                          {facts.lead_time_days != null && (
                            <Badge variant="gray" className="tabular-nums">
                              LT {facts.lead_time_days}d
                            </Badge>
                          )}
                          {facts.recommended_order_units != null && (
                            <Badge variant="info" className="tabular-nums">
                              order {formatNum(Number(facts.recommended_order_units))} u
                            </Badge>
                          )}
                          {facts.order_value_inr != null && (
                            <Badge variant="success" className="tabular-nums">
                              {formatInr(Number(facts.order_value_inr))}
                            </Badge>
                          )}
                        </div>

                        {/* Severity + Ack */}
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant={isRed ? "primary" : "outline"}
                            loading={acknowledge.isPending && acknowledge.variables === alert.id}
                            onClick={() => handleAck(alert)}
                          >
                            Acknowledge
                          </Button>
                        </div>
                      </div>

                      {/* Row 2 — action message (only if present) */}
                      {alert.action && (
                        <div className="border-t border-line px-4 py-2.5 text-xs leading-relaxed text-sub">
                          {alert.action}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {acked.length > 0 && (
              <details className="group rounded-xl border border-line bg-app/50 px-4 py-3">
                <summary className="cursor-pointer list-none text-xs font-bold tracking-wide text-sub uppercase transition-colors hover:text-ink">
                  ✓ Acknowledged ({acked.length})
                </summary>
                <ul className="mt-3 space-y-1.5">
                  {acked.map((alert) => (
                    <li
                      key={alert.id}
                      className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-sub"
                    >
                      <ArrowRight className="size-3 rotate-90 text-success" />
                      <span className="font-semibold text-ink">
                        #{alert.id} {alert.skuId}@{alert.region}
                      </span>
                      <span>· by {alert.acknowledgedBy ?? ACK_USER}</span>
                      {alert.acknowledgedAt && (
                        <span className="tabular-nums">
                          · {new Date(alert.acknowledgedAt).toLocaleString("en-IN")}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        );
      }}
    </Widget>
  );
}
