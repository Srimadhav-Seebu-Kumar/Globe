# AGENTS.md

## Purpose
Production-grade worldwide land-intelligence platform scaffold.
Use `docs/worldwide_land_intelligence_codex_master_plan.md` as the primary product/engineering source of truth.

## Repo structure
- `apps/web`: end-user globe/map product (Next.js)
- `apps/admin`: ingestion/review operations console (Next.js)
- `apps/api`: typed HTTP API surface (TypeScript)
- `services/ingestion`: Python ingestion and normalization pipeline
- `services/valuation`: Python valuation/model service
- `packages/types|geo|ui|config`: shared contracts/utilities
- `db`: SQL migrations and schema evolution
- `infra`: local infra compose scaffold
- `docs`: architecture, plans, rollout, and execution logs

## Commands
- Install: `npm install`
- Lint: `npm run lint`
- Typecheck: `npm run typecheck`
- Test: `npm run test`
- Build: `npm run build`
- Dev web: `npm run dev:web`
- Dev admin: `npm run dev:admin`
- Dev api: `npm run dev:api`

## Architecture guardrails
- Never imply parcel-level global coverage; enforce explicit coverage tiers A/B/C.
- Keep pricing states separated: `ask`, `closed`, `estimate`, `broker_verified`.
- Preserve provenance on every observable object: source, observed_at, ingested_at, transform version.
- Treat licensing/legal display policy as mandatory before market go-live.
- Design for incremental market rollout; avoid hardcoding single-market assumptions.
- Keep Postgres/PostGIS as canonical truth; derived indexes/search layers must be reproducible.

## Definition of done for changes
- Domain contract updates (`packages/types`) and migration updates are aligned.
- API/web/admin behavior reflects coverage + confidence + freshness constraints.
- Tests and static checks pass (`lint`, `typecheck`, `test`, `build`).
- `docs/documentation.md` log is updated with what changed and verification results.
