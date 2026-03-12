# Worldwide Land Intelligence Platform — Master Build Plan for Codex

## Document purpose

This document is the execution-grade blueprint for building a **worldwide land-intelligence website** with an interactive globe, market views, parcel views, availability tracking, pricing intelligence, watchlists, and market-specific data depth.

It is intentionally written so a coding agent can use it as a build backlog. Each task includes:
- objective
- why it matters
- dependencies
- detailed implementation steps
- deliverables
- acceptance criteria
- a Codex-friendly prompt seed

This plan assumes:
- **worldwide coverage is delivered in layers**, not all at the same fidelity on day one
- the product distinguishes **ask**, **closed**, **estimate**, and **broker-verified** prices
- every visible datum carries **source, freshness, and confidence**
- parcel-level depth is enabled only where licensing, geometry quality, and legal display rules permit it

---

## 1. Product definition

### 1.1 What this product is

A **global land-intelligence platform** that lets users:
- explore land markets on an interactive globe
- understand where plots are available
- compare active asking prices, recorded transactions, and modeled estimates
- inspect parcel-level details where data quality permits
- save markets and custom geographies
- receive alerts for new plots, price cuts, status changes, and nearby planning or zoning signals

### 1.2 What “worldwide” should mean in v1

Do **not** define worldwide as “parcel-level live data in every country.”

Define worldwide with three explicit coverage tiers:

#### Coverage Tier A — Global visibility
Available across the world.
- hex / grid aggregation
- country / region / city summaries
- market activity score
- benchmark pricing where possible
- coverage badges
- freshness and confidence badges

#### Coverage Tier B — Market depth
Available in markets with better structured sources.
- city / district / neighborhood drill-down
- active inventory clusters
- recent transactions
- planning / permit / zoning overlays
- better comp selection

#### Coverage Tier C — Parcel depth
Available only in licensed, geometry-clean, legally cleared markets.
- parcel outlines
- parcel dossier
- parcel history
- nearby comps
- broker / developer verification
- alerting at parcel or polygon level

This avoids pretending that all markets are equal.

### 1.3 Core product principles

1. **Never show one undifferentiated price.**
2. **Always separate active listings from closed transactions.**
3. **Always show freshness, source, and confidence.**
4. **Worldwide map first, market truth second, parcel truth last.**
5. **At low zoom, use aggregated cells; at high zoom, use boundaries and listings.**
6. **No market should go live until legal display rules are documented.**
7. **Do not depend on public OSM tiles in production.**
8. **Every market adapter must define units, currency, tenure model, zoning mapping, freshness, and licensing.**
9. **Every data source must have lineage and a display policy.**
10. **The UI must explain uncertainty instead of hiding it.**

---

## 2. Improvements required over the original concept

The original concept is strong, but a worldwide product needs these additions before build-out:

### 2.1 Coverage-model improvement
Add global coverage tiers so users understand where the platform has summary-only data versus parcel-grade detail.

### 2.2 Licensing improvement
Every source must be classified by:
- acquisition type
- usage rights
- attribution requirements
- commercial restrictions
- redistribution limits
- expiration / renewal owner

### 2.3 Provenance improvement
Every price, plot, and overlay needs:
- source id
- source name
- ingestion timestamp
- observed timestamp
- effective date
- transformation version
- confidence score
- display label

### 2.4 Canonical identity improvement
Create stable internal IDs for:
- parcel
- listing
- transaction
- project
- broker
- developer
- permit
- administrative geography

### 2.5 Global normalization improvement
Normalize:
- currencies
- land units
- address formats
- land tenure models
- zoning vocabularies
- status labels
- date/time handling

### 2.6 Reliability improvement
Build ingestion as a platform, not custom scripts per market.

### 2.7 Market-operations improvement
Add admin tooling for manual review, source health, dedupe resolution, and broker verification.

### 2.8 UX improvement
Make uncertainty visible:
- freshness chips
- confidence bars
- coverage badges
- “why this estimate” explanation
- source timeline

### 2.9 Search improvement
Search must support:
- country
- city
- district
- parcel id
- project
- broker
- developer
- coordinates
- saved polygons
- internal source ids

### 2.10 Performance improvement
Globe rendering, tile generation, and high-cardinality filters must be designed from day one for world-scale data.

### 2.11 Internationalization improvement
Support multilingual names, regional formatting, and RTL early.

### 2.12 Compliance improvement
Some jurisdictions restrict:
- parcel display
- ownership display
- broker data usage
- transaction redistribution
- scraping
- public price disclosure

This must be modeled as a first-class system, not a legal side note.

---

## 3. Recommended architecture

## 3.1 Frontend
Use:
- **Next.js + React + TypeScript** for the main product app
- **MapLibre GL JS** for the fast open-source production map stack
- a **CesiumJS-based premium / lab viewer** only if the globe itself becomes the hero differentiator
- a shared design system and component library

Why:
- TypeScript keeps frontend and API contracts aligned
- MapLibre supports globe examples, heatmaps on globe, time sliders, clusters, and custom globe layers
- CesiumJS is stronger if the product eventually becomes deeply 3D and globe-native

## 3.2 Backend
Use:
- **PostgreSQL + PostGIS** as the system of record for spatial and transactional data
- **Redis** for hot cache, proximity helpers, queues, and rate limiting
- **OpenSearch or Elasticsearch** for full-text and geo-shape search
- **S3-compatible object storage** for raw dumps, normalized snapshots, vector tiles, and exports
- **Python services** for ETL, valuation, geospatial transformations, and modeling
- **TypeScript services** for public APIs, auth, app orchestration, and real-time delivery

## 3.3 Map data and tiles
Use:
- global foundational map data from open / licensed sources
- Overture / OSM-derived or licensed basemap inputs
- internal vector tiles for:
  - H3 market cells
  - parcel outlines
  - planning overlays
  - admin boundaries
  - market activity layers

## 3.4 Delivery model
Use a monorepo:
- `apps/web`
- `apps/admin`
- `apps/api`
- `services/ingestion`
- `services/valuation`
- `packages/ui`
- `packages/geo`
- `packages/types`
- `packages/config`
- `infra`
- `db`
- `docs`

## 3.5 Real-time model
Use:
- event-driven updates for source ingestion
- streaming change feed for user-facing tickers and alerts
- incremental re-computation for cells, rankings, and watchlist deltas
- WebSockets or SSE for live UI updates
- optional Supabase Realtime or equivalent only where it speeds early development

---

## 4. Canonical data model

The platform should revolve around these entities.

### 4.1 Geography entities
- country
- region
- city
- district
- neighborhood
- market area
- custom polygon
- H3 cell
- map tile feature

### 4.2 Land entities
- parcel
- parcel geometry
- parcel attributes
- parcel legal / zoning summary
- parcel utilities / access summary
- parcel media / docs
- parcel state history

### 4.3 Market entities
- listing
- listing price event
- transaction
- valuation estimate
- market index observation
- comp candidate
- project / development
- permit / planning event
- broker
- developer
- source record
- source dataset
- source license

### 4.4 User entities
- user
- organization
- team
- role
- watchlist
- saved search
- alert rule
- comparison set
- notification endpoint
- audit event

### 4.5 Required metadata on every observable object
- `source_id`
- `source_type`
- `license_id`
- `observed_at`
- `ingested_at`
- `effective_at`
- `freshness_tier`
- `confidence_score`
- `visibility_policy`
- `market_code`
- `canonical_id`
- `dedupe_cluster_id`

---

## 5. Freshness, confidence, and price-state framework

## 5.1 Price states
Every property card, market card, and parcel page must classify prices into one of:

- **Ask** — currently advertised listing or broker inventory
- **Closed** — officially recorded transaction
- **Estimate** — modeled value from comps and market context
- **Broker-verified** — off-platform quote confirmed by a trusted human workflow

## 5.2 Freshness tiers
Use a consistent freshness vocabulary:
- live
- same day
- daily
- weekly
- monthly
- archive

## 5.3 Confidence scoring
Use a 0–100 confidence score derived from:
- source authority
- recency
- geometry quality
- duplicate resolution certainty
- comp count
- distance to comps
- zoning / use match quality
- market volatility
- human verification status

## 5.4 Display rules
- Never mix ask and closed values into one chart without a legend.
- Never show an estimate as if it were a recorded sale.
- Never show parcel geometry without geometry confidence.
- Always display the source and last updated date.

---

## 6. Worldwide rollout model

## 6.1 Launch order
Worldwide should be built as:
1. global aggregated view
2. high-quality pilot markets
3. regional expansion
4. long-tail source adapters

## 6.2 Recommended pilot markets
Start with:
- **Dubai / UAE**
- **England & Wales**
- **Singapore**

Reason:
- Dubai Land Department exposes multiple real estate datasets including transactions, valuations, land, broker, and developer data.
- HM Land Registry publishes Price Paid Data and updates monthly.
- Singapore URA publishes structured property statistics and indices, though not parcel-live.

## 6.3 Market onboarding requirement
No new market can go live until this checklist passes:
- source licensing approved
- attribution and display rules documented
- data quality benchmark met
- unit / currency mapping complete
- tenure model mapped
- zoning taxonomy mapped
- freshness rules set
- confidence rules set
- sample UI reviewed
- support / ops owner assigned

---

## 7. Codex working model for this repo

This project should be set up to work well with a coding agent.

