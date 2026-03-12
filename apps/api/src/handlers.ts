import { CONFIDENCE_LABELS, COVERAGE_TIERS, PRICE_STATES, type ConfidenceLabel, type CoverageTier, type PriceState } from "@globe/types";

import { loginWithCredentials } from "./auth.js";
import type {
  AlertDto,
  ActivityEventDto,
  CollectionResponse,
  LoginResponseDto,
  MarketDto,
  ParcelDto,
  ReviewItemDto
} from "./contracts.js";
import { activityEvents, alerts, listings, markets, parcels, sourceHealthRows } from "./data.js";
import { listReviewQueue as listPersistedReviewQueue, saveReviewDecision } from "./review-store.js";

const confidenceSet = new Set<string>(CONFIDENCE_LABELS);
const coverageTierSet = new Set<string>(COVERAGE_TIERS);
const priceStateSet = new Set<string>(PRICE_STATES);

const parseMultiValue = (url: URL, key: string): string[] => {
  const repeated = url.searchParams.getAll(key).filter(Boolean);
  const raw = repeated.length > 0 ? repeated : [url.searchParams.get(key) ?? ""];

  const values = raw
    .flatMap((entry) => entry.split(","))
    .map((entry) => entry.trim())
    .filter(Boolean);

  return Array.from(new Set(values));
};

const parseCoverageTiers = (url: URL): CoverageTier[] =>
  parseMultiValue(url, "coverageTier").filter((value): value is CoverageTier => coverageTierSet.has(value));

const parsePriceStates = (url: URL): PriceState[] =>
  parseMultiValue(url, "state").filter((value): value is PriceState => priceStateSet.has(value));

const parseConfidence = (url: URL): ConfidenceLabel => {
  const requested = (url.searchParams.get("minConfidence") ?? "low").trim();
  if (confidenceSet.has(requested)) {
    return requested as ConfidenceLabel;
  }

  return "low";
};

const rankConfidence = (label: MarketDto["confidence"]): number => {
  const rankMap: Record<MarketDto["confidence"], number> = {
    low: 1,
    medium: 2,
    high: 3,
    verified: 4
  };

  return rankMap[label];
};

const parseWindowDays = (url: URL): number => {
  const requested = Number(url.searchParams.get("windowDays") ?? 90);
  if (!Number.isFinite(requested)) {
    return 90;
  }

  return Math.max(1, Math.min(3650, Math.round(requested)));
};

interface Pagination {
  limit: number;
  offset: number;
}

const parsePagination = (url: URL, defaultLimit = 100, maxLimit = 500): Pagination => {
  const requestedLimit = Number(url.searchParams.get("limit") ?? defaultLimit);
  const requestedOffset = Number(url.searchParams.get("offset") ?? 0);

  const limit = Number.isFinite(requestedLimit) ? Math.max(1, Math.min(maxLimit, Math.round(requestedLimit))) : defaultLimit;
  const offset = Number.isFinite(requestedOffset) ? Math.max(0, Math.round(requestedOffset)) : 0;

  return { limit, offset };
};

const applyPagination = <T,>(items: T[], url: URL, defaultLimit = 100, maxLimit = 500) => {
  const pagination = parsePagination(url, defaultLimit, maxLimit);
  return {
    total: items.length,
    pagination,
    data: items.slice(pagination.offset, pagination.offset + pagination.limit)
  };
};

const withinWindow = (isoTimestamp: string, windowDays: number): boolean => {
  const eventTime = new Date(isoTimestamp).getTime();
  const cutoff = Date.now() - windowDays * 24 * 60 * 60 * 1000;
  return eventTime >= cutoff;
};

const okResponse = <T>(
  items: T[],
  total: number,
  pagination: Pagination,
  filtersApplied?: Record<string, string | string[]>
): CollectionResponse<T> => ({
  data: items,
  meta: {
    total,
    limit: pagination.limit,
    offset: pagination.offset,
    hasMore: pagination.offset + items.length < total,
    ...(filtersApplied ? { filtersApplied } : {})
  }
});

