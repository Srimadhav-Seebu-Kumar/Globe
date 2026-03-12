import type {
  AlertDto,
  CollectionResponse,
  HealthResponse,
  ListingDto,
  MarketDto,
  ParcelDto
} from "./contracts.js";

export const health = (): HealthResponse => ({
  status: "ok",
  service: "api",
  timestamp: new Date().toISOString()
});

export const listMarkets = (): CollectionResponse<MarketDto> => ({
  data: [],
  meta: { total: 0 }
});

export const listParcels = (): CollectionResponse<ParcelDto> => ({
  data: [],
  meta: { total: 0 }
});

export const listListings = (): CollectionResponse<ListingDto> => ({
  data: [],
  meta: { total: 0 }
});

export const listAlerts = (): CollectionResponse<AlertDto> => ({
  data: [],
  meta: { total: 0 }
});
