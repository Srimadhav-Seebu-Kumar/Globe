import {
  CONFIDENCE_LABELS,
  COVERAGE_TIERS,
  PRICE_STATES,
  type ConfidenceLabel,
  type CoverageTier,
  type PriceState
} from "@globe/types";

import { createSessionToken, loginWithCredentials, type AuthSession } from "./auth.js";
import type {
  AlertDto,
  ActivityEventDto,
  BrokerProfileDto,
  CollectionResponse,
  CompareResponseDto,
  ExportMemoDto,
  IntakeSubmissionDto,
  InquiryDto,
  LoginResponseDto,
  MarketDto,
  ParcelDto,
  ReviewItemDto,
  SavedSearchDto,
  UserAlertDto,
  UserDto,
  WatchlistItemDto
} from "./contracts.js";
import { activityEvents, alerts, listings, markets, parcels, sourceHealthRows } from "./data.js";
import {
  createIntakeSubmission,
  listIntakeSubmissions as listPersistedIntakeSubmissions,
  setIntakeSubmissionDecision
} from "./intake-store.js";
import { listReviewQueue as listPersistedReviewQueue, saveReviewDecision } from "./review-store.js";
import {
  authenticateUserAccount,
  createInquiryForUser,
  createSavedSearchForUser,
  createWatchlistItemForUser,
  getUserById,
  listInquiriesForUser,
  listSavedSearchesForUser,
  listWatchlistItemsForUser,
  registerUserAccount
} from "./user-store.js";

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

const requireSession = (session?: AuthSession): AuthSession => {
  if (!session) {
    throw new Error("Authenticated session is required");
  }
  return session;
};

const toOperatorUser = (session: AuthSession): UserDto => ({
  id: session.userId,
  email: session.email,
  name: session.name,
  role: "operator",
  createdAt: session.createdAt
});

const parseSavedSearchPayload = (body: unknown): Omit<SavedSearchDto, "id" | "userId" | "createdAt" | "updatedAt"> | null => {
  if (!body || typeof body !== "object") {
    return null;
  }

  const payload = body as Partial<SavedSearchDto> & { name?: unknown; query?: unknown; legalDisplayOnly?: unknown };
  const name = typeof payload.name === "string" ? payload.name.trim() : "";
  const query = typeof payload.query === "string" ? payload.query.trim() : "";
  const coverageTier = Array.isArray(payload.coverageTier)
    ? payload.coverageTier.filter((value): value is CoverageTier => typeof value === "string" && coverageTierSet.has(value))
    : [...COVERAGE_TIERS];
  const states = Array.isArray(payload.state)
    ? payload.state.filter((value): value is PriceState => typeof value === "string" && priceStateSet.has(value))
    : [...PRICE_STATES];
  const minConfidence =
    typeof payload.minConfidence === "string" && confidenceSet.has(payload.minConfidence)
      ? (payload.minConfidence as ConfidenceLabel)
      : "low";
  const windowDays =
    typeof payload.windowDays === "number" && Number.isFinite(payload.windowDays)
      ? Math.max(7, Math.min(365, Math.round(payload.windowDays)))
      : 90;
  const legalDisplayOnly = typeof payload.legalDisplayOnly === "boolean" ? payload.legalDisplayOnly : true;
  const marketId = typeof payload.marketId === "string" && payload.marketId.trim().length > 0 ? payload.marketId : null;

  if (!name) {
    return null;
  }

  return {
    name,
    query,
    coverageTier,
    state: states,
    minConfidence,
    windowDays,
    legalDisplayOnly,
    marketId
  };
};

const parseWatchlistPayload = (body: unknown): Omit<WatchlistItemDto, "id" | "userId" | "createdAt"> | null => {
  if (!body || typeof body !== "object") {
    return null;
  }

  const payload = body as Partial<WatchlistItemDto>;
  if (payload.type !== "market" && payload.type !== "parcel") {
    return null;
  }

  const marketId = typeof payload.marketId === "string" && payload.marketId.trim().length > 0 ? payload.marketId : null;
  const parcelId = typeof payload.parcelId === "string" && payload.parcelId.trim().length > 0 ? payload.parcelId : null;
  if (payload.type === "market" && !marketId) {
    return null;
  }
  if (payload.type === "parcel" && !parcelId) {
    return null;
  }

  const label =
    typeof payload.label === "string" && payload.label.trim().length > 0
      ? payload.label.trim()
      : payload.type === "market"
        ? `Saved market ${marketId}`
        : `Saved parcel ${parcelId}`;

  return {
    type: payload.type,
    marketId,
    parcelId,
    label
  };
};

