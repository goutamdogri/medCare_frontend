import {
  CalendarCheck,
  Clock,
  Cpu,
  Flame,
  Gavel,
  MapPin,
  Siren,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { useApp } from "@/context/app-context";
import { useAlerts, useDigest } from "@/hooks/queries";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

/** Page 6 — review cadence and the AI escalation brief. */
export default function EscalationCenter() {
  const { asOf } = useApp();
  const digestQuery = useDigest(asOf);
  const alertsQuery = useAlerts(asOf);

  const digest = digestQuery.data;
  const surgeMode = digest?.reviewMode === "DAILY_SURGE_MODE";

  const open = (alertsQuery.data?.content ?? []).filter((a) => !a.acknowledged);
  const redOpen = open.filter((a) => a.severity === "RED").length;
  const amberOpen = open.length - redOpen;

  return (
    <div className="animate-fade-up space-y-5 sm:space-y-6">
      <ModeBanner loading={digestQuery.isPending} surgeMode={surgeMode} />

      {/* 60:30:10 — metrics row: dominant neutral, secondary warning, accent red */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricRow
          icon={Flame}
          label="Red alerts"
          value={redOpen}
          accent="danger"
          sub={digest ? `digest reports ${digest.redAlertCount}` : undefined}
          loading={digestQuery.isPending || alertsQuery.isPending}
        />
        <MetricRow
          icon={TriangleAlert}
          label="Amber alerts"
          value={amberOpen}
          accent="warning"
          sub="awaiting acknowledgement"
          loading={digestQuery.isPending || alertsQuery.isPending}
        />
        <SurgeRegionsRow query={digestQuery} />
        <MetricRow
          icon={Clock}
          label="Review cadence"
          value={surgeMode ? "Daily" : "Weekly"}
          accent={surgeMode ? "danger" : "info"}
          sub={
            surgeMode
              ? "until region leaves top-quartile ILI for 14 days"
              : "Monday morning supply review"
          }
          loading={digestQuery.isPending}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:gap-6 xl:grid-cols-3">
        <BriefCard
          query={digestQuery}
          className="xl:col-span-2"
        />
        <CadenceExplainer />
      </div>
    </div>
  );
}

/* ------------------------------ Mode banner ---------------------------- */

function ModeBanner({
  loading,
  surgeMode,
}: {
  loading: boolean;
  surgeMode: boolean;
}) {
  if (loading) return <div className="h-20 animate-pulse rounded-2xl bg-line/60" />;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-4 rounded-2xl border p-5 shadow-card",
        surgeMode
          ? "border-danger/40 bg-gradient-to-r from-danger/12 via-danger/5 to-transparent dark:from-danger/15"
          : "border-info/40 bg-gradient-to-r from-info/10 to-transparent",
      )}
    >
      <span
        className={cn(
          "grid size-12 shrink-0 place-items-center rounded-2xl text-white shadow-lg",
          surgeMode
            ? "bg-gradient-to-br from-danger to-red-700 shadow-[0_10px_24px_-8px_rgb(239_68_68/0.7)]"
            : "bg-gradient-to-br from-info to-secondary shadow-[0_10px_24px_-8px_rgb(59_130_246/0.7)]",
        )}
      >
        {surgeMode ? <Siren className="size-6" /> : <CalendarCheck className="size-6" />}
      </span>
      <div>
        <p
          className={cn(
            "text-base font-extrabold tracking-tight sm:text-lg",
            surgeMode ? "text-danger" : "text-info dark:text-info",
          )}
        >
          {surgeMode ? "DAILY SURGE MODE" : "WEEKLY STANDARD"}
        </p>
        <p className="mt-0.5 max-w-prose text-xs leading-relaxed text-sub sm:text-sm">
          {surgeMode
            ? "Flu-season surge detected — review the watchlist every day until regions exit top-quartile ILI."
            : "Demand is stable — weekly Monday review cadence applies."}
        </p>
      </div>
    </div>
  );
}

/* --------------------------- Compact metric row ------------------------ */

function MetricRow({
  icon: Icon,
  label,
  value,
  accent,
  sub,
  loading,
}: {
  icon: typeof Flame;
  label: string;
  value: string | number;
  accent: "danger" | "warning" | "info" | "success";
  sub?: string;
  loading?: boolean;
}) {
  if (loading) {
    return <div className="h-20 animate-pulse rounded-xl bg-line/60" />;
  }

  const accentBg: Record<string, string> = {
    danger: "bg-danger/[.06] border-danger/20",
    warning: "bg-warning/[.06] border-warning/20",
    info: "bg-info/[.06] border-info/20",
    success: "bg-success/[.06] border-success/20",
  };
  const accentText: Record<string, string> = {
    danger: "text-danger",
    warning: "text-warning",
    info: "text-info",
    success: "text-success",
  };
  const accentIcon: Record<string, string> = {
    danger: "text-danger",
    warning: "text-warning",
    info: "text-info",
    success: "text-success",
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors",
        accentBg[accent],
      )}
    >
      <span className={cn("grid size-9 shrink-0 place-items-center rounded-lg", accentIcon[accent])}>
        <Icon className="size-[18px]" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold tracking-wide text-sub uppercase">{label}</p>
        <p className={cn("text-lg font-extrabold tabular-nums leading-tight", accentText[accent])}>
          {value}
        </p>
        {sub && <p className="mt-0.5 text-[11px] leading-snug text-sub truncate">{sub}</p>}
      </div>
    </div>
  );
}

