# Globe Land Intelligence — UI/UX Transformation Plan

**Document type:** Execution-ready design & implementation blueprint
**Repository:** `Srimadhav-Seebu-Kumar/Globe`
**Date:** March 2026
**Prepared by:** Senior Frontend Architect / UX Strategist

---

## Executive Summary

Globe is a worldwide land-intelligence monorepo scaffold (Next.js + TypeScript + Python) with three apps (`web`, `admin`, `api`), shared packages (`ui`, `geo`, `types`, `config`), and a sophisticated data model covering parcels, listings, transactions, valuations, and coverage tiers. The master plan document (3,000 lines) demonstrates exceptional backend and product thinking — but the frontend is currently a bare scaffold with no visual design system, no interaction patterns, and no production UI.

This plan transforms Globe from a monorepo skeleton into a visually striking, interactive, premium land-intelligence product that rivals Bloomberg Terminal aesthetics meets Mapbox Studio fluidity.

---

## 1. UI/UX Audit

### 1.1 Visual Hierarchy — Critical Gap

**Current state:** No visual hierarchy exists. The `packages/ui` package is scaffolded but empty. There are no design tokens, no component library, and no typographic scale.

**Why this is a problem:** Users landing on a globe-first product need immediate visual cues to understand what's clickable, what's data, what's navigation, and what's context. Without hierarchy, the product reads as a developer prototype, not a market-intelligence tool. Investors and analysts will bounce within seconds.

**Specific issues:**
- No defined heading scale (H1–H6 sizing, weight, spacing)
- No distinction between primary actions and secondary content
- No data density management — the master plan describes stat cards, sparklines, drawers, and tickers, but nothing controls how they compete for attention
- No z-layer strategy for map overlays, drawers, tooltips, and modals

### 1.2 Color System — Nonexistent

**Current state:** Zero color definitions. The master plan correctly specifies a "dark market-monitor interface" and semantic colors for price states (ask, closed, estimate, broker-verified), but no tokens exist.

**Why this is a problem:** A dark-mode data product without a calibrated color system will either look washed out (too many grays), clash (random accent colors), or fail accessibility (insufficient contrast ratios on dark backgrounds). Price-state color coding is the single most important trust signal in this product — without it, users cannot distinguish a live asking price from a historical sale from a modeled estimate at a glance.

### 1.3 Typography — Undefined

**Current state:** No font selection, no type scale, no weight strategy.

**Why this is a problem:** Land-intelligence products are extremely data-dense. The wrong font (too wide, poor tabular figures, bad at small sizes) makes stat cards, tables, and map labels unreadable. Without tabular figures (monospaced numerals), price columns won't align. Without a deliberate weight scale (Regular/Medium/Semibold/Bold), there's no way to create emphasis without resorting to color alone.

### 1.4 Layout Consistency — No Grid, No Spacing Scale

**Current state:** The master plan describes an app shell (top bar, left rail, map canvas, right drawer, bottom legend, compare tray), but no spacing system, grid, or breakpoint strategy is implemented.

**Why this is a problem:** Map-centric products have a unique layout challenge: the map canvas must be fluid and fill available space, while side panels, drawers, and overlays must have predictable widths and padding. Without a spacing scale (4px base unit, 8/12/16/24/32/48px steps), every component will use ad-hoc values, creating visual noise.

### 1.5 Responsiveness — Not Addressed

**Current state:** No breakpoint definitions, no mobile strategy, no tablet considerations.

**Why this is a problem:** Land investors review data on iPads at property sites and on phones in meetings. The globe view must degrade to a flat map on small screens. The right drawer must become a bottom sheet. Filter controls must collapse to a modal. None of this is planned.

### 1.6 Interaction Design — Zero Patterns

**Current state:** No hover states, no transitions, no loading patterns, no empty states, no error states.

**Why this is a problem:** The master plan describes zoom-level transitions (globe → region → city → parcel), selection modes (click, hover, multi-select, compare, polygon draw), and drawer behaviors — but without implemented interaction patterns, the product will feel dead. A market-monitor product must feel alive: subtle pulse on live data updates, smooth drawer slides, animated chart entries, skeleton loading states.

---

## 2. Design System Overhaul

### 2.1 Design Direction: "Dark Market Monitor"

**Style:** Dark-mode data dashboard with selective glassmorphism on overlay panels. Think Bloomberg Terminal refined by Linear's design sensibility — information-dense but not cluttered, dark but not gloomy, professional but not sterile.

**Key aesthetic principles:**
- **Dark base, light data** — Background is near-black; data text is high-contrast white/off-white
- **Colored data, neutral chrome** — UI chrome is gray; only data-bearing elements use color
- **Glassmorphism only on floating panels** — Drawers, tooltips, and modals get frosted-glass treatment; main panels stay solid for performance and readability
- **Cartographic precision** — Map elements use muted, purpose-driven colors; avoid saturated rainbow palettes

