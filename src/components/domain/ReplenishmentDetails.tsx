import type { ReplenishmentRow } from "@/types/api";
import { StatusBadge, CriticalityChip } from "@/components/ui/Badge";
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

/** Safety-stock math audit — lets planners verify the reorder logic. */
export function ReplenishmentDetails({ row }: { row: ReplenishmentRow }) {
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
    </div>
  );
}
