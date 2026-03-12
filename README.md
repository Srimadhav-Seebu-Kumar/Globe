# Globe Land Intelligence Monorepo

Production-oriented scaffold for a worldwide land-intelligence platform with market tiers, provenance-first data modeling, and incremental market rollout.

## Quick start

1. Install dependencies: `npm install`
2. Run checks: `npm run lint && npm run typecheck && npm run test`
3. Build all workspaces: `npm run build`
4. Start local apps:
   - Web: `npm run dev:web`
   - Admin: `npm run dev:admin`
   - API: `npm run dev:api`

Python services are scaffolded under `services/` with their own `pyproject.toml` files.

## AWS deployment automation

Deployment assets are in:
- `infra/docker/` (container images for `api`, `web`, `admin`)
- `.github/workflows/` (build + push + App Runner deploy workflows)
- `infra/aws/README.md` and `infra/aws/scripts/bootstrap.ps1` (bootstrap instructions)