## 7.1 Codex repo rules
Create:
- root `AGENTS.md`
- `.codex/config.toml`
- `docs/architecture/`
- `docs/runbooks/`
- `docs/task-briefs/`
- a reusable issue / task template

## 7.2 Prompt structure for every task
Use this shape for Codex tasks:

- **Goal**
- **Context**
- **Constraints**
- **Done when**

## 7.3 Task sizing
Prefer:
- one architecture or data model change per task
- one UI slice per task
- one source connector per task
- one verification story per task

Avoid giant prompts like “build the whole app.”

## 7.4 Verification rule
Every task should require:
- tests
- lint / type check
- docs update where relevant
- screenshots for UI work
- seed data or fixtures where relevant

---

# 8. Detailed build backlog

---

## EPIC 0 — Program setup, architecture, and Codex readiness

### TASK E0-T01 — Define worldwide coverage tiers and market-grade policy

**Objective**  
Create the product policy that defines worldwide coverage levels, what each level can display, and what is prohibited at each level.

**Why it matters**  
Without this, the team will accidentally build a misleading product that implies parcel-grade truth everywhere.

**Depends on**  
None.

**Detailed implementation steps**
1. Define the three coverage tiers: global visibility, market depth, parcel depth.
2. For each tier, specify:
   - supported features
   - prohibited features
   - required badges
   - minimum freshness
   - required confidence threshold
3. Add a `coverage_tier` enum to the core domain language.
4. Write examples for:
   - country with index-only data
   - city with listing + transaction data
   - parcel-enabled market
5. Define UI fallback behavior when a user zooms into a region with no parcel-grade coverage.

**Deliverables**
- `docs/product/coverage-model.md`
- `docs/product/coverage-examples.md`
- enum definitions in shared types

**Acceptance criteria**
- every market can be assigned a coverage tier
- design and engineering can point to one policy for what is shown
- low-confidence data is downgraded automatically

**Codex prompt seed**  
Implement the worldwide coverage policy, create shared enums and docs, and add examples for global-only, market-depth, and parcel-depth regions.

---

### TASK E0-T02 — Bootstrap the monorepo and engineering standards

**Objective**  
Create the repository structure, package boundaries, shared tooling, and engineering conventions.

**Why it matters**  
The project will span frontend, API, geospatial ETL, valuation, admin tools, and infrastructure. A clean monorepo prevents fragmentation.

**Depends on**  
E0-T01.

**Detailed implementation steps**
1. Initialize the monorepo with:
   - `apps/web`
   - `apps/admin`
   - `apps/api`
   - `services/ingestion`
   - `services/valuation`
   - `packages/ui`
   - `packages/geo`
   - `packages/types`
   - `packages/config`
   - `db`
   - `infra`
   - `docs`
2. Set up TypeScript, Python tooling, linting, formatting, and pre-commit checks.
3. Add environment variable schema validation.
4. Add conventional commit guidance and changelog tooling.
5. Add a local compose stack for Postgres/PostGIS, Redis, OpenSearch, and object storage emulator.

**Deliverables**
- monorepo skeleton
- root package scripts
- local development environment
- contributor docs

**Acceptance criteria**
- fresh clone boots locally
- common scripts exist for lint, test, dev, type-check
- services can be started independently

**Codex prompt seed**  
Scaffold the monorepo for web, admin, API, ingestion, valuation, shared packages, database, infra, and docs with runnable local development tooling.

---

### TASK E0-T03 — Add `AGENTS.md`, `.codex/config.toml`, and task templates

**Objective**  
Configure the repository so Codex can work consistently and safely.

**Why it matters**  
The build will be long-running and multi-step. The repository needs persistent agent instructions.

**Depends on**  
E0-T02.

**Detailed implementation steps**
1. Create root `AGENTS.md` with:
   - repo layout
   - build and test commands
   - branch and PR rules
   - security rules
   - no-shortcuts rules for pricing, provenance, and legal display
2. Add `.codex/config.toml` with sane defaults for reasoning, approvals, and task profiles.
3. Create a `docs/task-template.md` using Goal / Context / Constraints / Done when.
4. Create subdirectory `AGENTS.md` files for `services/ingestion` and `apps/web` if those workflows differ.
5. Add a `docs/review-checklist.md`.

**Deliverables**
- `AGENTS.md`
- `.codex/config.toml`
- task and review templates

**Acceptance criteria**
- a coding agent can infer how to work in the repo without extra setup
- every major directory has clear build instructions
- review expectations are documented

**Codex prompt seed**  
Create repo-level Codex guidance files, including AGENTS.md, config, and reusable task templates, with strong rules around provenance, tests, and market-safe data display.

---

### TASK E0-T04 — Record architecture decisions as ADRs

**Objective**  
Create written architecture decisions for mapping, storage, search, real-time delivery, and valuation.

**Why it matters**  
This project will evolve across markets and teams. ADRs reduce thrash and hidden assumptions.

**Depends on**  
E0-T02.

**Detailed implementation steps**
1. Write ADRs for:
   - MapLibre-first map stack
   - optional Cesium premium viewer
   - PostGIS as source of truth
   - H3 as aggregation index
   - OpenSearch / Elasticsearch for full-text + geo-shape search
   - object storage for raw and tile artifacts
   - Python for ETL and valuation
2. Document alternatives considered and tradeoffs.
3. Add decision status and revisit criteria.
4. Link ADRs from `AGENTS.md`.

**Deliverables**
- `docs/architecture/adr-*.md`

**Acceptance criteria**
- new engineers can understand why key stack choices were made
- every high-risk technology choice has a written rationale

**Codex prompt seed**  
Write ADRs for map stack, geospatial storage, aggregation index, search, data processing, and real-time architecture.

---

## EPIC 1 — Product design system and UX foundations

### TASK E1-T01 — Define the global information architecture

**Objective**  
Design the navigation and primary information hierarchy for the product.

**Why it matters**  
Without a clear information model, the site becomes a map toy instead of a working intelligence tool.

**Depends on**  
E0-T01.

**Detailed implementation steps**
1. Define top-level product areas:
   - Explore
   - Markets
   - Parcels
   - Compare
   - Watchlists
   - Alerts
   - Admin
2. Define route structure and URL patterns.
3. Define the object hierarchy from globe -> country -> region -> city -> district -> parcel.
4. Define common shared panels and drawers.
5. Define empty states for markets with only Tier A coverage.

**Deliverables**
- `docs/product/information-architecture.md`
- sitemap
- route schema draft

**Acceptance criteria**
- every major user action has a home
- route design is stable enough for implementation
- coverage tiers map cleanly to pages and panels

**Codex prompt seed**  
Create the route schema, object hierarchy, and information architecture for globe, market, parcel, compare, watchlist, and admin sections.

---

### TASK E1-T02 — Build the design system for a dark “market monitor” interface

**Objective**  
Create the UI system for a globe-first, data-dense, dark interface.

**Why it matters**  
The visual language is central to trust and usability. It must feel live without becoming noisy.

**Depends on**  
E0-T02, E1-T01.

**Detailed implementation steps**
1. Define design tokens:
   - spacing
   - typography
   - elevation
   - color semantics
   - status colors
2. Add semantic color mapping for:
   - ask
   - closed
   - estimate
   - broker-verified
   - freshness
   - confidence
   - risk
3. Build reusable components:
   - chip
   - legend
   - stat card
   - drawer
   - filter group
   - ticker row
   - provenance badge
   - sparkline panel
4. Define mobile, tablet, and desktop layout rules.

**Deliverables**
- `packages/ui`
- token files
- Storybook or equivalent
- visual spec docs

**Acceptance criteria**
- common states render consistently across web and admin
- confidence and freshness semantics are visible and accessible
- dark mode is first-class, not an afterthought

**Codex prompt seed**  
Implement the shared design system for a dark, data-heavy market-monitor UI with status chips, provenance badges, legends, drawers, and responsive layout primitives.

---

### TASK E1-T03 — Specify globe, market, and parcel interactions

**Objective**  
Turn the high-level product idea into concrete interaction rules.

**Why it matters**  
The product relies on transitions between scales; sloppy transitions will make the experience feel confusing.

**Depends on**  
E1-T01, E1-T02.

**Detailed implementation steps**
1. Define zoom breakpoints for:
   - globe cells
   - regional clusters
   - neighborhood overlays
   - parcel outlines
2. Define behavior for:
   - click
   - hover
   - selection
   - multi-select
   - compare mode
   - drawn polygon mode
3. Define transition logic between globe and flat map if needed.
4. Define the rules for preserving filters while zooming.
5. Define how the right drawer changes across object types.

**Deliverables**
- `docs/product/interaction-model.md`
- zoom-level spec
- filter persistence rules

**Acceptance criteria**
- every zoom range has a clear visualization mode
- filter state survives navigation as expected
- the drawer behavior is deterministic

**Codex prompt seed**  
Document and implement the interaction contract for globe cells, market clusters, parcel outlines, selection, hover, compare mode, and right-drawer behavior.

---

### TASK E1-T04 — Design search, filters, compare, and watchlist flows

**Objective**  
Define the core investor workflow beyond the map canvas.

**Why it matters**  
Most real users will search, filter, compare, save, and alert more often than they will free-explore the globe.

**Depends on**  
E1-T01, E1-T03.

**Detailed implementation steps**
1. Define filter model:
   - price
   - price / area
   - plot size
   - use class
   - freehold / leasehold
   - freshness
   - confidence
   - availability
   - hazard exposure
   - proximity
