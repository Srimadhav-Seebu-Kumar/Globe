# CLAUDE.md — Globe Engineering Guide

**Repo:** Globe Land Intelligence (monorepo) · **Audience:** any coding agent or engineer working in this repo.

This is the engineering law for building Globe from its current prototype to the worldwide land-intelligence platform. It tells you *how* to build. It deliberately does **not** enumerate the backlog — that lives in one place.

## How the docs fit together (read in this order)

1. **`claude.md`** (this file) — principles, architecture, DRY/reuse law, coding standards, definition of done, and the Phase 0 stabilization list.
2. **`feature-list.json`** — the single machine-readable source of truth for the backlog: 23 epics / 111 features across V1–V5, every reusable module, dependencies, and acceptance criteria. **Pick work from here.**
3. **`AGENTS.md`** — repo commands and architecture guardrails (authoritative for build/test commands).
4. **`docs/worldwide_land_intelligence_codex_master_plan.md`** — the long-form rationale behind the foundation epics (E0–E10).
5. **`docs/globe-future-state-analysis.md`** — the 5–10 year vision behind the advanced epics (E11–E21).

> **DRY for docs too:** if a fact about the backlog belongs in `feature-list.json`, do not copy it here. Reference the feature id (e.g. `F-E4-06`). If a build command belongs in `AGENTS.md`, reference it, don't fork it.

---

## 1. North star and product principles

**Mission:** make every square meter of Earth legible — priced, understood, and tradable. **Product:** the Bloomberg Terminal for the physical world.

Ten non-negotiable principles (from the master plan). Every feature must honor them:

1. Never show one undifferentiated price — always separate `ask`, `closed`, `estimate`, `broker_verified`.
2. Always show **freshness, source, and confidence** on every observable datum.
3. Worldwide map first, market truth second, parcel truth last — enforce coverage tiers A/B/C; never imply parcel-level global coverage.
4. At low zoom use aggregated cells; at high zoom use boundaries and listings.
5. No market goes live until its legal display policy is documented and enforced.
6. Do not depend on public OSM/demo tiles in production.
7. Every market adapter defines units, currency, tenure, zoning mapping, freshness, and licensing.
8. Every data source has lineage and a display policy.
9. The UI explains uncertainty instead of hiding it.
10. Keep Postgres/PostGIS as canonical truth; every derived index/search/tile/embedding must be reproducible from it.

---

## 2. Architecture and guardrails

```
Globe (npm workspaces monorepo)
├── apps/web/        Next.js user product (3D globe, MapLibre)        @globe/web
├── apps/admin/      Next.js operator console                         @globe/admin
├── apps/api/        Typed HTTP API (table-driven router)             @globe/api
├── services/ingestion/  Python ETL / connector + market adapters
├── services/valuation/  Python valuation / model service
├── packages/types/  Domain enums, provenance, ALL DTOs              @globe/types
├── packages/geo/    Geospatial math (coords, H3, distance, bbox)    @globe/geo
├── packages/config/ Cross-service constants + env schema            @globe/config
├── packages/ui/     Shared React components + design tokens         @globe/ui
├── db/migrations/   PostGIS canonical schema
├── infra/           Docker, compose, AWS, CI
└── docs/            Plans, architecture, this analysis
```

**Guardrails (from `AGENTS.md`) — these are hard constraints:**
- Enforce explicit coverage tiers A/B/C; never imply parcel-level global coverage.
- Keep pricing states separated: `ask`, `closed`, `estimate`, `broker_verified`.
- Preserve provenance on every observable object: source, observed_at, ingested_at, transform version, confidence.
- Treat licensing/legal display policy as mandatory before market go-live.
- Design for incremental market rollout; avoid hardcoding single-market assumptions.
- Postgres/PostGIS is canonical; derived layers must be reproducible.

---

## 3. The DRY and reusability law (read before writing any code)

**Build each capability exactly once, expose it from a shared module, and reuse it everywhere. Duplication is a defect that fails review.**

`feature-list.json` → `conventions.reusableModules` is the catalog of the 24 canonical building blocks (id, path, responsibility, status, who reuses it). Before implementing anything:

