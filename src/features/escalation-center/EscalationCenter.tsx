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
import { SkeletonBlock } from "@/components/ui/Skeleton";
import { StatCard } from "@/components/ui/StatCard";
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Red alerts open"
          value={redOpen}
          accent="danger"
          icon={Flame}
          sub={digest ? `digest reports ${digest.redAlertCount} for this run` : undefined}
        />
        <StatCard
          label="Amber alerts open"
          value={amberOpen}
          accent="warning"
          icon={TriangleAlert}
          sub="awaiting acknowledgement"
        />
        <SurgeRegionsCard query={digestQuery} />
        <StatCard
          label="Review cadence"
          value={surgeMode ? "Daily" : "Weekly"}
          accent={surgeMode ? "danger" : "info"}
          icon={Clock}
          sub={
            surgeMode
              ? "until region leaves top-quartile ILI for 14 straight days"
              : "Monday morning supply review"
          }
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

/* --------------------------- Surge region chips ------------------------ */

function SurgeRegionsCard({ query }: { query: ReturnType<typeof useDigest> }) {
  const regions = query.data?.surgeRegions ?? [];
  return (
    <Card className="animate-fade-up p-5 shadow-card">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold tracking-wider text-sub uppercase">
          Regions in surge
        </p>
        <MapPin className="size-4 text-sub" />
      </div>
      {query.isPending ? (
        <SkeletonBlock lines={1} className="px-0 pt-3 pb-0" />
      ) : regions.length === 0 ? (
        <>
          <p className="mt-2 text-sm font-bold text-success">None</p>
          <p className="mt-0.5 text-xs text-sub">No region currently exceeds surge thresholds.</p>
        </>
      ) : (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {regions.map((region) => (
            <Badge key={region} variant="danger" dot>
              {region.replaceAll("DC_", "").replaceAll("WH_", "")}
            </Badge>
          ))}
        </div>
      )}
    </Card>
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
  },
  {
    icon: CalendarCheck,
    title: "Standard mode",
    body: "Weekly Monday morning supply review with the full order book and write-off outlook.",
  },
  {
    icon: Gavel,
    title: "Always-on escalation",
    body: "Any new RED alert reaches the CSCO within 24 hours, regardless of the standing cadence.",
  },
];

function CadenceExplainer() {
  return (
    <Card>
      <CardHeader
        title="Cadence policy"
        subtitle="How this control tower decides when you look at it."
        icon={Clock}
        iconClassName="bg-warning-soft text-yellow-800 dark:bg-warning/15 dark:text-warning"
      />
      <ol className="space-y-4 px-5 pt-4 pb-5 sm:px-6">
        {RULES.map((rule, index) => {
          const Icon = rule.icon;
          return (
            <li key={rule.title} className="relative flex gap-3 pl-2">
              <div className="flex flex-col items-center">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-line bg-app text-sub">
                  <Icon className="size-4" />
                </span>
                {index < RULES.length - 1 && (
                  <span className="mt-1 w-px flex-1 bg-line" aria-hidden />
                )}
              </div>
              <div className="pb-1">
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
