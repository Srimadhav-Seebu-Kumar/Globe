/** Map silver ingestion records into API DTOs (gold read model). */

import type { ListingDto, MarketDto, ParcelDto, SourceHealthDto } from "./contracts.js";
import type { FreshnessTier } from "@globe/types";
import type {
  SilverRecord,
  SilverSourceSnapshot,
  SilverTransactionRecord,
  SilverValueZoneRecord
} from "./silver-store.js";
import { marketIdForSilverSource } from "./silver-store.js";

const mapFreshness = (freshness: string): FreshnessTier => {
  if (freshness === "realtime" || freshness === "daily" || freshness === "weekly" || freshness === "stale") {
    return freshness;
  }
  if (freshness === "monthly" || freshness === "semiannual") {
    return "weekly";
  }
  return "stale";
};

const mapConfidence = (confidence: string): MarketDto["confidence"] => {
  if (confidence === "verified" || confidence === "high" || confidence === "medium" || confidence === "low") {
    return confidence;
  }
  return "medium";
};
const SOURCE_DISPLAY: Record<
  string,
  { sourceName: string; marketName: string; region: string; timezone: string; center: { lng: number; lat: number } }
> = {
  "uk-hmlr-ppd": {
    sourceName: "HM Land Registry Price Paid",
    marketName: "England & Wales",
    region: "Europe",
    timezone: "Europe/London",
    center: { lng: -2.5, lat: 52.5 }
  },
  "kr-molit-land": {
    sourceName: "MOLIT Korea land trades",
    marketName: "Seoul Metro",
    region: "Asia-Pacific",
    timezone: "Asia/Seoul",
    center: { lng: 127.0, lat: 37.5665 }
  },
  "jp-mlit-koji": {
    sourceName: "MLIT 地価公示",
    marketName: "Tokyo",
    region: "Asia-Pacific",
    timezone: "Asia/Tokyo",
    center: { lng: 139.6917, lat: 35.6895 }
  },
  "tw-taipei-land-price": {
    sourceName: "Taipei announced land values",
    marketName: "Taipei",
    region: "Asia-Pacific",
    timezone: "Asia/Taipei",
    center: { lng: 121.5654, lat: 25.033 }
  },
  "tw-moi-land-stats": {
    sourceName: "Taiwan MOI county land stats",
    marketName: "Taiwan",
    region: "Asia-Pacific",
    timezone: "Asia/Taipei",
    center: { lng: 121.0, lat: 23.7 }
  },
  "de-nrw-boris": {
    sourceName: "BORIS NRW Bodenrichtwerte",
    marketName: "North Rhine-Westphalia",
    region: "Europe",
    timezone: "Europe/Berlin",
    center: { lng: 7.0, lat: 51.5 }
  },
  "global-bis-rppi": {
    sourceName: "BIS residential property price index",
    marketName: "Global benchmark",
    region: "Global",
    timezone: "UTC",
    center: { lng: 0, lat: 20 }
  },
  "cz-csu-avg-prices": {
    sourceName: "ČSÚ average property prices",
    marketName: "Czech Republic",
    region: "Europe",
    timezone: "Europe/Prague",
    center: { lng: 14.4378, lat: 50.0755 }
  }
};

const MARKET_SLUG: Record<string, string> = {
  "m-uk-ew": "england-wales-uk",
  "m-seoul": "seoul-kr",
  "m-tokyo": "tokyo-jp",
  "m-taipei-tw": "taipei-tw",
  "m-taiwan-tw": "taiwan-tw",
  "m-nrw-de": "nrw-de",
  "m-global-benchmark": "global-benchmark",
  "m-prague-cz": "prague-cz"
};

/** Align with mock market ids where the geography overlaps. */
const SOURCE_MARKET_OVERRIDE: Record<string, string> = {
  "kr-molit-land": "m-seoul",
  "jp-mlit-koji": "m-tokyo"
};

const isValueZone = (record: SilverRecord): record is SilverValueZoneRecord =>
  record.record_kind === "value_zone" || "value_per_sqm" in record;

const isTransaction = (record: SilverRecord): record is SilverTransactionRecord =>
  !isValueZone(record) && "amount" in record && typeof record.amount === "number";

const median = (values: number[]): number => {
  if (values.length === 0) {
    return 0;
  }
  const sorted = [...values].sort((left, right) => left - right);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? Math.round((sorted[mid - 1]! + sorted[mid]!) / 2) : sorted[mid]!;
};

const slugForMarket = (marketId: string): string => MARKET_SLUG[marketId] ?? marketId.replace(/^m-/, "");

const coverageForSource = (sourceCode: string): MarketDto["coverageTier"] => {
  if (sourceCode === "tw-taipei-land-price" || sourceCode === "jp-mlit-koji") {
    return "tier_c_parcel_depth";
  }
  if (sourceCode === "global-bis-rppi") {
    return "tier_a_global_visibility";
  }
  return "tier_b_market_depth";
};

export interface SilverGoldBundle {
  markets: MarketDto[];
  parcels: ParcelDto[];
  listings: ListingDto[];
  sourceHealthRows: SourceHealthDto[];
}

