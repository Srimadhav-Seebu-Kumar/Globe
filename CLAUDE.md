# CLAUDE.md

This file provides guidance for AI assistants working in this repository. See `AGENTS.md` for additional operating principles, and `docs/worldwide_land_intelligence_codex_master_plan.md` as the primary product/engineering source of truth.

## Project Overview

**Globe Land Intelligence** is a worldwide land-intelligence platform — a production-grade monorepo with a Next.js web app (interactive globe/map), a Next.js admin console, a bare TypeScript HTTP API, shared TypeScript packages, and Python microservices. The platform models parcel-level land data globally, with strict provenance, coverage tiering, and legal-display enforcement.

## Repository Structure

```
Globe/
├── apps/
│   ├── web/        # User-facing globe/map product (Next.js 15, port 3000)
│   ├── admin/      # Ingestion/review operations console (Next.js 15, port 3001)
│   └── api/        # Typed HTTP API surface (bare Node.js, port 4000)
├── packages/
│   ├── types/      # Canonical domain enums and contract interfaces
│   ├── geo/        # Geospatial utility helpers
│   ├── ui/         # Reusable React primitives (ShellPanel, dark theme)
│   └── config/     # Cross-service constants and rollout defaults
├── services/
│   ├── ingestion/  # Python 3.11 market adapter + provenance pipeline
│   └── valuation/  # Python 3.11 estimate engine + model versioning
├── db/
│   └── migrations/ # PostgreSQL/PostGIS schema (0001_init.sql)
├── infra/
│   ├── docker/     # Multi-stage Dockerfiles per service
│   ├── aws/        # AWS App Runner bootstrap scripts
│   └── docker-compose.yml  # Local dev infrastructure
├── docs/           # Architecture, plans, rollout framework, execution logs
├── .github/workflows/  # GitHub Actions CI/CD (deploy per service)
├── .env.example    # Environment variable template
└── AGENTS.md       # Operating manual (read this alongside CLAUDE.md)
```

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15.2.0, React 18.3.1, MapLibre-GL 5.3.0 |
| API | Bare Node.js HTTP, TypeScript 5.8.2 |
| Shared packages | TypeScript (strict, ES2022) |
| Python services | Python 3.11+, pytest |
| Database | PostgreSQL 16 + PostGIS 3.4 |
| Cache / Queue | Redis 7.4 |
| Search | OpenSearch 2.17.0 |
| Object storage | MinIO (S3-compatible) |
| Runtime | Node.js >= 20.11.0, npm >= 10.0.0 |
| Deployment | Docker, AWS App Runner, GitHub Actions |

## Development Commands

All commands run from the repo root unless noted.

```bash
# Setup
npm install

# Development servers (packages are built first automatically)
npm run dev:web        # web app at http://localhost:3000
npm run dev:admin      # admin app at http://localhost:3001
npm run dev:api        # API server at http://localhost:4000

# Quality checks (run all before committing)
npm run lint           # TypeScript type checking across all workspaces
npm run typecheck      # Dedicated typecheck pass
npm run test           # All workspace tests

# Build
npm run build:packages # Build packages/* first (required before apps)
npm run build:apps     # Build apps/* (requires packages built)
npm run build          # Full pipeline: packages → apps

# Local infrastructure (Postgres, Redis, OpenSearch, MinIO)
docker compose -f infra/docker-compose.yml up -d

# Python services (run from service directory)
cd services/ingestion && pip install -e ".[dev]" && pytest
cd services/valuation && pip install -e ".[dev]" && pytest
```

**Build order matters:** `packages/*` must be built before `apps/*`. The root scripts enforce this automatically; individual workspace commands do not.

## Architecture Guardrails

These are non-negotiable constraints. Do not violate them.

1. **Coverage tiers are explicit** — Never imply global coverage. Always express coverage as one of: `tier_a_global_visibility`, `tier_b_market_depth`, `tier_c_parcel_depth`. Parcel-level UI (tier C) is gated per-market.

