# Code Review & Audit Report
**Date:** 2026-03-28
**Repo:** Globe Land Intelligence (monorepo)

---

## Project Overview

### Architecture
A TypeScript/Node.js monorepo for a worldwide land-intelligence platform. Three deployed services communicate through a shared API:

```
Globe (monorepo root, npm workspaces)
├── apps/api/          — Raw Node.js HTTP API (port 4000), TypeScript, no framework
├── apps/web/          — Next.js 15 user-facing app (port 3000), MapLibre GL 3D globe
├── apps/admin/        — Next.js 15 operator dashboard (port 3001)
├── packages/types/    — Shared domain types & enums (@globe/types)
├── packages/geo/      — Geospatial utilities (@globe/geo)
├── packages/config/   — Cross-service config (@globe/config)
├── packages/ui/       — Shared React components (@globe/ui)
├── services/ingestion/ — Python 3.11 ingestion pipeline (scaffold)
├── services/valuation/ — Python 3.11 valuation model (scaffold)
├── db/migrations/     — PostgreSQL + PostGIS schema
└── infra/             — Docker, docker-compose, AWS App Runner, GitHub Actions CI/CD
```

### Tech Stack
- **API:** Raw Node.js HTTP, TypeScript 5.8, tsx runtime, ES2022, strict mode
- **Frontend:** Next.js 15, React 18.3.1, MapLibre GL 5.3.0
- **Auth:** Custom HMAC-SHA256 tokens (JWT-like, `payload.signature` format)
- **Persistence:** File-based JSON (dev/staging), PostgreSQL + PostGIS schema (production-ready)
- **Infrastructure:** Docker (alpine), AWS App Runner, ECR, OIDC federation, GitHub Actions
- **Testing:** Node native test runner, 17 API tests (smoke + unit)

### Data Flow
1. User/operator authenticates via `POST /v1/auth/login` → receives HMAC-signed token
2. Frontend (web/admin) stores token in sessionStorage, includes as `Authorization: Bearer`
3. API validates token on every request, checks role for admin routes
4. Data currently served from in-memory mock fixtures (`apps/api/src/data.ts`)
5. User workspace (saved searches, watchlists, inquiries) persisted to JSON files

---

## Bugs & Issues

### Critical

- **[apps/api/src/handlers.ts:921-986]** — **`exportMemo` bypasses the legal display policy.** The `/v1/export/memo` endpoint calls `parcels.find()` directly from the raw data array without applying `maskParcelForPolicy`. A user can supply the ID of a parcel with `legalDisplayAllowed: false` and receive the full un-redacted data including `canonicalParcelId`, real area, zoning code, and actual price history. **Live-verified:** parcel `p-ldn-001` (London, `legalDisplayAllowed: false`) returns `Parcel ID: GB-LON-E14-42`, `Area: 1900`, `Zoning: CAZ-COM` via this endpoint. Fix: apply `maskParcelForPolicy` to each parcel before including it in the memo, and return a 403 if any resulting parcel is `canonicalParcelId === "REDACTED"`.

- **[apps/api/src/user-store.ts:47-49]** — **Password hashing uses SHA-256, not a password-hashing algorithm.** SHA-256 is a general-purpose digest function — it's extremely fast and makes offline brute-force attacks trivial. The entire `users` array is stored in a flat JSON file so a single read grants access to all salted hashes. Fix: replace with `bcrypt` (cost factor ≥ 12), `argon2id`, or `scrypt` via `node:crypto.scrypt`.

- **[apps/api/src/user-store.ts:215-216]** — **Hash comparison with `!==` is timing-attack-vulnerable.** `if (attemptedHash !== user.passwordHash)` leaks timing information. Fix: use `timingSafeEqual` (already imported via `node:crypto` in auth.ts) after converting both hex strings to Buffers.