const maskParcelForPolicy = (parcel: ParcelDto): ParcelDto => {
  if (parcel.legalDisplayAllowed) {
    return parcel;
  }

  return {
    ...parcel,
    canonicalParcelId: "REDACTED",
    title: "Restricted parcel",
    zoningCode: "REDACTED",
    areaSqm: 0,
    center: { lng: 0, lat: 0 }
  };
};

const sanitizeAlert = (alert: AlertDto): AlertDto => ({
  ...alert
});

export const health = () => ({
  status: "ok" as const,
  service: "api" as const,
  timestamp: new Date().toISOString()
});

export const listMarkets = (url: URL): CollectionResponse<MarketDto> => {
  const query = (url.searchParams.get("query") ?? "").trim().toLowerCase();
  const coverageTier = parseCoverageTiers(url);
  const requiredStates = parsePriceStates(url);
  const minConfidence = parseConfidence(url);
  const windowDays = parseWindowDays(url);

  const marketStateMap = new Map<string, Set<PriceState>>();
  for (const listing of listings) {
    if (!withinWindow(listing.observedAt, windowDays)) {
      continue;
    }

    if (!marketStateMap.has(listing.marketId)) {
      marketStateMap.set(listing.marketId, new Set<PriceState>());
    }

    marketStateMap.get(listing.marketId)?.add(listing.state);
  }

  const filtered = markets
    .filter((market) => {
      if (query && !`${market.name} ${market.slug} ${market.countryCode} ${market.region}`.toLowerCase().includes(query)) {
        return false;
      }

      if (coverageTier.length > 0 && !coverageTier.includes(market.coverageTier)) {
        return false;
      }

      if (rankConfidence(market.confidence) < rankConfidence(minConfidence)) {
        return false;
      }

      if (requiredStates.length > 0) {
        const availableStates = marketStateMap.get(market.id) ?? new Set<PriceState>();
        if (requiredStates.every((state) => !availableStates.has(state))) {
          return false;
        }
      }

      return true;
    })
    .sort((left, right) => right.activityScore - left.activityScore);

  const paged = applyPagination(filtered, url, 120, 500);
  return okResponse(paged.data, paged.total, paged.pagination, {
    query,
    coverageTier,
    state: requiredStates,
    minConfidence,
    windowDays: windowDays.toString()
  });
};

export const listParcels = (url: URL) => {
  const marketId = url.searchParams.get("marketId");
  const coverageTier = parseCoverageTiers(url);
  const legalDisplayOnlyRaw = url.searchParams.get("legalDisplayOnly");
  const legalDisplayOnly = legalDisplayOnlyRaw === null ? true : legalDisplayOnlyRaw === "true";

  const filtered = parcels.filter((parcel) => {
    if (marketId && parcel.marketId !== marketId) {
      return false;
    }

    if (coverageTier.length > 0 && !coverageTier.includes(parcel.coverageTier)) {
      return false;
    }

    if (legalDisplayOnly && !parcel.legalDisplayAllowed) {
      return false;
    }

    return true;
  });

  const policyAware = filtered.map(maskParcelForPolicy);
  const paged = applyPagination(policyAware, url, 150, 1000);

  return okResponse(paged.data, paged.total, paged.pagination, {
    ...(marketId ? { marketId } : {}),
    coverageTier,
    legalDisplayOnly: legalDisplayOnly.toString()
  });
};

export const listListings = (url: URL) => {
  const marketId = url.searchParams.get("marketId");
  const parcelId = url.searchParams.get("parcelId");
  const states = parsePriceStates(url);
  const windowDays = parseWindowDays(url);

  const filtered = listings
    .filter((listing) => {
      if (marketId && listing.marketId !== marketId) {
        return false;
      }

      if (parcelId && listing.parcelId !== parcelId) {
        return false;
      }

      if (states.length > 0 && !states.includes(listing.state)) {
        return false;
      }

      return withinWindow(listing.observedAt, windowDays);
    })
    .sort((left, right) => +new Date(right.observedAt) - +new Date(left.observedAt));

  const paged = applyPagination(filtered, url, 150, 1000);
  return okResponse(paged.data, paged.total, paged.pagination, {
    ...(marketId ? { marketId } : {}),
    ...(parcelId ? { parcelId } : {}),
    state: states,
    windowDays: windowDays.toString()
  });
};