2. Define compare mode for:
   - parcels
   - districts
   - cities
3. Define watchlist flows:
   - save geography
   - save polygon
   - save parcel
   - save search
4. Define alert creation rules and preview.

**Deliverables**
- `docs/product/search-and-alerts.md`
- filter schema
- compare data model draft

**Acceptance criteria**
- filter behavior is well-defined for all object types
- compare and watchlist objects share a consistent model
- alert rules can be derived from saved views

**Codex prompt seed**  
Design the filter, compare, watchlist, and alert flows for land markets, including parcel, geography, and polygon save states.

---

## EPIC 2 — Geospatial foundation and map infrastructure

### TASK E2-T01 — Implement the foundational basemap strategy

**Objective**  
Create the global map base layer strategy for production.

**Why it matters**  
A world-scale product cannot rely on public community tile servers or ad hoc map sources.

**Depends on**  
E0-T04.

**Detailed implementation steps**
1. Define the production basemap stack:
   - foundational open/licensed data
   - self-hosted or commercial tile delivery
   - attribution handling
2. Add internal support for:
   - roads
   - water
   - land use
   - boundaries
   - labels
3. Add a basemap abstraction layer so providers can be swapped without rewriting the app.
4. Add attribution rendering and provider policy docs.
5. Add dev-vs-prod provider switching.

**Deliverables**
- map provider abstraction
- basemap config
- attribution system
- docs on allowed providers

**Acceptance criteria**
- no production path depends on public OSM tiles
- attribution is always visible and correct
- providers can be swapped per environment

**Codex prompt seed**  
Build the basemap provider abstraction, attribution rendering, and production-safe map configuration with no dependence on public OSM tile infrastructure.

---

### TASK E2-T02 — Load global administrative boundaries and geography hierarchy

**Objective**  
Create the authoritative internal geography tree for countries, regions, cities, districts, and neighborhoods.

**Why it matters**  
All search, aggregation, permissions, reporting, and onboarding depend on a clean geography model.

**Depends on**  
E0-T01, E2-T01.

**Detailed implementation steps**
1. Ingest global geography boundaries and names.
2. Create canonical internal geography IDs.
3. Support multilingual names where available.
4. Build parent-child hierarchy tables.
5. Add logic for disputed or multiple-perspective boundary cases where required.
6. Create APIs for:
   - lookup by id
   - lookup by name
   - containment
   - child geographies
   - reverse-geography

**Deliverables**
- geography tables
- hierarchy tables
- geography API
- seed scripts

**Acceptance criteria**
- a lat/lng can be mapped to a geography stack
- every market can attach to a standard geography
- multilingual labels can be stored and returned

**Codex prompt seed**  
Create the global geography schema, ingestion scripts, hierarchy logic, and API endpoints for country-to-neighborhood navigation and reverse lookup.

---

### TASK E2-T03 — Implement H3-based world aggregation

**Objective**  
Build the cell-based aggregation layer for the globe and mid-zoom discovery views.

**Why it matters**  
World-scale parcel rendering is impossible at low zoom. Aggregated cells are the correct abstraction.

**Depends on**  
E2-T02.

**Detailed implementation steps**
1. Choose H3 resolutions for:
   - world zoom
   - continent
   - country
   - metro
   - neighborhood preview
2. Build cell assignment logic for:
   - points
   - parcel centroids
   - transaction observations
   - listing observations
3. Create aggregation jobs for:
   - price medians
   - availability score
   - activity velocity
   - freshness mix
   - confidence mix
4. Store pre-computed aggregates by time bucket.
5. Add drill-through from cell -> underlying records.

**Deliverables**
- H3 aggregation library
- precompute jobs
- aggregate tables
- drill-through APIs

**Acceptance criteria**
- globe view does not query raw listings or parcels directly
- cells can be recomputed incrementally
- multiple time windows are supported

**Codex prompt seed**  
Implement H3 aggregation for market metrics, with time-bucketed precomputes, drill-through, and multi-resolution support for world-to-neighborhood exploration.

---

### TASK E2-T04 — Build the vector tile pipeline

**Objective**  
Serve high-performance vector tiles for cells, boundaries, parcel outlines, and overlays.

**Why it matters**  
Performance and interactivity depend on predictable tile delivery, not ad hoc JSON payloads.

**Depends on**  
E2-T02, E2-T03.

**Detailed implementation steps**
1. Design tile schemas for:
   - H3 cells
   - admin boundaries
   - parcel outlines
   - planning overlays
   - hazard overlays
2. Decide which layers are:
   - generated from PostGIS on demand
   - prebuilt as static tilesets
3. Add cache keys, versioning, and invalidation logic.
4. Add tile debugging tools and sample inspector pages.
5. Ensure tiles omit protected fields and only expose render-safe properties.

**Deliverables**
- vector tile server or endpoints
- tile generation jobs
- tile schema docs
- debug viewer

**Acceptance criteria**
- tile response times meet performance budget
- protected fields never leak into tiles
- tiles are versioned and cache-safe

**Codex prompt seed**  
Build vector tile generation and serving for aggregated cells, parcel outlines, boundaries, and overlays, with schema docs and cache-safe versioning.

---

### TASK E2-T05 — Add map performance budgets and progressive disclosure

**Objective**  
Prevent the globe experience from collapsing under world-scale data density.

**Why it matters**  
Map performance problems are easy to create and hard to undo late.

**Depends on**  
E2-T03, E2-T04.

**Detailed implementation steps**
1. Set budgets for:
   - initial render
   - tile latency
   - drawer open latency
   - filter re-query latency
2. Define zoom thresholds and object caps.
3. Add progressive loading for:
   - labels
   - overlays
   - parcel outlines
   - high-cardinality clusters
4. Add automatic fallback from parcel outlines to centroids where needed.
5. Add frontend telemetry for FPS, memory, and large selection failures.

**Deliverables**
- performance budget doc
- instrumentation
- fallback rules
- guardrail utilities

**Acceptance criteria**
- world view remains interactive on target hardware
- over-zoomed datasets degrade gracefully
- performance regressions are measurable

**Codex prompt seed**  
Implement map performance budgets, progressive disclosure, telemetry, and graceful fallbacks for heavy parcel and overlay layers.

---

## EPIC 3 — Data platform, ingestion, and source management

### TASK E3-T01 — Build the source registry and licensing catalog

**Objective**  
Create the master registry of every data source and its display rights.

**Why it matters**  
A worldwide property product fails legally before it fails technically if licensing is not first-class.

**Depends on**  
E0-T01.

**Detailed implementation steps**
1. Create tables for:
   - source
   - dataset
   - refresh cadence
   - license
   - attribution text
   - allowed use
   - restrictions
   - renewal owner
2. Add status states:
   - proposed
   - approved
   - trial
   - active
   - blocked
   - retired
3. Link every ingested record back to source datasets.
4. Add admin CRUD for registry management.
5. Add “display blocked” logic for sources whose legal state changes.

**Deliverables**
- source registry schema
- admin CRUD
- display enforcement hooks

**Acceptance criteria**
- every record displayed in the product maps to a registry entry
- blocked sources disappear safely from user-facing surfaces
- attribution can be rendered per source

**Codex prompt seed**  
Implement the source registry, license catalog, attribution model, and display-enforcement logic so every record is traceable to an approved dataset.

---

### TASK E3-T02 — Create the raw ingestion framework

**Objective**  
Build a reusable ingestion framework for files, APIs, feeds, and partner uploads.

**Why it matters**  
Worldwide expansion requires connector reuse, not one-off scripts.

**Depends on**  
E0-T02, E3-T01.

**Detailed implementation steps**
1. Create a common ingestion contract:
   - source pull
   - raw snapshot
   - checksum
   - schema detection
   - parse
   - normalization
   - QA
   - publish
2. Support ingestion modes:
   - file download
   - API pull
   - SFTP / bucket import
   - manual upload
   - browser scrape only where legally allowed
3. Add idempotency, retries, dead-letter handling, and lineage.
4. Save all raw input artifacts to object storage.
5. Track job status and error summaries.

**Deliverables**
- ingestion framework package
- source connector interface
- job status tables
- lineage model

**Acceptance criteria**
- a new connector can be added with minimal custom code
- failed jobs can be retried safely
- raw source artifacts remain accessible for audit

**Codex prompt seed**  
Build a reusable ingestion pipeline framework with raw snapshots, checksums, schema detection, retries, lineage, and support for API, file, and partner-upload sources.

---

### TASK E3-T03 — Build the market adapter framework

**Objective**  
Define how each market plugs into the platform with its own rules and mappings.

**Why it matters**  
Markets differ in tenure, units, zoning, language, freshness, and source structure.

**Depends on**  
E3-T01, E3-T02.

**Detailed implementation steps**
1. Create a market adapter contract that requires:
   - market code
   - currency
   - unit system
   - tenure mapping
   - zoning mapping
   - source list
   - availability logic
   - freshness rules
   - confidence rules
   - legal display rules
2. Create adapters for:
   - Dubai / UAE
   - England & Wales
   - Singapore
3. Add market-specific data transforms and status mappings.
4. Add adapter tests using sample source fixtures.

**Deliverables**
- `market-adapters/`
- shared adapter interface
- first three market adapters
- tests and fixtures

**Acceptance criteria**
- onboarding a new market follows a predictable checklist
- market-specific rules are isolated from the global core
- adapters are testable independently