- **[apps/api/src/user-store.ts:27-29, intake-store.ts:11-13, review-store.ts:17-20]** — **Production store defaults to `/tmp/`.** All three JSON stores default to `/tmp/globe-*.json` in production. On AWS App Runner (and any container environment), `/tmp` is ephemeral and is wiped on every deployment or container restart. **All registered users, intake submissions, and review decisions will be silently lost.** The service starts fresh each deploy with no data. Fix: require `APP_USER_STORE_FILE` / `APP_INTAKE_STORE_FILE` / `APP_REVIEW_STORE_FILE` to be explicitly set in production, or (better) migrate to the PostgreSQL schema that already exists.

- **[apps/api/src/auth.ts:46-61]** — **Token secret falls back to `APP_OPERATOR_PASSWORD`, then to an ephemeral in-memory random.** If `APP_AUTH_TOKEN_SECRET` is unset, the operator password becomes the signing secret — exposing one credential compromises both. If neither is set, a random secret is generated at startup and discarded on restart, invalidating all issued tokens. Fix: require `APP_AUTH_TOKEN_SECRET` to be set; fail fast at startup if it's missing in production (`NODE_ENV === 'production'`).

### Major

- **[apps/api/src/handlers.ts:673-674, 729-730]** — **User session TTL is hardcoded to 12 hours** (`1000 * 60 * 60 * 12`) while the operator TTL respects `APP_SESSION_TTL_MINUTES`. The env variable has no effect on user tokens. Fix: use `getSessionTtlMs()` (already exported from auth.ts) in the `login` and `register` handlers.

- **[apps/api/src/handlers.ts:655-704]** — **User login has zero rate limiting.** The `login()` handler tries `authenticateUserAccount` first. If that returns `null`, it then calls `loginWithCredentials` (which is rate-limited). But if a registered user account exists for a given email, `loginWithCredentials` is never reached, so unlimited brute-force attempts are possible against user accounts. **Live-verified:** 20 consecutive failed login attempts with wrong password all return 401 — no 429 is ever issued. Fix: apply a parallel rate-limit map keyed on `clientKey` for user logins, or unify login paths before branching.

- **[apps/api/src/user-store.ts:163-165, intake-store.ts:65-68, review-store.ts:59-62]** — **Synchronous `writeFileSync` on every mutation blocks the Node.js event loop.** All three stores call `writeFileSync` synchronously from within request handlers. Under any concurrent load this stalls all other pending I/O. Fix: use `writeFile` (async) with a queue/promise chain to serialise writes without blocking.

- **[apps/api/src/user-store.ts, intake-store.ts]** — **No file-write locking; concurrent writes corrupt the store.** Two simultaneous POST requests both read the in-memory array, append, and write to disk. The second write overwrites the first — one record is lost. No mutex or write queue exists. Fix: use an async write queue (a single `Promise` chain) to serialize all writes.

- **[apps/web/next.config.mjs:19]** — **CSP `connect-src` includes `http://localhost:4000` unconditionally** in both dev and production builds. This is a CSP misconfiguration — production pages allow connections to localhost. Fix: gate this behind `process.env.NODE_ENV === 'development'` just like the `unsafe-eval` directive above it.

- **[apps/api/src/handlers.ts:179-218, 220-252]** — **No maximum string length on free-text fields.** Fields like `name`, `query`, `label`, `message`, `fullName`, `company`, `details` are validated for type and trimmed but have no upper-length bound. Combined with the 1 MB body limit, a single field like `details` could be ~1 MB of text written to the JSON store on every submission. Fix: add max-length guards (e.g. `name.length > 200`, `details.length > 4000`) in all parse helpers.

- **[db/migrations/0001_init.sql:147]** — **`listing` table `price_state` CHECK constraint excludes `'closed'`.** The constraint is `CHECK (price_state IN ('ask', 'estimate', 'broker_verified'))` but `closed` is a valid enum member. Closed price records cannot be inserted into `listing`. (The intent is they go in `transaction`, but the constraint silently rejects valid data if code ever inserts a closed listing.) Fix: either add `'closed'` to the CHECK or add a comment making the intent explicit.

