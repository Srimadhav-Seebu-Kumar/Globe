"use client";

import dynamic from "next/dynamic";
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
  watchlistId: string;
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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

const formatNumber = (value: number): string => new Intl.NumberFormat("en-US").format(value);
const formatDateTime = (value: string): string => new Date(value).toLocaleString();

const priceStateLabel = (state: PriceState): string => state.replace("_", " ");

const fetchCollection = async <T,>(path: string): Promise<T[]> => {
  const response = await fetch(`${API_BASE_URL}${path}`, { cache: "no-store" });
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
  const [legalDisplayOnly, setLegalDisplayOnly] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const selectedMarket = useMemo(
    () => markets.find((market) => market.id === selectedMarketId) ?? null,
    [markets, selectedMarketId]
  );

  useEffect(() => {
    const loadMarkets = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (query.trim()) {
          params.set("query", query.trim());
        }

        for (const tier of coverageFilter) {
          params.append("coverageTier", tier);
        }

        for (const state of stateFilter) {
          params.append("state", state);
        }

        params.set("minConfidence", minConfidence);
        params.set("windowDays", String(windowDays));

        const data = await fetchCollection<MarketDto>(`/v1/markets?${params.toString()}`);
        setMarkets(data);

        setSelectedMarketId((previous) => {
          if (data.some((item) => item.id === previous)) {
            return previous;
          }

          return data[0]?.id ?? "";
        });
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "Failed to load markets");
      } finally {
        setIsLoading(false);
      }
    };

    void loadMarkets();
  }, [coverageFilter, minConfidence, query, stateFilter, windowDays]);

  useEffect(() => {
    if (!selectedMarketId) {
      setParcels([]);
      setListings([]);
      setAlerts([]);
      setEvents([]);
      return;
    }

    const loadDetails = async () => {
      try {
        const parcelParams = new URLSearchParams({ marketId: selectedMarketId, legalDisplayOnly: String(legalDisplayOnly) });
        for (const tier of coverageFilter) {
          parcelParams.append("coverageTier", tier);
        }

        const listingParams = new URLSearchParams({ marketId: selectedMarketId, windowDays: String(windowDays) });
        for (const state of stateFilter) {
          listingParams.append("state", state);
        }

        const eventParams = new URLSearchParams({ marketId: selectedMarketId, windowDays: String(windowDays) });

        const [parcelRows, listingRows, alertRows, eventRows] = await Promise.all([
          fetchCollection<ParcelDto>(`/v1/parcels?${parcelParams.toString()}`),
          fetchCollection<ListingDto>(`/v1/listings?${listingParams.toString()}`),
          fetchCollection<AlertDto>(`/v1/alerts?marketId=${selectedMarketId}&activeOnly=true`),
          fetchCollection<ActivityEventDto>(`/v1/events?${eventParams.toString()}`)
        ]);

        setParcels(parcelRows);
        setListings(listingRows);
        setAlerts(alertRows);
        setEvents(eventRows);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "Failed to load market details");
      }
    };

    void loadDetails();
  }, [coverageFilter, legalDisplayOnly, selectedMarketId, stateFilter, windowDays]);

  const toggleCoverageTier = (tier: CoverageTier) => {
    setCoverageFilter((previous) =>
      previous.includes(tier) ? previous.filter((value) => value !== tier) : [...previous, tier]
    );
  };

  const togglePriceState = (state: PriceState) => {
    setStateFilter((previous) =>
      previous.includes(state) ? previous.filter((value) => value !== state) : [...previous, state]
    );
  };

  return (
    <main className="shell">
      <header className="topbar">
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <strong>Globe Land Intelligence</strong>
          <span className="badge">Live market intelligence</span>
          <span className="badge">{isLoading ? "Refreshing data" : `${markets.length} markets loaded`}</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <span className="badge">Window: {windowDays}d</span>
          <span className="badge">Confidence: {minConfidence}</span>
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
          onChange={(event) => setSelectedMarketId(event.target.value)}
        >
          {markets.map((market) => (
            <option key={market.id} value={market.id}>
              {market.name} ({market.countryCode})
            </option>
          ))}
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

        {error ? <p className="error-text">{error}</p> : null}
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
                <strong>{selectedMarket.coverageTier}</strong>
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
            </div>

            <h3 className="section-title" style={{ marginTop: 14 }}>
              Parcels ({parcels.length})
            </h3>
            <div className="scroll-panel">
              {parcels.map((parcel) => (
                <article key={parcel.id} className="list-card">
                  <strong>{parcel.title}</strong>
                  <p>{parcel.canonicalParcelId}</p>
                  <p>
                    {formatNumber(parcel.areaSqm)} sqm | {parcel.zoningCode} | {parcel.legalDisplayAllowed ? "Display allowed" : "Display masked"}
                  </p>
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
                </article>
              ))}
            </div>

            <h3 className="section-title" style={{ marginTop: 14 }}>
              Active alerts ({alerts.length})
            </h3>
            <div className="scroll-panel">
              {alerts.map((alert) => (
                <article key={alert.id} className="list-card">
                  <strong>{alert.title}</strong>
                  <p>{alert.ruleType}</p>
                  <p>{alert.lastTriggeredAt ? formatDateTime(alert.lastTriggeredAt) : "Never triggered"}</p>
                </article>
              ))}
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
          <span>Lower activity</span>
          <span>Higher activity</span>
        </div>
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
        {events.length > 0
          ? events.map((event) => `${formatDateTime(event.occurredAt)} | ${event.summary}`).join("  ||  ")
          : "No activity events in selected window."}
      </footer>
    </main>
  );
};