**Codex prompt seed**  
Create the market adapter framework and implement first adapters for Dubai, England/Wales, and Singapore with currency, unit, tenure, zoning, freshness, and display rules.

---

### TASK E3-T04 — Build bronze / silver / gold data layers

**Objective**  
Separate raw, normalized, and product-ready data states.

**Why it matters**  
This reduces accidental corruption and makes debugging data quality issues possible.

**Depends on**  
E3-T02.

**Detailed implementation steps**
1. Define layer semantics:
   - bronze = raw parsed records
   - silver = normalized market records
   - gold = canonical product entities
2. Create storage tables or schemas for each layer.
3. Add lineage columns from gold -> silver -> bronze -> raw artifact.
4. Add snapshot versioning and replay capability.
5. Add data diff utilities between snapshots.

**Deliverables**
- layered schemas
- versioning rules
- replay tooling

**Acceptance criteria**
- canonical entities can be traced to source rows
- data regressions can be debugged from historical snapshots
- gold-layer tables are safe for product queries

**Codex prompt seed**  
Implement bronze, silver, and gold data layers with lineage, snapshot versioning, and replay utilities for debugging and product safety.

---

### TASK E3-T05 — Implement data quality rules and anomaly detection

**Objective**  
Detect bad prices, impossible geometries, broken addresses, duplicate bursts, and stale feeds.

**Why it matters**  
Property data is messy. Data quality must be systematic.

**Depends on**  
E3-T02, E3-T04.

**Detailed implementation steps**
1. Create rule categories:
   - schema validity
   - required fields
   - geometry validity
   - price sanity
   - unit sanity
   - duplicate density
   - freshness drift
   - source outage
2. Add hard-fail and soft-warn severities.
3. Add anomaly checks such as:
   - price per sqm outliers
   - impossible parcel area
   - duplicate listing explosions
   - market-wide price spikes due to parse errors
4. Create QA dashboards and notifications.
5. Gate publication to gold layer on severe failures.

**Deliverables**
- QA rule engine
- dashboards
- alerting
- publication gate

**Acceptance criteria**
- bad datasets can be quarantined
- engineers and ops can inspect failures quickly
- quality gates protect user-facing tables

**Codex prompt seed**  
Build a data quality and anomaly detection system for pricing, geometry, freshness, and duplicate issues, with publication gating and dashboards.

---

## EPIC 4 — Canonical domain model, normalization, and confidence

### TASK E4-T01 — Implement the core PostGIS schema

**Objective**  
Create the main database schema for parcels, listings, transactions, estimates, geographies, and user objects.

**Why it matters**  
This schema is the foundation of all APIs and analytics.

**Depends on**  
E0-T04, E2-T02, E3-T04.

**Detailed implementation steps**
1. Create tables for:
   - geographies
   - parcels
   - parcel_geometries
   - listings
   - listing_events
   - transactions
   - valuation_estimates
   - brokers
   - developers
   - projects
   - permits
   - sources
   - licenses
   - watchlists
   - alerts
2. Add spatial indexes and non-spatial indexes.
3. Add audit columns and soft-delete strategy.
4. Add migration workflow and seed data.
5. Define foreign key strategy and event history tables.

**Deliverables**
- migrations
- schema docs
- seed data
- ERD

**Acceptance criteria**
- schema supports all core objects without ambiguous ownership
- spatial queries are indexed
- history is preserved for changing objects

**Codex prompt seed**  
Implement the core PostGIS schema, migrations, ERD, and seeds for geography, land, market, provenance, and user entities.

---

### TASK E4-T02 — Build currency, area, and unit normalization

**Objective**  
Normalize global market data into a comparable measurement model.

**Why it matters**  
A worldwide product is unusable if prices and land areas are not comparable.

**Depends on**  
E4-T01.

**Detailed implementation steps**
1. Create canonical units:
   - sqm
   - sqft
   - acre
   - hectare
2. Create canonical price fields:
   - local currency amount
   - normalized base currency amount
   - amount per canonical area unit
3. Add FX ingestion and historical conversion support.
4. Preserve source-native units and display format.
5. Add formatting helpers by locale.

**Deliverables**
- normalization utilities
- FX tables
- unit conversion library
- API formatting helpers

**Acceptance criteria**
- every listing and transaction can be compared across markets
- source-native values remain recoverable
- historical charts use consistent conversion logic

**Codex prompt seed**  
Implement currency, FX, area-unit normalization, and locale-aware formatting so worldwide listings and transactions can be compared safely.

---

### TASK E4-T03 — Implement canonical identity and dedupe logic

**Objective**  
Create stable internal IDs and dedupe clusters for parcels, listings, brokers, developers, and transactions.

**Why it matters**  
Worldwide property data often duplicates the same plot across multiple marketplaces and broker feeds.

**Depends on**  
E4-T01, E3-T05.

**Detailed implementation steps**
1. Create canonical ID rules for each entity type.
2. Build deterministic matching keys where possible:
   - parcel number
   - project + unit / plot identifiers
   - address + area + geometry proximity
3. Build probabilistic dedupe where exact keys fail.
4. Store cluster confidence and merge rationale.
5. Add manual review hooks for ambiguous matches.

**Deliverables**
- dedupe service
- cluster tables
- matching score docs
- review endpoints

**Acceptance criteria**
- duplicate listings collapse into one canonical object when safe
- ambiguous merges are reviewable
- confidence is preserved on canonical objects

**Codex prompt seed**  
Implement canonical IDs, dedupe clustering, confidence scoring, and review hooks for listings, parcels, transactions, brokers, and developers.

---

### TASK E4-T04 — Build geocoding, reverse geocoding, and spatial confidence scoring

**Objective**  
Map source records to coordinates, boundaries, and parcel geometry confidence.

**Why it matters**  
A map product is only as good as its spatial truth.

**Depends on**  
E2-T02, E4-T01.

**Detailed implementation steps**
1. Add forward geocoding for address-like records.
2. Add reverse geocoding to geography hierarchy.
3. Add geometry confidence classes:
   - exact parcel boundary
   - authoritative centroid
   - derived centroid
   - locality-only
4. Store multiple candidate matches where needed.
5. Add a geometry review queue in admin.

**Deliverables**
- geocoding pipeline
- confidence taxonomy
- candidate tables
- review workflow

**Acceptance criteria**
- every displayed mapped object has a geometry confidence label
- parcel pages cannot render without acceptable confidence
- locality-only records are safely downgraded in UI

**Codex prompt seed**  
Implement geocoding, reverse geocoding, candidate matching, and geometry confidence scoring with safe downgrade rules for low-confidence records.

---

### TASK E4-T05 — Implement freshness and confidence scoring engine

**Objective**  
Build the shared logic that turns data provenance into product-facing trust signals.

**Why it matters**  
Users need a coherent trust model across markets.

**Depends on**  
E3-T01, E4-T03, E4-T04.

**Detailed implementation steps**
1. Define scoring inputs by object type.
2. Compute scores for:
   - listings
   - transactions
   - parcels
   - estimates
   - cell aggregates
3. Create freshness tiers from source timestamps.
4. Add explanation fields like:
   - “official transaction, updated monthly”
   - “broker-verified within 24h”
   - “estimate built from 5 nearby comps”
5. Add API-ready score payloads.

**Deliverables**
- scoring service
- score calculation docs
- explanation generator
- tests

**Acceptance criteria**
- trust signals are consistent across APIs and UI
- explanations are human-readable
- low-confidence records can be hidden or downgraded

**Codex prompt seed**  
Implement the freshness and confidence engine with human-readable explanations and API payloads for listings, transactions, parcels, estimates, and aggregate cells.

---

### TASK E4-T06 — Encode legal display policies by market and source

**Objective**  
Make legal and contractual display limits machine-enforceable.

**Why it matters**  
The platform will have different rights in different jurisdictions.

**Depends on**  
E3-T01, E3-T03, E4-T01.

**Detailed implementation steps**
1. Create policy types for:
   - can display parcel boundary
   - can display exact price
   - can display address
   - can redistribute broker data
   - can expose raw export
   - can show historical record
2. Allow policies at source, market, and object-type level.
3. Create a precedence model for conflicts.
4. Add product-safe display adapters that redact prohibited fields.
5. Log policy-based redactions for audit.

**Deliverables**
- legal policy tables
- display adapter logic
- audit logs
- admin policy editor

**Acceptance criteria**
- restricted fields never leak through APIs or tiles
- legal policy changes take effect without schema changes
- redactions are auditable

**Codex prompt seed**  
Implement machine-enforced legal display policies with market/source precedence, redaction adapters, and audit logs.

---

## EPIC 5 — Pricing, comps, and valuation intelligence

### TASK E5-T01 — Build the comparable selection engine

**Objective**  
Select relevant comps for parcels, districts, and market cards.

**Why it matters**  
The estimate layer and explanation system depend on credible comparable selection.

**Depends on**  
E4-T01, E4-T02, E4-T03.

**Detailed implementation steps**
1. Define comp eligibility rules by market and use class.
2. Use distance, time, area, zoning, tenure, road access, and source quality as filters.
3. Add fallback logic for sparse markets.
4. Store comp candidate sets for explainability and caching.
5. Add API endpoints for comp inspection.

**Deliverables**
- comp engine
- candidate tables
- tuning config
- inspection endpoint

**Acceptance criteria**
- parcel pages can show “why these comps”
- the estimate engine has reusable candidate sets
- comp selection degrades gracefully in sparse markets