/* --------------------------- Surge region row ------------------------ */

function SurgeRegionsRow({ query }: { query: ReturnType<typeof useDigest> }) {
  const regions = query.data?.surgeRegions ?? [];

  if (query.isPending) {
    return <div className="h-20 animate-pulse rounded-xl bg-line/60" />;
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-app px-4 py-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg text-sub">
        <MapPin className="size-[18px]" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold tracking-wide text-sub uppercase">
          Regions in surge
        </p>
        {regions.length === 0 ? (
          <>
            <p className="text-lg font-extrabold text-success leading-tight">None</p>
            <p className="mt-0.5 text-[11px] text-sub">No region exceeds thresholds</p>
          </>
        ) : (
          <div className="mt-1 flex flex-wrap gap-1">
            {regions.map((region) => (
              <Badge key={region} variant="danger" dot className="text-[10px]">
                {region.replaceAll("DC_", "").replaceAll("WH_", "")}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------ AI brief card -------------------------- */

function BriefCard({
  query,
  className,
}: {
  query: ReturnType<typeof useDigest>;
  className?: string;
}) {
  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader
        title="Brief for CSCO"
        subtitle="On-device generated escalation narrative from the alert engine."
        icon={Sparkles}
        iconClassName="bg-secondary-soft text-violet-700 dark:bg-secondary/15 dark:text-secondary"
        actions={
          query.data?.modelUsed && (
            <Badge variant="secondary" className="px-3 py-1.5">
              <Cpu className="size-3" />
              Generated by {query.data.modelUsed} · local LLM
            </Badge>
          )
        }
      />
      <div className="flex-1 px-5 pt-4 pb-5 sm:px-6">
        {query.isPending || !query.data ? (
          <div className="space-y-2.5">
            {Array.from({ length: 7 }, (_, i) => (
              <div
                key={i}
                className="h-3.5 animate-pulse rounded-full bg-line/70"
                style={{ width: `${92 - ((i * 13) % 38)}%` }}
              />
            ))}
          </div>
        ) : (
          <div className="max-h-[420px] overflow-y-auto rounded-xl border border-line bg-app px-4 py-3.5">
            <p className="text-sm leading-relaxed whitespace-pre-wrap text-ink">
              {query.data.digestText}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}

/* ---------------------------- Cadence explainer ------------------------ */

const RULES = [
  {
    icon: Siren,
    title: "Surge mode",
    body: "Daily review while any region stays in the top ILI quartile — exits only after 14 consecutive below-quartile days.",
    accent: "danger" as const,
  },
  {
    icon: CalendarCheck,
    title: "Standard mode",
    body: "Weekly Monday morning supply review with the full order book and write-off outlook.",
    accent: "info" as const,
  },
  {
    icon: Gavel,
    title: "Always-on escalation",
    body: "Any new RED alert reaches the CSCO within 24 hours, regardless of the standing cadence.",
    accent: "warning" as const,
  },
];

function CadenceExplainer() {
  const accentBorder: Record<string, string> = {
    danger: "border-l-danger",
    info: "border-l-info",
    warning: "border-l-warning",
  };
  const accentText: Record<string, string> = {
    danger: "text-danger",
    info: "text-info",
    warning: "text-warning",
  };

  return (
    <Card>
      <CardHeader
        title="Cadence policy"
        subtitle="How this control tower decides when you look at it."
        icon={Clock}
        iconClassName="bg-warning-soft text-yellow-800 dark:bg-warning/15 dark:text-warning"
      />
      <ol className="space-y-0 px-5 pt-4 pb-5 sm:px-6">
        {RULES.map((rule, index) => {
          const Icon = rule.icon;
          return (
            <li
              key={rule.title}
              className={cn(
                "relative flex gap-3 border-l-2 py-3 pl-4",
                accentBorder[rule.accent],
                index < RULES.length - 1 && "border-b border-line/50",
              )}
            >
              <span className={cn("mt-0.5 shrink-0", accentText[rule.accent])}>
                <Icon className="size-4" />
              </span>
              <div>
                <p className="text-sm font-bold text-ink">{rule.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-sub">{rule.body}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
