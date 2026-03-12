import { CONFIDENCE_LABELS, COVERAGE_TIERS, PRICE_STATES, type ConfidenceLabel, type CoverageTier, type PriceState } from "@globe/types";

import { loginWithCredentials } from "./auth.js";
import type {
  ActivityEventDto,
  CollectionResponse,
  LoginResponseDto,
  MarketDto,
  ReviewItemDto
} from "./contracts.js";
import { activityEvents, alerts, listings, markets, parcels, reviewQueue, sourceHealthRows } from "./data.js";

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

const withinWindow = (isoTimestamp: string, windowDays: number): boolean => {
  const eventTime = new Date(isoTimestamp).getTime();
  const cutoff = Date.now() - windowDays * 24 * 60 * 60 * 1000;
  return eventTime >= cutoff;
};

const okResponse = <T>(items: T[], filtersApplied?: Record<string, string | string[]>): CollectionResponse<T> => ({
  data: items,
  meta: {
    total: items.length,
    ...(filtersApplied ? { filtersApplied } : {})
  }
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
        for (const state of requiredStates) {
          if (!availableStates.has(state)) {
            return false;
          }
        }
      }

      return true;
    })
    .sort((left, right) => right.activityScore - left.activityScore);

  return okResponse(filtered, {
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
  const legalDisplayOnly = url.searchParams.get("legalDisplayOnly") === "true";

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

  return okResponse(filtered, {
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

  return okResponse(filtered, {
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

  return okResponse(filtered, {
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

  return okResponse(filtered, {
    status: statusFilter
  });
};

export const listReviewQueue = (url: URL): CollectionResponse<ReviewItemDto> => {
  const statusFilter = parseMultiValue(url, "status");
  const severityFilter = parseMultiValue(url, "severity");

  const filtered = reviewQueue.filter((item) => {
    if (statusFilter.length > 0 && !statusFilter.includes(item.status)) {
      return false;
    }

    if (severityFilter.length > 0 && !severityFilter.includes(item.severity)) {
      return false;
    }

    return true;
  });

  return okResponse(filtered, {
    status: statusFilter,
    severity: severityFilter
  });
};

export const setReviewDecision = (
  reviewId: string,
  decision: "approved" | "rejected"
): { ok: boolean; review: ReviewItemDto | null } => {
  const review = reviewQueue.find((candidate) => candidate.id === reviewId);

  if (!review) {
    return { ok: false, review: null };
  }

  review.status = decision;
  return { ok: true, review };
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

  return okResponse(filtered, {
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
