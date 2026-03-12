# Data Source Registry Template

Use one record per source feed or endpoint.

## Source identity
- `source_code`:
- `source_name`:
- `operator`:
- `contact_owner`:
- `markets_covered`:

## Licensing and policy
- `acquisition_type` (api, bulk, licensed file, broker feed, manual):
- `usage_rights`:
- `attribution_requirements`:
- `commercial_restrictions`:
- `redistribution_limits`:
- `expires_at`:
- `renewal_owner`:
- `legal_display_notes`:

## Data semantics
- `entity_types` (market, geography, parcel, listing, transaction, permit, broker, developer):
- `units_and_currency`:
- `status_vocabulary`:
- `tenure_mapping`:
- `zoning_mapping`:
- `id_stability_notes`:

## Reliability and quality
- `expected_frequency`:
- `freshness_sla`:
- `quality_checks`:
- `known_gaps`:
- `confidence_baseline`:

## Ingestion contract
- `adapter_owner`:
- `raw_object_path`:
- `normalization_version`:
- `dedupe_key_strategy`:
- `backfill_policy`:
- `incident_runbook`:

## Approvals
- `data_engineering_approved_by`:
- `product_approved_by`:
- `legal_approved_by`:
- `go_live_decision_date`:
