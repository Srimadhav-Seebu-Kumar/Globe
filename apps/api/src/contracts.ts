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

export interface PointDto {
  lng: number;
  lat: number;
}

export interface MarketDto {
  id: string;
  slug: string;
  name: string;
  countryCode: string;
  region: string;
  center: PointDto;
  coverageTier: CoverageTier;
  freshness: FreshnessTier;
  confidence: ConfidenceLabel;
  activityScore: number;
  activeListings: number;
  closedTransactions: number;
  benchmarkPricePerSqm: number;
  benchmarkCurrency: string;
  updatedAt: string;
}

export interface ParcelDto {
  id: string;
  canonicalParcelId: string;
  marketId: string;
  title: string;
  center: PointDto;
  areaSqm: number;
  zoningCode: string;
  coverageTier: CoverageTier;
  legalDisplayAllowed: boolean;
  freshness: FreshnessTier;
  confidence: ConfidenceLabel;
  updatedAt: string;
}

export interface ListingDto {
  id: string;
  reference: string;
  marketId: string;
  parcelId: string | null;
  state: PriceState;
  amount: number;
  currencyCode: string;
  observedAt: string;
  sourceName: string;
  brokerName: string | null;
  freshness: FreshnessTier;
  confidence: ConfidenceLabel;
}

export interface AlertDto {
  id: string;
  marketId: string;
  watchlistId: string;
  title: string;
  ruleType: "new_listing" | "price_change" | "planning_signal";
  isActive: boolean;
  lastTriggeredAt: string | null;
}

export interface SourceHealthDto {
  id: string;
  sourceCode: string;
  sourceName: string;
  marketId: string;
  marketName: string;
  status: "healthy" | "degraded" | "offline";
  freshnessLagMinutes: number;
  successRate30d: number;
  lastIngestedAt: string;
  licenseState: "active" | "renewal_due";
}

export interface ReviewItemDto {
  id: string;
  marketId: string;
  marketName: string;
  category: "dedupe" | "geocoding" | "policy" | "broker_verification";
  severity: "high" | "medium" | "low";
  title: string;
  createdAt: string;
  status: "pending" | "approved" | "rejected";
}

export interface ActivityEventDto {
  id: string;
  marketId: string;
  summary: string;
  occurredAt: string;
  category: "listing" | "transaction" | "planning" | "verification";
}

export interface LoginRequestDto {
  email: string;
  password: string;
}

export interface LoginResponseDto {
  ok: boolean;
  token: string | null;
  email: string | null;
  role: "operator" | null;
}

export interface CollectionResponse<T> {
  data: T[];
  meta: {
    total: number;
    filtersApplied?: Record<string, string | string[]>;
  };
}
