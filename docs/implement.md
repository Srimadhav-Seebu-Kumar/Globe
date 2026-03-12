# Implement

## Implementation defaults
- TypeScript strict mode stays enabled across apps/packages.
- API contracts evolve through `packages/types` before endpoint expansion.
- Database changes are append-only via new migration files in `db/migrations`.
- Ingestion and valuation logic stay Python-first, separated from API orchestration.

## Build order for feature work
1. Update domain contract (`packages/types`) and migration if needed.
2. Implement API route contract and tests.
3. Add web/admin integration with explicit coverage/freshness/confidence UX.
4. Add ingestion/valuation integration and provenance updates.
5. Update docs and rollout policy references.

## Quality gates per task
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`

## Non-negotiables
- Never collapse price states into a single ambiguous number.
- Never imply parcel-level completeness for markets without Tier C readiness.
- Never surface source-derived data without provenance and legal-display context.
