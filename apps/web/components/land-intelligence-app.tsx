"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CONFIDENCE_LABELS, COVERAGE_TIERS, FRESHNESS_TIERS, PRICE_STATES, type CoverageTier, type PriceState } from "@globe/types";

const GlobeCanvas = dynamic(() => import("./globe-canvas").then((module) => module.GlobeCanvas), {
  ssr: false,
  loading: () => <div style={{ height: "100%", width: "100%", background: "#020617" }} />
});

interface PointDto {
  lng: number;
  lat: number;
}

interface MarketDto {
  id: string;
  slug: string;
  name: string;
  countryCode: string;
  region: string;
  timezone: string;
  center: PointDto;
  coverageTier: CoverageTier;
  freshness: (typeof FRESHNESS_TIERS)[number];
  confidence: (typeof CONFIDENCE_LABELS)[number];
  activityScore: number;
  activeListings: number;
  closedTransactions: number;
  benchmarkPricePerSqm: number;
  benchmarkCurrency: string;
  updatedAt: string;
}

interface ParcelDto {
  id: string;
  canonicalParcelId: string;
  marketId: string;
  title: string;
  center: PointDto;
  areaSqm: number;
  zoningCode: string;
  coverageTier: CoverageTier;
  legalDisplayAllowed: boolean;
  freshness: (typeof FRESHNESS_TIERS)[number];
  confidence: (typeof CONFIDENCE_LABELS)[number];
  updatedAt: string;
}

interface ListingDto {
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
  freshness: (typeof FRESHNESS_TIERS)[number];
  confidence: (typeof CONFIDENCE_LABELS)[number];
}

interface AlertDto {
  id: string;
  marketId: string;
  title: string;
  ruleType: "new_listing" | "price_change" | "planning_signal";
  isActive: boolean;
  lastTriggeredAt: string | null;
}

interface ActivityEventDto {
  id: string;
  marketId: string;
  summary: string;
  occurredAt: string;
  category: "listing" | "transaction" | "planning" | "verification";
}

interface UserDto {
  id: string;
  email: string;
  name: string;
  role: "operator" | "user";
  createdAt: string;
}

interface SavedSearchDto {
  id: string;
  userId: string;
  name: string;
  query: string;
  coverageTier: CoverageTier[];
  state: PriceState[];
  minConfidence: (typeof CONFIDENCE_LABELS)[number];
  windowDays: number;
  legalDisplayOnly: boolean;
  marketId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface WatchlistItemDto {
  id: string;
  userId: string;
  type: "market" | "parcel";
  marketId: string | null;
  parcelId: string | null;
  label: string;
  createdAt: string;
}

interface UserAlertDto extends AlertDto {
  watchlistItemId: string;
  watchlistLabel: string;
}

interface BrokerProfileDto {
  id: string;
  name: string;
  marketIds: string[];
  listingCount: number;
  verifiedListingCount: number;
  lastObservedAt: string | null;
  status: "verified" | "active";
}

interface CompareItemDto {
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

interface CompareResponseDto {
  generatedAt: string;
  items: CompareItemDto[];
}

interface ExportMemoDto {
  filename: string;
  mimeType: "text/markdown";
  content: string;
}

interface InquiryDto {
  id: string;
  userId: string;
  listingId: string;
  marketId: string;
  message: string;
  status: "submitted" | "acknowledged";
  createdAt: string;
}

interface AuthResponseDto {
  ok: boolean;
  token: string | null;
  email: string | null;
  role: "operator" | "user" | null;
  user: UserDto | null;
  errorCode?: string;
}

interface CollectionResponse<T> {
  data: T[];
  meta: {
    total: number;
  };
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api";
const USER_SESSION_STORAGE_KEY = "globe_web_user_token";
const SQM_TO_SQFT = 10.7639;

const formatNumber = (value: number): string => new Intl.NumberFormat("en-US").format(value);
const formatCurrency = (value: number, currency: string): string =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(value);
const formatCurrencyPrecise = (value: number, currency: string): string =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
const formatDateTime = (value: string, timezone?: string): string => {
  const parsed = new Date(value);
  if (!timezone) {
    return parsed.toLocaleString();
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: timezone
  }).format(parsed);
};

const formatRelativeTime = (value: string): string => {
  const now = Date.now();
  const target = new Date(value).getTime();
  const diffMs = target - now;
  const minute = 60_000;
  const hour = minute * 60;
  const day = hour * 24;

  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  if (Math.abs(diffMs) < hour) {
    return rtf.format(Math.round(diffMs / minute), "minute");
  }

  if (Math.abs(diffMs) < day) {
    return rtf.format(Math.round(diffMs / hour), "hour");
  }

  return rtf.format(Math.round(diffMs / day), "day");
};

const priceStateLabel = (state: PriceState): string => state.replaceAll("_", " ");
const coverageTierLabel = (value: CoverageTier): string =>
  value.replace("tier_a_", "Tier A ").replace("tier_b_", "Tier B ").replace("tier_c_", "Tier C ").replaceAll("_", " ");

const parseEnumList = <T extends string>(params: URLSearchParams, key: string, allowed: readonly T[]): T[] => {
  const raw = params.getAll(key).flatMap((value) => value.split(","));
  const picked = raw.map((value) => value.trim()).filter((value): value is T => allowed.includes(value as T));
  return Array.from(new Set(picked));
};

const useDebouncedValue = <T,>(value: T, delayMs: number): T => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timeout);
  }, [delayMs, value]);

  return debounced;
};

const buildHeaders = (token?: string): HeadersInit => {
  if (!token) {
    return {};
  }

  return {
    authorization: `Bearer ${token}`
  };
};