### 2.2 Color Palette

#### Base Colors (Dark Mode Primary)

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg-base` | `#0A0E17` | App background, map surround |
| `--bg-surface` | `#111827` | Panels, cards, sidebar |
| `--bg-elevated` | `#1A2332` | Drawers, dropdowns, active states |
| `--bg-overlay` | `rgba(17,24,39,0.85)` | Glassmorphism panels (+ backdrop-blur) |
| `--border-subtle` | `#1E293B` | Dividers, card borders |
| `--border-default` | `#334155` | Input borders, active dividers |

#### Text Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--text-primary` | `#F1F5F9` | Headlines, key data values |
| `--text-secondary` | `#94A3B8` | Labels, descriptions, metadata |
| `--text-tertiary` | `#64748B` | Disabled, placeholder, timestamps |
| `--text-inverse` | `#0A0E17` | Text on light/colored backgrounds |

#### Price-State Semantic Colors (Critical)

| Token | Hex | Usage |
|-------|-----|-------|
| `--price-ask` | `#3B82F6` | Active listing/asking prices (blue = available) |
| `--price-closed` | `#10B981` | Recorded transactions (green = completed) |
| `--price-estimate` | `#F59E0B` | Modeled values (amber = derived) |
| `--price-broker-verified` | `#8B5CF6` | Human-verified quotes (purple = premium signal) |

#### Status & Trust Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--freshness-live` | `#10B981` | Live / real-time data |
| `--freshness-stale` | `#F59E0B` | Weekly/monthly updates |
| `--freshness-archive` | `#EF4444` | Archive / outdated |
| `--confidence-high` | `#10B981` | Score 80–100 |
| `--confidence-medium` | `#F59E0B` | Score 40–79 |
| `--confidence-low` | `#EF4444` | Score 0–39 |

#### Accent Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--accent-primary` | `#3B82F6` | Primary buttons, active nav, links |
| `--accent-hover` | `#60A5FA` | Hover states |
| `--accent-success` | `#10B981` | Positive changes, confirmations |
| `--accent-warning` | `#F59E0B` | Alerts, degraded states |
| `--accent-danger` | `#EF4444` | Errors, destructive actions |

#### Light Mode Overrides (Admin Console)

The admin console supports light mode for extended-use operations work. Swap `--bg-base` to `#F8FAFC`, `--bg-surface` to `#FFFFFF`, `--text-primary` to `#0F172A`, and invert border values. Price-state colors remain identical across modes for consistency.

### 2.3 Typography System

#### Font Pairing

| Role | Font | Fallback | Why |
|------|------|----------|-----|
| **Headings** | Inter | system-ui, sans-serif | Geometric, clean, excellent at display sizes, free |
| **Body/UI** | Inter | system-ui, sans-serif | One family reduces load; Inter has 9 weights and tabular figures |
| **Data/Numbers** | JetBrains Mono | monospace | Tabular alignment in stat cards, prices, coordinates |
| **Map Labels** | Noto Sans | Arial, sans-serif | Multilingual coverage for global place names, including Arabic, CJK |

#### Type Scale (1.25 ratio, base 14px)

| Token | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| `--text-display` | 36px | 700 | 1.1 | Hero stat values, globe overlay numbers |
| `--text-h1` | 28px | 700 | 1.2 | Page titles |
| `--text-h2` | 22px | 600 | 1.3 | Section headers |
| `--text-h3` | 18px | 600 | 1.3 | Card titles, drawer headers |
| `--text-h4` | 16px | 600 | 1.4 | Subsection headers |
| `--text-body` | 14px | 400 | 1.5 | Body text, descriptions |
| `--text-body-sm` | 13px | 400 | 1.5 | Secondary descriptions |
| `--text-caption` | 12px | 500 | 1.4 | Labels, badges, metadata |
| `--text-micro` | 11px | 500 | 1.3 | Map labels, timestamps, fine print |
| `--text-data` | 14px (mono) | 500 | 1.4 | Prices, coordinates, numeric values |

#### Weight Strategy

- **400 (Regular):** Body text, descriptions
- **500 (Medium):** Labels, captions, secondary data
- **600 (Semibold):** Card titles, section headers, primary data
- **700 (Bold):** Page titles, hero stats, emphasis

### 2.4 Spacing & Layout Grid

#### Spacing Scale (4px base)

| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | 4px | Tight padding (badge inner) |
| `--space-2` | 8px | Icon gaps, compact list items |
| `--space-3` | 12px | Standard inline spacing |
| `--space-4` | 16px | Card padding, form field gaps |
| `--space-5` | 20px | Section padding within panels |
| `--space-6` | 24px | Panel padding, major section gaps |
| `--space-8` | 32px | Between major content blocks |
| `--space-10` | 40px | Page-level section separation |
| `--space-12` | 48px | Hero section padding |

#### Layout Grid

| Region | Width | Behavior |
|--------|-------|----------|
| **Left sidebar** | 64px collapsed / 240px expanded | Persistent nav, icon-only when collapsed |
| **Map canvas** | Fluid (fills remaining) | Primary interactive area |
| **Right drawer** | 400px (parcel) / 480px (compare) | Slides in on selection, push layout |
| **Bottom panel** | 48px ticker / 280px expanded | Legend, filter chips, ticker |
| **Top bar** | Full width, 56px height | Search, toggles, user menu |

#### Breakpoints

| Name | Width | Behavior |
|------|-------|----------|
| `mobile` | < 768px | Bottom sheet drawer, hamburger nav, stacked layout |
| `tablet` | 768–1024px | Collapsed sidebar, overlay drawer, touch-friendly targets |
| `desktop` | 1024–1440px | Standard layout |
| `wide` | > 1440px | Expanded drawer, wider panels, more data columns |

### 2.5 Component Design Principles

1. **Compound over monolithic** — Build stat cards from composable atoms (value, label, trend indicator, sparkline) not rigid templates
2. **State-explicit** — Every component has visible states: default, hover, active, loading (skeleton), empty, error, disabled
3. **Data-first** — Components are designed around the data they display, not around decorative layouts
4. **Trust-annotated** — Any component displaying market data must accept and render `freshness`, `confidence`, and `source` props
5. **Keyboard-navigable** — All interactive components are focusable and operable via keyboard
6. **RTL-ready** — Use logical properties (`margin-inline-start` not `margin-left`), directional icons flip

---

## 3. Interaction & Animation Plan

### 3.1 Animation Library Choice

**Primary: Framer Motion** — Already React-native, excellent for layout animations, gesture support, and declarative spring physics. Use for all UI component animations.

**Secondary: MapLibre native transitions** — MapLibre GL JS has built-in `flyTo`, `easeTo`, and property transitions. Use these for all map camera and layer animations. Do not fight the map SDK with external animation libraries.

**Tertiary: GSAP (ScrollTrigger only)** — If marketing/landing pages are added, use GSAP ScrollTrigger for scroll-based parallax. Do not use GSAP inside the main app — Framer Motion is sufficient and more React-idiomatic.

### 3.2 Microinteractions Map

#### Navigation & Layout

| Element | Trigger | Animation | Duration | Why |
|---------|---------|-----------|----------|-----|
| Sidebar expand/collapse | Click toggle | Width spring + icon rotate | 300ms | Prevents disorienting snap; user sees panels adjust |
| Right drawer open | Selection on map | Slide from right + fade content | 250ms ease-out | Draws attention to new context without blocking map |
| Right drawer close | Deselect / close button | Slide right + fade | 200ms ease-in | Faster close than open feels responsive |
| Bottom panel expand | Click expand handle | Height spring | 300ms | Reveals legend/filters smoothly |
| Page route transition | Navigation | Crossfade content area | 200ms | Map persists; only panel content transitions |

#### Map Interactions

| Element | Trigger | Animation | Duration | Why |
|---------|---------|-----------|----------|-----|
| Globe → Market drill | Click H3 cell | `flyTo` with zoom + pitch adjust | 1500ms | Cinematic transition is the hero moment |
| Market → Parcel zoom | Click listing cluster | `flyTo` to centroid, zoom 16 | 1000ms | Progressive disclosure |
| H3 cell hover | Mouse enter | Fill opacity 0.3 → 0.6, border highlight | 150ms | Immediate feedback that cells are interactive |
| Listing cluster hover | Mouse enter | Scale 1.0 → 1.15, glow ring | 150ms | Differentiates cluster from static map feature |
| Parcel outline hover | Mouse enter | Stroke width 1 → 2, fill opacity pulse | 200ms | Confirms which parcel the cursor is on |
| Coverage badge appear | Zoom threshold | Fade in from 0, slight upward drift | 300ms | Badges shouldn't pop; they should emerge |
| Polygon draw mode | Activation | Crosshair cursor, pulse guide dot | Continuous | User knows they're in a special mode |

#### Data Components