1. Resolve every id in the feature's `reuses` array to its module and **extend that module** — never re-implement its responsibility inline.
2. When you create a new shared capability, **register it** in `reusableModules` and list it in the feature's `produces`.
3. Shared logic lives in a `package` or `service`, never copy-pasted into an app.

**Concrete anti-duplication rules:**

| Concern | Single home | Rule |
|---|---|---|
| Domain enums, provenance, DTOs | `@globe/types` (`types.domain`, `types.contracts`) | Apps import them. Re-declaring a DTO in `apps/web` or `apps/admin` is a build-blocking defect (the audit found exactly this — fix it). |
| Geospatial math | `@globe/geo` (`geo.coords`, `geo.h3`) | No app computes coordinates/H3/distance inline. |
| Constants + env validation | `@globe/config` (`config.constants`, `config.env`) | One typed env schema, validated at startup. |
| Shared UI + tokens | `@globe/ui` (`ui.components`, `ui.tokens`) | Apps compose primitives; never re-style chips/badges/legends/drawers. |
| HTTP plumbing | `api.router` | Endpoints are `RouteDefinition` entries; reuse `writeJson`, `statusResolver`, parse helpers. Never hand-roll CORS/headers/parsing per handler. |
| Persistence | `api.store` | One durable store + async write-queue. The three file stores collapse into it. |
| Legal display / provenance masking | `api.policy` | One adapter applied to every outbound object. No handler reads raw data arrays directly. |
| Per-market behavior | `ingest.marketAdapter` | Behind the adapter interface; market code never leaks into core. |
| Freshness/confidence scoring | `scoring.confidence` | One engine consumed by API, tiles, valuation, and UI. |

---

## 4. Coding standards

- **TypeScript:** strict mode, ES2022, no implicit `any`. Type at module boundaries; prefer `unknown` + narrowing over `any` (the audit found `EMPTY_GRID_FILTER: any` — fix).
- **Security (mandatory, non-negotiable):** parameterized queries only; validate all input against allowlists (type, format, length, range); password hashing with Argon2id/scrypt/bcrypt (cost ≥ 12) — never SHA-256; constant-time comparisons for secrets; never log secrets/PII; fail securely (deny by default); rate-limit every auth/mutation endpoint; secrets via env/secret-manager, never hardcoded.
- **Comments:** explain non-obvious intent, trade-offs, or constraints only. Never narrate what code does. Never describe a change in a comment.
- **Errors:** generic messages to clients, detailed logs server-side; never leak stack traces.
- **Tests:** every feature ships with tests (Node native test runner for TS; pytest for Python). New behavior is covered before it is "done".
- **Files:** edit existing files over creating new ones; never create `.md` files unless explicitly requested; never touch `.github/`.

---

## 5. The build backlog → use `feature-list.json`

The backlog is **not** in this file. To choose and execute work:

1. Open `feature-list.json`. Pick the lowest-`version`, highest-`priority` feature whose `dependsOn` are all `status: "done"`.
2. **Phase 0 (`E-STABILIZE`) comes first** — the prototype is not safe for real users until those land (see §6).
3. Read the feature's `reuses` and extend those modules (see §3).
4. Satisfy every item in the feature's `acceptance`, then the global `definitionOfDone`.
5. Update the feature `status` and register anything new in `reusableModules` / `produces`.

Status values: `done` · `prototype` (exists on mock/file data — must be hardened) · `in_progress` · `todo` · `blocked`. Phases map to product versions: **P0→V1, P1→V2, P2→V3, P3→V4–V5.**

---

## 6. Phase 0 — Known critical issues (fix before real users)

These are the audit findings, preserved. Each maps to a feature in `feature-list.json` (epic `E-STABILIZE`). **No production launch with any Critical item open.**

