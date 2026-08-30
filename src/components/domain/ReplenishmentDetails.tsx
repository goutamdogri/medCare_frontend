import { ArrowRight, Calculator, PackagePlus, Truck, Warehouse } from "lucide-react";
import type { InboundTransfer, ReplenishmentRow } from "@/types/api";
import { useApp } from "@/context/app-context";
import { useSkuCoverage } from "@/hooks/queries";
import { ReasonBadge } from "@/components/ui/Badge";
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
      <p className="text-[10px] font-bold tracking-wider text-sub uppercase text-left">
        {label}
      </p>
      <p className="mt-1.5 text-sm font-bold text-ink tabular-nums text-left">{children}</p>
    </div>
  );
}

/** Section header with a divider so the panels read as clearly separate blocks. */
function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-line pt-5 first:border-t-0 first:pt-0">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="size-4 text-sub" />
        <h4 className="text-xs font-bold tracking-wider text-ink uppercase">{title}</h4>
      </div>
      {children}
    </section>
  );
}

/** Muted footnote showing the two underlying formulas — secondary, de-emphasized. */
function FormulaNote() {
  return (
    <div className="border-t border-line pt-5">
      <div className="rounded-xl border border-dashed border-line px-4 py-3 text-[11px] leading-relaxed text-sub/80">
        <p className="text-[10px] font-semibold tracking-wide text-sub/60 uppercase">
          How it's calculated
        </p>
        <p className="mt-1.5">
          safety stock ≈ z<sub>service</sub> · σ · √lead-time
        </p>
        <p className="mt-1">
          target position = μ · (lead time + review period) + safety stock
        </p>
      </div>
    </div>
  );
}

/** Safety-stock math audit + order↔transfer reconciliation for one position. */
export function ReplenishmentDetails({ row }: { row: ReplenishmentRow }) {
  const { asOf, regionById } = useApp();
  const coverageQuery = useSkuCoverage(asOf, row.skuId, row.region);

  return (
    <div className="space-y-6">
      <Section title="Safety-stock inputs" icon={Calculator}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Field label="μ daily demand">{num(row.muDaily).toFixed(1)}</Field>
          <Field label="σ daily demand">{num(row.sigmaDaily).toFixed(1)}</Field>
          <Field label="Lead time">{row.leadTimeDays} d</Field>
          <Field label="Safety stock">{formatNum(row.safetyStock)}</Field>
          <Field label="Target position">{formatNum(row.targetPosition)}</Field>
          <Field label="On hand">{formatNum(row.onHand)}</Field>
        </div>
      </Section>

      <Section title="Recommended order" icon={PackagePlus}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Order qty">{formatNum(row.orderQty)} u</Field>
          <Field label="Order value">{formatInr(row.orderValueInr)}</Field>
        </div>
      </Section>

      <Section title="Transfer plan" icon={Truck}>
        <TransferCoverage query={coverageQuery} regionName={regionById.get(row.region)?.name ?? row.region} />
      </Section>

      <FormulaNote />
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
    <div className="space-y-4">
      <p className="text-xs leading-relaxed text-sub">
        Transfers already heading to <span className="font-semibold text-ink">{regionName}</span>{" "}
        cover part of this order before you buy — so you only need to purchase what's still left.
      </p>

      <div className="grid grid-cols-3 gap-3">
        <Field label="Inbound">{formatNum(data.inboundUnits)} u</Field>
        <Field label="Covered">{formatNum(covered)}%</Field>
        <Field label="Remaining to buy">
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
        <div className="space-y-1.5">
          <div className="h-2 overflow-hidden rounded-full bg-app">
            <div
              className="h-full rounded-full bg-secondary transition-all"
              style={{ width: `${Math.min(100, covered)}%` }}
            />
          </div>
          <p className="text-[11px] font-medium text-sub tabular-nums">
            {formatNum(data.inboundUnits)} of {formatNum(data.orderQty)} units already incoming
          </p>
        </div>
      )}

      {query.isPending ? (
        <div className="space-y-2">
          {Array.from({ length: 2 }, (_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-line/60" />
          ))}
        </div>
      ) : !hasTransfers ? (
        <div className="flex items-center gap-2 rounded-xl border border-dashed border-line bg-app px-4 py-3 text-xs text-sub">
          <Warehouse className="size-4 text-sub/50" />
          No inbound transfers planned for this SKU at this location.
        </div>
      ) : (
        <>
          <p className="text-[10px] font-bold tracking-wider text-sub uppercase">
            Inbound transfers · {data.inboundTransfers.length}
          </p>
          <ul className="space-y-2.5">
            {data.inboundTransfers.map((t) => (
              <TransferLine key={t.id} transfer={t} />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function TransferLine({ transfer }: { transfer: InboundTransfer }) {
  return (
    <li className="rounded-xl border border-line bg-app px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-sm font-semibold whitespace-nowrap">
          {transfer.fromLocation.replace("DC_", "").replace("WH_", "")}
          <ArrowRight className="size-3.5 text-primary" />
          <span className="text-sub">{formatNum(transfer.qtyUnits)} u</span>
        </div>
        <ReasonBadge reason={transfer.reason} />
      </div>
      <div className="mt-2 flex items-center justify-between gap-3 text-[11px] font-medium text-sub">
        <span className="flex items-center gap-1.5">
          <Truck className="size-3 text-sub/60" />
          {transfer.batchId ?? "batch —"} · lead {transfer.transferLeadDays}d
          {transfer.carrier ? ` · ${transfer.carrier}` : ""}
        </span>
        {transfer.daysToExpiry != null && (
          <span className="tabular-nums whitespace-nowrap">{transfer.daysToExpiry}d to expiry</span>
        )}
      </div>
    </li>
  );
}
