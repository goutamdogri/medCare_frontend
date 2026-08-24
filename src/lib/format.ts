import type { NumLike } from "@/types/api";

/** Coerce a possibly-string DECIMAL / nullable value into a safe number. */
export function num(v: NumLike): number {
  if (v === null || v === undefined || v === "") return 0;
  const n = typeof v === "number" ? v : Number.parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

/** Like num() but preserves null (e.g. daysOfSupplyOnHand when stocked out). */
export function numOrNull(v: NumLike): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number.parseFloat(v);
  return Number.isFinite(n) ? n : null;
}

const compact = new Intl.NumberFormat("en-IN", {
  notation: "compact",
  maximumFractionDigits: 1,
});

/** ₹12.1L / ₹1.03Cr / ₹45.2K / ₹820 — Indian short-scale formatting. */
export function formatInr(value: number): string {
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  if (abs >= 1e7) return `${sign}₹${trim(abs / 1e7)}Cr`;
  if (abs >= 1e5) return `${sign}₹${trim(abs / 1e5)}L`;
  if (abs >= 1e3) return `${sign}₹${trim(abs / 1e3)}K`;
  return `${sign}₹${Math.round(abs)}`;
}

function trim(n: number): string {
  const rounded = Math.round(n * 100) / 100;
  return String(rounded);
}

/** Compact tick formatting for axes: 12.5K, 3.2L … */
export function formatCompact(value: number): string {
  if (Math.abs(value) >= 1e5) return `${(value / 1e5).toFixed(1)}L`;
  return compact.format(value);
}

/** Thousands separators, Indian grouping: 21,042 / 1,12,59,023. */
export function formatNum(value: number): string {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 1 }).format(
    value,
  );
}

export function formatPct(value: number, digits = 1): string {
  return `${value.toFixed(digits)}%`;
}

const DAY_MONTH = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
});
const DAY_MONTH_YEAR = new Intl.DateTimeFormat("en-In", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

/** "17 Jan" — axis labels. Safe for ISO yyyy-MM-dd strings. */
export function formatDate(iso: string): string {
  return DAY_MONTH.format(new Date(`${iso.slice(0, 10)}T00:00:00`));
}

/** "17 Jan 2019" — tooltips and headers. */
export function formatDateLong(iso: string): string {
  return DAY_MONTH_YEAR.format(new Date(`${iso.slice(0, 10)}T00:00:00`));
}

export function isoDaysAgo(days: number, anchorIso: string): string {
  const d = new Date(`${anchorIso.slice(0, 10)}T00:00:00`);
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

/** "2h ago", "3d ago" relative to now — pipeline freshness chip. */
export function timeAgo(isoDateTime: string): string {
  const then = new Date(isoDateTime).getTime();
  const seconds = Math.max(0, (Date.now() - then) / 1000);
  if (seconds < 90) return `${Math.round(seconds)}s ago`;
  const minutes = seconds / 60;
  if (minutes < 90) return `${Math.round(minutes)}m ago`;
  const hours = minutes / 60;
  if (hours < 36) return `${Math.round(hours)}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function formatDuration(seconds: number | null): string {
  if (seconds == null) return "—";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}