- **[apps/api/src/handlers.ts:882-919]** — **`compareParcels` has no limit on input IDs.** `parseMultiValue(url, "parcelId")` already deduplicates, but nothing caps the total count. A request with 500 parcel IDs triggers 500 linear scans of the `listings` array for each. Fix: cap at a reasonable maximum (e.g. 20) and return 400 for excess.

### Minor

- **[apps/api/src/handlers.ts:160-162]** — **`sanitizeAlert` is a no-op.** The function just spreads the alert unchanged (`return { ...alert }`). It's called on line 574 but provides no actual sanitization. Remove it or add real field filtering.

- **[apps/api/src/handlers.ts:145-158]** — **`maskParcelForPolicy` sets `center: { lng: 0, lat: 0 }` for restricted parcels.** Coordinates `0,0` are a real geographic location (equator/prime meridian) and a widely recognized "null island" sentinel. Clients could detect which parcels are restricted by checking for this coordinate. Fix: omit `center` from the response entirely for restricted parcels, or set it to the market centroid.

- **[apps/web/components/globe-canvas.tsx:146]** — **`EMPTY_GRID_FILTER` typed as `any`.** `const EMPTY_GRID_FILTER: any = ["==", ["get", "gridId"], ""]`. Fix: use `maplibregl.FilterSpecification` or `unknown[]`.

- **[apps/web/components/globe-canvas.tsx:152]** — **MapLibre font URL points to demo endpoint.** `glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf"` is the MapLibre demo tile server, not intended for production traffic. Fix: self-host glyphs or use a licensed tile provider URL.

- **[apps/admin/app/page.tsx:116, 266]** — **`localStorage.removeItem` called with the `SESSION_STORAGE_KEY` name but token is only ever stored in `sessionStorage`.** The localStorage.removeItem calls are dead code. Fix: remove them.

- **[apps/api/src/handlers.ts:302]** — **Email validation accepts strings with `@` anywhere, not valid emails.** `!email.includes("@")` catches `@` but not `a@` or `@b`. Same pattern in `parsePasswordResetPayload` (line 426), `parseIssueReportPayload` (line 405). Fix: use a minimal regex like `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` or a validation library.

- **[apps/api/src/server.ts:78-80]** — **OPTIONS requests respond 204 without route resolution.** Any path receives a 204 for OPTIONS including `/v1/nonexistent`. This leaks CORS capability on non-existent routes. This is low risk but is technically misleading.

- **[apps/api/src/user-store.ts:183]** — **Password minimum length checked after `trim()`** — `password.trim().length < 8`. A password of 8 spaces would be rejected (correct), but a password that is 8 chars with leading/trailing spaces has those stripped before the check. The hash is computed on the un-trimmed value though (`hashPassword(password, salt)` at line 198). This creates an inconsistency: if the user registers with `"  abc123  "` the length check passes on the trimmed value (6 chars) → weak_password rejection. This is actually OK but the trim() in the length check is misleading. Fix: remove the `.trim()` from the length check only (keep it consistent).

---

## Testing Results