**Codex prompt seed**  
Implement comparable selection using distance, recency, zoning, size, tenure, and source quality, with explainable candidate sets and sparse-market fallbacks.

---

### TASK E5-T02 — Implement the price-state engine

**Objective**  
Separate and reconcile ask, closed, estimate, and broker-verified values.

**Why it matters**  
This is a central product truth rule.

**Depends on**  
E4-T05, E5-T01.

**Detailed implementation steps**
1. Create a unified price observation model with state type.
2. Build ranking logic for which price appears as the default headline in each context.
3. Define chart rendering rules by state.
4. Add conflict resolution when multiple asks or conflicting broker quotes exist.
5. Preserve full event history.

**Deliverables**
- price-state service
- chart rules
- conflict resolution logic
- timeline model

**Acceptance criteria**
- the UI never confuses asks with closed sales
- parcel cards can switch between price states cleanly
- every price observation is traceable and historical

**Codex prompt seed**  
Implement the price-state engine that reconciles ask, closed, estimate, and broker-verified observations without conflating them in the UI or analytics.

---

### TASK E5-T03 — Add regional index fallback and benchmark layers

**Objective**  
Provide meaningful pricing context in markets where parcel comps are weak.

**Why it matters**  
Worldwide coverage requires a graceful fallback instead of blank screens.

**Depends on**  
E5-T01, E5-T02.

**Detailed implementation steps**
1. Create market index observation tables.
2. Add adapters for index-style datasets.
3. Build benchmark aggregations for:
   - city
   - district
   - use class
   - price band
4. Add rules for when to use index fallback instead of parcel estimate.
5. Distinguish benchmark-derived estimates clearly in UI.

**Deliverables**
- benchmark model
- fallback logic
- market index APIs

**Acceptance criteria**
- low-data markets still produce useful benchmark views
- fallback estimates are clearly labeled
- charts can blend parcel and market context without confusion

**Codex prompt seed**  
Implement regional index and benchmark fallback layers so thin-data markets can still surface useful pricing context without pretending to be parcel-precise.

---

### TASK E5-T04 — Implement the valuation model service

**Objective**  
Build a model service that generates parcel and geography-level estimates.

**Why it matters**  
Estimates are essential for areas without strong live listing density.

**Depends on**  
E5-T01, E5-T03.

**Detailed implementation steps**
1. Create training / inference pipelines.
2. Define feature sets:
   - comp statistics
   - zoning
   - tenure
   - access
   - hazards
   - geography
   - recency
   - market index context
3. Add versioned model artifacts.
4. Store prediction intervals, not only point estimates.
5. Add batch and on-demand inference modes.

**Deliverables**
- valuation service
- feature generation pipeline
- model registry
- inference endpoints

**Acceptance criteria**
- estimates are versioned and reproducible
- model predictions include uncertainty
- inference can be rerun after source updates

**Codex prompt seed**  
Implement the valuation model service with feature generation, versioned artifacts, uncertainty intervals, batch inference, and on-demand parcel valuation.

---

### TASK E5-T05 — Add estimate explainability and confidence intervals

**Objective**  
Make valuation outputs inspectable and trustworthy.

**Why it matters**  
Opaque estimates will destroy user trust, especially in land markets.

**Depends on**  
E5-T04.

**Detailed implementation steps**
1. Expose drivers such as:
   - comp range
   - comp count
   - distance band
   - zoning similarity
   - trend adjustment
   - data freshness
2. Render interval bands and confidence explanations.
3. Add “why estimate quality is low” states.
4. Add internal review tools to inspect model outputs.
5. Add export-ready explanation summaries.

**Deliverables**
- explainability payloads
- UI-ready summaries
- internal review endpoints

**Acceptance criteria**
- every estimate can explain itself
- low-confidence estimates are obvious
- support and ops can review outlier estimates

**Codex prompt seed**  
Add explainability and interval output to the valuation system so every estimate has readable drivers, quality reasons, and internal review support.

---

### TASK E5-T06 — Build price history and change-event timelines

**Objective**  
Show the evolution of listings, transactions, estimates, and status changes over time.

**Why it matters**  
History is a major reason to use this platform over a static listing site.

**Depends on**  
E5-T02.

**Detailed implementation steps**
1. Store immutable price events and status events.
2. Build timelines for parcels, listings, projects, and markets.
3. Support event types:
   - listed
   - price cut
   - price raise
   - off market
   - sold / recorded
   - estimate refreshed
   - broker verified
   - permit added
   - zoning changed
4. Add feed summarization for tickers and alerts.

**Deliverables**
- event history tables
- timeline APIs
- feed generation jobs

**Acceptance criteria**
- parcel pages show clean chronological history
- tickers can be powered from the same event store
- alerting can subscribe to event types

**Codex prompt seed**  
Implement immutable price and status event history with timeline APIs and shared event feeds for parcel pages, market cards, and live tickers.

---

## EPIC 6 — Public APIs, search, auth, and notifications

### TASK E6-T01 — Design and implement the public/internal API surface

**Objective**  
Provide stable APIs for the web app, admin app, and future partners.

**Why it matters**  
The UI, admin tools, and integrations all depend on a clean contract.

**Depends on**  
E4-T01.

**Detailed implementation steps**
1. Design endpoints or graph queries for:
   - globe cells
   - market summaries
   - parcel details
   - search
   - filters
   - compare
   - watchlists
   - alerts
   - admin review queues
2. Add schema versioning.
3. Add field-level redaction hooks for legal policy.
4. Document pagination, sorting, and error contracts.
5. Generate typed client SDKs if appropriate.

**Deliverables**
- API spec
- implementation
- typed client bindings
- docs

**Acceptance criteria**
- web and admin can consume the same contracts cleanly
- redaction rules apply centrally
- contracts are versioned and documented

**Codex prompt seed**  
Design and implement the API surface for globe cells, market summaries, parcel details, search, compare, watchlists, alerts, and admin tools with policy-aware field redaction.

---

### TASK E6-T02 — Build auth, organizations, and RBAC

**Objective**  
Create role-aware access control for users, teams, admins, brokers, and partners.

**Why it matters**  
Different users will need different visibility and workflow rights.

**Depends on**  
E6-T01.

**Detailed implementation steps**
1. Define roles:
   - anonymous
   - authenticated user
   - paid user
   - analyst
   - broker
   - market ops
   - admin
   - data engineer
2. Create org/team membership support.
3. Add permissions for:
   - data access
   - exports
   - review queues
   - broker verification
   - source editing
4. Add audit logging for sensitive actions.
5. Add entitlement hooks for subscriptions later.

**Deliverables**
- auth layer
- RBAC model
- protected route middleware
- audit log hooks

**Acceptance criteria**
- sensitive tools are permission-gated
- entitlements can be layered without redesign
- all admin actions are auditable

**Codex prompt seed**  
Implement authentication, organizations, RBAC, protected routes, and audit logging for user, admin, and partner workflows.

---

### TASK E6-T03 — Implement full-text and geo search

**Objective**  
Create fast search across names, places, parcels, projects, brokers, developers, and addresses.

**Why it matters**  
Search will be the fastest way into the product for many users.

**Depends on**  
E2-T02, E4-T03, E6-T01.

**Detailed implementation steps**
1. Build an indexed search model for:
   - geography names
   - parcel ids
   - project names
   - broker names
   - developer names
   - addresses
   - coordinates
   - saved polygons
2. Support autocomplete, synonyms, and multilingual matching.
3. Add geo-shape and bounding-box search.
4. Add result grouping by object type.
5. Add ranking features that favor coverage depth and confidence.

**Deliverables**
- search index mappings
- indexing pipelines
- search API
- autocomplete UI contract

**Acceptance criteria**
- top results are relevant and typed
- coordinates and parcel ids resolve reliably
- multilingual queries work in supported markets

**Codex prompt seed**  
Build full-text, autocomplete, coordinate, and geo-shape search across geographies, parcels, projects, brokers, developers, and addresses with typed grouped results.

---

### TASK E6-T04 — Build filters, ranking, and query orchestration

**Objective**  
Make complex map and list filtering fast and deterministic.

**Why it matters**  
The product’s value depends on narrowing huge result spaces quickly.

**Depends on**  
E6-T03, E2-T05.

**Detailed implementation steps**
1. Create filter schemas for map and list contexts.
2. Support:
   - price range
   - price per area
   - use class
   - tenure
   - size
   - freshness
   - confidence
   - source type
   - hazard
   - proximity
3. Implement ranking strategies for:
   - relevance
   - newest
   - best value
   - highest confidence
   - biggest price drop
4. Ensure filter logic is consistent between map, list, compare, and exports.

**Deliverables**
- filter engine
- ranking engine
- shared query DSL
- test suite

**Acceptance criteria**
- the same filter produces the same result set across surfaces
- latency meets product budget
- filter combinations behave predictably

**Codex prompt seed**  
Implement the shared filter and ranking engine for map, list, compare, and export surfaces with deterministic behavior and query performance guarantees.

---

### TASK E6-T05 — Implement watchlists, alerts, and change detection

**Objective**  
Turn passive market browsing into active monitoring.

**Why it matters**  
Alerts are one of the highest-retention features in this category.

**Depends on**  
E5-T06, E6-T02.

**Detailed implementation steps**
1. Support saved objects:
   - parcel
   - geography
   - polygon
   - saved search
2. Support rule types:
   - new listing
   - price drop
   - status changed
   - official transaction recorded
   - confidence changed
   - permit added nearby
   - zoning change nearby
