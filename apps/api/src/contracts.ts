import type {
  ConfidenceLabel,
  CoverageTier,
  FreshnessTier,
  PriceState
} from "@globe/types";

export interface HealthResponse {
  status: "ok";
  service: "api";
  timestamp: string;
}

export interface MarketDto {
  id: string;
  slug: string;
  name: string;
  coverageTier: CoverageTier;
  freshness: FreshnessTier;
  confidence: ConfidenceLabel;
}

export interface ParcelDto {
  id: string;
  marketId: string;
  coverageTier: CoverageTier;
  legalDisplayAllowed: boolean;
  freshness: FreshnessTier;
  confidence: ConfidenceLabel;
}

export interface ListingDto {
  id: string;
  marketId: string;
  parcelId: string | null;
  state: Extract<PriceState, "ask" | "broker_verified">;
  amount: number;
  currencyCode: string;
  freshness: FreshnessTier;
  confidence: ConfidenceLabel;
}

export interface AlertDto {
  id: string;
  watchlistId: string;
  ruleType: "new_listing" | "price_change" | "planning_signal";
  isActive: boolean;
}

export interface CollectionResponse<T> {
  data: T[];
  meta: {
    total: number;
  };
}
