# Ingestion Service

Python service that pulls real land-market data from registered sources and
publishes normalized, provenance-stamped records. Implements `F-E3-02`
(reusable ingestion framework) and the code-level half of `F-E3-01`
(source registry + licensing catalog) from `feature-list.json`.

## Pipeline

Every source runs the same stages — connectors only implement `fetch` and `parse`:

```
pull → raw snapshot + checksum → parse → normalize → QA gate → publish
```

Guarantees: idempotency (unchanged checksum ⇒ skip), lineage (silver records
trace to immutable raw artifacts + manifests), QA quarantine (hard failures
never publish), retry with backoff on transient network errors.

## Layout

- `src/ingestion/models.py` — canonical models; mirrors `packages/types/src/domain.ts`
- `src/ingestion/framework.py` — connector contract + pipeline runner
- `src/ingestion/registry.py` — source registry: license, attribution, cadence, fallback chains
- `src/ingestion/qa.py` — quality gate (hard-fail vs soft-warn)
- `src/ingestion/storage.py` — bronze/silver zones, lineage manifests, health state
- `src/ingestion/connectors/` — one module per source

## Implemented sources

| Source | Market | Cadence | License | Env |
|---|---|---|---|---|
| `uk-hmlr-ppd` | England & Wales transactions | monthly | OGL v3 (attribution required) | optional `HMLR_PPD_URL` |
| `kr-molit-land` | Korea land transactions | daily | data.go.kr (free key) | `MOLIT_API_KEY`, optional `MOLIT_LAWD_CD`, `MOLIT_DEAL_YMD` |

Fallback chains and required attribution strings live in `registry.py`;
nothing is ingestible without a registry entry. The registry also catalogs
14 additional live-verified sources (FR, IE, TW, SG, AU-NSW, JP, AE-Dubai,
US-CT, US-NYC, EE, DE-NRW, IT, US-FHFA, CA, HK) awaiting connectors —
run `python -m ingestion.main list` for the full catalog.

## Usage

```bash
python3.11 -m venv .venv && .venv/bin/pip install pytest
PYTHONPATH=src .venv/bin/python -m ingestion.main list
PYTHONPATH=src .venv/bin/python -m ingestion.main run uk-hmlr-ppd
PYTHONPATH=src .venv/bin/python -m ingestion.main health
.venv/bin/python -m pytest -q
```

Artifacts land in `data/` (gitignored): `raw/<source>/<run>/` (immutable
payloads + manifest), `silver/<source>/<run>.jsonl` (normalized records),
`state/health.json` (source health for fallback resolution and dashboards).

Set `GLOBE_INGEST_DATA_DIR` to relocate the data root (e.g. mounted volume).

## Next build targets

1. Market-adapter interface (`F-E3-03`) extracted from the two connectors.
2. Postgres publication: silver JSONL → `source_observation` rows (`F-E3-04`).
3. Scheduler/queue orchestration + dead-letter handling.
4. Admin source-health endpoint reading `state/health.json` (`F-E8-01`).