3. Add change detection jobs.
4. Add deduping so users are not spammed.
5. Add in-app alert center and webhook-friendly event model.

**Deliverables**
- watchlist schema
- alert engine
- change detection jobs
- alert center API

**Acceptance criteria**
- a user can monitor a parcel, area, or search
- alerts fire only on real deltas
- notification volume is controllable

**Codex prompt seed**  
Build watchlists, alert rules, and change-detection jobs for parcels, geographies, polygons, and saved searches with anti-spam deduping.

---

### TASK E6-T06 — Add notification delivery and preference management

**Objective**  
Deliver alerts through reliable user-controlled channels.

**Why it matters**  
Alerting is only valuable if delivery is predictable and tunable.

**Depends on**  
E6-T05.

**Detailed implementation steps**
1. Add notification channels:
   - in-app
   - email
   - webhook
   - optional messaging integrations later
2. Add daily digest vs instant options.
3. Add timezone-aware delivery windows.
4. Add unsubscribe and mute rules.
5. Add delivery logs and retry handling.

**Deliverables**
- notification preferences
- delivery workers
- delivery logs
- templates

**Acceptance criteria**
- users can control cadence and channels
- failed deliveries are visible and retryable
- timezone handling is correct

**Codex prompt seed**  
Implement notification delivery, preferences, delivery logs, retries, and timezone-aware scheduling for alert events.

---

## EPIC 7 — User-facing product implementation

### TASK E7-T01 — Build the application shell and global layout

**Objective**  
Create the top bar, left rail, map canvas, right drawer, bottom legend, and compare/watchlist tray.

**Why it matters**  
This is the product’s core frame.

**Depends on**  
E1-T02, E6-T01.

**Detailed implementation steps**
1. Build route-aware shell components.
2. Add persistent:
   - search bar
   - currency toggle
   - price-state toggle
   - buy / lease toggle
   - map layer controls
   - legend
   - activity ticker
3. Add drawer layout patterns for globe cell, market, and parcel selection.
4. Add keyboard shortcuts and state persistence.
5. Add responsive collapse behavior.

**Deliverables**
- app shell components
- layout state store
- responsive behavior
- keyboard shortcuts

**Acceptance criteria**
- shell feels stable across routes
- state survives navigation and refresh where appropriate
- layout remains usable on target breakpoints

**Codex prompt seed**  
Implement the globe-first application shell with top controls, map canvas, right drawer, bottom legend, ticker, and compare/watchlist tray.

---

### TASK E7-T02 — Implement the global globe view

**Objective**  
Render the worldwide discovery experience.

**Why it matters**  
This is the hero surface and market-entry point.

**Depends on**  
E2-T03, E2-T04, E7-T01.

**Detailed implementation steps**
1. Render H3 or equivalent aggregate cells.
2. Support view modes:
   - median ask / area
   - median closed / area
   - estimate benchmark
   - availability
   - activity velocity
   - confidence
3. Add globe camera persistence and deep links.
4. Add hover, click, compare, and drill-down.
5. Add coverage badge overlays for countries and markets.

**Deliverables**
- globe page
- cell layer rendering
- selection behavior
- deep-link support

**Acceptance criteria**
- world view is performant and legible
- users can drill from globe to market cleanly
- coverage depth is obvious at country level

**Codex prompt seed**  
Implement the global globe view with aggregated cells, multiple metrics, coverage badges, hover/click interactions, and drill-down into market pages.

---

### TASK E7-T03 — Implement market view with clusters and overlays

**Objective**  
Build city / region level views where users inspect active inventory and market dynamics.

**Why it matters**  
This is where the product becomes operational, not just exploratory.

**Depends on**  
E2-T04, E6-T04, E7-T01.

**Detailed implementation steps**
1. Render:
   - listing clusters
   - district stats
   - recent transactions
   - permit / planning overlays
   - hazard overlays
2. Add side-by-side list + map mode.
3. Add filter chips and sort controls.
4. Add mini trend charts and district comparisons.
5. Support drawn polygon analysis.

**Deliverables**
- market page
- map/list toggle
- district cards
- polygon analysis workflow

**Acceptance criteria**
- market view handles both dense and sparse regions
- filters and overlays feel immediate
- drawn polygons can summarize inventory and pricing

**Codex prompt seed**  
Implement the market view with listing clusters, district summaries, overlays, filter chips, list mode, and drawn-polygon analysis.

---

### TASK E7-T04 — Implement parcel view and parcel dossier

**Objective**  
Create the detailed parcel page / drawer experience.

**Why it matters**  
This is the highest-value workflow for serious users.

**Depends on**  
E5-T02, E5-T06, E7-T03.

**Detailed implementation steps**
1. Build parcel header with:
   - title
   - price states
   - freshness
   - confidence
   - availability state
2. Add sections for:
   - geometry / map
   - zoning and permitted use
   - utilities and access
   - nearby comps
   - price history
   - documents
   - broker / developer
   - nearby risks
   - nearby developments / permits
3. Add compare and save actions.
4. Add evidence / provenance drawer.
5. Add export-ready structured summary.

**Deliverables**
- parcel page
- parcel section components
- provenance panel
- export summary API

**Acceptance criteria**
- parcel detail is clear and evidence-backed
- provenance is inspectable
- compare and watchlist actions are one click away

**Codex prompt seed**  
Implement the parcel dossier with price states, freshness, confidence, zoning, utilities, comps, history, documents, risk, nearby development, and provenance panels.

---

### TASK E7-T05 — Add provenance, freshness, and confidence UI

**Objective**  
Make trust signals visible everywhere.

**Why it matters**  
A data-intelligence product wins or loses on explainability.

**Depends on**  
E4-T05, E7-T01.

**Detailed implementation steps**
1. Create reusable components for:
   - freshness chips
   - confidence bars
   - source badges
   - coverage labels
   - legal-limited state banners
2. Add a “why am I seeing this?” panel to key views.
3. Add hover / tap explanations for low confidence.
4. Add compare-safe display rules so trust signals are visible in tables.

**Deliverables**
- trust signal component library
- explainability panel
- table and card integrations

**Acceptance criteria**
- every user-facing price can show trust metadata
- low-confidence states are never silent
- coverage limits are visible before frustration occurs

**Codex prompt seed**  
Implement reusable trust-signal UI for freshness, confidence, coverage, source attribution, and explanation panels across globe, market, and parcel views.

---

### TASK E7-T06 — Build compare, portfolio, and watchlist UI

**Objective**  
Turn selected markets and parcels into a working portfolio workflow.

**Why it matters**  
Professional users need comparison and saved-state workflows more than casual exploration.

**Depends on**  
E6-T05, E7-T01.

**Detailed implementation steps**
1. Build compare tray and compare page.
2. Support comparing:
   - parcel vs parcel
   - district vs district
   - city vs city
3. Build watchlist and saved search views.
4. Add quick alert creation from compare and watchlist surfaces.
5. Add summary metrics and sparkline history.

**Deliverables**
- compare UI
- watchlist pages
- saved search pages
- quick-alert UI

**Acceptance criteria**
- users can build and revisit comparison sets
- watchlists show recent change events
- portfolio workflows do not require re-searching each session

**Codex prompt seed**  
Implement compare, watchlist, saved search, and quick-alert UI so users can monitor parcels and markets over time.

---

### TASK E7-T07 — Implement ticker, time slider, and activity feed

**Objective**  
Create the “live market monitor” layer of the product.

**Why it matters**  
This is what gives the site energy and recurrence.

**Depends on**  
E5-T06, E6-T05, E7-T01.

**Detailed implementation steps**
1. Build a global and market-specific activity feed.
2. Add event types for:
   - new listing
   - price drop
   - transaction recorded
   - permit update
   - broker verification
3. Build a time slider for map reaggregation and historical playback.
4. Add filters for event type, geography, and object type.
5. Add pause, replay, and summary states.

**Deliverables**
- ticker UI
- activity feed page
- time slider
- historical replay queries

**Acceptance criteria**
- feed updates without overwhelming the user
- map aggregates can be replayed across time
- users can filter to meaningful event types

**Codex prompt seed**  
Implement the activity ticker, live feed, and time slider with historical replay and event filtering for market-monitor behavior.

---

### TASK E7-T08 — Add multilingual, RTL, and accessibility support

**Objective**  
Make the worldwide product usable across scripts, locales, and assistive technologies.

**Why it matters**  
Worldwide coverage without global usability is incomplete.

**Depends on**  
E1-T02, E2-T02, E7-T01.

**Detailed implementation steps**
1. Add i18n architecture and locale files.
2. Support localized numbers, currencies, dates, and unit formatting.
3. Add RTL support for layout-critical screens.
4. Add keyboard navigation, screen-reader semantics, focus handling, and color-contrast validation.
5. Add multilingual map labels where supported.

**Deliverables**
- i18n framework
- locale-aware formatting
- RTL styles
- accessibility test suite

**Acceptance criteria**
- app can run in LTR and RTL
- trust-critical UI remains accessible
- locale formatting is correct and consistent

**Codex prompt seed**  
Implement internationalization, RTL support, accessibility guardrails, and locale-aware formatting across the core land-intelligence UI.

---

## EPIC 8 — Admin operations and partner workflows

### TASK E8-T01 — Build the ingestion monitor and source health dashboard

**Objective**  
Give ops and data engineers visibility into source freshness, failures, and publication state.

**Why it matters**  
Worldwide data pipelines require operational observability.