const parseInquiryPayload = (body: unknown): { listingId: string; message: string } | null => {
  if (!body || typeof body !== "object") {
    return null;
  }

  const payload = body as { listingId?: unknown; message?: unknown };
  if (typeof payload.listingId !== "string" || payload.listingId.trim().length === 0) {
    return null;
  }

  const message =
    typeof payload.message === "string" && payload.message.trim().length > 0
      ? payload.message.trim()
      : "Please share latest availability, documentation, and negotiation terms.";

  return {
    listingId: payload.listingId.trim(),
    message
  };
};

const normalizeEmail = (value: string): string => value.trim().toLowerCase();

const parseDemoRequestPayload = (body: unknown): {
  fullName: string;
  email: string;
  company: string;
  marketFocus: string;
  details: string;
} | null => {
  if (!body || typeof body !== "object") {
    return null;
  }

  const payload = body as {
    fullName?: unknown;
    email?: unknown;
    company?: unknown;
    marketFocus?: unknown;
    details?: unknown;
  };

  const fullName = typeof payload.fullName === "string" ? payload.fullName.trim() : "";
  const email = typeof payload.email === "string" ? normalizeEmail(payload.email) : "";
  const company = typeof payload.company === "string" ? payload.company.trim() : "";
  const marketFocus = typeof payload.marketFocus === "string" ? payload.marketFocus.trim() : "";
  const details = typeof payload.details === "string" ? payload.details.trim() : "";

  if (!fullName || !email.includes("@")) {
    return null;
  }

  return {
    fullName,
    email,
    company: company || "Not provided",
    marketFocus: marketFocus || "Global",
    details: details || "No additional details supplied."
  };
};

const parseListingSubmissionPayload = (body: unknown): {
  marketId: string;
  title: string;
  listingReference: string;
  currencyCode: string;
  amount: number;
  state: PriceState;
  sourceName: string;
  brokerName: string;
  parcelId: string | null;
  details: string;
} | null => {
  if (!body || typeof body !== "object") {
    return null;
  }

  const payload = body as {
    marketId?: unknown;
    title?: unknown;
    listingReference?: unknown;
    currencyCode?: unknown;
    amount?: unknown;
    state?: unknown;
    sourceName?: unknown;
    brokerName?: unknown;
    parcelId?: unknown;
    details?: unknown;
  };

  const marketId = typeof payload.marketId === "string" ? payload.marketId.trim() : "";
  const title = typeof payload.title === "string" ? payload.title.trim() : "";
  const listingReference = typeof payload.listingReference === "string" ? payload.listingReference.trim() : "";
  const currencyCode = typeof payload.currencyCode === "string" ? payload.currencyCode.trim().toUpperCase() : "USD";
  const amount = typeof payload.amount === "number" ? payload.amount : Number(payload.amount ?? Number.NaN);
  const sourceName = typeof payload.sourceName === "string" ? payload.sourceName.trim() : "";
  const brokerName = typeof payload.brokerName === "string" ? payload.brokerName.trim() : "";
  const parcelId =
    typeof payload.parcelId === "string" && payload.parcelId.trim().length > 0 ? payload.parcelId.trim() : null;
  const details = typeof payload.details === "string" ? payload.details.trim() : "";
  const state =
    typeof payload.state === "string" && priceStateSet.has(payload.state) ? (payload.state as PriceState) : "ask";

  const marketExists = markets.some((market) => market.id === marketId);
  if (!marketExists || !title || !listingReference || !sourceName || !Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  return {
    marketId,
    title,
    listingReference,
    currencyCode,
    amount: Math.round(amount),
    state,
    sourceName,
    brokerName: brokerName || "Unspecified",
    parcelId,
    details: details || "No additional listing notes."
  };
};

const parseIssueReportPayload = (body: unknown): {
  email: string;
  marketId: string | null;
  title: string;
  issueType: string;
  description: string;
  listingReference: string;
} | null => {
  if (!body || typeof body !== "object") {
    return null;
  }

  const payload = body as {
    email?: unknown;
    marketId?: unknown;
    title?: unknown;
    issueType?: unknown;
    description?: unknown;
    listingReference?: unknown;
  };

  const email = typeof payload.email === "string" ? normalizeEmail(payload.email) : "";
  const marketIdRaw = typeof payload.marketId === "string" ? payload.marketId.trim() : "";
  const marketId = marketIdRaw.length > 0 ? marketIdRaw : null;
  const title = typeof payload.title === "string" ? payload.title.trim() : "";
  const issueType = typeof payload.issueType === "string" ? payload.issueType.trim() : "";
  const description = typeof payload.description === "string" ? payload.description.trim() : "";
  const listingReference = typeof payload.listingReference === "string" ? payload.listingReference.trim() : "";

  if (!email.includes("@") || !title || !description) {
    return null;
  }

  return {
    email,
    marketId,
    title,
    issueType: issueType || "data_quality",
    description,
    listingReference: listingReference || "Not provided"
  };
};

const parsePasswordResetPayload = (body: unknown): { email: string } | null => {
  if (!body || typeof body !== "object") {
    return null;
  }

  const payload = body as { email?: unknown };
  const email = typeof payload.email === "string" ? normalizeEmail(payload.email) : "";
  if (!email.includes("@")) {
    return null;
  }
  return { email };
};

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
    return { ok: false, token: null, email: null, role: null, user: null, errorCode: "invalid_credentials" };
  }

  const payload = body as { email?: string; password?: string };
  if (typeof payload.email !== "string" || typeof payload.password !== "string") {
    return { ok: false, token: null, email: null, role: null, user: null, errorCode: "invalid_credentials" };
  }

  const user = authenticateUserAccount(payload.email, payload.password);
  if (user) {
    const now = Date.now();
    const token = createSessionToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      createdAt: user.createdAt,
      expiresAt: now + 1000 * 60 * 60 * 12
    });

    return {
      ok: true,
      token,
      email: user.email,
      role: user.role,
      user
    };
  }

  const operatorResult = loginWithCredentials(payload.email, payload.password, clientKey);
  if (operatorResult.ok) {
    const operatorUser: UserDto = {
      id: `operator:${operatorResult.email}`,
      email: operatorResult.email,
      name: "Operator",
      role: "operator",
      createdAt: new Date().toISOString()
    };
    return {
      ok: true,
      token: operatorResult.token,
      email: operatorResult.email,
      role: operatorResult.role,
      user: operatorUser
    };
  }

  return { ok: false, token: null, email: null, role: null, user: null, errorCode: operatorResult.errorCode };
};