const fetchCollection = async <T,>(
  path: string,
  options?: {
    signal?: AbortSignal;
    token?: string;
  }
): Promise<T[]> => {
  const requestInit: RequestInit = { cache: "no-store" };
  if (options?.signal) {
    requestInit.signal = options.signal;
  }
  if (options?.token) {
    requestInit.headers = buildHeaders(options.token);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, requestInit);
  if (!response.ok) {
    throw new Error(`Request failed for ${path}: ${response.status}`);
  }

  const payload = (await response.json()) as CollectionResponse<T>;
  return payload.data;
};

const fetchResource = async <T,>(
  path: string,
  options?: {
    signal?: AbortSignal;
    token?: string;
  }
): Promise<T> => {
  const headers = buildHeaders(options?.token);
  const response = await fetch(`${API_BASE_URL}${path}`, {
    cache: "no-store",
    ...(options?.signal ? { signal: options.signal } : {}),
    ...(Object.keys(headers).length > 0 ? { headers } : {})
  });

  if (!response.ok) {
    throw new Error(`Request failed for ${path}: ${response.status}`);
  }

  return (await response.json()) as T;
};

export const LandIntelligenceApp = () => {
  const [markets, setMarkets] = useState<MarketDto[]>([]);
  const [mapMarkets, setMapMarkets] = useState<MarketDto[]>([]);
  const [parcels, setParcels] = useState<ParcelDto[]>([]);
  const [listings, setListings] = useState<ListingDto[]>([]);
  const [alerts, setAlerts] = useState<AlertDto[]>([]);
  const [events, setEvents] = useState<ActivityEventDto[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearchDto[]>([]);
  const [watchlistItems, setWatchlistItems] = useState<WatchlistItemDto[]>([]);
  const [userAlerts, setUserAlerts] = useState<UserAlertDto[]>([]);
  const [brokerProfiles, setBrokerProfiles] = useState<BrokerProfileDto[]>([]);
  const [inquiries, setInquiries] = useState<InquiryDto[]>([]);
  const [compareParcelIds, setCompareParcelIds] = useState<string[]>([]);
  const [compareResult, setCompareResult] = useState<CompareResponseDto | null>(null);

  const [authToken, setAuthToken] = useState("");
  const [currentUser, setCurrentUser] = useState<UserDto | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authMessage, setAuthMessage] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [selectedMarketId, setSelectedMarketId] = useState<string>("");
  const [coverageFilter, setCoverageFilter] = useState<CoverageTier[]>([...COVERAGE_TIERS]);
  const [stateFilter, setStateFilter] = useState<PriceState[]>([...PRICE_STATES]);
  const [minConfidence, setMinConfidence] = useState<(typeof CONFIDENCE_LABELS)[number]>("low");
  const [windowDays, setWindowDays] = useState<number>(90);
  const [legalDisplayOnly, setLegalDisplayOnly] = useState<boolean>(true);
  const [refreshTick, setRefreshTick] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionNote, setActionNote] = useState<string | null>(null);
  const [isHydratedFromUrl, setIsHydratedFromUrl] = useState(false);
  const debouncedQuery = useDebouncedValue(query, 300);
  const debouncedWindowDays = useDebouncedValue(windowDays, 250);

  const selectedMarket = useMemo(
    () => markets.find((market) => market.id === selectedMarketId) ?? null,
    [markets, selectedMarketId]
  );

  const selectedMarketBenchmarkPerSqft = useMemo(
    () => (selectedMarket ? selectedMarket.benchmarkPricePerSqm / SQM_TO_SQFT : null),
    [selectedMarket]
  );

  const latestRefreshAt = useMemo(() => {
    const allTimestamps = [
      ...markets.map((market) => market.updatedAt),
      ...parcels.map((parcel) => parcel.updatedAt),
      ...listings.map((listing) => listing.observedAt)
    ];
    if (allTimestamps.length === 0) {
      return null;
    }

    return allTimestamps.sort((left, right) => new Date(right).getTime() - new Date(left).getTime())[0];
  }, [listings, markets, parcels]);

  const portfolioSummary = useMemo(() => {
    if (markets.length === 0) {
      return {
        averageActivity: 0,
        legalDisplayRate: 0,
        tierCounts: {
          tier_a_global_visibility: 0,
          tier_b_market_depth: 0,
          tier_c_parcel_depth: 0
        }
      };
    }

    const totals = markets.reduce(
      (accumulator, market) => {
        accumulator.activity += market.activityScore;
        accumulator.tierCounts[market.coverageTier] += 1;
        return accumulator;
      },
      {
        activity: 0,
        tierCounts: {
          tier_a_global_visibility: 0,
          tier_b_market_depth: 0,
          tier_c_parcel_depth: 0
        }
      }
    );

    const legalDisplayCount = parcels.filter((parcel) => parcel.legalDisplayAllowed).length;

    return {
      averageActivity: Math.round(totals.activity / markets.length),
      legalDisplayRate: parcels.length > 0 ? Math.round((legalDisplayCount / parcels.length) * 100) : 100,
      tierCounts: totals.tierCounts
    };
  }, [markets, parcels]);

  const clearAuthSession = () => {
    setAuthToken("");
    setCurrentUser(null);
    setSavedSearches([]);
    setWatchlistItems([]);
    setUserAlerts([]);
    setInquiries([]);
    setAuthMessage(null);
    globalThis.sessionStorage.removeItem(USER_SESSION_STORAGE_KEY);
  };

  const refreshUserWorkspace = async (token: string): Promise<void> => {
    const [savedSearchRows, watchlistRows, userAlertRows, inquiryRows] = await Promise.all([
      fetchCollection<SavedSearchDto>("/v1/saved-searches?limit=200", { token }),
      fetchCollection<WatchlistItemDto>("/v1/watchlists?limit=200", { token }),
      fetchCollection<UserAlertDto>("/v1/my/alerts?activeOnly=true&limit=200", { token }),
      fetchCollection<InquiryDto>("/v1/inquiries?limit=100", { token })
    ]);

    setSavedSearches(savedSearchRows);
    setWatchlistItems(watchlistRows);
    setUserAlerts(userAlertRows);
    setInquiries(inquiryRows);
  };

  const isAuthError = (value: unknown): boolean =>
    value instanceof Error && (value.message.includes(": 401") || value.message.includes(": 403"));

  const createAuthToken = (token: string): void => {
    setAuthToken(token);
    globalThis.sessionStorage.setItem(USER_SESSION_STORAGE_KEY, token);
  };

  const resetFilters = () => {
    setQuery("");
    setCoverageFilter([...COVERAGE_TIERS]);
    setStateFilter([...PRICE_STATES]);
    setMinConfidence("low");
    setWindowDays(90);
    setLegalDisplayOnly(true);
    setActionNote(null);
  };

  useEffect(() => {
    const token = globalThis.sessionStorage.getItem(USER_SESSION_STORAGE_KEY);
    if (!token) {
      return;
    }

    setAuthToken(token);
  }, []);

  useEffect(() => {
    if (!authToken) {
      return;
    }

    const controller = new AbortController();

    const loadUser = async () => {
      try {
        const profile = await fetchResource<UserDto | null>("/v1/me", { token: authToken, signal: controller.signal });
        if (!profile) {
          clearAuthSession();
          return;
        }
        setCurrentUser(profile);
        await refreshUserWorkspace(authToken);
      } catch (requestError) {
        if (controller.signal.aborted) {
          return;
        }

        if (isAuthError(requestError)) {
          clearAuthSession();
          setActionNote("Your session expired. Sign in again.");
          return;
        }

        setError(requestError instanceof Error ? requestError.message : "Failed to load user workspace");
      }
    };

    void loadUser();

    return () => {
      controller.abort();
    };
  }, [authToken, refreshTick]);

  useEffect(() => {
    const params = new URLSearchParams(globalThis.location.search);
    const initialQuery = params.get("q") ?? "";
    const initialCoverage = parseEnumList(params, "coverageTier", COVERAGE_TIERS);
    const initialStates = parseEnumList(params, "state", PRICE_STATES);
    const initialConfidence = params.get("minConfidence");
    const initialWindowDays = Number(params.get("windowDays") ?? Number.NaN);
    const initialLegal = params.get("legalDisplayOnly");
    const initialMarketId = params.get("marketId") ?? "";

    setQuery(initialQuery);
    if (initialCoverage.length > 0) {
      setCoverageFilter(initialCoverage);
    }
    if (initialStates.length > 0) {
      setStateFilter(initialStates);
    }
    if (initialConfidence && CONFIDENCE_LABELS.includes(initialConfidence as (typeof CONFIDENCE_LABELS)[number])) {
      setMinConfidence(initialConfidence as (typeof CONFIDENCE_LABELS)[number]);
    }
    if (Number.isFinite(initialWindowDays)) {
      setWindowDays(Math.max(7, Math.min(365, Math.round(initialWindowDays))));
    }
    if (initialLegal === "false") {
      setLegalDisplayOnly(false);
    } else if (initialLegal === "true") {
      setLegalDisplayOnly(true);
    }
    if (initialMarketId) {
      setSelectedMarketId(initialMarketId);
    }
    setIsHydratedFromUrl(true);
  }, []);

  useEffect(() => {
    if (!isHydratedFromUrl) {
      return;
    }

    const controller = new AbortController();

    const loadMarkets = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (debouncedQuery.trim()) {
          params.set("query", debouncedQuery.trim());
        }

        for (const tier of coverageFilter) {
          params.append("coverageTier", tier);
        }

        for (const state of stateFilter) {
          params.append("state", state);
        }

        params.set("minConfidence", minConfidence);
        params.set("windowDays", String(debouncedWindowDays));
        params.set("limit", "100");

        const data = await fetchCollection<MarketDto>(`/v1/markets?${params.toString()}`, { signal: controller.signal });
        setMarkets(data);

        setSelectedMarketId((previous) => {
          if (data.some((item) => item.id === previous)) {
            return previous;
          }

          return data[0]?.id ?? "";
        });
      } catch (requestError) {
        if (controller.signal.aborted) {
          return;
        }

        setError(requestError instanceof Error ? requestError.message : "Failed to load markets");
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    void loadMarkets();

    return () => {
      controller.abort();
    };
  }, [coverageFilter, debouncedQuery, debouncedWindowDays, isHydratedFromUrl, minConfidence, refreshTick, stateFilter]);

  useEffect(() => {
    if (!isHydratedFromUrl) {
      return;
    }

    const controller = new AbortController();

    const loadMapMarkets = async () => {
      try {
        const params = new URLSearchParams();
        params.set("minConfidence", "low");
        params.set("windowDays", String(debouncedWindowDays));
        params.set("limit", "500");
        const rows = await fetchCollection<MarketDto>(`/v1/markets?${params.toString()}`, { signal: controller.signal });
        setMapMarkets(rows);
      } catch (requestError) {
        if (controller.signal.aborted) {
          return;
        }
        setError(requestError instanceof Error ? requestError.message : "Failed to load map markets");
      }
    };

    void loadMapMarkets();

    return () => {
      controller.abort();
    };
  }, [debouncedWindowDays, isHydratedFromUrl, refreshTick]);

  useEffect(() => {
    if (!isHydratedFromUrl) {
      return;
    }

    if (!selectedMarketId) {
      setParcels([]);
      setListings([]);
      setAlerts([]);
      setEvents([]);
      return;
    }

    const controller = new AbortController();

    const loadDetails = async () => {
      setIsDetailsLoading(true);
      try {
        const parcelParams = new URLSearchParams({ marketId: selectedMarketId, legalDisplayOnly: String(legalDisplayOnly) });
        for (const tier of coverageFilter) {
          parcelParams.append("coverageTier", tier);
        }
        parcelParams.set("limit", "300");

        const listingParams = new URLSearchParams({ marketId: selectedMarketId, windowDays: String(debouncedWindowDays) });
        for (const state of stateFilter) {
          listingParams.append("state", state);
        }
        listingParams.set("limit", "300");

        const eventParams = new URLSearchParams({ marketId: selectedMarketId, windowDays: String(debouncedWindowDays) });
        eventParams.set("limit", "100");

        const [parcelRows, listingRows, alertRows, eventRows] = await Promise.all([
          fetchCollection<ParcelDto>(`/v1/parcels?${parcelParams.toString()}`, { signal: controller.signal }),
          fetchCollection<ListingDto>(`/v1/listings?${listingParams.toString()}`, { signal: controller.signal }),
          fetchCollection<AlertDto>(`/v1/alerts?marketId=${selectedMarketId}&activeOnly=true&limit=50`, { signal: controller.signal }),
          fetchCollection<ActivityEventDto>(`/v1/events?${eventParams.toString()}`, { signal: controller.signal })
        ]);

        setParcels(parcelRows);
        setListings(listingRows);
        setAlerts(alertRows);
        setEvents(eventRows);
      } catch (requestError) {
        if (controller.signal.aborted) {
          return;
        }

        setError(requestError instanceof Error ? requestError.message : "Failed to load market details");
      } finally {
        if (!controller.signal.aborted) {
          setIsDetailsLoading(false);
        }
      }
    };

    void loadDetails();

    return () => {
      controller.abort();
    };
  }, [coverageFilter, debouncedWindowDays, isHydratedFromUrl, legalDisplayOnly, refreshTick, selectedMarketId, stateFilter]);

  useEffect(() => {
    if (!selectedMarketId) {
      setBrokerProfiles([]);
      return;
    }

    const controller = new AbortController();

    const loadBrokerProfiles = async () => {
      try {
        const rows = await fetchCollection<BrokerProfileDto>(`/v1/brokers?marketId=${selectedMarketId}&limit=100`, {
          signal: controller.signal
        });
        setBrokerProfiles(rows);
      } catch (requestError) {
        if (controller.signal.aborted) {
          return;
        }

        setError(requestError instanceof Error ? requestError.message : "Failed to load broker profiles");
      }
    };

    void loadBrokerProfiles();

    return () => {
      controller.abort();
    };
  }, [refreshTick, selectedMarketId]);

  useEffect(() => {
    if (!isHydratedFromUrl) {
      return;
    }

    const params = new URLSearchParams();
    if (query.trim()) {
      params.set("q", query.trim());
    }
    for (const tier of coverageFilter) {
      params.append("coverageTier", tier);
    }
    for (const state of stateFilter) {
      params.append("state", state);
    }
    params.set("minConfidence", minConfidence);
    params.set("windowDays", String(windowDays));
    params.set("legalDisplayOnly", String(legalDisplayOnly));
    if (selectedMarketId) {
      params.set("marketId", selectedMarketId);
    }

    const nextQuery = params.toString();
    const currentPath = globalThis.location.pathname;
    const current = globalThis.location.search.startsWith("?") ? globalThis.location.search.slice(1) : globalThis.location.search;
    if (current === nextQuery) {
      return;
    }

    const nextUrl = nextQuery ? `${currentPath}?${nextQuery}` : currentPath;
    globalThis.history.replaceState({}, "", nextUrl);
  }, [coverageFilter, isHydratedFromUrl, legalDisplayOnly, minConfidence, query, selectedMarketId, stateFilter, windowDays]);

  const toggleCoverageTier = (tier: CoverageTier) => {
    setCoverageFilter((previous) => {
      if (previous.includes(tier)) {
        if (previous.length === 1) {
          return previous;
        }

        return previous.filter((value) => value !== tier);
      }

      return [...previous, tier];
    });
  };

  const togglePriceState = (state: PriceState) => {
    setStateFilter((previous) => {
      if (previous.includes(state)) {
        if (previous.length === 1) {
          return previous;
        }

        return previous.filter((value) => value !== state);
      }

      return [...previous, state];
    });
  };

  const authenticateUser = async () => {
    setAuthMessage(null);
    const email = authEmail.trim().toLowerCase();
    if (!email || !authPassword) {
      setAuthMessage("Enter email and password.");
      return;
    }

    const endpoint = authMode === "register" ? "/v1/auth/register" : "/v1/auth/login";
    const body =
      authMode === "register"
        ? { email, password: authPassword, name: authName.trim() || null }
        : { email, password: authPassword };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        cache: "no-store",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body)
      });
      const payload = (await response.json()) as AuthResponseDto;
      if (!response.ok || !payload.ok || !payload.token || !payload.user) {
        const fallback = response.status === 409 ? "Email already registered." : "Authentication failed.";
        setAuthMessage(payload.errorCode ? `Auth error: ${payload.errorCode}` : fallback);
        return;
      }

      createAuthToken(payload.token);
      setCurrentUser(payload.user);
      setAuthPassword("");
      setAuthMode("login");
      setActionNote(`Signed in as ${payload.user.name}.`);
      await refreshUserWorkspace(payload.token);
    } catch (requestError) {
      setAuthMessage(requestError instanceof Error ? requestError.message : "Authentication request failed");
    }
  };

  const logoutUser = () => {
    clearAuthSession();
    setActionNote("Signed out.");
  };

  const saveCurrentSearch = async () => {
    if (!authToken || !currentUser) {
      setActionNote("Sign in to save searches.");
      return;
    }

    const payload = {
      name: `${selectedMarket?.name ?? "Global"} search (${new Date().toLocaleDateString()})`,
      query: query.trim(),
      coverageTier: coverageFilter,
      state: stateFilter,
      minConfidence,
      windowDays,
      legalDisplayOnly,
      marketId: selectedMarketId || null
    };

    try {
      const response = await fetch(`${API_BASE_URL}/v1/saved-searches`, {
        method: "POST",
        cache: "no-store",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify(payload)
      });
      const result = (await response.json()) as { ok: boolean; item?: SavedSearchDto; error?: string };
      if (!response.ok || !result.ok || !result.item) {
        setActionNote(result.error ?? "Could not save search.");
        return;
      }

      setSavedSearches((previous) => [result.item as SavedSearchDto, ...previous]);
      setActionNote(`Saved search: ${result.item.name}`);
    } catch (requestError) {
      setActionNote(requestError instanceof Error ? requestError.message : "Could not save search.");
    }
  };

  const saveMarketWatchlist = async () => {
    if (!authToken || !currentUser || !selectedMarket) {
      setActionNote("Sign in and select a market to save.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/v1/watchlists`, {
        method: "POST",
        cache: "no-store",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          type: "market",
          marketId: selectedMarket.id,
          parcelId: null,
          label: `${selectedMarket.name} market watch`
        })
      });
      const result = (await response.json()) as { ok: boolean; item?: WatchlistItemDto; error?: string };
      if (!response.ok || !result.ok || !result.item) {
        setActionNote(result.error ?? "Could not save market watch.");
        return;
      }

      setWatchlistItems((previous) => [result.item as WatchlistItemDto, ...previous.filter((item) => item.id !== result.item?.id)]);
      setActionNote(`Saved market watch: ${selectedMarket.name}`);
    } catch (requestError) {
      setActionNote(requestError instanceof Error ? requestError.message : "Could not save market watch.");
    }
  };

  const saveParcelWatchlist = async (parcel: ParcelDto) => {
    if (!authToken || !currentUser) {
      setActionNote("Sign in to save parcels.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/v1/watchlists`, {
        method: "POST",
        cache: "no-store",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          type: "parcel",
          marketId: parcel.marketId,
          parcelId: parcel.id,
          label: `${parcel.title}`
        })
      });
      const result = (await response.json()) as { ok: boolean; item?: WatchlistItemDto; error?: string };
      if (!response.ok || !result.ok || !result.item) {
        setActionNote(result.error ?? "Could not save parcel.");
        return;
      }

      setWatchlistItems((previous) => [result.item as WatchlistItemDto, ...previous.filter((item) => item.id !== result.item?.id)]);
      setActionNote(`Saved parcel: ${parcel.title}`);
    } catch (requestError) {
      setActionNote(requestError instanceof Error ? requestError.message : "Could not save parcel.");
    }
  };

  const toggleCompareParcel = (parcelId: string) => {
    setCompareParcelIds((previous) => {
      if (previous.includes(parcelId)) {
        return previous.filter((value) => value !== parcelId);
      }
      if (previous.length >= 6) {
        return previous;
      }
      return [...previous, parcelId];
    });
  };

  const runCompare = async () => {
    if (compareParcelIds.length === 0) {
      setActionNote("Choose at least one parcel for compare mode.");
      return;
    }

    const params = new URLSearchParams();
    for (const parcelId of compareParcelIds) {
      params.append("parcelId", parcelId);
    }

    try {
      const payload = await fetchResource<CompareResponseDto>(`/v1/compare?${params.toString()}`);
      setCompareResult(payload);
      setActionNote(`Compared ${payload.items.length} parcel(s).`);
    } catch (requestError) {
      setActionNote(requestError instanceof Error ? requestError.message : "Compare request failed.");
    }
  };

  const exportCompareMemo = async () => {
    if (!authToken || !currentUser) {
      setActionNote("Sign in to export comparison memos.");
      return;
    }
    if (compareParcelIds.length === 0) {
      setActionNote("Choose parcels first, then export.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/v1/export/memo`, {
        method: "POST",
        cache: "no-store",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          parcelIds: compareParcelIds,
          notes: `Generated by ${currentUser.name}`
        })
      });
      const payload = (await response.json()) as ExportMemoDto | { error: string };
      if (!response.ok || !("content" in payload)) {
        setActionNote("Could not export memo.");
        return;
      }

      const blob = new Blob([payload.content], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = payload.filename;
      anchor.click();
      URL.revokeObjectURL(url);
      setActionNote(`Memo exported: ${payload.filename}`);
    } catch (requestError) {
      setActionNote(requestError instanceof Error ? requestError.message : "Could not export memo.");
    }
  };

  const submitInquiry = async (listing: ListingDto) => {
    if (!authToken || !currentUser) {
      setActionNote("Sign in to send listing inquiries.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/v1/inquiries`, {
        method: "POST",
        cache: "no-store",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          listingId: listing.id,
          message: `Inquiry for ${listing.reference}: please share due diligence pack and latest terms.`
        })
      });
      const payload = (await response.json()) as { ok: boolean; item?: InquiryDto; error?: string };
      if (!response.ok || !payload.ok || !payload.item) {
        setActionNote(payload.error ?? "Inquiry could not be sent.");
        return;
      }

      setInquiries((previous) => [payload.item as InquiryDto, ...previous]);
      setActionNote(`Inquiry sent for ${listing.reference}.`);
    } catch (requestError) {
      setActionNote(requestError instanceof Error ? requestError.message : "Inquiry could not be sent.");
    }
  };

  return (
    <main className="shell">
      <header className="topbar">
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <strong>Globe Land Intelligence</strong>
          <span className="badge">Verified parcel intelligence</span>
          <span className="badge">{isLoading ? "Refreshing data" : `${markets.length} markets loaded`}</span>
          <nav className="topbar-links" aria-label="Trust and documentation pages">
            <Link className="topbar-link" href="/about">
              About
            </Link>
            <Link className="topbar-link" href="/methodology">
              Methodology
            </Link>
            <Link className="topbar-link" href="/data-sources">
              Data sources
            </Link>
            <Link className="topbar-link" href="/legal-display">
              Legal display
            </Link>
          </nav>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span className="badge">Window: {windowDays}d</span>
          <span className="badge">Min confidence: {minConfidence}</span>
          {selectedMarket ? <span className="badge">Market confidence: {selectedMarket.confidence}</span> : null}
          <span className="badge">Legal: {legalDisplayOnly ? "Strict" : "Inclusive"}</span>
          {currentUser ? <span className="badge">User: {currentUser.name}</span> : <span className="badge">Guest</span>}
          <a className="action-button" href="mailto:hello@globelandintelligence.com?subject=Globe%20Land%20Intelligence%20Demo%20Request">
            Request demo
          </a>
          {currentUser ? (
            <button type="button" className="action-button" onClick={logoutUser}>
              Sign out
            </button>
          ) : null}
          <button type="button" className="action-button" onClick={() => setRefreshTick((value) => value + 1)}>
            Refresh
          </button>
        </div>
      </header>

      <aside className="left">
        <h2 className="section-title">Filters</h2>

        <label className="field-label" htmlFor="market-query">
          Search market
        </label>
        <input
          id="market-query"
          className="field-input"
          placeholder="Country, city, region"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />

        <label className="field-label" htmlFor="market-selector">
          Market
        </label>
        <select
          id="market-selector"
          className="field-input"
          value={selectedMarketId}
          disabled={markets.length === 0}
          onChange={(event) => setSelectedMarketId(event.target.value)}
        >
          {markets.length === 0 ? (
            <option value="">{isLoading ? "Loading markets..." : "No markets found"}</option>
          ) : (
            markets.map((market) => (
              <option key={market.id} value={market.id}>
                {market.name} ({market.countryCode})
              </option>
            ))
          )}
        </select>

        <p className="field-label">Coverage tiers</p>
        <div className="control-group">
          {COVERAGE_TIERS.map((tier) => (
            <label key={tier} className="checkbox-row">
              <input
                type="checkbox"
                checked={coverageFilter.includes(tier)}
                onChange={() => toggleCoverageTier(tier)}
              />
              <span>{tier.replaceAll("_", " ")}</span>
            </label>
          ))}
        </div>

        <p className="field-label">Pricing states</p>
        <div className="control-group">
          {PRICE_STATES.map((state) => (
            <label key={state} className="checkbox-row">
              <input type="checkbox" checked={stateFilter.includes(state)} onChange={() => togglePriceState(state)} />
              <span>{priceStateLabel(state)}</span>
            </label>
          ))}
        </div>

        <label className="field-label" htmlFor="confidence-selector">
          Minimum confidence
        </label>
        <select
          id="confidence-selector"
          className="field-input"
          value={minConfidence}
          onChange={(event) => setMinConfidence(event.target.value as (typeof CONFIDENCE_LABELS)[number])}
        >
          {CONFIDENCE_LABELS.map((level) => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </select>

        <label className="checkbox-row" style={{ marginTop: 10 }}>
          <input type="checkbox" checked={legalDisplayOnly} onChange={(event) => setLegalDisplayOnly(event.target.checked)} />
          <span>Only legal-display parcels</span>
        </label>

        <p className="muted-text">Restricted parcels are masked by policy.</p>
        <div className="action-row">
          <button type="button" className="action-button" onClick={resetFilters}>
            Reset filters
          </button>
        </div>
        <p className="field-label">Workflow</p>
        <div className="action-row" style={{ gap: 8, flexWrap: "wrap" }}>
          <button type="button" className="action-button" onClick={() => void saveCurrentSearch()}>
            Save search
          </button>
          <button type="button" className="action-button" onClick={() => void saveMarketWatchlist()}>
            Save market
          </button>
          <a className="action-button" href="mailto:listings@globelandintelligence.com?subject=Submit%20Land%20Listing">
            Add listing
          </a>
          <a className="action-button" href="mailto:support@globelandintelligence.com?subject=Report%20Duplicate%20or%20Stale%20Listing">
            Report issue
          </a>
        </div>
        <p className="field-label" style={{ marginTop: 14 }}>
          Account
        </p>
        {currentUser ? (
          <div className="control-group">
            <p className="muted-text">
              Signed in as {currentUser.name} ({currentUser.email})
            </p>
            <p className="muted-text">
              Saved searches: {savedSearches.length} | Watchlist items: {watchlistItems.length} | My alerts: {userAlerts.length}
            </p>
            <p className="muted-text">Inquiries sent: {inquiries.length}</p>
          </div>
        ) : (
          <div className="control-group">
            <label className="field-label" htmlFor="auth-email">
              Email
            </label>
            <input
              id="auth-email"
              className="field-input"
              value={authEmail}
              onChange={(event) => setAuthEmail(event.target.value)}
              placeholder="you@example.com"
            />
            <label className="field-label" htmlFor="auth-password">
              Password
            </label>
            <input
              id="auth-password"
              className="field-input"
              type="password"
              value={authPassword}
              onChange={(event) => setAuthPassword(event.target.value)}
              placeholder="Minimum 8 characters"
            />
            {authMode === "register" ? (
              <>
                <label className="field-label" htmlFor="auth-name">
                  Name
                </label>
                <input
                  id="auth-name"
                  className="field-input"
                  value={authName}
                  onChange={(event) => setAuthName(event.target.value)}
                  placeholder="Analyst name"
                />
              </>
            ) : null}
            <div className="action-row" style={{ gap: 8, flexWrap: "wrap" }}>
              <button type="button" className="action-button" onClick={() => void authenticateUser()}>
                {authMode === "register" ? "Create account" : "Sign in"}
              </button>
              <button
                type="button"
                className="action-button"
                onClick={() => setAuthMode((mode) => (mode === "login" ? "register" : "login"))}
              >
                {authMode === "login" ? "Need account?" : "Have account?"}
              </button>
            </div>
            {authMessage ? <p className="muted-text">{authMessage}</p> : null}
          </div>
        )}
        {actionNote ? <p className="muted-text">{actionNote}</p> : null}
        {error ? (
          <div className="error-block">
            <p className="error-text">{error}</p>
            <button type="button" className="action-button" onClick={() => setRefreshTick((value) => value + 1)}>
              Retry now
            </button>
          </div>
        ) : null}
      </aside>

      <section className="map">
        <GlobeCanvas
          markets={mapMarkets.length > 0 ? mapMarkets : markets}
          selectedMarketId={selectedMarketId}
          onSelectMarket={setSelectedMarketId}
        />
      </section>

      <aside className="right">
        {selectedMarket ? (
          <>
            <h2 className="section-title">{selectedMarket.name} detail</h2>
            <div className="drawer-grid">
              <div className="stat-card">
                <p>Coverage</p>
                <strong>{coverageTierLabel(selectedMarket.coverageTier)}</strong>
              </div>
              <div className="stat-card">
                <p>Activity score</p>
                <strong>{selectedMarket.activityScore}</strong>
              </div>
              <div className="stat-card">
                <p>Active listings</p>
                <strong>{formatNumber(selectedMarket.activeListings)}</strong>
              </div>
              <div className="stat-card">
                <p>Closed deals</p>
                <strong>{formatNumber(selectedMarket.closedTransactions)}</strong>
              </div>
              <div className="stat-card">
                <p>Timezone</p>
                <strong>{selectedMarket.timezone}</strong>
              </div>
              <div className="stat-card">
                <p>Benchmark</p>
                <strong>{formatCurrency(selectedMarket.benchmarkPricePerSqm, selectedMarket.benchmarkCurrency)} /sqm</strong>
                <p style={{ marginTop: 4 }}>
                  {selectedMarketBenchmarkPerSqft !== null
                    ? `${formatCurrencyPrecise(selectedMarketBenchmarkPerSqft, selectedMarket.benchmarkCurrency)} /sqft`
                    : "n/a"}
                </p>
              </div>
              <div className="stat-card">
                <p>Avg activity</p>
                <strong>{portfolioSummary.averageActivity}</strong>
              </div>
              <div className="stat-card">
                <p>Legal display rate</p>
                <strong>{portfolioSummary.legalDisplayRate}%</strong>
              </div>
            </div>

            <div className="coverage-breakdown">
              <span className="badge">Tier A: {portfolioSummary.tierCounts.tier_a_global_visibility}</span>
              <span className="badge">Tier B: {portfolioSummary.tierCounts.tier_b_market_depth}</span>
              <span className="badge">Tier C: {portfolioSummary.tierCounts.tier_c_parcel_depth}</span>
              <span className="badge">Freshness: {selectedMarket.freshness}</span>
              <span className="badge">Confidence: {selectedMarket.confidence}</span>
            </div>

            <h3 className="section-title" style={{ marginTop: 14 }}>
              Parcels ({parcels.length})
            </h3>
            <div className="scroll-panel">
              {parcels.map((parcel) => (
                <article key={parcel.id} className="list-card">
                  <strong>{parcel.legalDisplayAllowed ? parcel.title : "Restricted parcel"}</strong>
                  <p>{parcel.legalDisplayAllowed ? parcel.canonicalParcelId : "REDACTED"}</p>
                  <p>{parcel.legalDisplayAllowed ? `${formatNumber(parcel.areaSqm)} sqm | ${parcel.zoningCode}` : "Display masked by policy"}</p>
                  <p>
                    Freshness: {parcel.freshness} | Confidence: {parcel.confidence}
                  </p>
                  <div className="action-row" style={{ gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                    <button type="button" className="action-button" onClick={() => toggleCompareParcel(parcel.id)}>
                      {compareParcelIds.includes(parcel.id) ? "Remove compare" : "Add compare"}
                    </button>
                    <button type="button" className="action-button" onClick={() => void saveParcelWatchlist(parcel)}>
                      Save parcel
                    </button>
                  </div>
                </article>
              ))}
              {parcels.length === 0 ? <p className="muted-text">No parcels match current filters.</p> : null}
            </div>

            <h3 className="section-title" style={{ marginTop: 14 }}>
              Price observations ({listings.length})
            </h3>
            <div className="scroll-panel">
              {listings.map((listing) => (
                <article key={listing.id} className="list-card">
                  <strong>
                    {listing.currencyCode} {formatNumber(listing.amount)}
                  </strong>
                  <p>
                    {priceStateLabel(listing.state)} | {listing.reference}
                  </p>
                  <p>
                    {listing.sourceName}
                    {listing.brokerName ? ` | ${listing.brokerName}` : ""}
                  </p>
                  <p>Observed {formatDateTime(listing.observedAt, selectedMarket.timezone)}</p>
                  <p>
                    Freshness: {listing.freshness} | Confidence: {listing.confidence}
                  </p>
                  <div className="action-row" style={{ gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                    <button type="button" className="action-button" onClick={() => void submitInquiry(listing)}>
                      Send inquiry
                    </button>
                  </div>
                </article>
              ))}
              {listings.length === 0 ? <p className="muted-text">No listing observations in this window.</p> : null}
            </div>

            <h3 className="section-title" style={{ marginTop: 14 }}>
              Active alerts ({alerts.length})
            </h3>
            <div className="scroll-panel">
              {alerts.map((alert) => (
                <article key={alert.id} className="list-card">
                  <strong>{alert.title}</strong>
                  <p>{alert.ruleType}</p>
                  <p>{alert.lastTriggeredAt ? formatDateTime(alert.lastTriggeredAt, selectedMarket.timezone) : "Never triggered"}</p>
                </article>
              ))}
              {alerts.length === 0 ? <p className="muted-text">No active alerts for this market.</p> : null}
            </div>

            <h3 className="section-title" style={{ marginTop: 14 }}>
              My watchlist alerts ({userAlerts.length})
            </h3>
            <div className="scroll-panel">
              {userAlerts.map((alert) => (
                <article key={`${alert.id}-${alert.watchlistItemId}`} className="list-card">
                  <strong>{alert.title}</strong>
                  <p>{alert.watchlistLabel}</p>
                  <p>{alert.ruleType}</p>
                  <p>{alert.lastTriggeredAt ? formatDateTime(alert.lastTriggeredAt, selectedMarket.timezone) : "Never triggered"}</p>
                </article>
              ))}
              {userAlerts.length === 0 ? <p className="muted-text">No watchlist alerts yet.</p> : null}
            </div>

            <h3 className="section-title" style={{ marginTop: 14 }}>
              Broker profiles ({brokerProfiles.length})
            </h3>
            <div className="scroll-panel">
              {brokerProfiles.map((broker) => (
                <article key={broker.id} className="list-card">
                  <strong>{broker.name}</strong>
                  <p>
                    Listings: {broker.listingCount} | Verified: {broker.verifiedListingCount}
                  </p>
                  <p>Status: {broker.status}</p>
                  <p>{broker.lastObservedAt ? `Last observed ${formatDateTime(broker.lastObservedAt, selectedMarket.timezone)}` : "No recent observations"}</p>
                </article>
              ))}
              {brokerProfiles.length === 0 ? <p className="muted-text">No broker profiles for this market.</p> : null}
            </div>

            <h3 className="section-title" style={{ marginTop: 14 }}>
              Compare mode ({compareParcelIds.length})
            </h3>
            <div className="scroll-panel">
              <p className="muted-text">Selected parcel IDs: {compareParcelIds.length > 0 ? compareParcelIds.join(", ") : "None selected"}</p>
              <div className="action-row" style={{ gap: 8, flexWrap: "wrap" }}>
                <button type="button" className="action-button" onClick={() => void runCompare()}>
                  Run compare
                </button>
                <button type="button" className="action-button" onClick={() => void exportCompareMemo()}>
                  Export memo
                </button>
                <button type="button" className="action-button" onClick={() => setCompareParcelIds([])}>
                  Clear
                </button>
              </div>
              {compareResult?.items?.map((item) => (
                <article key={item.parcelId} className="list-card">
                  <strong>{item.parcelTitle}</strong>
                  <p>
                    {item.marketName} | {formatNumber(item.areaSqm)} sqm
                  </p>
                  <p>
                    Latest:{" "}
                    {item.latestListingAmount !== null && item.latestListingCurrencyCode
                      ? `${item.latestListingState ?? "n/a"} ${item.latestListingCurrencyCode} ${formatNumber(item.latestListingAmount)}`
                      : "No observations"}
                  </p>
                  <p>
                    Avg observed:{" "}
                    {item.averageObservedAmount !== null && item.latestListingCurrencyCode
                      ? `${item.latestListingCurrencyCode} ${formatNumber(item.averageObservedAmount)}`
                      : "n/a"}
                  </p>
                  <p>Observation count: {item.observationCount}</p>
                </article>
              ))}
            </div>

            <h3 className="section-title" style={{ marginTop: 14 }}>
              Activity log ({events.length})
            </h3>
            <div className="scroll-panel">
              {events.map((event) => (
                <article key={event.id} className="list-card">
                  <strong>{event.summary}</strong>
                  <p>{event.category}</p>
                  <p>{formatDateTime(event.occurredAt, selectedMarket.timezone)}</p>
                </article>
              ))}
              {events.length === 0 ? <p className="muted-text">No activity events in selected window.</p> : null}
            </div>
          </>
        ) : (
          <p className="muted-text">No market matches current filters.</p>
        )}
      </aside>

      <section className="legend">
        <h2 className="section-title">Heat legend and time rail</h2>
        <div className="legend-gradient" />
        <div className="legend-labels">
          <span>Lower blended USD-eq /sqft</span>
          <span>Higher blended USD-eq /sqft</span>
        </div>
        <p className="muted-text" style={{ margin: "8px 0 0" }}>
          Rate model: market benchmarks are normalized to USD-equivalent per square foot for cross-market comparability, then rendered as
          a 3D adaptive land-only grid. Zooming in increases tile density and shrinks tile area; zooming out coarsens cells for
          performance.
        </p>
        <p className="muted-text" style={{ margin: "6px 0 0" }}>
          Quick read: 1) pick a market, 2) hover/tap a land tile, 3) review nearest city plus blended rate, 4) validate provenance and
          policy before decisions.
        </p>
        <p className="muted-text" style={{ margin: "6px 0 0" }}>
          <Link href="/methodology">Methodology</Link> | <Link href="/data-sources">Data sources</Link> |{" "}
          <Link href="/legal-display">Legal display policy</Link>
        </p>
        <label className="field-label" htmlFor="window-range" style={{ marginTop: 10 }}>
          Observation window: {windowDays} days
        </label>
        <input
          id="window-range"
          type="range"
          min={7}
          max={365}
          value={windowDays}
          onChange={(event) => setWindowDays(Number(event.target.value))}
          style={{ width: "100%" }}
        />
      </section>

      <footer className="ticker">
        {latestRefreshAt
          ? `Last refresh ${formatRelativeTime(latestRefreshAt)} (${formatDateTime(latestRefreshAt, selectedMarket?.timezone)})`
          : "No activity events in selected window."}
      </footer>

      {isLoading || isDetailsLoading ? (
        <div className="loading-overlay" aria-live="polite">
          {isLoading ? "Syncing market feeds..." : "Loading market detail..."}
        </div>
      ) : null}
    </main>
  );
};
