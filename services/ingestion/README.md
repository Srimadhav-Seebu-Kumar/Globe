# Ingestion Service

First-pass Python service scaffold for global land-data ingestion.

## Responsibilities
- Pull raw source feeds into object storage (`raw/` zone) with immutable run IDs.
- Normalize market adapters into canonical records (`normalized/` zone).
- Emit `source_observation` payloads with provenance, freshness, and confidence metadata.
- Publish ingest run metrics for admin source health dashboards.

## Next build targets
1. Implement adapter interface per market/source pair.
2. Add queue-driven orchestration and retry semantics.
3. Persist ingest run audit events into Postgres.