export const register = (body: unknown): LoginResponseDto => {
  if (!body || typeof body !== "object") {
    return { ok: false, token: null, email: null, role: null, user: null, errorCode: "invalid_payload" };
  }

  const payload = body as { email?: string; password?: string; name?: string };
  if (typeof payload.email !== "string" || typeof payload.password !== "string") {
    return { ok: false, token: null, email: null, role: null, user: null, errorCode: "invalid_payload" };
  }

  const result = registerUserAccount(payload.email, payload.password, typeof payload.name === "string" ? payload.name : null);
  if (!result.ok) {
    return { ok: false, token: null, email: null, role: null, user: null, errorCode: result.errorCode };
  }

  const user = result.user;
  const now = Date.now();
  const token = createSessionToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    createdAt: user.createdAt,
    expiresAt: now + 1000 * 60 * 60 * 12
  });

  return {
    ok: true,
    token,
    email: user.email,
    role: user.role,
    user
  };
};

export const currentUser = (session?: AuthSession): UserDto | null => {
  const requiredSession = requireSession(session);
  if (requiredSession.role === "operator") {
    return toOperatorUser(requiredSession);
  }

  return getUserById(requiredSession.userId);
};

export const listSavedSearches = (url: URL, session?: AuthSession): CollectionResponse<SavedSearchDto> => {
  const requiredSession = requireSession(session);
  const filtered = listSavedSearchesForUser(requiredSession.userId);
  const paged = applyPagination(filtered, url, 100, 500);
  return okResponse(paged.data, paged.total, paged.pagination);
};

export const createSavedSearch = (
  body: unknown,
  session?: AuthSession
): { ok: true; item: SavedSearchDto } | { ok: false; error: string } => {
  const requiredSession = requireSession(session);
  const parsed = parseSavedSearchPayload(body);
  if (!parsed) {
    return { ok: false, error: "Invalid saved search payload" };
  }

  const item = createSavedSearchForUser(requiredSession.userId, parsed);
  return { ok: true, item };
};