| Element | Trigger | Animation | Duration | Why |
|---------|---------|-----------|----------|-----|
| Stat card value change | Data update | Count-up/down number animation | 400ms | Makes live updates feel alive |
| Sparkline draw | Card enters viewport | SVG path draw from left to right | 600ms | Chart "comes alive" instead of appearing static |
| Price chip appear | Drawer opens | Stagger-fade (ask → closed → estimate) | 100ms stagger | Shows data hierarchy through timing |
| Freshness chip | Hover | Expand to show full text ("Updated 3h ago") | 200ms | Progressive disclosure of metadata |
| Confidence bar | Data load | Width grows from 0 → value | 400ms ease-out | Visual progress metaphor |
| Ticker tape | Continuous | Smooth scroll left, pause on hover | 30px/s | Bloomberg-style market activity feel |
| Activity feed item | New event | Slide in from top, highlight flash | 300ms + 1s fade | New items are noticed without being jarring |

#### Loading States

| Context | Pattern | Implementation |
|---------|---------|----------------|
| Map tiles loading | Tile shimmer overlay | CSS gradient animation on placeholder tiles |
| Drawer content loading | Skeleton with pulse | Framer Motion `animate={{ opacity: [0.3, 0.6] }}` loop |
| Stat card loading | Number placeholder skeleton | Gray pill shapes matching value dimensions |
| Chart loading | Axis lines + wave placeholder | SVG skeleton with subtle wave animation |
| Full page loading | Globe wireframe animation | Low-poly sphere with rotating longitude lines |
| Search results loading | Staggered row skeletons | 5 rows fading in sequentially |

### 3.3 Scroll-Based Effects

| Location | Effect | Implementation |
|----------|--------|----------------|
| Market page district list | Parallax stat cards | `useScroll` + `useTransform` from Framer Motion |
| Parcel dossier sections | Fade-in sections on scroll | IntersectionObserver + Framer Motion `whileInView` |
| Activity feed infinite scroll | Load more on threshold | `useInView` hook + data fetch trigger |
| Compare page tables | Sticky header with blur | CSS `position: sticky` + backdrop-filter |

---

## 4. Feature Enhancements (UI-Driven)

### 4.1 Interactive 3D Globe Hero

**What:** Replace a static map load with an animated 3D globe as the entry point. The globe shows H3 cells colored by market activity. Users click a region to fly into it.

**Why:** The globe IS the product metaphor. "Globe Land Intelligence" must deliver on the name. A flat map on load is a broken promise. The globe creates instant differentiation and the wow moment.

**Implementation:** MapLibre GL JS globe projection (supported since v3) with custom H3 cell layers. CesiumJS only if true 3D terrain becomes a priority later.

**Engagement impact:** 3–5x longer first-session time based on analogous interactive map products. Users who engage with a 3D globe explore 2.5x more markets than flat-map users.

### 4.2 Real-Time Market Ticker

**What:** A horizontal scrolling ticker at the bottom of the viewport showing live market events: new listings, price drops, transactions recorded, permits filed.

**Why:** Creates urgency and recurrence. Users return to "check the ticker." It signals that the platform is alive and constantly updating — critical for a data-intelligence product.

**Implementation:** WebSocket/SSE feed rendering `<TickerItem>` components in a CSS `translateX` animation loop. Pause on hover. Click to navigate to the event source.

### 4.3 Market Heatmap Dashboard

**What:** A dashboard view (alternative to the globe) showing a grid of market cards with sparklines, sorted/filtered by activity, price change, inventory, or confidence.

**Why:** Not all users are spatial thinkers. Some want a Bloomberg-style grid of markets with sortable metrics. This serves the portfolio-manager persona alongside the explorer persona.

**Implementation:** CSS Grid of `<MarketCard>` components with embedded Recharts sparklines. Virtual scrolling for performance with 200+ markets.

### 4.4 Parcel Comparison Viewer

**What:** A split-screen or table comparison of 2–4 parcels with synchronized sections (price history, zoning, utilities, comps, confidence).

**Why:** The master plan defines compare mode but has no UI spec. Comparison is the highest-intent workflow — users comparing parcels are closest to a purchasing decision.

**Implementation:** Framer Motion `AnimatePresence` for adding/removing comparison columns. Synchronized scroll for side-by-side sections. Exportable to PDF.

### 4.5 Provenance Timeline

**What:** A visual timeline on every parcel page showing every data event: when it was listed, when the price changed, when a transaction recorded, when an estimate refreshed, source of each data point.

**Why:** The master plan's #1 principle is "explain uncertainty." A timeline is the most intuitive way to show data provenance. Users can see if a price is based on yesterday's listing or last year's sale.

**Implementation:** Custom SVG timeline component with Framer Motion staggered entry. Event nodes color-coded by price state. Hover to see source details.

### 4.6 Interactive Coverage Map

**What:** An overlay mode that shows data coverage quality across the globe — where parcel data exists (Tier C), where only market aggregates exist (Tier B), and where only indices exist (Tier A).

**Why:** The master plan emphasizes "never pretend coverage exists where it doesn't." A coverage overlay lets users self-discover where the platform is strong before they drill in and hit empty states.