export const listAlerts = (url: URL) => {
  const marketId = url.searchParams.get("marketId");
  const activeOnly = url.searchParams.get("activeOnly") !== "false";

  const filtered = alerts.filter((alert) => {
    if (marketId && alert.marketId !== marketId) {
      return false;
    }

    if (activeOnly && !alert.isActive) {
      return false;
    }

    return true;
  });

  const safeAlerts = filtered.map(sanitizeAlert);
  const paged = applyPagination(safeAlerts, url, 100, 500);

  return okResponse(paged.data, paged.total, paged.pagination, {
    ...(marketId ? { marketId } : {}),
    activeOnly: activeOnly.toString()
  });
};

export const listSourceHealth = (url: URL) => {
  const statusFilter = parseMultiValue(url, "status");

  const filtered = sourceHealthRows.filter((row) => {
    if (statusFilter.length > 0 && !statusFilter.includes(row.status)) {
      return false;
    }

    return true;
  });

  const paged = applyPagination(filtered, url, 100, 500);

  return okResponse(paged.data, paged.total, paged.pagination, {
    status: statusFilter
  });
};

export const listReviewQueue = (url: URL): CollectionResponse<ReviewItemDto> => {
  const reviewItems = listPersistedReviewQueue();
  const statusFilter = parseMultiValue(url, "status");
  const severityFilter = parseMultiValue(url, "severity");

  const filtered = reviewItems.filter((item) => {
    if (statusFilter.length > 0 && !statusFilter.includes(item.status)) {
      return false;
    }

    if (severityFilter.length > 0 && !severityFilter.includes(item.severity)) {
      return false;
    }

    return true;
  });

  const paged = applyPagination(filtered, url, 100, 500);

  return okResponse(paged.data, paged.total, paged.pagination, {
    status: statusFilter,
    severity: severityFilter
  });
};

export const setReviewDecision = (
  reviewId: string,
  decision: "approved" | "rejected"
): { ok: boolean; review: ReviewItemDto | null } => {
  return saveReviewDecision(reviewId, decision);
};

export const listActivityEvents = (url: URL): CollectionResponse<ActivityEventDto> => {
  const marketId = url.searchParams.get("marketId");
  const windowDays = parseWindowDays(url);

  const filtered = activityEvents
    .filter((event) => {
      if (marketId && event.marketId !== marketId) {
        return false;
      }

      return withinWindow(event.occurredAt, windowDays);
    })
    .sort((left, right) => +new Date(right.occurredAt) - +new Date(left.occurredAt));

  const paged = applyPagination(filtered, url, 120, 1000);

  return okResponse(paged.data, paged.total, paged.pagination, {
    ...(marketId ? { marketId } : {}),
    windowDays: windowDays.toString()
  });
};

export const login = (body: unknown, clientKey: string): LoginResponseDto => {
  if (!body || typeof body !== "object") {
    return { ok: false, token: null, email: null, role: null, errorCode: "invalid_credentials" };
  }

  const payload = body as { email?: string; password?: string };
  if (typeof payload.email !== "string" || typeof payload.password !== "string") {
    return { ok: false, token: null, email: null, role: null, errorCode: "invalid_credentials" };
  }

  const result = loginWithCredentials(payload.email, payload.password, clientKey);
  if (!result.ok) {
    return { ok: false, token: null, email: null, role: null, errorCode: result.errorCode };
  }

  return {
    ok: true,
    token: result.token,
    email: result.email,
    role: result.role
  };
};
