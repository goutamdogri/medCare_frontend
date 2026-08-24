# MedCare · Supply Chain Control Tower

Judge-facing SPA for the pharma supply-chain ML system: demand sensing with
flu-leading indicators, shortage watchlist with live acknowledgement workflow,
expiry-aware transfers, the daily replenishment plan and an AI escalation brief.

**Stack** — Vite · React 19 · TypeScript · Tailwind CSS v4 · TanStack Query ·
Recharts · React Router · lucide-react.

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173 (proxies /api + /actuator → :3001)
```

Requires the API to be reachable at `http://localhost:3001`
(`GET /actuator/health` must return `{"status":"UP"}`). Override the target
origin with `VITE_API_ORIGIN` or call the API from a different base with
`VITE_API_BASE` (both optional — defaults assume the standard setup).

```bash
npm run build      # type-check + production bundle
npm run lint       # eslint
npm run preview    # serve the production build
```

## Pages ↔ outcomes

| Route | Page | Outcome it proves |
|---|---|---|
| `/` | Command Center | Overall value — availability ↑, wastage ↓ |
| `/demand` | Demand Sensing | Forecast accuracy via leading indicators |
| `/shortages` | Shortage Watchlist | Fewer stock-outs + acknowledgement workflow |
| `/expiry` | Expiry Rescue | Expiry-aware allocation, write-off reduction |
| `/orders` | Order Book | The replenishment plan planners receive |
| `/escalation` | Escalation Center | Review cadence + on-device AI brief |

All pages are snapshot-driven: pick any `asOf` date in the top bar and every
query refetches keyed by `[endpoint, asOf]` — never mixed snapshots.

## Architecture

```
src/
├── api/            # fetch wrapper (error normalisation, query params)
├── components/
│   ├── charts/     # shared chart theme, tooltip, legend chips
│   ├── domain/     # cross-page domain widgets (safety-stock audit)
│   ├── layout/     # AppShell, Sidebar (+pipeline health chip), TopBar
│   └── ui/         # design-system primitives (Card, Badge, Drawer, …)
├── context/        # app state (asOf/theme/meta) + toast system
├── features/       # one folder per page, self-contained widgets
│   ├── command-center/  ├── demand-sensing/     ├── shortage-watchlist/
│   ├── expiry-rescue/    └── order-book/
├── hooks/          # TanStack Query hooks per backend domain
├── lib/            # formatting (₹L/Cr), CSV export, class utils
└── types/          # DTOs mirroring docs/backend-spec.md
```

### Conventions

- **Theming** — semantic tokens (`bg-app`, `bg-card`, `text-ink`, `text-sub`,
  `border-line`) map to `design-system/designTokens.json` via Tailwind v4
  `@theme inline`; light/dark flips through a `.dark` class on `<html>`
  (persisted in `localStorage`, applied pre-paint). Brand & feedback tokens are
  purpose-named, never hue-named: `primary` (indigo — actions, active states,
  focus), `secondary` (violet), `accent` (teal), `success`, `warning`,
  `danger` (strictly alerts/errors/losses), `info`. Swap a hex once in
  `src/index.css` and the whole UI follows.
- **Data fetching** — every widget renders its own skeleton/error/empty state
  via `<Widget query={…}>`; errors surface a retry button plus a toast,
  never a blank screen.
- **Numbers** — INR uses Indian short scale (`₹12.1L`, `₹1.03Cr`) via
  `lib/format.ts`; MySQL DECIMAL strings are coerced with `num()`.
- Backend contract: [`docs/backend-spec.md`](docs/backend-spec.md) · UI spec:
  [`docs/frontend-spec.md`](docs/frontend-spec.md)