2. **Price states stay separated** — The four canonical states are `ask`, `closed`, `estimate`, `broker_verified`. Do not mix, merge, or create new ones without a types package update.

3. **Provenance is mandatory on every observable** — Every datum must carry: `source`, `observed_at`, `ingested_at`, and transform version. Do not store or return data without provenance.

4. **Legal display policy enforced before go-live** — Licensing metadata is required, not optional. Parcel data must be masked (`legalDisplayOnly=true` path) until policy passes onboarding checks. The API redacts parcel titles to `"Restricted parcel"` and omits canonical IDs by default.

5. **Incremental market rollout** — Never hardcode single-market assumptions. Use the tier A/B/C gating framework defined in `docs/market-rollout-framework.md`.

6. **PostgreSQL/PostGIS is canonical truth** — Redis, OpenSearch, and in-memory data are derived indexes. They must be reproducible from the DB. Never treat a derived layer as the source of record.

7. **MapLibre is the map stack** — Avoid production dependencies on public OSM-hosted tiles. Use self-hosted or commercial tile sources.

## Key Domain Contracts (`packages/types`)

```typescript
// Canonical enums — add values only with explicit types package version bump
PRICE_STATES      = ["ask", "closed", "estimate", "broker_verified"]
COVERAGE_TIERS    = ["tier_a_global_visibility", "tier_b_market_depth", "tier_c_parcel_depth"]
FRESHNESS_TIERS   = ["realtime", "daily", "weekly", "stale"]
CONFIDENCE_LABELS = ["low", "medium", "high", "verified"]

// Every observable carries this
interface ProvenanceStamp {
  source: string;
  observed_at: string;    // ISO 8601
  ingested_at: string;    // ISO 8601
  transform_version: string;
}
```

Adding new enum values requires updating `packages/types`, bumping its version, and aligning any dependent migrations in `db/migrations/`.

## API Design Conventions (`apps/api`)

- **Auth**: Stateless signed bearer tokens. Validate via `src/auth.ts`. Admin routes require valid token; return `401` with `{"error": "unauthorized"}` on failure.
- **Filtering**: Query params for `coverage`, `state`, `confidence`, `marketId`, `legalDisplayOnly`. Always apply legal-display masking when `legalDisplayOnly=true`.
- **Pagination**: All list endpoints return `{ data: T[], meta: { limit, hasMore, offset } }`.
- **Errors**: Uniform `{ error: string, code?: string }` with appropriate HTTP status codes.
- **Request limits**: 1MB payload limit enforced in `src/server.ts`. Content-Type must be `application/json` for POST requests.
- **CORS**: Controlled by `APP_ALLOWED_ORIGINS` env var. Do not hardcode origins.
- **No frameworks**: The API uses bare Node.js `http` module. Do not introduce Express, Fastify, or similar without explicit approval.

## Frontend Conventions (`apps/web`, `apps/admin`)

- **Next.js App Router** — Use the `app/` directory. Server components by default; add `"use client"` only where needed.
- **MapLibre dynamic import** — `globe-canvas.tsx` must stay `ssr: false` to avoid server-side MapLibre errors.
- **Security headers** — CSP, HSTS, X-Frame-Options, Permissions-Policy are set in `next.config.mjs`. Do not relax them without a documented reason.
- **Admin auth** — Bearer token stored in `sessionStorage`. Any `401` response must trigger logout. No token in `localStorage` or cookies.
- **Dark theme** — Slate palette: bg `#0f172a`, text `#e2e8f0`. Use `@globe/ui` primitives for panels.
- **API proxying** — Frontend calls go through Next.js rewrites to `/api/*` → backend. Do not call the API directly from client code with hardcoded ports.

## Testing Conventions

