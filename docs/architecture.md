# Architecture

## Platform shape
- Monorepo with Next.js apps (`web`, `admin`), TypeScript API, shared TS packages, and Python services.
- Spatial source of truth in Postgres + PostGIS.
- Redis for caching, queue primitives, and rate limits.
- OpenSearch for global text + geo retrieval.
- S3-compatible object storage for `raw/`, `normalized/`, `tiles/`, and `exports/` data zones.

## Runtime components
- `apps/web`: user-facing globe/map product shell with coverage-aware UX.
- `apps/admin`: ingestion/source health and review workflow shell.
- `apps/api`: typed HTTP route surface for markets/parcels/listings/alerts.
- `services/ingestion`: market adapter + provenance pipeline skeleton.
- `services/valuation`: estimate engine skeleton and model versioning boundary.

## Shared packages
- `packages/types`: canonical domain enums and contract types.
- `packages/geo`: geo utility helpers for spatial operations.
- `packages/ui`: reusable React primitives for panel-level UI scaffolding.
- `packages/config`: cross-service constants and rollout defaults.

## Data architecture guardrails
- Coverage is explicit (`tier_a_global_visibility`, `tier_b_market_depth`, `tier_c_parcel_depth`).
- Price states remain separated (`ask`, `closed`, `estimate`, `broker_verified`).
- Every observable datum must support provenance (`source`, `observed_at`, `ingested_at`, transform version).
- Licensing and legal display policy are modeled as required metadata, not optional docs.
- Parcel-level experience is enabled market-by-market where policy + geometry quality pass onboarding checks.

## Delivery posture
- Optimize for incremental market rollout with strict gating.
- Prefer typed contracts and adapters over ad-hoc one-off integrations.
- Keep map stack MapLibre-first and avoid production dependency on public OSM-hosted tiles.
