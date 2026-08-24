# MedCare Supply Chain Control Tower — Implementation Plan

## Status: APPROVED by user (proceed on unlock)

Stack confirmed: Vite 8 + React 19 + TS + Tailwind v4 (installed: react-router-dom 7,
@tanstack/react-query 5, recharts 3, lucide-react, clsx, tailwind-merge).
Mock backend ALREADY RUNNING at http://localhost:3001 — frontend integration only.

## Verified live API contract quirks (curl-probed)

- DECIMAL columns serialize as STRINGS: `fillRatePct:"93.78"`, `lgbmWeight:"0.503"`,
  `chronosWeight:"0.497"` → need `num()` coercion helper used everywhere.
- `/api/alerts` `facts` object uses SNAKE_CASE keys (`days_of_supply`, `lead_time_days`,
  `order_value_inr`, `recommended_order_units`, `criticality`).
- `/api/transfers` → `{ asOf, transfers:[...] }` incl. joined `carrier`; NOT paginated.
- `/api/writeoffs` → `{ asOf, totalResidualExposureInr, writeoffs:[...] }`.
- `/api/inventory/aging` → `{ asOf, detail:[{location,skuId,bucket,units,valueInr}] }`
  (buckets d0_30|d31_60|d61_90|d90plus) — roll up client-side for heatmap/utilization.
- `/api/demand/history`, `/api/flu` return FULL arrays from 2014 → always pass
  `from`/`to` (inclusive; note response includes day before `from`) + sku/region.
- Unknown asOf → HTTP 404 `{status,error,path,timestamp}` (clean JSON).
- PATCH /api/alerts/{id}/acknowledge body `{user:"csco@pharma.in"}` works, returns alert.
- meta.asOf = "2019-01-16"; runs have `asOfDate` field name.
- replenishment summary: `{byStatus:{ok,low,stockout_risk}, totalOrderValueInr, byCriticality:[{criticality,count,orderValueInr}]}`.
- forecasts envelope: `{content, page, size, totalElements, modelMix:{lgbm,chronos}, asOf}`.

## Styling rules (user-mandated)

- Semantic CSS vars in :root/.dark mapped via `@theme inline` in src/index.css →
  utilities: bg-app/bg-card/bg-card-subtle/text-ink/text-sub/border-line (auto theme-flip),
  accents coral/purple/mint/golden/peach (+ -soft variants), severity sev-red/sev-amber/sev-ok,
  shadows shadow-card/shadow-card-hover/shadow-pop, animations fade-up/slide-in-right/backdrop-in.
- Tailwind utility classes in markup preferred; custom CSS only where unavoidable
  (range slider pseudo-elements, scrollbar, color-scheme, font). dark: variant for one-offs.
- Theme = `.dark` class on <html> + localStorage("mc-theme"), pre-paint script in index.html.

## File-by-file build order

1. src/index.css — @custom-variant dark, semantic vars, @theme inline tokens,
   slider/scrollbar CSS (DONE design above)
2. index.html — Inter font links, title "MedCare · Supply Chain Control Tower",
   pre-paint theme script
3. vite.config.ts — server.proxy: "/api" + "/actuator" → http://localhost:3001
4. src/types/api.ts — all DTOs (decimal fields typed number|string, facts snake_case)
5. src/lib/format.ts — num() coercion, formatInr (₹12.1L/₹1.03Cr/₹45.2K), formatNum en-IN,
   formatPct, formatDate ("17 Jan 2019"/"17 Jan"), timeAgo
6. src/lib/csv.ts — toCsv + download util
7. src/api/client.ts — apiGet<T>(path, params), ApiError(status,message), base "" (proxy)
8. src/context/app.ts(x) — AppContext {asOf,setAsOf,meta,theme,toggleTheme};
   hook in .ts, provider .tsx (react-refresh safe)
