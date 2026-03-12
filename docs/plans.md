# Plans

## Phase 0 (completed in this scaffold)
- Monorepo structure and baseline tooling.
- Foundational docs and operating guardrails.
- Initial PostGIS schema/migration plan.
- Product, admin, API, ingestion, and valuation skeletons.

## Phase 1
- Implement source registry UI + API backed by `source` table.
- Add market onboarding flow with legal display checklist.
- Introduce ingestion run persistence and source health metrics.

## Phase 2
- Build world cell/heatmap pipeline and vector tile publishing.
- Add market drill-down API and map layer orchestration.
- Add search indexing pipeline for market/geography/parcel/listing entities.

## Phase 3
- Enable parcel dossiers for Tier C markets.
- Implement watchlists/alerts end-to-end.
- Deliver valuation v1 (`estimate`) with explainability payloads.

## Phase 4
- Add review queue operations (dedupe, geocode, policy conflicts).
- Ship broker/developer verification workflows.
- Add observability, SLOs, and market rollout scorecards.
