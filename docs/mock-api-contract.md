# Frontend API Contract

The frontend currently starts with a deterministic in-memory API so screens can be developed without a running backend.

## Mock mode

Mock mode is enabled by default. It is controlled in `src/api/client.ts`:

```env
VITE_USE_MOCK_API=false
```

Set that variable to `false` when the backend is running. The frontend will then use the Vite proxy and `VITE_API_ORIGIN` (default `http://localhost:3000`).

## Endpoints used by the frontend

| Endpoint | Used for | Response |
| --- | --- | --- |
| `GET /api/meta` | snapshot date, SKU and region selectors | `MetaResponse` |
| `GET /api/runs?limit=` | model run and WMAPE context | `RunEntry[]` |
| `GET /api/kpi?asOf=` | command-center KPI cards | `KpiResponse` |
| `GET /api/kpi/daily-curves?asOf=` | served vs demand chart | `DailyCurvesResponse` |
| `GET /api/kpi/writeoff-cumulative?asOf=` | write-off trajectory chart | `WriteoffCumulativeResponse` |
| `GET /api/inventory/aging?asOf=` | inventory freshness and ageing | `AgingResponse` |
| `GET /api/forecasts?asOf=&skuId=&region=&horizonMax=&size=` | demand sensing band and factors | `ForecastsResponse` |
| `GET /api/demand/history?skuId=&region=&from=&to=` | historical demand line | `DemandPoint[]` |
| `GET /api/flu?region=&from=&to=` | flu/ILI overlay | `FluPoint[]` |
| `GET /api/model/metrics?asOf=` | realized accuracy card | `ModelMetricsResponse` |
| `GET /api/replenishment?asOf=&size=&sort=` | shortage watchlist and order book | `ReplenishmentResponse` |
| `GET /api/replenishment/summary?asOf=` | status and criticality totals | `ReplenishmentSummary` |
| `GET /api/transfers?asOf=&reason=&size=` | expiry rescue transfer plan | `TransfersResponse` |
| `GET /api/writeoffs?asOf=&size=` | residual expiry exposure | `WriteoffsResponse` |
| `GET /api/alerts?asOf=&size=` | escalation board and alert drawer | `AlertsResponse` |
| `PATCH /api/alerts/:id/acknowledge` | acknowledge an alert | `AlertItem` |
| `GET /api/digest?asOf=` | review mode and escalation brief | `DigestResponse` |

All date values use `YYYY-MM-DD`; timestamps are ISO 8601. Paginated responses use `{ content, page, size, totalElements }`.

## Mock data coverage

The mock includes four SKUs, four locations, 42 forecast days, 60 history days, inventory ageing, replenishment rows, transfer/write-off rows, alerts, digest text, model metrics, and a mutable alert acknowledgement flow. Data is deterministic so chart and layout work remains stable between refreshes.
