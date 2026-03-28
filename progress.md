# Globe UI Transformation — Build Progress

**Branch:** `feature/ui-transformation`
**Started:** 2026-03-28
**Last updated:** 2026-03-28

---

## Summary

Transforming Globe from a bare scaffold into a premium dark-mode land-intelligence product.
Full plan is in `plan.md`. Security audit findings in `claude.md`.

---

## Completed

### Phase 1: Design System Foundation ✅

- [x] **Design tokens** — Full CSS custom property system in `packages/ui/tokens/`
  - `colors.css` — Dark mode palette, price-state semantic colors, accent/status tokens, light mode overrides
  - `typography.css` — Inter Variable + JetBrains Mono + Noto Sans, full type scale
  - `spacing.css` — 4px base grid, border radius tokens
  - `layout.css` — Z-index layers, panel dimensions, breakpoints
  - `animations.css` — Duration/easing tokens, keyframes (shimmer, ticker-scroll, fade-in, etc.)
  - `index.css` — Aggregator + global reset + scrollbar styling

- [x] **Tailwind CSS v4** configured with `@tailwindcss/postcss` and `@theme {}` CSS var mapping
- [x] **Font loading** — Inter, JetBrains Mono (next/font), Noto Sans (Google Fonts link)
- [x] **globals.css** updated with token imports + Tailwind directive + backward-compat legacy CSS

### Phase 2: Atom Components ✅

All files in `apps/web/components/ui/`:

| Component | File | Description |
|-----------|------|-------------|
| Button | `Button.tsx` | 5 variants × 4 sizes, loading spinner, icon support, forwardRef |
| Badge | `Badge.tsx` | 7 variants with optional dot indicator |
| Skeleton | `Skeleton.tsx` | Skeleton, SkeletonText, SkeletonCard |
| Spinner | `Spinner.tsx` | sm/md/lg, ARIA role=status |
| Input | `Input.tsx` | forwardRef, label, error, hint, prefix/suffix icons |
| Tooltip | `Tooltip.tsx` | 4-side placement, hover/focus, configurable delay |
| Divider | `Divider.tsx` | Horizontal/vertical |

### Phase 3: Price-State Molecule Components ✅

| Component | File | Description |
|-----------|------|-------------|
| PriceChip | `PriceChip.tsx` | Ask/Closed/Estimate/Broker-Verified chips + PriceChipRow |
| FreshnessChip | `FreshnessChip.tsx` | Tier-based color, relative time, pulsing dot for realtime |
| ConfidenceBadge | `ConfidenceBadge.tsx` | Optional progress bar (role=meter) |
| CoverageBadge | `CoverageBadge.tsx` | Tier A/B/C with matching colors |
| StatCard | `StatCard.tsx` | Value/label/trend/sparkline slot, loading skeleton |
| EmptyState | `EmptyState.tsx` | Globe SVG illustration, title, description, CTA |

### Phase 4: App Shell Layout ✅

| Component | File | Description |
|-----------|------|-------------|
| Sidebar | `Sidebar.tsx` | Fixed left, 64px↔240px spring expand, tooltips when collapsed |
| TopBar | `TopBar.tsx` | Fixed top, user menu, Cmd+K hint, adjusts to sidebar width |
| RightDrawer | `RightDrawer.tsx` | Framer Motion spring slide-in, backdrop, Escape key |
| BottomPanel | `BottomPanel.tsx` | Height-spring expand, ticker area, fade gradient masks |
| AppShell | `AppShell.tsx` | Composes all 4 — main layout wrapper |

### Phase 5: Globe Overlay Components ✅

| Component | File | Description |
|-----------|------|-------------|
| MetricToggle | `MetricToggle.tsx` | Pill group: Ask/Closed/Activity/Confidence |
| FloatingLegend | `FloatingLegend.tsx` | Gradient legend synced to active metric |
| CommandPalette | `CommandPalette.tsx` | cmdk-based, Framer Motion spring, grouped results, Cmd+K |

### Phase 6: Data Visualization Components ✅

| Component | File | Description |
|-----------|------|-------------|
| TrendChart | `TrendChart.tsx` | Recharts AreaChart + gradient fill + CustomTooltip |
| Sparkline | `TrendChart.tsx` | Pure SVG inline sparkline |
| PriceTimeline | `PriceTimeline.tsx` | Staggered Framer Motion events, color-coded nodes |
| TickerTape | `TickerTape.tsx` | CSS ticker-scroll animation, doubled array for seamless loop |

### Phase 7: Feature Components ✅

| Component | File | Description |
|-----------|------|-------------|
| ParcelDossier | `ParcelDossier.tsx` | Full parcel panel: overview, pricing, trend chart, history, action bar |
| CompareGrid | `CompareGrid.tsx` | Side-by-side 2–4 parcel comparison with best-value highlighting |
| WatchlistCard | `WatchlistCard.tsx` | Watchlist item card: price, sparkline, change indicator, alert badge |
| WatchlistPage | `WatchlistPage.tsx` | Full watchlist view: grouped sidebar + card grid |

### Phase 8: Admin Console Components ✅

| Component | File | Description |
|-----------|------|-------------|
| SourceHealthCard | `SourceHealthCard.tsx` | Source status card with quality score bar, traffic-light indicator |
| JobHistoryTable | `JobHistoryTable.tsx` | Sortable ingestion job history table with expandable rows |

### Phase 9: AppShell Integration ✅

- [x] **AppShell wired into `land-intelligence-app.tsx`**
  - New imports: AppShell, CommandPalette, TickerTape, FloatingLegend, MetricToggle, CompareGrid, WatchlistPage, ParcelDossier
  - State added: `activeView`, `commandPaletteOpen`, `activeMetric`, `drawerParcelId`
  - Data transforms: `tickerItems`, `watchlistGroups`, `compareGridItems`
  - Views: Globe (GlobeCanvas + MetricToggle overlay), Compare (CompareGrid), Watchlist (WatchlistPage)
  - Right drawer: ParcelDossier with Watch/Compare actions wired to existing handlers
  - CommandPalette: markets search with `navigate to globe + select market`
  - Legacy shell preserved in hidden div for reference

- [x] **TypeScript build passes** — `npm run build` succeeds with 0 errors

---

## In Progress

- [ ] Market view panel (stats cards, tabbed Listings/Trends/Alerts)
- [ ] FilterBar (price range slider, size, use-class, tenure, freshness, confidence)

---

## Pending

- [ ] Responsive layout (mobile bottom sheet, tablet overlay)
- [ ] Accessibility pass (aria-labels, keyboard nav)
- [ ] Admin console page layout (light mode, SourceHealthCard grid, JobHistoryTable)

---

## Security Audit Notes

Critical bugs documented in `claude.md`:
1. `exportMemo` bypasses legal display policy — **live-verified**
2. SHA-256 password hashing (should be bcrypt/argon2)
3. Timing-attack-vulnerable hash comparison
4. `/tmp/` production store defaults
5. Token secret fallback chain

None of the security fixes are implemented yet — UI transformation is the current focus.