**Depends on**  
E3-T02, E3-T05.

**Detailed implementation steps**
1. Build source status cards with:
   - last success
   - next expected update
   - row count delta
   - quality score
   - blocked status
2. Add job drill-down pages and raw artifact links.
3. Add retry and quarantine actions.
4. Add anomaly trend views by source and market.

**Deliverables**
- admin dashboard
- source health cards
- job detail pages

**Acceptance criteria**
- ops can see stale, broken, and blocked sources quickly
- source health is drillable by market
- failed jobs can be retried from admin

**Codex prompt seed**  
Implement the ingestion monitor and source health dashboard with freshness, row deltas, quality score, retries, quarantine, and raw artifact links.

---

### TASK E8-T02 — Build manual review queues for dedupe, geocoding, and policy conflicts

**Objective**  
Create the human-in-the-loop layer for ambiguous data situations.

**Why it matters**  
Not all data decisions should be automated.

**Depends on**  
E4-T03, E4-T04, E4-T06.

**Detailed implementation steps**
1. Create queue types for:
   - duplicate merge review
   - geometry candidate review
   - blocked-field policy review
   - suspicious price review
2. Add compare views for candidate records.
3. Add approve / reject / split / escalate actions.
4. Store decision provenance and reviewer notes.
5. Add sampling QA for already-accepted records.

**Deliverables**
- review queue UI
- decision APIs
- reviewer audit log

**Acceptance criteria**
- ambiguous cases can be resolved by humans
- decisions are traceable
- manual review can improve future rules

**Codex prompt seed**  
Implement manual review queues for dedupe, geocoding, policy conflicts, and suspicious pricing with auditable decisions and reviewer notes.

---

### TASK E8-T03 — Implement broker and developer verification workflows

**Objective**  
Create trusted human verification paths for off-platform inventory and quotes.

**Why it matters**  
Broker-verified state is valuable only if the verification workflow is auditable.

**Depends on**  
E6-T02, E5-T02.

**Detailed implementation steps**
1. Define broker/developer user roles and verification states.
2. Create workflows for:
   - invite
   - identity / organization verification
   - listing confirmation
   - quote confirmation
   - expiry / re-verification
3. Add evidence attachments and approval notes.
4. Expose broker-verified state in the public product with timestamps.

**Deliverables**
- verification workflow
- partner profiles
- evidence upload support
- public badge logic

**Acceptance criteria**
- broker-verified labels can be audited
- stale verifications expire
- public UI reflects verification age and source

**Codex prompt seed**  
Implement broker and developer verification workflows with evidence, expiry, auditability, and public broker-verified labeling.

---

### TASK E8-T04 — Build source configuration and market onboarding admin tools

**Objective**  
Make it possible to onboard and manage new markets without code edits for every metadata change.

**Why it matters**  
Worldwide expansion speed depends on operational tooling.

**Depends on**  
E3-T01, E3-T03.

**Detailed implementation steps**
1. Add admin forms for:
   - source metadata
   - market adapter metadata
   - coverage tier
   - attribution text
   - refresh schedules
   - display policies
2. Add onboarding checklists and gating status.
3. Add sample preview pages for staged markets.
4. Add market activation / deactivation controls.

**Deliverables**
- source config UI
- market onboarding UI
- preview mode

**Acceptance criteria**
- market metadata changes do not require redeploys
- staged markets can be previewed safely
- activation follows explicit checklist gates

**Codex prompt seed**  
Implement source configuration and market onboarding admin tooling with gating, preview mode, activation controls, and editable metadata.

---

## EPIC 9 — Observability, security, billing, and reliability

### TASK E9-T01 — Implement platform observability

**Objective**  
Instrument the whole system for logs, metrics, traces, and product analytics.

**Why it matters**  
A world-scale geospatial product is too complex to operate blindly.

**Depends on**  
E0-T02.

**Detailed implementation steps**
1. Add structured logging across apps and services.
2. Add tracing for ingestion, API, tile delivery, and notifications.
3. Add metrics for:
   - source freshness
   - tile latency
   - search latency
   - alert delays
   - render failures
   - model inference duration
4. Add product analytics for key user flows.
5. Add dashboards and incident runbooks.

**Deliverables**
- observability libraries
- dashboards
- runbooks
- alert definitions

**Acceptance criteria**
- key flows are measurable end to end
- performance regressions and outages are visible
- product usage can guide prioritization

**Codex prompt seed**  
Implement structured logging, tracing, metrics, dashboards, and runbooks for ingestion, APIs, tiles, search, alerts, and valuation services.

---

### TASK E9-T02 — Harden security, secrets, and data protection

**Objective**  
Secure a system that handles licensed datasets, partner workflows, and valuable market data.

**Why it matters**  
Security issues here are business-critical.

**Depends on**  
E6-T02.

**Detailed implementation steps**
1. Add secrets management and environment separation.
2. Add rate limiting, API auth, and abuse protection.
3. Add object-level authorization checks.
4. Add signed URLs and export protections.
5. Add encryption at rest/in transit assumptions to infra docs.
6. Add dependency scanning and container hardening.

**Deliverables**
- security middleware
- secrets policies
- export protection
- security docs

**Acceptance criteria**
- protected data paths are access-controlled
- secrets are not stored unsafely in the repo or logs
- exports respect entitlements and policy rules

**Codex prompt seed**  
Implement security hardening, secrets management, rate limiting, object-level auth, signed exports, and dependency/container scanning guardrails.

---

### TASK E9-T03 — Add performance testing and load testing

**Objective**  
Validate that the platform can handle world-scale map use and source updates.

**Why it matters**  
Map, search, and tile systems often fail only under realistic load.

**Depends on**  
E2-T05, E6-T04, E9-T01.

**Detailed implementation steps**
1. Define load scenarios for:
   - globe open
   - market drill-down
   - heavy filter churn
   - parcel detail opens
   - search bursts
   - tile invalidation after ingest
2. Add synthetic datasets for scale testing.
3. Add regression thresholds to CI where practical.
4. Capture p50 / p95 / p99 for key interactions.

**Deliverables**
- load scripts
- synthetic data generators
- performance reports

**Acceptance criteria**
- scale bottlenecks are identified before launch
- performance budgets have automated checks
- large-market scenarios are testable locally or in staging

**Codex prompt seed**  
Implement scale and load tests for globe render, tiles, market filters, parcel pages, search bursts, and ingest-triggered invalidation.

---

### TASK E9-T04 — Implement billing, entitlements, and API quotas

**Objective**  
Prepare the product for paid tiers and differentiated access.

**Why it matters**  
Enterprise and professional workflows will likely fund the product.

**Depends on**  
E6-T02.

**Detailed implementation steps**
1. Define product tiers:
   - public / teaser
   - pro
   - enterprise
   - partner
2. Gate:
   - export limits
   - alert volume
   - historical depth
   - API access
   - premium overlays
   - broker workflow access
3. Add usage metering and quota checks.
4. Add billing hooks and subscription events.

**Deliverables**
- entitlement model
- quota middleware
- billing integration scaffold
- usage dashboards

**Acceptance criteria**
- plan-based access can be enforced centrally
- quota state is observable
- billing changes update product access cleanly

**Codex prompt seed**  
Implement plan-based entitlements, quotas, usage metering, and billing hooks for public, pro, enterprise, and partner access tiers.

---

### TASK E9-T05 — Add backup, disaster recovery, and retention policies

**Objective**  
Protect the platform against data loss and accidental corruption.

**Why it matters**  
Source data, dedupe decisions, and market history are expensive to rebuild.

**Depends on**  
E4-T01, E9-T01.

**Detailed implementation steps**
1. Define backup plans for:
   - Postgres/PostGIS
   - search indexes
   - object storage artifacts
   - model registry
2. Define restore procedures and recovery time objectives.
3. Add retention policies for:
   - raw artifacts
   - event history
   - exports
   - notification logs
4. Add periodic restore drills.

**Deliverables**
- backup policies
- restore runbooks
- retention config
- drill evidence

**Acceptance criteria**
- core data stores have tested restore paths
- retention is explicit and compliant
- raw and gold data can both be recovered

**Codex prompt seed**  
Implement backup, restore, retention, and disaster-recovery runbooks for core databases, search indexes, object storage, and model artifacts.

---

## EPIC 10 — Worldwide rollout and go-to-market operations

### TASK E10-T01 — Create the market onboarding playbook

**Objective**  
Turn market expansion into a repeatable process.

**Why it matters**  
Worldwide growth will fail if each new market requires rediscovering the workflow.

**Depends on**  
E3-T03, E4-T06.

**Detailed implementation steps**
1. Create a playbook template covering:
   - source discovery
   - legal review
   - adapter mapping
   - QA thresholds
   - UI preview
   - launch checklist
2. Add scorecards for:
   - coverage
   - legal risk
   - source stability
   - update cadence
   - geometry quality
3. Add recommended rollout stages:
   - hidden internal
   - beta
   - limited public
   - full launch

**Deliverables**
- `docs/ops/market-onboarding-playbook.md`
- scorecards
- checklist templates

**Acceptance criteria**
- new markets can be evaluated consistently
- legal, data, and product teams share the same checklist
- launch stage is explicit

**Codex prompt seed**  
Create a market onboarding playbook with scorecards, legal/data/product gates, rollout stages, and repeatable launch checklists.

---

### TASK E10-T02 — Implement coverage badges and data-availability catalog

