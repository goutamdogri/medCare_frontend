import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Flame,
  ShieldCheck,
  TrendingUp,
  TriangleAlert,
} from "lucide-react";
import type { UseQueryResult } from "@tanstack/react-query";
import { DeltaBadge } from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/StatCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { num, formatInr } from "@/lib/format";
import type { KpiResponse, PolicyKpi } from "@/types/api";
import { useRef } from "react";
import gsap from "gsap";

interface CardModel {
  label: string;
  value: string;
  icon: LucideIcon;
  accent:
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "danger"
    | "info";
  badge: ReactNode;
  sub: ReactNode;
}

function buildCards(data: KpiResponse): CardModel[] {
  const p: PolicyKpi = data.proposed;
  const sq: PolicyKpi = data.statusQuo;
  const imp = data.improvement;

  return [
    {
      label: "Fill rate",
      value: `${num(p.fillRatePct).toFixed(1)}%`,
      icon: TrendingUp,
      accent: "success",
      badge: <DeltaBadge value={imp.fillRatePctDelta} suffix="pts" />,
      sub: (
        <>
          vs <b>{num(sq.fillRatePct).toFixed(1)}%</b> status quo
        </>
      ),
    },
    {
      label: "Critical fill rate",
      value: `${num(p.criticalFillRatePct).toFixed(1)}%`,
      icon: ShieldCheck,
      accent: "secondary",
      badge: <DeltaBadge value={imp.criticalFillRatePctDelta} suffix="pts" />,
      sub: (
        <>
          vs <b>{num(sq.criticalFillRatePct).toFixed(1)}%</b> status quo
        </>
      ),
    },
    {
      label: "Write-off value · 42d",
      value: formatInr(num(p.writeoffValueInr)),
      icon: Flame,
      accent: "danger",
      badge: (
        <DeltaBadge
          prefix={`${formatInr(imp.writeoffSavingInr)} saved`}
        />
      ),
      sub: (
        <>
          vs <b>{formatInr(num(sq.writeoffValueInr))}</b> status quo
        </>
      ),
    },
    {
      label: "Critical stock-out site-days",
      value: String(p.criticalStockoutSitedays),
      icon: TriangleAlert,
      accent: "warning",
      badge: (
        <DeltaBadge
          value={-imp.stockoutUnitReductionPct}
          goodDirection="down"
          suffix="% units"
        />
      ),
      sub: (
        <>
          vs <b>{sq.criticalStockoutSitedays}</b> status quo
        </>
      ),
    },
  ];
}

export function KpiRow({
  query,
}: {
  query: UseQueryResult<KpiResponse>;
}) {
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const handleMouseEnter = (index: number) => {
    const card = cardRefs.current[index];

    if (!card) return;

    gsap.to(card, {
      y: -8,
      scale: 1.02,
      duration: 0.3,
      ease: "power2.out",
    });
  };

  const handleMouseLeave = (index: number) => {
    const card = cardRefs.current[index];

    if (!card) return;

    gsap.to(card, {
      y: 0,
      scale: 1,
      duration: 0.35,
      ease: "power2.out",
    });
  };

  if (query.isPending) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-line bg-card p-5 shadow-card"
          >
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="mt-4 h-8 w-28" />
            <Skeleton className="mt-3 h-4 w-36" />
          </div>
        ))}
      </div>
    );
  }

  const data = query.data;

  if (!data) return null;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {buildCards(data).map((card, index) => (
        <div
          key={card.label}
          ref={(el) => {
            cardRefs.current[index] = el;
          }}
          onMouseEnter={() => handleMouseEnter(index)}
          onMouseLeave={() => handleMouseLeave(index)}
          className="will-change-transform"
        >
          <StatCard
            label={card.label}
            value={card.value}
            icon={card.icon}
            accent={card.accent}
            badge={card.badge}
            sub={card.sub}
          />
        </div>
      ))}
    </div>
  );
}