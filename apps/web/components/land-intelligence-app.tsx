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

interface CollectionResponse<T> {
  data: T[];
  meta: {
    total: number;
  };
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api";

const formatNumber = (value: number): string => new Intl.NumberFormat("en-US").format(value);
const formatCurrency = (value: number, currency: string): string =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
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

const useDebouncedValue = <T,>(value: T, delayMs: number): T => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timeout);
  }, [delayMs, value]);

  return debounced;
};

const fetchCollection = async <T,>(path: string, signal?: AbortSignal): Promise<T[]> => {
  const requestInit: RequestInit = { cache: "no-store" };
  if (signal) {
    requestInit.signal = signal;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, requestInit);
  if (!response.ok) {
    throw new Error(`Request failed for ${path}: ${response.status}`);
  }

  const payload = (await response.json()) as CollectionResponse<T>;
  return payload.data;
};

export const LandIntelligenceApp = () => {
  const [markets, setMarkets] = useState<MarketDto[]>([]);
  const [parcels, setParcels] = useState<ParcelDto[]>([]);
  const [listings, setListings] = useState<ListingDto[]>([]);
  const [alerts, setAlerts] = useState<AlertDto[]>([]);
  const [events, setEvents] = useState<ActivityEventDto[]>([]);

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
  const debouncedQuery = useDebouncedValue(query, 300);
  const debouncedWindowDays = useDebouncedValue(windowDays, 250);

  const selectedMarket = useMemo(
    () => markets.find((market) => market.id === selectedMarketId) ?? null,
    [markets, selectedMarketId]
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

  const resetFilters = () => {
    setQuery("");
    setCoverageFilter([...COVERAGE_TIERS]);
    setStateFilter([...PRICE_STATES]);
    setMinConfidence("low");
    setWindowDays(90);
    setLegalDisplayOnly(true);
  };

  useEffect(() => {
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

        const data = await fetchCollection<MarketDto>(`/v1/markets?${params.toString()}`, controller.signal);
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
  }, [coverageFilter, debouncedQuery, debouncedWindowDays, minConfidence, refreshTick, stateFilter]);

  useEffect(() => {
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
          fetchCollection<ParcelDto>(`/v1/parcels?${parcelParams.toString()}`, controller.signal),
          fetchCollection<ListingDto>(`/v1/listings?${listingParams.toString()}`, controller.signal),
          fetchCollection<AlertDto>(`/v1/alerts?marketId=${selectedMarketId}&activeOnly=true&limit=50`, controller.signal),
          fetchCollection<ActivityEventDto>(`/v1/events?${eventParams.toString()}`, controller.signal)
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
  }, [coverageFilter, debouncedWindowDays, legalDisplayOnly, refreshTick, selectedMarketId, stateFilter]);

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

  return (
    <main className="shell">
      <header className="topbar">
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <strong>Globe Land Intelligence</strong>
          <span className="badge">Live market intelligence</span>
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
          <span className="badge">Confidence: {minConfidence}</span>
          <span className="badge">Legal: {legalDisplayOnly ? "Strict" : "Inclusive"}</span>
          <a className="action-button" href="mailto:hello@globelandintelligence.com?subject=Globe%20Land%20Intelligence%20Demo%20Request">
            Request demo
          </a>
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
        <GlobeCanvas markets={markets} selectedMarketId={selectedMarketId} onSelectMarket={setSelectedMarketId} />
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
                <strong>{formatCurrency(selectedMarket.benchmarkPricePerSqm, selectedMarket.benchmarkCurrency)}</strong>
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
          <span>Lower blended $/sqft</span>
          <span>Higher blended $/sqft</span>
        </div>
        <p className="muted-text" style={{ margin: "8px 0 0" }}>
          Rate model: benchmark $/sqm is converted to $/sqft (divide by 10.7639), then rendered as a 3D adaptive land-only grid. Zooming
          in increases tile density and shrinks tile area; zooming out coarsens cells for performance. Hover land tiles to raise nearby
          cells instantly and inspect blended rate + nearest major city context.
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