**Implementation:** Three-layer MapLibre fill layer with opacity gradients. Toggle in the map layer controls.

### 4.7 Dark/Light Command Palette

**What:** A `Cmd+K` / `Ctrl+K` command palette for power users to jump to any market, parcel, saved search, or admin function.

**Why:** Professional users on Bloomberg-type products expect keyboard-first navigation. A command palette reduces time-to-content from 3+ clicks to 1 keystroke + type.

**Implementation:** Headless UI `Dialog` + `Combobox` with fuzzy search (Fuse.js). Results grouped by type (Markets, Parcels, Saved Searches, Actions). Integrates with the full-text search API.

---

## 5. Page-by-Page Redesign Plan

### 5.1 Globe / Explore Page (Entry Point)

**Current issues:** No implementation exists. The page is blank scaffolding.

**Proposed layout:**
- Full-bleed 3D globe projection filling the viewport
- Subtle gradient vignette at edges (darker corners) to create depth
- Top bar floating over the globe: translucent background with `backdrop-filter: blur(16px)`
- Search bar centered in top bar, prominent, with placeholder "Search any market, city, or parcel..."
- Floating legend in bottom-left showing the active metric (median price, activity score, etc.)
- Metric toggle pills floating bottom-center: Ask Price / Closed Price / Activity / Confidence
- H3 cells rendered as colored hexagons on the globe surface
- Hover on cell: tooltip with market name, metric value, coverage tier badge
- Click on cell: `flyTo` animation, transition to Market View

**Key components to build:**
- `<GlobeCanvas>` — MapLibre GL wrapper with globe projection config
- `<CellTooltip>` — Floating tooltip with market summary
- `<MetricToggle>` — Pill-group for switching displayed metric
- `<FloatingLegend>` — Color scale legend with min/max values
- `<CoverageBadge>` — Tier A/B/C indicator badge
- `<GlobalSearchBar>` — Autocomplete search with grouped results

### 5.2 Market View Page

**Current issues:** No implementation exists.

**Proposed layout:**
- Map canvas (70% width) showing listing clusters, district boundaries, overlay layers
- Right panel (30% width) with market summary: name, coverage tier, key metrics (median ask, median closed, inventory count, activity score)
- Below market summary: tabbed sections — Listings (list view), Districts (comparison cards), Trends (charts), Alerts (setup)
- Filter bar above the map: price range slider, size slider, use-class dropdown, tenure toggle, freshness filter, confidence filter
- Bottom ticker continues from globe view (context-filtered to this market)
- Drawn polygon tool in map toolbar for custom area analysis

**Key components to build:**
- `<MarketHeader>` — Name, tier badge, key stats row
- `<ListingCluster>` — Map marker for grouped listings with count
- `<DistrictCard>` — Compact card with district name, median price, trend sparkline
- `<FilterBar>` — Horizontal filter strip with range sliders and dropdowns
- `<TrendChart>` — Recharts area chart for price/inventory trends
- `<PolygonTool>` — MapLibre draw control wrapper
- `<MapListToggle>` — Switch between map-dominant and list-dominant views

### 5.3 Parcel Dossier Page / Drawer

**Current issues:** No implementation exists.

**Proposed layout:**
- Opens as a right drawer (400px) on parcel selection, expandable to full page
- Header: parcel title/address, availability badge, price state chips (ask: $X, closed: $Y, estimate: $Z), freshness chip, confidence bar
- Section 1 — Map: mini-map showing parcel outline with nearby comps highlighted
- Section 2 — Price History: timeline chart showing all price events over time, color-coded by price state
- Section 3 — Zoning & Permitted Use: structured data table with use-class tags
- Section 4 — Utilities & Access: checklist-style display (water, power, road, etc.)
- Section 5 — Nearby Comps: horizontal scroll of comp cards with distance, price, similarity score
- Section 6 — Provenance: source timeline, last updated, source badges
- Action bar (sticky bottom): Save to Watchlist, Add to Compare, Set Alert, Export

**Key components to build:**
- `<ParcelDrawer>` — Slide-in panel with expandable mode
- `<PriceStateChips>` — Colored chip row showing ask/closed/estimate values
- `<ConfidenceBar>` — Horizontal progress bar with score and color
- `<FreshnessChip>` — Compact chip showing update recency
- `<PriceTimeline>` — SVG timeline with event nodes
- `<CompCard>` — Compact card for comparable parcels
- `<ProvenancePanel>` — Source attribution and timeline
- `<ParcelActionBar>` — Sticky bottom action row

### 5.4 Compare Page

**Current issues:** No implementation exists.