export const listWatchlistItems = (url: URL, session?: AuthSession): CollectionResponse<WatchlistItemDto> => {
  const requiredSession = requireSession(session);
  const filtered = listWatchlistItemsForUser(requiredSession.userId);
  const paged = applyPagination(filtered, url, 100, 500);
  return okResponse(paged.data, paged.total, paged.pagination);
};

export const createWatchlistItem = (
  body: unknown,
  session?: AuthSession
): { ok: true; item: WatchlistItemDto } | { ok: false; error: string } => {
  const requiredSession = requireSession(session);
  const parsed = parseWatchlistPayload(body);
  if (!parsed) {
    return { ok: false, error: "Invalid watchlist payload" };
  }

  const item = createWatchlistItemForUser(requiredSession.userId, parsed);
  return { ok: true, item };
};

export const listUserAlerts = (url: URL, session?: AuthSession): CollectionResponse<UserAlertDto> => {
  const requiredSession = requireSession(session);
  const activeOnly = url.searchParams.get("activeOnly") !== "false";
  const watchlistItems = listWatchlistItemsForUser(requiredSession.userId);

  const parcelToMarket = new Map(parcels.map((parcel) => [parcel.id, parcel.marketId]));
  const linkedAlerts: UserAlertDto[] = [];

  for (const item of watchlistItems) {
    const marketId =
      item.type === "market" ? item.marketId : item.parcelId ? parcelToMarket.get(item.parcelId) ?? null : null;
    if (!marketId) {
      continue;
    }

    for (const alert of alerts) {
      if (alert.marketId !== marketId) {
        continue;
      }
      if (activeOnly && !alert.isActive) {
        continue;
      }

      linkedAlerts.push({
        ...alert,
        watchlistItemId: item.id,
        watchlistLabel: item.label
      });
    }
  }

  linkedAlerts.sort((left, right) => {
    const rightTime = right.lastTriggeredAt ? +new Date(right.lastTriggeredAt) : 0;
    const leftTime = left.lastTriggeredAt ? +new Date(left.lastTriggeredAt) : 0;
    return rightTime - leftTime;
  });

  const paged = applyPagination(linkedAlerts, url, 100, 500);
  return okResponse(paged.data, paged.total, paged.pagination, {
    activeOnly: activeOnly.toString()
  });
};

export const listBrokerProfiles = (url: URL): CollectionResponse<BrokerProfileDto> => {
  const marketId = url.searchParams.get("marketId");
  const brokerMap = new Map<string, BrokerProfileDto>();

  for (const listing of listings) {
    if (!listing.brokerName) {
      continue;
    }
    if (marketId && listing.marketId !== marketId) {
      continue;
    }

    const key = listing.brokerName.trim().toLowerCase();
    const existing = brokerMap.get(key);
    if (!existing) {
      brokerMap.set(key, {
        id: `broker-${key.replace(/[^a-z0-9]+/g, "-")}`,
        name: listing.brokerName,
        marketIds: [listing.marketId],
        listingCount: 1,
        verifiedListingCount: listing.state === "broker_verified" ? 1 : 0,
        lastObservedAt: listing.observedAt,
        status: listing.state === "broker_verified" ? "verified" : "active"
      });
      continue;
    }

    existing.listingCount += 1;
    if (!existing.marketIds.includes(listing.marketId)) {
      existing.marketIds.push(listing.marketId);
    }
    if (listing.state === "broker_verified") {
      existing.verifiedListingCount += 1;
      existing.status = "verified";
    }
    if (!existing.lastObservedAt || +new Date(listing.observedAt) > +new Date(existing.lastObservedAt)) {
      existing.lastObservedAt = listing.observedAt;
    }
  }

  const rows = Array.from(brokerMap.values()).sort((left, right) => right.listingCount - left.listingCount);
  const paged = applyPagination(rows, url, 100, 500);
  return okResponse(paged.data, paged.total, paged.pagination, {
    ...(marketId ? { marketId } : {})
  });
};