9. src/context/toast.ts(x) — ToastProvider + useToast (success/error/info, auto-dismiss)
10. src/hooks/queries.ts — QueryClient factory + hooks keyed [domain, asOf, ...params]:
    useMeta, useKpi, useDailyCurves, useWriteoffCumulative, useForecasts(sku,region,horizonMax),
    useDemandHistory(sku,region,from,to), useFlu(region,from,to), useReplenishment(filters,size=500),
    useReplenishmentSummary, useTransfers(reason?), useWriteoffs, useAging,
    useAlerts({severity?,unackOnly?}), useAcknowledge mutation (invalidates alerts+digest),
    useDigest, useRuns
11. src/components/ui/*.tsx — Card, CardHeader, Badge(severity/status/criticality/reason/policy),
    Button(variants), Skeleton, Drawer(right slide-over+backdrop), Select, RangeSlider,
    EmptyState, ErrorState(retry), Toaster, StatCard(delta badge), Table primitives,
    RawJsonToggle(<details> ⚙), SegmentedControl(policy/toggle chips)
12. src/components/layout/AppShell.tsx — Sidebar (logo, 6 nav items w/ icons,
    pipeline health chip from useRuns[0]: dot+duration+"Xm ago"), TopBar (page title,
    asOf date input max=meta.asOf, "Data as of … · run success · Xm ago", theme toggle),
    mobile sidebar drawer; Outlet
13. Pages under src/features/<name>/ with widget components per page:
    - command-center/: KpiCards ×4 (proposed vs status_quo + green delta badge),
      ServedVsDemandChart (policy segmented toggle; demand dashed line + fulfilled area),
      WriteoffTrajectory (2 cumulative Areas + ₹saved annotation chip),
      UtilizationStrip (pure-div stacked bars: bucket mix per location vs capacity from meta regions? capacity not in /api/meta regions → compute utilization from aging units only, label "units on hand"; color by soon-expiry share)
    - demand-sensing/: ControlsRow (SKU select w/ brand names, region select, slider 1–42),
      ForecastBandChart (history actuals ≤asOf + bandLow/bandSpan stacked-area technique +
      p50 coral line + flu index dashed purple right axis), SensingTable (×momentum, fluRatio,
      +uplift% with info tooltips), ModelMixDonut, WmapeNote (hidden when null)
    - shortage-watchlist/: StatusTiles (click-to-filter), RiskGrid (sortable DOS asc,
      DOS<leadTime red chip, brand join from meta), RowDrawer (mu/sigma/serviceLevel/
      targetPosition/onHand + related alerts), AlertBoard (RED then AMBER cards, facts grid,
      Acknowledge → PATCH csco@pharma.in, acked collapse muted ✓ list)
    - expiry-rescue/: HeadlinePair (Σ valueSavedInr vs totalResidualExposureInr),
      TransferTable (reason filter chips teal/purple, From→To arrow lane, expires-in chip red<45),
      AgingHeatmap (6 locations × 4 buckets, intensity = valueInr/max, totals row/col),
      ResidualTop10 table
    - order-book/: SummaryBar (total value, placed vs no-op, criticality split mini-bars),
      OrderGrid (sort status/criticality/region/value/DOS + filters + CSV export of filtered set),
      DetailDrawer (service level + safety stock math audit)
    - escalation-center/: ModeBanner (red surge vs calm blue weekly), SurgeChips
      (redAlertCount + surgeRegions or "none"), AiBriefCard (pre-wrap digestText +
      footer "Generated by {modelUsed} · local LLM"), CadenceExplainer (static card)
14. src/App.tsx — BrowserRouter + QueryClientProvider + AppProvider + ToastProvider +
    AppShell + Routes (/ , /demand, /shortages, /expiry, /orders, /escalation, *→/)
15. Cross-cutting: per-widget skeletons, ErrorState w/ retry, empty states w/ quick-jump
    to latest asOf, toast on errors/mutations; responsive (sidebar→mobile drawer,
    grids lg: breakpoints); charts accept var(--line)/var(--ink) so they re-theme live.

## Verification

- npm run lint && npm run build clean
- npm run dev + curl through proxy /actuator/health
- Manual contract check of each page against live data shapes probed above

## Out of scope (user decision)

- Mock server (already running externally on :3001)