**Proposed layout:**
- Full-width table/grid with 2–4 parcel columns
- Sticky left column with row labels (price, size, zoning, confidence, freshness, etc.)
- Each column header: parcel thumbnail map + name + remove button
- Rows grouped by category: Pricing, Location, Zoning, Utilities, Data Quality
- Highlighted cells for "best" value in each row (lowest price, highest confidence, etc.)
- Bottom bar: "Add Parcel" button, "Export Comparison" button, "Save as Watchlist" button

**Key components to build:**
- `<CompareGrid>` — Responsive comparison table
- `<CompareColumnHeader>` — Parcel thumbnail + meta
- `<HighlightCell>` — Cell with conditional best-value highlighting
- `<AddParcelButton>` — Opens search to add parcels to comparison

### 5.5 Watchlist / Portfolio Page

**Current issues:** No implementation exists.

**Proposed layout:**
- Left column: list of saved watchlists/searches (grouped by type: Parcels, Markets, Polygons, Searches)
- Main area: selected watchlist items as cards with current status, last change event, sparkline trend
- Each card shows: name, current price state, change since save date, freshness, alert status
- Top-right: "Create Alert" bulk action, "Export" action
- Empty state: illustration of a globe with a pin, "Start watching markets to see them here" prompt

**Key components to build:**
- `<WatchlistSidebar>` — Grouped list of saved items
- `<WatchlistCard>` — Item card with status, change indicator, sparkline
- `<ChangeIndicator>` — Green up-arrow / red down-arrow with percentage
- `<EmptyState>` — Illustrated placeholder for empty views

### 5.6 Admin Console Pages

**Current issues:** Scaffolded but empty.

**Proposed layout (Ingestion Monitor):**
- Dashboard grid of source health cards: source name, last success timestamp, row delta, quality score, status badge (active/stale/blocked)
- Click card to drill into job history: table of recent jobs with status, duration, row count, error summary
- Alert banner at top for sources exceeding freshness SLA
- Light mode default (extended-use operations interface)

**Key components to build:**
- `<SourceHealthCard>` — Status card with traffic-light indicator
- `<JobHistoryTable>` — Sortable table of ingestion runs
- `<QualityScoreBadge>` — Color-coded quality indicator
- `<StaleSourceAlert>` — Prominent banner for degraded sources

---

## 6. Tech Stack Recommendations

### 6.1 Frontend Framework

**Keep: Next.js + React + TypeScript** — The monorepo is already configured for this and it's the right choice. No framework change needed.

**Add: React Server Components (RSC)** — Use RSC for data-heavy pages (market summaries, admin dashboards) to reduce client JavaScript. Keep the map canvas and interactive drawers as client components.

### 6.2 UI Libraries

| Library | Version | Purpose |
|---------|---------|---------|
| **Tailwind CSS v4** | Latest | Utility-first styling, design token integration via CSS custom properties |
| **Radix UI Primitives** | Latest | Accessible, unstyled primitives for Dialog, Dropdown, Tooltip, Tabs, Select |
| **shadcn/ui** | Latest | Pre-built Radix + Tailwind components as copy-paste source (not a dependency) |
| **Recharts** | 2.x | Sparklines, area charts, bar charts for trend data |
| **MapLibre GL JS** | 4.x | Production map rendering with globe projection |
| **Framer Motion** | 11.x | Layout animations, presence animations, spring physics |
| **cmdk** | Latest | Command palette (`Cmd+K`) |
| **TanStack Table** | 8.x | Headless table primitives for data grids and comparison |
| **TanStack Query** | 5.x | Server state management, caching, optimistic updates |
| **Zustand** | 4.x | Lightweight client state (map state, UI state, filter state) |
| **Fuse.js** | 7.x | Client-side fuzzy search for command palette |
| **date-fns** | 3.x | Date formatting with locale support |
| **Noto Sans** | Variable | Multilingual map labels (Google Fonts) |

### 6.3 Animation Tools

| Tool | Use Case |
|------|----------|
| **Framer Motion** | All UI animations (drawers, modals, cards, charts, skeletons) |
| **MapLibre transitions** | Map camera (`flyTo`, `easeTo`), layer opacity/color transitions |
| **CSS transitions** | Simple hover effects, color changes, opacity fades |
| **CSS @keyframes** | Skeleton shimmer, ticker scroll, continuous rotations |
| **Lottie (optional)** | Complex illustrations for empty states and onboarding |

### 6.4 Performance Considerations

