import { useState } from "react";
import { useApp } from "@/context/app-context";
import {
  useDemandHistory,
  useDailyCurves,
  useFlu,
  useForecasts,
  useRuns,
} from "@/hooks/queries";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { ForecastBand } from "@/features/demand-sensing/ForecastBand";
import {
  ModelMixDonut,
  SensingTable,
  WmapeNote,
} from "@/features/demand-sensing/SensingPanels";
import { isoDaysAgo } from "@/lib/format";

/** Page 2 — short-term forecast accuracy via leading indicators. */
export default function DemandSensing() {
  const { asOf, meta } = useApp();
  const [skuId, setSkuId] = useState("N02BE-01");
  const [region, setRegion] = useState("WH_INDORE");
  const [windowDays, setWindowDays] = useState(14);

  const historyFrom = asOf ? isoDaysAgo(60, asOf) : undefined;
  const historyQuery = useDemandHistory(skuId, region, historyFrom, asOf);
  const forecastQuery = useForecasts(asOf ?? "", { skuId, region, horizonMax: windowDays });
  const lastForecastDate =
    forecastQuery.data?.content.at(-1)?.forecastDate ??
    (asOf ? isoDaysAgo(-42, asOf) : undefined);
  const fluQuery = useFlu(region, historyFrom, lastForecastDate);
  const curvesQuery = useDailyCurves(asOf);
  const runsQuery = useRuns(1);

  const skuOptions =
    meta?.skus.map((sku) => ({
      value: sku.skuId,
      label: `${sku.brandName} · ${sku.skuId}`,
    })) ?? [];
  const regionOptions =
    meta?.regions.map((r) => ({ value: r.locationId, label: r.name })) ?? [];

  return (
    <div className="animate-fade-up space-y-5 sm:space-y-6">
      <Card className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <Select
            label="SKU"
            id="ds-sku"
            options={skuOptions.length > 0 ? skuOptions : [{ value: skuId, label: skuId }]}
            value={skuId}
            onChange={(event) => setSkuId(event.target.value)}
            className="lg:max-w-xs"
          />
          <Select
            label="Region"
            id="ds-region"
            options={regionOptions.length > 0 ? regionOptions : [{ value: region, label: region }]}
            value={region}
            onChange={(event) => setRegion(event.target.value)}
            className="lg:max-w-56"
          />
          <p className="ml-auto hidden max-w-64 text-[11px] leading-relaxed text-sub xl:block">
            Slide the window to trim the horizon — the band re-slices instantly, no
            recomputation needed.
          </p>
        </div>
      </Card>

      <ForecastBand
        forecastQuery={forecastQuery}
        historyQuery={historyQuery}
        fluQuery={fluQuery}
        curvesQuery={curvesQuery}
        asOf={asOf ?? ""}
        windowDays={windowDays}
        onWindowChange={setWindowDays}
      />

      <div className="grid grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SensingTable query={forecastQuery} skuId={skuId} region={region} windowDays={windowDays} />
        </div>
        <div className="flex flex-col gap-5 sm:gap-6">
          <ModelMixDonut query={forecastQuery} />
          <WmapeNote runsQuery={runsQuery} />
        </div>
      </div>
    </div>
  );
}