export const compareParcels = (url: URL): CompareResponseDto => {
  const parcelIds = parseMultiValue(url, "parcelId");
  const marketById = new Map(markets.map((market) => [market.id, market]));

  const items = parcelIds
    .map((parcelId) => parcels.find((parcel) => parcel.id === parcelId))
    .filter((parcel): parcel is ParcelDto => Boolean(parcel))
    .map((parcel) => {
      const parcelListings = listings.filter((listing) => listing.parcelId === parcel.id);
      const sortedListings = [...parcelListings].sort((left, right) => +new Date(right.observedAt) - +new Date(left.observedAt));
      const latestListing = sortedListings[0] ?? null;
      const averageObservedAmount =
        parcelListings.length > 0
          ? Math.round(parcelListings.reduce((sum, listing) => sum + listing.amount, 0) / parcelListings.length)
          : null;
      const market = marketById.get(parcel.marketId);

      return {
        parcelId: parcel.id,
        parcelTitle: parcel.title,
        marketId: parcel.marketId,
        marketName: market?.name ?? parcel.marketId,
        areaSqm: parcel.areaSqm,
        latestListingState: latestListing?.state ?? null,
        latestListingAmount: latestListing?.amount ?? null,
        latestListingCurrencyCode: latestListing?.currencyCode ?? null,
        latestObservedAt: latestListing?.observedAt ?? null,
        averageObservedAmount,
        observationCount: parcelListings.length
      };
    });

  return {
    generatedAt: new Date().toISOString(),
    items
  };
};

export const exportMemo = (body: unknown): ExportMemoDto | { error: string } => {
  if (!body || typeof body !== "object") {
    return { error: "Invalid export payload" };
  }

  const payload = body as { parcelIds?: unknown; notes?: unknown };
  if (!Array.isArray(payload.parcelIds) || payload.parcelIds.length === 0) {
    return { error: "parcelIds is required" };
  }

  const selectedParcels = payload.parcelIds
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .map((parcelId) => parcels.find((parcel) => parcel.id === parcelId))
    .filter((parcel): parcel is ParcelDto => Boolean(parcel));

  if (selectedParcels.length === 0) {
    return { error: "No matching parcels found" };
  }

  const now = new Date().toISOString();
  const lines: string[] = [];
  lines.push("# Globe Land Intelligence - Comparison Memo");
  lines.push("");
  lines.push(`Generated at: ${now}`);
  lines.push("");

  for (const parcel of selectedParcels) {
    const market = markets.find((candidate) => candidate.id === parcel.marketId);
    const parcelListings = listings
      .filter((listing) => listing.parcelId === parcel.id)
      .sort((left, right) => +new Date(right.observedAt) - +new Date(left.observedAt));
    const latest = parcelListings[0] ?? null;
    const avgAmount =
      parcelListings.length > 0
        ? Math.round(parcelListings.reduce((sum, listing) => sum + listing.amount, 0) / parcelListings.length)
        : null;

    lines.push(`## ${parcel.title}`);
    lines.push(`- Parcel ID: ${parcel.canonicalParcelId}`);
    lines.push(`- Market: ${market?.name ?? parcel.marketId}`);
    lines.push(`- Area (sqm): ${parcel.areaSqm}`);
    lines.push(`- Zoning: ${parcel.zoningCode}`);
    lines.push(`- Freshness: ${parcel.freshness}`);
    lines.push(`- Confidence: ${parcel.confidence}`);
    if (latest) {
      lines.push(`- Latest observation: ${latest.state} ${latest.currencyCode} ${latest.amount} (${latest.observedAt})`);
    }
    if (avgAmount !== null && latest) {
      lines.push(`- Average observed amount: ${latest.currencyCode} ${avgAmount}`);
    }
    lines.push("");
  }

  const notes = typeof payload.notes === "string" ? payload.notes.trim() : "";
  if (notes) {
    lines.push("## Analyst Notes");
    lines.push(notes);
    lines.push("");
  }

  return {
    filename: `land-memo-${new Date().toISOString().slice(0, 10)}.md`,
    mimeType: "text/markdown",
    content: lines.join("\n")
  };
};

export const listInquiries = (url: URL, session?: AuthSession): CollectionResponse<InquiryDto> => {
  const requiredSession = requireSession(session);
  const rows = listInquiriesForUser(requiredSession.userId);
  const paged = applyPagination(rows, url, 100, 500);
  return okResponse(paged.data, paged.total, paged.pagination);
};

export const createInquiry = (
  body: unknown,
  session?: AuthSession
): { ok: true; item: InquiryDto } | { ok: false; error: string } => {
  const requiredSession = requireSession(session);
  const parsed = parseInquiryPayload(body);
  if (!parsed) {
    return { ok: false, error: "Invalid inquiry payload" };
  }

  const listing = listings.find((item) => item.id === parsed.listingId);
  if (!listing) {
    return { ok: false, error: "Listing not found" };
  }

  const item = createInquiryForUser(requiredSession.userId, {
    listingId: listing.id,
    marketId: listing.marketId,
    message: parsed.message
  });
  return { ok: true, item };
};