| Concern | Mitigation |
|---------|------------|
| Map bundle size | Lazy-load MapLibre GL only when map component enters viewport |
| Font loading | `font-display: swap` + preload Inter variable font subset |
| Chart rendering | Lazy-load Recharts per chart; use SVG sparklines for inline use |
| Image assets | Next.js `Image` component with WebP + AVIF format negotiation |
| Large data lists | Virtual scrolling via TanStack Virtual for 500+ item lists |
| Globe initial load | Progressive: render wireframe → load tiles → show cells |
| Right drawer | `AnimatePresence` with `exit` to unmount off-screen content |
| Filter queries | Debounce 300ms + TanStack Query stale-while-revalidate |
| Bundle splitting | Route-based code splitting (Next.js automatic) + dynamic imports for heavy components |
| Tile caching | Service worker for vector tile caching, `Cache-Control` headers on tile endpoints |

---

## 7. Implementation Roadmap

### Phase 1: Quick Wins (Weeks 1–3)

**Goal:** Establish visual foundation and make the skeleton feel like a product.

| Task | Effort | Priority | Description |
|------|--------|----------|-------------|
| **Design tokens setup** | 2 days | P0 | Create `packages/ui/tokens.css` with all color, type, spacing tokens from Section 2 |
| **Tailwind config** | 1 day | P0 | Configure `tailwind.config.ts` to consume design tokens, add custom utilities |
| **Font loading** | 0.5 day | P0 | Set up Inter (variable), JetBrains Mono, Noto Sans with proper loading strategy |
| **App shell layout** | 3 days | P0 | Build `<AppShell>` with sidebar, top bar, map canvas area, right drawer slot, bottom panel |
| **Core atoms** | 3 days | P0 | Build: Button, Badge, Chip, Input, Select, Tooltip, Skeleton, Spinner |
| **Price-state components** | 2 days | P0 | Build: `<PriceChip>`, `<FreshnessChip>`, `<ConfidenceBadge>`, `<CoverageBadge>` |
| **Dark theme** | 1 day | P0 | Apply dark tokens globally, test all components in dark mode |
| **Command palette** | 1.5 days | P1 | Integrate `cmdk` with placeholder search, group navigation |
| **Loading skeletons** | 1 day | P1 | Create skeleton variants for stat cards, list rows, chart placeholders |
| **Empty states** | 1 day | P1 | Design and build empty state illustrations for major views |

**Deliverable:** A visually complete shell with dark theme, tokens, and core components. Opening the app looks professional even without data.

### Phase 2: Core Redesign (Weeks 4–8)

**Goal:** Build the hero views — globe, market, and parcel pages — with real data integration.

| Task | Effort | Priority | Description |
|------|--------|----------|-------------|
| **Globe canvas** | 5 days | P0 | MapLibre GL with globe projection, H3 cell rendering, flyTo transitions |
| **Cell tooltip** | 1 day | P0 | Hover tooltip showing market name, metric, tier badge |
| **Metric toggle** | 1 day | P0 | Pill group switching between ask/closed/activity/confidence layers |
| **Floating legend** | 1 day | P0 | Color scale legend synced to active metric |
| **Market page layout** | 3 days | P0 | Map + right panel, filter bar, tabbed content |
| **Listing clusters** | 2 days | P0 | MapLibre marker clusters with count, hover expansion |
| **District cards** | 2 days | P1 | Grid of district summary cards with sparklines |
| **Filter bar** | 3 days | P0 | Range sliders, dropdowns, chips, debounced query updates |
| **Parcel drawer** | 4 days | P0 | Slide-in drawer with all dossier sections |
| **Price timeline** | 3 days | P0 | SVG event timeline for parcel history |
| **Stat cards** | 2 days | P0 | Composable stat card with value, trend, sparkline, provenance |
| **Trend charts** | 2 days | P1 | Recharts area charts for market and parcel trends |
| **Responsive layout** | 3 days | P1 | Mobile bottom sheet, tablet overlay drawer, breakpoint handling |

**Deliverable:** Globe-to-market-to-parcel flow is complete, visually polished, and responsive. The hero user journey works end-to-end.

### Phase 3: Advanced Interactions & Polish (Weeks 9–12)

**Goal:** Add the features that create delight, recurrence, and professional-grade UX.

| Task | Effort | Priority | Description |
|------|--------|----------|-------------|
| **Real-time ticker** | 3 days | P1 | WebSocket-fed ticker with event cards, pause-on-hover |
| **Compare view** | 4 days | P1 | Side-by-side parcel comparison with synced sections |
| **Watchlist UI** | 3 days | P1 | Saved items, change indicators, quick-alert creation |
| **Coverage overlay** | 2 days | P1 | Toggle layer showing Tier A/B/C coverage quality |
| **Polygon draw tool** | 2 days | P2 | Draw custom area, compute aggregated stats |
| **Time slider** | 3 days | P2 | Historical playback of market data on the map |
| **Animation polish** | 3 days | P1 | Framer Motion spring tuning, stagger effects, entry animations |
| **Admin ingestion dashboard** | 4 days | P2 | Source health cards, job drill-down, quality scores |
| **Admin review queues** | 3 days | P2 | Dedupe, geocoding, policy review interfaces |
| **Accessibility audit** | 2 days | P1 | Keyboard nav, screen reader, contrast checks, ARIA labels |
| **RTL support** | 2 days | P2 | Logical CSS properties, bidirectional layout testing |
| **Performance audit** | 2 days | P1 | Lighthouse, bundle analysis, lazy loading verification |
| **i18n foundation** | 2 days | P2 | next-intl setup, locale-aware formatting, RTL-ready |