export const buildGoldFromSilver = (snapshots: SilverSourceSnapshot[]): SilverGoldBundle => {
  const markets: MarketDto[] = [];
  const parcels: ParcelDto[] = [];
  const listings: ListingDto[] = [];
  const sourceHealthRows: SourceHealthDto[] = [];

  for (const snapshot of snapshots) {
    const meta = SOURCE_DISPLAY[snapshot.sourceCode];
    const marketId = SOURCE_MARKET_OVERRIDE[snapshot.sourceCode] ?? marketIdForSilverSource(snapshot.sourceCode);
    if (!marketId || !meta) {
      continue;
    }

    const zoneValues = snapshot.records.filter(isValueZone).map((record) => record.value_per_sqm);
    const txnAmounts = snapshot.records.filter(isTransaction).map((record) => record.amount);
    const benchmarkPool = zoneValues.length > 0 ? zoneValues : txnAmounts;
    const benchmark = median(benchmarkPool);
    const currency =
      snapshot.records.find((record) => ("currency_code" in record ? record.currency_code : undefined))?.currency_code ??
      "USD";
    const latestObserved = snapshot.records.reduce((latest, record) => {
      return record.observed_at > latest ? record.observed_at : latest;
    }, snapshot.records[0]?.observed_at ?? new Date().toISOString());

    const closedCount = snapshot.records.filter((record) => isTransaction(record) && record.price_state === "closed").length;
    const estimateCount = snapshot.records.filter((record) => isValueZone(record)).length;

    markets.push({
      id: marketId,
      slug: slugForMarket(marketId),
      name: meta.marketName,
      countryCode: snapshot.records[0]?.country_code ?? "XX",
      region: meta.region,
      timezone: meta.timezone,
      center: meta.center,
      coverageTier: coverageForSource(snapshot.sourceCode),
      freshness: mapFreshness(snapshot.records[0]?.freshness ?? "weekly"),
      confidence: mapConfidence(snapshot.records[0]?.confidence ?? "medium"),
      activityScore: Math.min(95, 40 + Math.log10(Math.max(snapshot.records.length, 1)) * 15),
      activeListings: estimateCount,
      closedTransactions: closedCount,
      benchmarkPricePerSqm: benchmark,
      benchmarkCurrency: currency,
      updatedAt: latestObserved
    });

    sourceHealthRows.push({
      id: `s-ingest-${snapshot.sourceCode}`,
      sourceCode: snapshot.sourceCode,
      sourceName: meta.sourceName,
      marketId,
      marketName: meta.marketName,
      status: snapshot.records.length > 0 ? "healthy" : "degraded",
      freshnessLagMinutes: 60,
      successRate30d: 99,
      lastIngestedAt: latestObserved,
      licenseState: "active"
    });

    let parcelIndex = 0;
    let listingIndex = 0;
    for (const record of snapshot.records) {
      if (isValueZone(record)) {
        const parcelId = `p-ingest-${snapshot.sourceCode}-${parcelIndex}`;
        parcelIndex += 1;
        const coords = record.geometry?.coordinates;
        const center =
          Array.isArray(coords) && coords.length >= 2
            ? { lng: Number(coords[0]), lat: Number(coords[1]) }
            : meta.center;
        const district = record.address?.district ?? record.zone_name ?? record.market_code;
        parcels.push({
          id: parcelId,
          canonicalParcelId: record.source_record_id,
          marketId,
          title: `${district} — official value zone (estimate)`,
          center,
          areaSqm: typeof record.attributes?.area_sqm === "number" ? (record.attributes.area_sqm as number) : 100,
          zoningCode: "OFFICIAL-VALUE",
          coverageTier: coverageForSource(snapshot.sourceCode),
          legalDisplayAllowed: true,
          freshness: mapFreshness(record.freshness),
          confidence: mapConfidence(record.confidence),
          updatedAt: record.observed_at
        });
        listings.push({
          id: `l-ingest-${snapshot.sourceCode}-${listingIndex}`,
          reference: record.record_id,
          marketId,
          parcelId,
          state: "estimate",
          amount: record.value_per_sqm,
          currencyCode: record.currency_code,
          observedAt: record.observed_at,
          sourceName: meta.sourceName,
          brokerName: null,
          freshness: mapFreshness(record.freshness),
          confidence: mapConfidence(record.confidence)
        });
        listingIndex += 1;
        continue;
      }

      if (isTransaction(record)) {
        listings.push({
          id: `l-ingest-${snapshot.sourceCode}-${listingIndex}`,
          reference: record.record_id,
          marketId,
          parcelId: null,
          state: record.price_state,
          amount: record.amount,
          currencyCode: record.currency_code,
          observedAt: record.observed_at,
          sourceName: meta.sourceName,
          brokerName: null,
          freshness: mapFreshness(record.freshness),
          confidence: mapConfidence(record.confidence)
        });
        listingIndex += 1;
      }
    }
  }

  return { markets, parcels, listings, sourceHealthRows };
};

export const mergeById = <T extends { id: string }>(primary: T[], overlay: T[]): T[] => {
  const map = new Map<string, T>();
  for (const item of primary) {
    map.set(item.id, item);
  }
  for (const item of overlay) {
    map.set(item.id, item);
  }
  return [...map.values()];
};

export const mergeMarkets = (mock: MarketDto[], ingested: MarketDto[]): MarketDto[] => {
  const ingestedById = new Map(ingested.map((market) => [market.id, market]));
  return mock.map((market) => {
    const overlay = ingestedById.get(market.id);
    if (!overlay) {
      return market;
    }
    ingestedById.delete(market.id);
    return {
      ...market,
      benchmarkPricePerSqm: overlay.benchmarkPricePerSqm || market.benchmarkPricePerSqm,
      benchmarkCurrency: overlay.benchmarkCurrency || market.benchmarkCurrency,
      closedTransactions: market.closedTransactions + overlay.closedTransactions,
      activeListings: market.activeListings + overlay.activeListings,
      updatedAt: overlay.updatedAt > market.updatedAt ? overlay.updatedAt : market.updatedAt,
      confidence: overlay.confidence,
      freshness: overlay.freshness
    };
  }).concat([...ingestedById.values()]);
};
