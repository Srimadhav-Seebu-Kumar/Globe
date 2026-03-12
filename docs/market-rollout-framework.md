# Market Rollout Framework

## Objective
Roll out markets safely with explicit coverage and compliance boundaries.

## Rollout tiers
1. Tier A (`tier_a_global_visibility`): cells/aggregates and market scorecards.
2. Tier B (`tier_b_market_depth`): district/neighborhood drill-down + stronger comps.
3. Tier C (`tier_c_parcel_depth`): parcel boundaries/dossiers where licensed and legally displayable.

## Entry checklist per market
- Legal display policy documented and approved.
- Source registry entries complete for all feeds.
- Freshness and confidence baselines defined.
- Currency/unit/tenure normalization mappings approved.
- Coverage snapshot pipeline operational.

## Exit criteria by tier
### Tier A
- Country/region/city aggregates available.
- Coverage badge visible in API + UI.

### Tier B
- Drill-down geography hierarchy loaded.
- Listings + transactions ingestion passing quality checks.

### Tier C
- Parcel geometry quality threshold met.
- Parcel-level legal display clearance confirmed.
- Parcel detail and watchlist alerts passing QA.

## Operational cadence
- Weekly market quality review.
- Monthly licensing and attribution audit.
- Quarterly coverage tier recertification.