- **Framework**: Node.js native `node:test` + `node:assert/strict`. No Jest, Vitest, or Mocha.
- **File pattern**: `test/**/*.test.ts` (TypeScript workspaces), `tests/test_*.py` (Python services).
- **Test command**: Per workspace via `npm run test`; root `npm run test` runs all.
- **What to test**:
  - Enum canonicality (types package)
  - Coordinate validation edge cases (geo package)
  - API: filtering, pagination, auth enforcement, legal-display masking, intake persistence
  - Router: route matching correctness
  - Smoke tests for web/admin/python services
- **Legal-display masking test**: Any new parcel or listing endpoint must have a test asserting that `legalDisplayOnly=true` redacts sensitive fields.

## Definition of Done

Before marking any change complete:

1. **Domain contracts aligned** — If `packages/types` changed, DB migrations are updated to match.
2. **Coverage/confidence/freshness reflected** — API, web, and admin behavior respects tier constraints.
3. **All checks pass** — `npm run lint && npm run typecheck && npm run test && npm run build` exits 0.
4. **Documentation log updated** — Add an entry to `docs/documentation.md` describing what changed and how it was verified.

## Environment Variables

Copy `.env.example` to `.env` for local development. Key variables:

| Variable | Purpose | Default |
|---|---|---|
| `POSTGRES_URL` | PostgreSQL connection | `postgres://postgres:postgres@localhost:5432/globe` |
| `REDIS_URL` | Redis connection | `redis://localhost:6379` |
| `OPENSEARCH_URL` | OpenSearch endpoint | `http://localhost:9200` |
| `OBJECT_STORAGE_*` | MinIO/S3 credentials | See `.env.example` |
| `APP_OPERATOR_EMAIL` | Admin login email | — |
| `APP_OPERATOR_PASSWORD` | Admin login password | — |
| `APP_AUTH_TOKEN_SECRET` | Token signing secret | — |
| `APP_ALLOWED_ORIGINS` | CORS origins (comma-separated) | `localhost:3000,localhost:3001` |
| `APP_SESSION_TTL_MINUTES` | Token expiry | `120` |
| `APP_TRUST_PROXY` | Proxy header trust | `false` (dev) |

## Security Practices

- **No hardcoded secrets** — All secrets via environment variables. Never commit `.env`.
- **Constant-time comparison** — Use `crypto.timingSafeEqual` for token/password comparison (`src/auth.ts`).
- **Input validation** — Validate JSON body structure and content-type at the server boundary (`src/server.ts`).
- **Non-root containers** — All Dockerfiles run as a non-root user. Preserve this.
- **CSP must not be weakened** — In particular, do not add `unsafe-inline` script sources or broaden `connect-src` beyond what MapLibre requires.
- **Parcel redaction** — Default API behavior masks parcel data. Tests must assert this. Do not disable redaction without explicit legal-display policy clearance.

## Deployment

- **CI/CD**: `.github/workflows/deploy-*.yml` — one workflow per service. Each builds, pushes to ECR, and deploys via AWS App Runner.
- **Docker**: Multi-stage builds. Builder stage compiles TypeScript; runner stage copies `dist/`. Always `NODE_ENV=production` in runner.
- **Branch model**: Feature branches merge to main; deployments trigger from main via GitHub Actions.

## Common Pitfalls

- Running `npm run dev -w @globe/web` without first building packages will fail with missing module errors. Always run `npm run build:packages` first, or use the root `npm run dev:web` which does this automatically.
- The API `src/data.ts` uses in-memory seeded data for development. It is not connected to PostgreSQL. Production data layer is not yet wired up; do not assume DB connectivity in the API.
- `apps/admin` stores session tokens in `sessionStorage`, not cookies. The admin console does not work across browser tabs by design.
- Python services use `pyproject.toml`, not `requirements.txt`. Install with `pip install -e ".[dev]"` from the service directory.
- MapLibre requires `{ ssr: false }` dynamic import. If you add any map-dependent component, ensure it is client-only.
