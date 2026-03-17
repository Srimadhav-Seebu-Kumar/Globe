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
  timezone: string;
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
  role: "operator" | "user" | null;
  user: UserDto | null;
  errorCode?:
    | "invalid_credentials"
    | "auth_unconfigured"
    | "rate_limited"
    | "email_taken"
    | "weak_password"
    | "invalid_payload";
}

export interface UserDto {
  id: string;
  email: string;
  name: string;
  role: "operator" | "user";
  createdAt: string;
}

export interface SavedSearchDto {
  id: string;
  userId: string;
  name: string;
  query: string;
  coverageTier: CoverageTier[];
  state: PriceState[];
  minConfidence: ConfidenceLabel;
  windowDays: number;
  legalDisplayOnly: boolean;
  marketId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WatchlistItemDto {
  id: string;
  userId: string;
  type: "market" | "parcel";
  marketId: string | null;
  parcelId: string | null;
  label: string;
  createdAt: string;
}

export interface UserAlertDto extends AlertDto {
  watchlistItemId: string;
  watchlistLabel: string;
}

export interface BrokerProfileDto {
  id: string;
  name: string;
  marketIds: string[];
  listingCount: number;
  verifiedListingCount: number;
  lastObservedAt: string | null;
  status: "verified" | "active";
}

export interface CompareItemDto {
  parcelId: string;
  parcelTitle: string;
  marketId: string;
  marketName: string;
  areaSqm: number;
  latestListingState: PriceState | null;
  latestListingAmount: number | null;
  latestListingCurrencyCode: string | null;
  latestObservedAt: string | null;
  averageObservedAmount: number | null;
  observationCount: number;
}

export interface CompareResponseDto {
  generatedAt: string;
  items: CompareItemDto[];
}

export interface ExportMemoDto {
  filename: string;
  mimeType: "text/markdown";
  content: string;
}

export interface InquiryDto {
  id: string;
  userId: string;
  listingId: string;
  marketId: string;
  message: string;
  status: "submitted" | "acknowledged";
  createdAt: string;
}

export interface IntakeSubmissionDto {
  id: string;
  type: "demo_request" | "listing_submission" | "issue_report" | "password_reset";
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
  submittedByEmail: string;
  submittedByUserId: string | null;
  marketId: string | null;
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  payload: Record<string, string>;
}

export interface CollectionResponse<T> {
  data: T[];
  meta: {
    total: number;
    limit?: number;
    offset?: number;
    hasMore?: boolean;
    filtersApplied?: Record<string, string | string[]>;
  };
}
