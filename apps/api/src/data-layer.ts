/** Merged mock + ingested silver dataset for API handlers. */

import {
  activityEvents,
  alerts,
  listings as mockListings,
  markets as mockMarkets,
  parcels as mockParcels,
  reviewQueue,
  sourceHealthRows as mockSourceHealthRows
} from "./data.js";
import type { ListingDto, MarketDto, ParcelDto, SourceHealthDto } from "./contracts.js";
import { buildGoldFromSilver, mergeById, mergeMarkets } from "./silver-gold.js";
import { listAvailableSilverSources, loadAllSilverSnapshotsSync } from "./silver-store.js";

export { activityEvents, alerts, reviewQueue };

const silverEnabled = (): boolean => process.env.GLOBE_USE_INGEST_DATA !== "false";

let cached:
  | {
      markets: MarketDto[];
      parcels: ParcelDto[];
      listings: ListingDto[];
      sourceHealthRows: SourceHealthDto[];
    }
  | undefined;

const buildMergedDataset = () => {
  if (!silverEnabled() || listAvailableSilverSources().length === 0) {
    return {
      markets: mockMarkets,
      parcels: mockParcels,
      listings: mockListings,
      sourceHealthRows: mockSourceHealthRows
    };
  }

  const snapshots = loadAllSilverSnapshotsSync();
  const gold = buildGoldFromSilver(snapshots);
  return {
    markets: mergeMarkets(mockMarkets, gold.markets),
    parcels: mergeById(mockParcels, gold.parcels),
    listings: mergeById(mockListings, gold.listings),
    sourceHealthRows: mergeById(mockSourceHealthRows, gold.sourceHealthRows)
  };
};

const dataset = () => {
  if (!cached) {
    cached = buildMergedDataset();
  }
  return cached;
};

/** Reset cached merge (tests). */
export const resetDataLayerCache = (): void => {
  cached = undefined;
};

export const markets = (): MarketDto[] => dataset().markets;
export const parcels = (): ParcelDto[] => dataset().parcels;
export const listings = (): ListingDto[] => dataset().listings;
export const sourceHealthRows = (): SourceHealthDto[] => dataset().sourceHealthRows;