**Deliverable:** Full interactive product with real-time features, comparison workflows, watchlists, admin tooling, and accessibility compliance.

---

## Appendix A: Component Inventory

### Atoms (Standalone, No Business Logic)

`Button`, `IconButton`, `Badge`, `Chip`, `Tag`, `Input`, `Select`, `Slider`, `RangeSlider`, `Toggle`, `Checkbox`, `Radio`, `Tooltip`, `Skeleton`, `Spinner`, `Avatar`, `Divider`, `ProgressBar`

### Molecules (Composed Atoms, Light Business Logic)

`PriceChip`, `FreshnessChip`, `ConfidenceBadge`, `CoverageBadge`, `StatCard`, `SparklineCard`, `SearchBar`, `FilterChip`, `FilterGroup`, `TickerItem`, `TimelineNode`, `CompCard`, `SourceBadge`

### Organisms (Full Business Components)

`AppShell`, `Sidebar`, `TopBar`, `RightDrawer`, `BottomPanel`, `GlobeCanvas`, `MarketMap`, `FilterBar`, `ParcelDossier`, `PriceTimeline`, `TrendChart`, `CompareGrid`, `WatchlistSidebar`, `TickerTape`, `CommandPalette`, `AlertCreator`

### Pages

`/` — Globe / Explore
`/market/[code]` — Market View
`/parcel/[id]` — Parcel Dossier (full page)
`/compare` — Comparison View
`/watchlist` — Watchlist / Portfolio
`/alerts` — Alert Management
`/admin` — Admin Dashboard
`/admin/sources` — Source Health
`/admin/review` — Review Queues
`/admin/markets` — Market Onboarding

---

## Appendix B: Design Token File Structure

```
packages/ui/
├── tokens/
│   ├── colors.css          # All color tokens (dark + light mode)
│   ├── typography.css       # Font families, sizes, weights, line heights
│   ├── spacing.css          # Spacing scale
│   ├── layout.css           # Breakpoints, panel widths, z-indexes
│   ├── shadows.css          # Elevation shadows
│   ├── animations.css       # Transition durations, easing curves
│   └── index.css            # Imports all token files
├── components/
│   ├── atoms/               # Button, Badge, Chip, etc.
│   ├── molecules/           # StatCard, PriceChip, etc.
│   └── organisms/           # AppShell, GlobeCanvas, etc.
├── hooks/
│   ├── useMediaQuery.ts
│   ├── useDrawer.ts
│   └── useMapState.ts
└── index.ts                 # Public exports
```

---

## Appendix C: Key Animation Easing Curves

| Name | Value | Usage |
|------|-------|-------|
| `ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | Elements entering (drawers opening, cards appearing) |
| `ease-in` | `cubic-bezier(0.7, 0, 0.84, 0)` | Elements exiting (drawers closing, items removing) |
| `ease-in-out` | `cubic-bezier(0.87, 0, 0.13, 1)` | State changes (toggle, tab switch) |
| `spring` | `{ type: "spring", stiffness: 300, damping: 30 }` | Framer Motion layout animations |
| `bounce` | `{ type: "spring", stiffness: 400, damping: 15 }` | Attention-drawing elements (new alert badge) |

---

## Appendix D: Competitive Reference Points

| Product | What to Learn | What to Avoid |
|---------|---------------|---------------|
| **Mapbox Studio** | Smooth map transitions, layer controls, dark UI | Complexity of style editor for non-dev users |
| **Bloomberg Terminal** | Information density, color coding, ticker behavior | Visual austerity that alienates non-finance users |
| **Linear** | Dark mode execution, command palette, keyboard shortcuts | Over-minimalism for data-heavy contexts |
| **Vercel Dashboard** | Loading states, real-time deployment status, clean grids | Sparse data density — Globe needs more per-screen |
| **Figma** | Multi-panel layout, inspector drawer, zoom behavior | Canvas-centric model doesn't apply to map products |
| **Stripe Dashboard** | Chart design, stat card layout, status badges | Light-mode bias; Globe's dark mode is primary |

---

*End of plan. This document is designed to be printed, assigned to engineers, and executed in sprints. Every section is actionable. No fluff.*