**Objective**  
Make the platform transparent about where it has what level of data depth.

**Why it matters**  
Worldwide products need an honesty layer.

**Depends on**  
E0-T01, E10-T01.

**Detailed implementation steps**
1. Create a public/internal coverage catalog by market.
2. Add badges such as:
   - benchmark only
   - listing depth
   - transaction depth
   - parcel geometry available
   - broker verification available
3. Add country and city overlay rendering.
4. Add search results hints based on coverage.

**Deliverables**
- coverage catalog
- badge rendering
- APIs and admin editing support

**Acceptance criteria**
- users can see data availability before drilling in
- sales and support can reference one canonical coverage catalog
- coverage changes update in UI without custom code

**Codex prompt seed**  
Implement the coverage catalog and badge system so users can see listing depth, transaction depth, parcel geometry, and verification availability by market.

---

### TASK E10-T03 — Deliver pilot markets: Dubai, England/Wales, Singapore

**Objective**  
Prove the global platform with three different source-quality patterns.

**Why it matters**  
These pilots validate the architecture against different data realities.

**Depends on**  
E3-T03 through E7-T08.

**Detailed implementation steps**
1. Complete source adapters and legal display rules for each pilot.
2. Tune market-specific transforms and confidence scoring.
3. Validate search, filters, and parcel / market pages in each market.
4. Create staging datasets and QA scorecards.
5. Launch internal beta with pilot coverage catalog.

**Deliverables**
- three pilot market packages
- QA reports
- staging demo environments
- launch notes

**Acceptance criteria**
- all three pilot markets function end to end
- each pilot demonstrates a different coverage level honestly
- issues discovered in pilots feed back into the platform core

**Codex prompt seed**  
Finish end-to-end pilot-market implementations for Dubai, England/Wales, and Singapore, including adapters, QA scorecards, legal display rules, and staged launch readiness.

---

### TASK E10-T04 — Build the partner data integration framework

**Objective**  
Prepare the product for commercial data and broker / developer partnerships.

**Why it matters**  
Open data alone will not unlock parcel-grade worldwide depth.

**Depends on**  
E3-T02, E3-T03, E8-T03.

**Detailed implementation steps**
1. Create partner source ingestion patterns and contracts.
2. Add partner-specific license scopes and revenue / access flags.
3. Add partner QA and mapping templates.
4. Add partner-specific data redaction and entitlement behavior.
5. Create docs for partner onboarding.

**Deliverables**
- partner integration contract
- partner ingest templates
- license scope model
- onboarding docs

**Acceptance criteria**
- partner data can be ingested without breaking core assumptions
- entitlements and legal display are partner-aware
- ops can onboard partners through documented workflows

**Codex prompt seed**  
Implement the partner data integration framework with license scopes, entitlements, ingestion templates, QA templates, and onboarding docs.

---

### TASK E10-T05 — Create launch operations, support, and post-launch iteration loops

**Objective**  
Prepare the platform to launch, learn, and improve quickly.

**Why it matters**  
A worldwide intelligence product will need constant tuning.

**Depends on**  
E9-T01, E10-T03.

**Detailed implementation steps**
1. Create launch checklist covering:
   - uptime
   - support docs
   - legal notices
   - attribution checks
   - analytics
   - alerts delivery
   - backup validation
2. Create support playbooks for:
   - bad data reports
   - source outage
   - duplicate complaints
   - wrong parcel geometry
   - pricing disputes
3. Add product feedback loops tied to specific market pages and object types.
4. Add monthly quality review and source scorecards.

**Deliverables**
- launch checklist
- support playbooks
- feedback tooling
- recurring review process

**Acceptance criteria**
- operations can respond to quality and support issues quickly
- launch quality is measurable
- post-launch fixes feed back into platform rules and adapters

**Codex prompt seed**  
Implement launch operations docs, support playbooks, quality review loops, and feedback capture tied to markets, parcels, and source records.

---

# 9. Recommended implementation order

Use this order unless there is a strong reason to deviate:

1. E0-T01 → E0-T04  
2. E1-T01 → E1-T04  
3. E2-T01 → E2-T05  
4. E3-T01 → E3-T05  
5. E4-T01 → E4-T06  
6. E5-T01 → E5-T06  
7. E6-T01 → E6-T06  
8. E7-T01 → E7-T08  
9. E8-T01 → E8-T04  
10. E9-T01 → E9-T05  
11. E10-T01 → E10-T05

---

# 10. Definition of done

A feature is not done until:

- code is committed in the correct package/service
- tests pass
- lint / format / type checks pass
- docs are updated
- provenance and legal display behavior are handled
- fixtures or seed data are included when needed
- screenshots or short demos exist for UI changes
- acceptance criteria in the task are satisfied

A market is not done until:

- source and license are registered
- adapter exists
- QA is green
- coverage tier is assigned
- badges render correctly
- trust metadata renders correctly
- legal display policy is enforced
- support owner exists

---

# 11. Suggested success metrics

## Product metrics
- weekly active analysts / investors
- watchlist creation rate
- alert save rate
- repeat parcel-page visits
- compare-session completion rate

## Data metrics
- source freshness SLA hit rate
- percentage of user-facing records with explicit provenance
- percentage of records with high confidence
- duplicate rate before and after canonicalization
- market coverage depth by region

## Performance metrics
- initial globe render time
- map interaction latency
- parcel detail load time
- search p95 latency
- tile p95 latency

## Trust metrics
- estimate click-through to explanation panel
- support tickets about wrong prices
- support tickets about wrong geometry
- policy-redaction incidents
- percent of launches with full attribution compliance

---

# 12. Risks and mitigation

## Risk: pretending worldwide parcel coverage exists when it does not
**Mitigation**: coverage tiers, badges, legal display rules, benchmark fallback.

## Risk: licensing conflicts across markets
**Mitigation**: source registry, policy engine, redaction layer, launch gate.

## Risk: duplicate listings destroy trust
**Mitigation**: canonical IDs, dedupe clustering, review queues.

## Risk: low map performance at scale
**Mitigation**: H3 aggregation, vector tiles, progressive disclosure, load testing.

## Risk: opaque estimates reduce credibility
**Mitigation**: explainability, intervals, provenance, confidence labels.

## Risk: market-by-market exceptions leak into core code
**Mitigation**: market adapter framework, shared contract tests, onboarding playbook.

---

# 13. First Codex task batch to execute immediately

If starting from zero, the first batch should be:

1. E0-T02 — bootstrap monorepo
2. E0-T03 — add AGENTS.md and Codex config
3. E0-T04 — create ADRs
4. E1-T01 — define information architecture
5. E2-T02 — create geography schema
6. E4-T01 — create core PostGIS schema
7. E3-T01 — create source registry
8. E2-T03 — implement H3 aggregation
9. E6-T01 — define API contracts
10. E7-T01 — build app shell

That sequence gets the repo, architecture, database, geospatial core, source model, API contracts, and UI shell into place quickly.

---

# 14. Research references

These references informed the technical and market assumptions in this plan.

## Codex workflow
- OpenAI Codex best practices: https://developers.openai.com/codex/learn/best-practices/
- AGENTS.md guide: https://developers.openai.com/codex/guides/agents-md/
- Codex overview: https://developers.openai.com/codex/
- Codex skills: https://developers.openai.com/codex/skills/

## Mapping stack
- CesiumJS: https://cesium.com/platform/cesiumjs/
- MapLibre GL JS examples: https://maplibre.org/maplibre-gl-js/docs/examples/
- Mapbox globe limitations: https://docs.mapbox.com/mapbox-gl-js/guides/globe/
- deck.gl GlobeView: https://deck.gl/docs/api-reference/core/globe-view

## Geospatial infrastructure
- PostGIS: https://postgis.net/
- PostGIS spatial indexes: https://postgis.net/documentation/faq/spatial-indexes/
- H3: https://h3geo.org/docs/
- Elasticsearch geo_shape: https://www.elastic.co/docs/reference/elasticsearch/mapping-reference/geo-shape
- Redis geospatial: https://redis.io/docs/latest/develop/data-types/geospatial/
- Supabase Realtime / Postgres Changes: https://supabase.com/docs/guides/realtime/postgres-changes

## Global and pilot-market data examples
- Dubai Land Department real estate data: https://dubailand.gov.ae/en/open-data/real-estate-data/
- HM Land Registry Price Paid Data: https://www.gov.uk/government/collections/price-paid-data
- HM Land Registry downloads: https://www.gov.uk/government/statistical-data-sets/price-paid-data-downloads
- Singapore URA property data and statistics: https://www.ura.gov.sg/Corporate/Property/Property-Data
- INSPIRE cadastral parcels: https://knowledge-base.inspire.ec.europa.eu/cadastral-parcels_en
- RESO Web API: https://www.reso.org/reso-web-api/

## Global map data and tile policies
- Overture Maps documentation: https://docs.overturemaps.org/
- Overture Explorer: https://docs.overturemaps.org/getting-data/explore/
- OpenAddresses: https://openaddresses.io/
- OpenStreetMap tile usage policy: https://operations.osmfoundation.org/policies/tiles/

---

# 15. Final instruction to the build team

Build this as a **truthful global intelligence product**, not as a fake-real-time globe.

The technical win is not merely rendering the earth.
The real win is making every visible number answer three questions:
1. What exactly is this?
2. How fresh is it?
3. Why should I trust it?

If the system answers those three questions at every zoom level, the product becomes defensible.
