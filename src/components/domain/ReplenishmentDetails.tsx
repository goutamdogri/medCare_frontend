import { ArrowRight, PackagePlus, Truck, Warehouse } from "lucide-react";
import type { InboundTransfer, ReplenishmentRow } from "@/types/api";
import { useApp } from "@/context/app-context";
import { useSkuCoverage } from "@/hooks/queries";
import { StatusBadge, CriticalityChip, ReasonBadge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";
import { formatNum, formatInr, num } from "@/lib/format";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-line bg-app px-3 py-2.5">
      <p className="text-[10px] font-bold tracking-wider text-sub uppercase">{label}</p>
      <p className="mt-1 text-sm font-bold text-ink tabular-nums">{children}</p>
    </div>
  );
}

/** Safety-stock math audit + order↔transfer reconciliation for one position. */
export function ReplenishmentDetails({ row }: { row: ReplenishmentRow }) {
  const { asOf, regionById } = useApp();
  const coverageQuery = useSkuCoverage(asOf, row.skuId, row.region);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={row.status} />
        <CriticalityChip criticality={row.criticality} />
        <span className="text-xs font-medium text-sub">
          Service level {(row.serviceLevel * 100).toFixed(0)}%
        </span>
      </div>

      <p className="text-xs font-semibold tracking-wide text-sub uppercase">
        Safety-stock inputs
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Field label="μ daily demand">{num(row.muDaily).toFixed(1)}</Field>
        <Field label="σ daily demand">{num(row.sigmaDaily).toFixed(1)}</Field>
        <Field label="Lead time">{row.leadTimeDays} d</Field>
        <Field label="Safety stock">{formatNum(row.safetyStock)}</Field>
        <Field label="Target position">{formatNum(row.targetPosition)}</Field>
        <Field label="On hand">{formatNum(row.onHand)}</Field>
      </div>

      <p className="rounded-xl bg-secondary-soft px-3 py-2.5 text-xs leading-relaxed text-violet-700 dark:bg-secondary/10 dark:text-violet-300">
        safety stock ≈ z<sub>service</sub> · σ · √lead-time · target position = μ ·
        (lead time + review period) + safety stock
      </p>

      <div className="grid grid-cols-2 gap-2">
        <Field label="Order qty">
          {formatNum(row.orderQty)} u
        </Field>
        <Field label="Order value">{formatInr(row.orderValueInr)}</Field>
      </div>

      <TransferCoverage
        query={coverageQuery}
        regionName={regionById.get(row.region)?.name ?? row.region}
      />
    </div>
  );
}

/* --------------------- Transfer plan / remaining-to-order --------------------- */

const COVERAGE_EMPTY = {
  orderQty: 0,
  inboundUnits: 0,
  netToOrder: 0,
  coveragePct: null,
  inboundTransfers: [],
};

function TransferCoverage({
  query,
  regionName,
}: {
  query: ReturnType<typeof useSkuCoverage>;
  regionName: string;
}) {
  const data = query.data ?? COVERAGE_EMPTY;
  const hasTransfers = data.inboundTransfers.length > 0;
  const covered = data.coveragePct ?? 0;
  const fullyCovered = data.orderQty > 0 && data.netToOrder === 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <PackagePlus className="size-4 text-secondary" />
        <p className="text-xs font-semibold tracking-wide text-sub uppercase">
          Recommended transfer plan
        </p>
      </div>

      <p className="rounded-xl bg-secondary-soft px-3 py-2.5 text-xs leading-relaxed text-violet-700 dark:bg-secondary/10 dark:text-violet-300">
        Transfers already heading to {regionName} cover part of this order before you buy.
      </p>

      <div className="grid grid-cols-3 gap-2">
        <Field label="Inbound units">{formatNum(data.inboundUnits)} u</Field>
        <Field label="Covered">{formatNum(covered)}%</Field>
        <Field label="Remaining to order">
          <span
            className={cn(
              fullyCovered ? "text-success" : data.netToOrder > 0 ? "text-danger" : "text-ink",
            )}
          >
            {formatNum(data.netToOrder)} u
          </span>
        </Field>
      </div>

      {data.orderQty > 0 && (
        <div className="flex items-center gap-2 text-[11px] text-sub">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-app">
            <div
              className="h-full rounded-full bg-secondary transition-all"
              style={{ width: `${Math.min(100, covered)}%` }}
            />
          </div>
          <span className="tabular-nums">
            {formatNum(data.inboundUnits)} of {formatNum(data.orderQty)} incoming
          </span>
        </div>
      )}

      {query.isPending ? (
        <div className="space-y-2">
          {Array.from({ length: 2 }, (_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-line/60" />
          ))}
        </div>
      ) : !hasTransfers ? (
        <div className="flex items-center gap-2 rounded-xl border border-dashed border-line bg-app px-3 py-3 text-xs text-sub">
          <Warehouse className="size-4 text-sub/50" />
          No inbound transfers planned for this SKU at this location.
        </div>
      ) : (
        <ul className="space-y-2">
          {data.inboundTransfers.map((t) => (
            <TransferLine key={t.id} transfer={t} />
          ))}
        </ul>
      )}
    </div>
  );
}

function TransferLine({ transfer }: { transfer: InboundTransfer }) {
  return (
    <li className="flex items-start justify-between gap-3 rounded-xl border border-line bg-app px-3 py-2.5">
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap">
          {transfer.fromLocation.replace("DC_", "").replace("WH_", "")}
          <ArrowRight className="size-3 text-primary" />
          <span className="text-sub">{formatNum(transfer.qtyUnits)} u</span>
        </div>
        <p className="mt-0.5 flex items-center gap-1.5 text-[11px] font-medium text-sub">
          <Truck className="size-3 text-sub/60" />
          {transfer.batchId ?? "batch —"} · lead {transfer.transferLeadDays}d
          {transfer.carrier ? ` · ${transfer.carrier}` : ""}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <ReasonBadge reason={transfer.reason} />
        {transfer.daysToExpiry != null && (
          <span className="text-[11px] font-medium text-sub tabular-nums">
            {transfer.daysToExpiry}d to expiry
          </span>
        )}
      </div>
    </li>
  );
}
