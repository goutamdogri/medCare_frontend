import { useDailyCurves, useKpi, useWriteoffCumulative, useAging } from "@/hooks/queries";
import { useApp } from "@/context/app-context";
import { KpiRow } from "@/features/command-center/KpiRow";
import { ServedVsDemand } from "@/features/command-center/ServedVsDemand";
import { WriteoffTrajectory } from "@/features/command-center/WriteoffTrajectory";
import { UtilizationStrip } from "@/features/command-center/UtilizationStrip";

/** Page 1 — overall value: availability up, wastage down. */
export default function CommandCenter() {
  const { asOf } = useApp();
  const kpiQuery = useKpi(asOf);
  const curvesQuery = useDailyCurves(asOf);
  const cumulativeQuery = useWriteoffCumulative(asOf);
  const agingQuery = useAging(asOf);

  return (
    <div className="animate-fade-up space-y-5 sm:space-y-6">
      <KpiRow query={kpiQuery} />

      <div className="grid grid-cols-1 gap-5 sm:gap-6 xl:grid-cols-3">
        <ServedVsDemand query={curvesQuery} />
        <UtilizationStrip query={agingQuery} />
      </div>

      <WriteoffTrajectory
        query={cumulativeQuery}
        savingInr={kpiQuery.data?.improvement.writeoffSavingInr}
      />
    </div>
  );
}
