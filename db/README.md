# Database Layer

`db/migrations/0001_init.sql` is the initial Postgres/PostGIS schema scaffold.

Core entities included:
- `market`
- `geography`
- `parcel`
- `listing`
- `transaction`
- `source`
- `source_observation`
- `permit_or_planning_signal`
- `broker`
- `developer`
- `watchlist`
- `alert`
- `coverage_snapshot`

The schema enforces first-class treatment of coverage tiers, freshness, confidence, licensing, and provenance metadata.
