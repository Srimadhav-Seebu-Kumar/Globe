-- 0001_init.sql
-- Core schema scaffold for the worldwide land-intelligence platform.

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'coverage_tier') THEN
    CREATE TYPE coverage_tier AS ENUM (
      'tier_a_global_visibility',
      'tier_b_market_depth',
      'tier_c_parcel_depth'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'price_state') THEN
    CREATE TYPE price_state AS ENUM (
      'ask',
      'closed',
      'estimate',
      'broker_verified'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'freshness_tier') THEN
    CREATE TYPE freshness_tier AS ENUM (
      'realtime',
      'daily',
      'weekly',
      'stale'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'confidence_label') THEN
    CREATE TYPE confidence_label AS ENUM (
      'low',
      'medium',
      'high',
      'verified'
    );
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS market (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  iso_country_code CHAR(2) NOT NULL,
  timezone TEXT NOT NULL,
  coverage_tier coverage_tier NOT NULL,
  legal_display_policy JSONB NOT NULL DEFAULT '{}'::jsonb,
  licensing_notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS geography (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id UUID REFERENCES market(id) ON DELETE SET NULL,
  level TEXT NOT NULL,
  name TEXT NOT NULL,
  name_localized JSONB NOT NULL DEFAULT '{}'::jsonb,
  parent_id UUID REFERENCES geography(id) ON DELETE SET NULL,
  canonical_code TEXT,
  geom GEOMETRY(MultiPolygon, 4326),
  centroid GEOMETRY(Point, 4326),
  coverage_tier coverage_tier NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS source (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  acquisition_type TEXT NOT NULL,
  usage_rights TEXT NOT NULL,
  attribution_requirements TEXT,
  commercial_restrictions TEXT,
  redistribution_limits TEXT,
  expires_at TIMESTAMPTZ,
  renewal_owner TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS broker (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id UUID NOT NULL REFERENCES market(id) ON DELETE CASCADE,
  source_id UUID REFERENCES source(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  company_name TEXT,
  license_number TEXT,
  verification_status TEXT NOT NULL DEFAULT 'pending',
  verified_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS developer (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id UUID NOT NULL REFERENCES market(id) ON DELETE CASCADE,
  source_id UUID REFERENCES source(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  registration_number TEXT,
  verification_status TEXT NOT NULL DEFAULT 'pending',
  verified_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS parcel (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id UUID NOT NULL REFERENCES market(id) ON DELETE CASCADE,
  geography_id UUID REFERENCES geography(id) ON DELETE SET NULL,
  canonical_parcel_id TEXT NOT NULL,
  external_parcel_id TEXT,
  tenure_model TEXT,
  zoning_code TEXT,
  area_sq_m NUMERIC(18, 2),
  geom GEOMETRY(MultiPolygon, 4326),
  centroid GEOMETRY(Point, 4326),
  legal_display_allowed BOOLEAN NOT NULL DEFAULT FALSE,
  coverage_tier coverage_tier NOT NULL,
  freshness_tier freshness_tier NOT NULL,
  confidence_label confidence_label NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (market_id, canonical_parcel_id)
);

CREATE TABLE IF NOT EXISTS listing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id UUID NOT NULL REFERENCES market(id) ON DELETE CASCADE,
  parcel_id UUID REFERENCES parcel(id) ON DELETE SET NULL,
  source_id UUID NOT NULL REFERENCES source(id) ON DELETE RESTRICT,
  broker_id UUID REFERENCES broker(id) ON DELETE SET NULL,
  listing_ref TEXT,
  title TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  price_state price_state NOT NULL CHECK (price_state IN ('ask', 'estimate', 'broker_verified')),
  price_amount NUMERIC(18, 2) NOT NULL,
  currency_code CHAR(3) NOT NULL,
  listed_at TIMESTAMPTZ,
  last_seen_at TIMESTAMPTZ,
  freshness_tier freshness_tier NOT NULL,
  confidence_label confidence_label NOT NULL,
  provenance JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "transaction" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id UUID NOT NULL REFERENCES market(id) ON DELETE CASCADE,
  parcel_id UUID REFERENCES parcel(id) ON DELETE SET NULL,
  source_id UUID NOT NULL REFERENCES source(id) ON DELETE RESTRICT,
  buyer_developer_id UUID REFERENCES developer(id) ON DELETE SET NULL,
  seller_broker_id UUID REFERENCES broker(id) ON DELETE SET NULL,
  transaction_ref TEXT,
  status TEXT NOT NULL DEFAULT 'recorded',
  price_state price_state NOT NULL DEFAULT 'closed' CHECK (price_state = 'closed'),
  closed_price_amount NUMERIC(18, 2) NOT NULL,
  currency_code CHAR(3) NOT NULL,
  closed_at TIMESTAMPTZ,
  recorded_at TIMESTAMPTZ,
  freshness_tier freshness_tier NOT NULL,
  confidence_label confidence_label NOT NULL,
  provenance JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS permit_or_planning_signal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id UUID NOT NULL REFERENCES market(id) ON DELETE CASCADE,
  geography_id UUID REFERENCES geography(id) ON DELETE SET NULL,
  parcel_id UUID REFERENCES parcel(id) ON DELETE SET NULL,
  source_id UUID REFERENCES source(id) ON DELETE SET NULL,
  signal_type TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT,
  announced_at TIMESTAMPTZ,
  effective_from TIMESTAMPTZ,
  effective_to TIMESTAMPTZ,
  freshness_tier freshness_tier NOT NULL,
  confidence_label confidence_label NOT NULL,
  provenance JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS source_observation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES source(id) ON DELETE CASCADE,
  market_id UUID REFERENCES market(id) ON DELETE SET NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  observed_at TIMESTAMPTZ,
  ingested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  effective_date DATE,
  transformation_version TEXT NOT NULL,
  raw_object_uri TEXT,
  normalized_payload JSONB NOT NULL,
  freshness_tier freshness_tier NOT NULL,
  confidence_label confidence_label NOT NULL,
  display_label TEXT,
  display_policy_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (entity_type IN ('market', 'geography', 'parcel', 'listing', 'transaction', 'permit', 'broker', 'developer'))
);

CREATE TABLE IF NOT EXISTS watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  market_id UUID REFERENCES market(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  geometry GEOMETRY(MultiPolygon, 4326),
  criteria JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS alert (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  watchlist_id UUID REFERENCES watchlist(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'in_app',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  criteria JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS coverage_snapshot (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id UUID NOT NULL REFERENCES market(id) ON DELETE CASCADE,
  as_of_date DATE NOT NULL,
  coverage_tier coverage_tier NOT NULL,
  market_county_or_region TEXT,
  parcel_count INTEGER NOT NULL DEFAULT 0,
  listing_count INTEGER NOT NULL DEFAULT 0,
  transaction_count INTEGER NOT NULL DEFAULT 0,
  freshness_tier freshness_tier NOT NULL,
  confidence_label confidence_label NOT NULL,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (market_id, as_of_date, coverage_tier)
);

CREATE INDEX IF NOT EXISTS idx_geography_geom ON geography USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_parcel_geom ON parcel USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_parcel_market ON parcel (market_id);
CREATE INDEX IF NOT EXISTS idx_listing_market ON listing (market_id);
CREATE INDEX IF NOT EXISTS idx_listing_state ON listing (price_state, status);
CREATE INDEX IF NOT EXISTS idx_transaction_market ON "transaction" (market_id);
CREATE INDEX IF NOT EXISTS idx_transaction_closed_at ON "transaction" (closed_at DESC);
CREATE INDEX IF NOT EXISTS idx_source_observation_entity ON source_observation (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_source_observation_source ON source_observation (source_id, ingested_at DESC);
CREATE INDEX IF NOT EXISTS idx_watchlist_geometry ON watchlist USING GIST (geometry);
CREATE INDEX IF NOT EXISTS idx_coverage_snapshot_market ON coverage_snapshot (market_id, as_of_date DESC);
