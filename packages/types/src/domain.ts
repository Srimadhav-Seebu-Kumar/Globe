export const PRICE_STATES = ["ask", "closed", "estimate", "broker_verified"] as const;
export type PriceState = (typeof PRICE_STATES)[number];

export const FRESHNESS_TIERS = ["realtime", "daily", "weekly", "stale"] as const;
export type FreshnessTier = (typeof FRESHNESS_TIERS)[number];

export const CONFIDENCE_LABELS = ["low", "medium", "high", "verified"] as const;
export type ConfidenceLabel = (typeof CONFIDENCE_LABELS)[number];

export const COVERAGE_TIERS = [
  "tier_a_global_visibility",
  "tier_b_market_depth",
  "tier_c_parcel_depth"
] as const;
export type CoverageTier = (typeof COVERAGE_TIERS)[number];

export interface ProvenanceStamp {
  sourceId: string;
  observedAt: string;
  ingestedAt: string;
  transformationVersion: string;
}

export interface PricePoint {
  state: PriceState;
  amount: number;
  currencyCode: string;
  observedAt: string;
  freshness: FreshnessTier;
  confidence: ConfidenceLabel;
  provenance: ProvenanceStamp;
}
