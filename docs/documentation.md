# Documentation Log

## Running status log
- 2026-03-12 21:35 GST: Reviewed repo state and loaded master plan headings as source of truth.
- 2026-03-12 21:45 GST: Created monorepo directory scaffold (`apps`, `packages`, `services`, `db`, `infra`, `docs`) and root workspace tooling.
- 2026-03-12 21:58 GST: Added shared packages (`types`, `geo`, `ui`, `config`) with strict TypeScript settings and smoke tests.
- 2026-03-12 22:10 GST: Added Next.js shells for `apps/web` and `apps/admin` plus map/admin placeholders.
- 2026-03-12 22:18 GST: Added typed API scaffold (`health`, `markets`, `parcels`, `listings`, `alerts`).
- 2026-03-12 22:25 GST: Added Python ingestion/valuation skeletons with service responsibility READMEs.
- 2026-03-12 22:33 GST: Added `db/migrations/0001_init.sql` core entity schema and indexes.
- 2026-03-12 22:36 GST: Copied master plan into `docs/worldwide_land_intelligence_codex_master_plan.md` and authored architecture/plans/implementation docs.
- 2026-03-13 00:05 GST: Replaced web placeholders with data-driven filters, MapLibre globe market layers, detail drawer, and ticker/time rail wired to API.
- 2026-03-13 00:11 GST: Replaced admin placeholders with live source health table and actionable review queue decisions.
- 2026-03-13 00:17 GST: Expanded API with seeded market/parcel/listing/alert/event data, filterable endpoints, login route, and admin mutation routes.
- 2026-03-13 00:20 GST: Added local credential file for operator login and wired auth endpoint.
- 2026-03-13 01:08 GST: Completed targeted bug/security hardening pass (auth guardrails, CORS restrictions, input validation, request-size limits, and map render race fix).
- 2026-03-13 01:42 GST: Added AWS hosting automation scaffold (Dockerfiles for web/admin/api, GitHub deploy workflows, AWS bootstrap script, and deployment runbook).
- 2026-03-13 00:38 GST: Completed second hardening sweep: route-level status mapping applied in API server, production-safe 500 error payloads, and monorepo Next tracing root configuration.
- 2026-03-13 00:45 GST: Tightened auth/session security posture (constant-time hash compare, stale login-attempt cleanup, and admin token persistence moved to sessionStorage with legacy migration).
- 2026-03-13 00:49 GST: Reworked web globe basemap rendering to include built-in landmass polygons and outlines so the globe remains visibly populated without third-party style dependencies.
- 2026-03-13 00:50 GST: Fixed production runtime packaging bug by switching shared package exports to `dist` artifacts, adding explicit workspace package build orchestration, and adjusting API build path mapping.

## Verification log
- 2026-03-12 22:40 GST: `npm install` completed successfully (0 vulnerabilities).
- 2026-03-12 22:42 GST: `npm run lint` passed across all workspaces.
- 2026-03-12 22:43 GST: `npm run typecheck` passed across all workspaces.
- 2026-03-12 22:44 GST: `npm run test` passed across all workspaces.
- 2026-03-12 22:47 GST: `npm run build` passed across all workspaces.
- Note: Next.js emitted a non-blocking warning about multiple lockfiles and inferred workspace root from `C:\\Users\\ssk22\\package-lock.json`.
- 2026-03-13 00:31 GST: Re-ran `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build`; all passed after functional implementation changes.
- 2026-03-13 00:36 GST: API functional checks passed for health, markets, parcels, listings, alerts, events, admin sources/reviews, and login endpoints.
- 2026-03-13 00:39 GST: Playwright UI testing became unavailable after MCP transport termination during session; command-level verification was completed.
- 2026-03-13 01:12 GST: Re-ran `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build`; all passed after security fixes.
- 2026-03-13 01:49 GST: Re-ran `npm run lint`, `npm run test`, and `npm run build`; all passed after hosting automation files were added.
- 2026-03-13 01:50 GST: Installed AWS CLI via `pip` (`python -m awscli`) and verified command availability.
- 2026-03-13 01:50 GST: Blocking constraint: AWS programmatic credentials are not available in this environment (`Unable to locate credentials`), so actual cloud resource provisioning/deploy execution could not be completed from this session.
- 2026-03-13 00:47 GST: Re-ran `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build`; all passed after hardening changes.
- 2026-03-13 00:49 GST: Runtime smoke checks passed for dev servers (`api`/`web`/`admin` each returned `200`, shell content checks passed, API login + authenticated admin endpoints validated).
- 2026-03-13 00:50 GST: Verified compiled API runtime via `node apps/api/dist/server.js`; `/health` and `/v1/auth/login` succeeded after shared package export fixes.
- 2026-03-13 00:50 GST: `npm audit --omit=dev` reports 0 vulnerabilities.

## Open gaps
- API currently uses seeded in-memory datasets (no persistent database binding yet).
- Admin review decisions persist only in process memory until API restart.
- API auth/session state is in-memory only; move to Redis or DB-backed session store for distributed/runtime durability.
- AWS deployment workflows are committed, but first deployment requires valid AWS API credentials (access key/secret or SSO session) and GitHub repository secrets.
- Production `npm run start -w @globe/web` and `npm run start -w @globe/admin` could not be fully smoke-automated in this session due execution policy blocking those background command patterns; dev/runtime + build verification is passing.