| Feature/Flow | Status | Notes |
|---|---|---|
| `GET /health` | ✅ | Returns `{status:"ok"}` correctly |
| `GET /v1/markets` | ✅ | Filters, pagination, minConfidence all work |
| `GET /v1/parcels` | ✅ | Legal-display masking works correctly for list endpoint |
| `GET /v1/listings` | ✅ | State and market filters work |
| `GET /v1/alerts` | ✅ | Market filter and activeOnly work |
| `GET /v1/compare` | ✅ | Returns empty items array with no IDs |
| `POST /v1/auth/register` | ✅ | Creates user, returns token |
| `POST /v1/auth/login` (user) | ✅ | Returns token on success, 401 on fail |
| `POST /v1/auth/login` (operator) | ⚠️ | Returns 503 when `APP_OPERATOR_EMAIL`/`APP_OPERATOR_PASSWORD` not set (expected) |
| Operator rate limiting | ✅ | Triggers after 8 attempts in 10-min window |
| User login rate limiting | ❌ | **Zero rate limiting on user accounts — 20+ failed attempts all return 401** |
| `GET /v1/me` (auth required) | ✅ | Returns user; 401 without token |
| Admin endpoints (role required) | ✅ | Returns 403 for user-role token |
| `POST /v1/export/memo` | ❌ | **Bypasses legal display policy — returns real data for restricted parcels** |
| Large body (>1MB) | ✅ | Returns 413 correctly |
| Malformed JSON body | ✅ | Returns 400 correctly |
| Unauthenticated protected route | ✅ | Returns 401 |
| XSS in query param | ✅ | Reflected only in safe JSON context, no HTML render |
| `GET /v1/brokers` | ✅ | Builds profile from listings correctly |
| `POST /v1/intake/demo-requests` | ✅ | Persists and returns intake item |
| `GET /v1/admin/intake` | ✅ (operator only) | Lists pending submissions |
| Review decision flow | ✅ | Status updated and persisted |

---

## Missing / Gaps

### Security
- [ ] No rate limiting on user account login (brute-force vector)
- [ ] No rate limiting on `POST /v1/auth/register` (spam/enumeration vector)
- [ ] Password hashing must be upgraded from SHA-256 to bcrypt/argon2
- [ ] `APP_AUTH_TOKEN_SECRET` has no validation at startup — silently falls back to insecure defaults
- [ ] `exportMemo` does not apply legal display policy (critical data policy gap)

### Data Durability
- [ ] All three JSON file stores default to `/tmp/` in production — data is destroyed on every deploy
- [ ] No database connection layer — the existing PostgreSQL schema is never used by the API
- [ ] No write-locking on JSON stores — concurrent requests can silently corrupt data
- [ ] No backup or export mechanism for user data

### Observability
- [ ] No structured logging — only `process.stdout.write` on startup
- [ ] No request logging (method, path, status, duration)
- [ ] No error tracking (no Sentry, no CloudWatch integration)
- [ ] No metrics (no Prometheus, no CloudWatch metrics)
- [ ] Docker images have no `HEALTHCHECK` instruction — App Runner cannot health-check the container directly

### Testing
- [ ] No test for the `exportMemo` data-policy bypass (the critical bug above)
- [ ] No test for user login brute-force (rate limiting gap)
- [ ] No test for the `/tmp` production store path
- [ ] No integration tests that start the actual HTTP server
- [ ] No E2E tests (no Playwright/Cypress)
- [ ] No tests for the web app components (React Testing Library)
- [ ] No tests for admin page
- [ ] Python services have only smoke tests; `valuation/main.py` is an empty scaffold

### CI/CD
- [ ] No lint/typecheck step in CI — the deploy workflows build and push without validating code quality
- [ ] No test step in CI — tests never run in the pipeline
- [ ] No staging environment or deployment gate between build and production push
- [ ] `latest` tag is overwritten on every main branch push — no rollback tag strategy

### Documentation
- [ ] `.env.example` has no documentation for `APP_REVIEW_STORE_FILE`, `APP_USER_STORE_FILE`, `APP_INTAKE_STORE_FILE`
- [ ] No API documentation (no OpenAPI/Swagger spec)
- [ ] No documented process for how to swap file-based stores for PostgreSQL in production
- [ ] No CHANGELOG or versioning strategy

### Accessibility & Frontend
- [ ] No `aria-label` on icon buttons in the globe UI
- [ ] No keyboard navigation support for the 3D globe map selection
- [ ] No `<noscript>` fallback — entire UI requires JavaScript
- [ ] All DTOs are re-declared locally in `land-intelligence-app.tsx` and `admin/page.tsx` instead of importing from `@globe/types` or `@globe/api/contracts` — type drift risk