export const createDemoRequest = (
  body: unknown
): { ok: true; item: IntakeSubmissionDto } | { ok: false; error: string } => {
  const parsed = parseDemoRequestPayload(body);
  if (!parsed) {
    return { ok: false, error: "Invalid demo request payload" };
  }

  const item = createIntakeSubmission({
    type: "demo_request",
    submittedByUserId: null,
    marketId: null,
    title: `Demo request - ${parsed.fullName}`,
    description: parsed.details,
    priority: "medium",
    payload: {
      fullName: parsed.fullName,
      email: parsed.email,
      company: parsed.company,
      marketFocus: parsed.marketFocus,
      details: parsed.details
    }
  });

  return { ok: true, item };
};

export const createListingSubmission = (
  body: unknown,
  session?: AuthSession
): { ok: true; item: IntakeSubmissionDto } | { ok: false; error: string } => {
  const requiredSession = requireSession(session);
  const parsed = parseListingSubmissionPayload(body);
  if (!parsed) {
    return { ok: false, error: "Invalid listing submission payload" };
  }

  const item = createIntakeSubmission({
    type: "listing_submission",
    submittedByUserId: requiredSession.userId,
    marketId: parsed.marketId,
    title: parsed.title,
    description: parsed.details,
    priority: parsed.state === "broker_verified" ? "high" : "medium",
    payload: {
      email: requiredSession.email,
      listingReference: parsed.listingReference,
      currencyCode: parsed.currencyCode,
      amount: String(parsed.amount),
      state: parsed.state,
      sourceName: parsed.sourceName,
      brokerName: parsed.brokerName,
      parcelId: parsed.parcelId ?? "",
      details: parsed.details
    }
  });

  return { ok: true, item };
};

export const createIssueReport = (
  body: unknown,
  session?: AuthSession
): { ok: true; item: IntakeSubmissionDto } | { ok: false; error: string } => {
  const parsed = parseIssueReportPayload(body);
  if (!parsed) {
    return { ok: false, error: "Invalid issue report payload" };
  }

  const item = createIntakeSubmission({
    type: "issue_report",
    submittedByUserId: session?.userId ?? null,
    marketId: parsed.marketId,
    title: parsed.title,
    description: parsed.description,
    priority: "high",
    payload: {
      email: parsed.email,
      issueType: parsed.issueType,
      listingReference: parsed.listingReference,
      description: parsed.description
    }
  });

  return { ok: true, item };
};

export const createPasswordResetRequest = (body: unknown): { ok: true } | { ok: false; error: string } => {
  const parsed = parsePasswordResetPayload(body);
  if (!parsed) {
    return { ok: false, error: "Invalid reset request payload" };
  }

  createIntakeSubmission({
    type: "password_reset",
    submittedByUserId: null,
    marketId: null,
    title: `Password reset request - ${parsed.email}`,
    description: "User requested a password reset link from the web app.",
    priority: "low",
    payload: {
      email: parsed.email
    }
  });

  // Intentional generic success message to avoid account enumeration.
  return { ok: true };
};

export const listAdminIntakeSubmissions = (url: URL): CollectionResponse<IntakeSubmissionDto> => {
  const statusFilter = parseMultiValue(url, "status");
  const typeFilter = parseMultiValue(url, "type");
  const marketId = (url.searchParams.get("marketId") ?? "").trim();

  const filtered = listPersistedIntakeSubmissions().filter((item) => {
    if (statusFilter.length > 0 && !statusFilter.includes(item.status)) {
      return false;
    }
    if (typeFilter.length > 0 && !typeFilter.includes(item.type)) {
      return false;
    }
    if (marketId && item.marketId !== marketId) {
      return false;
    }
    return true;
  });

  const paged = applyPagination(filtered, url, 150, 500);
  return okResponse(paged.data, paged.total, paged.pagination, {
    status: statusFilter,
    type: typeFilter,
    ...(marketId ? { marketId } : {})
  });
};

export const setAdminIntakeDecision = (
  submissionId: string,
  decision: "approved" | "rejected"
): { ok: boolean; item: IntakeSubmissionDto | null } => setIntakeSubmissionDecision(submissionId, decision);