| Sev | Issue | Location | Fix | Feature |
|---|---|---|---|---|
| Critical | `exportMemo` bypasses legal display policy — returns un-redacted restricted parcels | `apps/api/src/handlers.ts:921-986` | Apply `maskParcelForPolicy`; 403 on any REDACTED parcel | F-STB-01 |
| Critical | Passwords hashed with SHA-256 (fast digest) | `apps/api/src/user-store.ts:47-49` | Argon2id / scrypt; re-hash legacy on login | F-STB-02 |
| Critical | Hash comparison with `!==` (timing attack) | `apps/api/src/user-store.ts:215-216` | `crypto.timingSafeEqual` over buffers | F-STB-03 |
| Critical | Stores default to ephemeral `/tmp` in prod — data lost on deploy | `user-store.ts:27-29`, `intake-store.ts:11-13`, `review-store.ts:17-20` | Require store path/DB in prod; one durable store | F-STB-04 |
| Critical | Token secret falls back to operator password / ephemeral random | `apps/api/src/auth.ts:46-61` | Require `APP_AUTH_TOKEN_SECRET`; fail fast in prod | F-STB-06 |
| Major | User session TTL hardcoded to 12h (ignores env) | `handlers.ts:673-674, 729-730` | Use `getSessionTtlMs()` | F-STB-08 |
| Major | User login has zero rate limiting (brute-force) | `handlers.ts:655-704` | Shared `clientKey` limiter on login + register | F-STB-07 |
| Major | Synchronous `writeFileSync` blocks the event loop | three stores | Async serialized write-queue | F-STB-05 |
| Major | No write-locking — concurrent writes corrupt the store | `user-store.ts`, `intake-store.ts` | Single-promise write queue | F-STB-05 |
| Major | CSP `connect-src` allows `http://localhost:4000` in prod | `apps/web/next.config.mjs:19` | Gate behind `NODE_ENV === 'development'` | F-STB-10 |
| Major | No max length on free-text fields (1MB writes) | `handlers.ts:179-252` | Max-length guards in parse helpers | F-STB-09 |
| Major | `compareParcels` uncapped input ids | `handlers.ts:882-919` | Cap at 20; 400 on excess | F-STB-09 |
| Major | `listing.price_state` CHECK excludes `'closed'` | `db/migrations/0001_init.sql:147` | Add `'closed'` or document intent | F-STB-10 |
| Minor | `sanitizeAlert` is a no-op | `handlers.ts:160-162` | Implement or remove | F-STB-10 |
| Minor | Masked parcels emit `center {0,0}` (detectable sentinel) | `handlers.ts:145-158` | Omit `center` or use market centroid | F-STB-10 |
| Minor | MapLibre demo font/tile endpoint | `apps/web/components/globe-canvas.tsx:152` | Self-host glyphs/tiles | F-STB-10 |
| Minor | `EMPTY_GRID_FILTER: any` | `globe-canvas.tsx:146` | Type as `FilterSpecification` | F-STB-10 |
| Minor | Dead `localStorage.removeItem` (token is sessionStorage) | `apps/admin/app/page.tsx:116, 266` | Remove dead code | F-STB-10 |
| Minor | Weak email validation (`includes('@')`) | `handlers.ts:302, 405, 426` | Minimal email regex | F-STB-09 |
| Minor | `OPTIONS` returns 204 without route resolution | `apps/api/src/server.ts:78-80` | Resolve route before responding | F-STB-09 |

---

## 7. Definition of done

Mirrors `feature-list.json` → `definitionOfDone`. A change is done only when:

- Code is in the correct package/service (shared logic in a package, not an app) and every `reuses` module was extended, not duplicated.
- `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build` all pass.
- Provenance + legal-display behavior is handled for any user-facing datum.
- Tests/fixtures added; UI changes have screenshots; `docs/documentation.md` log updated.
- Every `acceptance` item for the feature is verifiably true.

A **market** is done only when its source/license is registered, adapter implemented + tested, QA green, coverage tier assigned, badges + trust metadata render, legal policy enforced, and a support owner exists.

---

## 8. Commands (authoritative list in `AGENTS.md`)

```
npm install            # install workspace deps
npm run lint           # lint all workspaces
npm run typecheck      # typecheck all workspaces
npm run test           # run all tests
npm run build          # build packages then apps
npm run dev:web        # user app (port 3000)
npm run dev:admin      # operator console (port 3001)
npm run dev:api        # API (port 4000)
```

Always run `lint`, `typecheck`, and `test` before claiming a feature is complete — evidence before assertions.

