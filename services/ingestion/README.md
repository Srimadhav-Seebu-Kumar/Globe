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
| `jp-mlit-koji` | Japan official land price points (¥/m²) | semiannual | KSJ CC BY 4.0 | optional `JP_KOJI_YEAR`, `JP_KOJI_PREF` (default 26/13 Tokyo) |
| `de-nrw-boris` | Germany NRW Bodenrichtwerte zones (€/m²) | semiannual | dl-de/zero-2.0 | optional `DE_NRW_BRW_URL` (~216MB shapefile) |
| `tw-moi-land-stats` | Taiwan county announced land values | semiannual | Taiwan OGDL | — |
| `tw-taipei-land-price` | Taipei parcel 公告現值/公告地價 (TWD/m²) | semiannual | Taipei OGDL | optional `TAIPEI_LAND_RID`, `TAIPEI_LAND_MAX_ROWS`, `TAIPEI_LAND_YEAR` |
| `cz-csu-avg-prices` | Czech district average property prices | semiannual | data.gov.cz open | `CZ_CSU_CSV_URL` (NKOD distribution) |
| `global-bis-rppi` | BIS global residential price index | quarterly | BIS terms | terminal fallback (~244 country series) |

Fallback chains and required attribution strings live in `registry.py`;
nothing is ingestible without a registry entry. The registry also catalogs
**15 official value-zone sources** (Germany BORIS states, Japan 地価公示, Taiwan,
Switzerland cantons, NL WOZ, etc.) — run `python -m ingestion.main list` and
filter for `value_zones`. Registry now lists **37 sources** including Belgium
CadGIS (registered), Hong Kong RVD indices, Italy OMI, and Taichung parcels.

## API silver overlay

The API reads the latest `silver/<source>/*.jsonl` when present and merges
ingested records with mock fixtures (`apps/api/src/data-layer.ts`). Set
`GLOBE_INGEST_DATA_DIR` to the ingestion data root and optionally
`GLOBE_SILVER_MAX_RECORDS` (default 10,000 per source). Disable with
`GLOBE_USE_INGEST_DATA=false`.

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