### Infrastructure
- [ ] No index on `listing(parcel_id)` in the database schema — parcel-level listing lookups will be full scans
- [ ] No index on `source_observation(market_id)` — market-level observation queries will be slow
- [ ] The `transaction` table uses a reserved SQL keyword as a table name (quoted as `"transaction"`) — error-prone in raw queries

---

## Future Improvements

### High Priority

1. **Migrate stores to PostgreSQL.** The full schema already exists in `db/migrations/0001_init.sql`. The file-based stores are a single point of failure and will lose all data in production on every deploy. Priority: implement database connection pooling (pg/postgres.js) and port `user-store.ts`, `intake-store.ts`, `review-store.ts` to SQL.

2. **Upgrade password hashing.** Replace SHA-256 with `bcrypt` or `node:crypto.scrypt`. All existing hashed passwords must be re-hashed at next login (detect on login, re-hash and save on success). This is a required security fix before any real users sign up.

3. **Fix the `exportMemo` policy bypass.** Apply `maskParcelForPolicy` to parcels in `exportMemo` and return an appropriate error for restricted parcels. This is a legal/policy compliance issue.

4. **Add rate limiting to user login and registration.** Apply the same `loginAttempts` map mechanism that already exists for operators. Consider a shared module so both paths use identical logic.

5. **Add CI validation steps.** Before deploying, run `npm run typecheck && npm run lint && npm run test` in the GitHub Actions workflows. This prevents regressions from being silently deployed.

6. **Add startup validation for required env vars.** Fail fast in production if `APP_AUTH_TOKEN_SECRET`, `APP_OPERATOR_EMAIL`, `APP_OPERATOR_PASSWORD` are missing or still set to `.env.example` placeholder values.

### Medium Priority

7. **Add structured request logging.** Log every request with method, path, status code, duration, and a correlation ID. Use `pino` or a minimal structured logger. Without this, production debugging is nearly impossible.

8. **Respect `APP_SESSION_TTL_MINUTES` for user tokens.** Currently hardcoded to 12 hours in `handlers.ts`. Use the already-exported `getSessionTtlMs()` from auth.ts.

9. **Add a lint and typecheck step** to the CI pipeline (currently none exists). The deploy workflows build and push without any code validation.

10. **Cap `compareParcels` and `exportMemo` input sizes.** Max 20 parcel IDs for compare, max 10 for export memo. Return 400 for excess.

11. **Self-host MapLibre fonts/tiles.** Replace `https://demotiles.maplibre.org/font/...` with a self-hosted font endpoint. The demo server is not for production use.

12. **Fix CSP `connect-src` localhost in production.** Gate `http://localhost:4000` behind `process.env.NODE_ENV === 'development'`.

13. **Import shared DTOs in frontend apps.** Both `apps/web/components/land-intelligence-app.tsx` and `apps/admin/app/page.tsx` re-declare all DTOs locally. Import from `@globe/types` or expose a `@globe/contracts` package to eliminate drift.

14. **Add Docker HEALTHCHECK instructions** to all three Dockerfiles so App Runner and orchestrators can detect unhealthy containers without a separate probe.

### Low Priority

15. **Remove the `sanitizeAlert` no-op.** Either implement actual field filtering or remove the function and call directly.

16. **Fix `center: {lng:0,lat:0}` in masked parcels.** Use the market centroid or omit the field for restricted parcels.

17. **Add database missing indexes:** `listing(parcel_id)`, `source_observation(market_id)`.

18. **Rename the `transaction` SQL table.** Using a reserved keyword requires quoting everywhere and is error-prone. Consider `land_transaction` or `closed_transaction`.

19. **Clarify `listing.price_state` CHECK constraint.** Either add `'closed'` or add a code comment explaining why it's excluded.

20. **Remove dead `localStorage.removeItem` calls** in `apps/admin/app/page.tsx` (lines 116, 266).

21. **Add `aria-label` and keyboard navigation** to the globe canvas interactive controls for WCAG compliance.

22. **Add email format validation** beyond simple `.includes("@")` in demo request, issue report, and password reset handlers.
