import type {
  ActivityEventDto,
  AlertDto,
  ListingDto,
  MarketDto,
  ParcelDto,
  ReviewItemDto,
  SourceHealthDto
} from "./contracts.js";

const now = new Date();

const daysAgo = (days: number): string => {
  const value = new Date(now);
  value.setUTCDate(value.getUTCDate() - days);
  return value.toISOString();
};

export const markets: MarketDto[] = [
  {
    id: "m-dubai",
    slug: "dubai-uae",
    name: "Dubai",
    countryCode: "AE",
    region: "Middle East",
    center: { lng: 55.2708, lat: 25.2048 },
    coverageTier: "tier_c_parcel_depth",
    freshness: "daily",
    confidence: "verified",
    activityScore: 88,
    activeListings: 1482,
    closedTransactions: 534,
    benchmarkPricePerSqm: 2950,
    benchmarkCurrency: "AED",
    updatedAt: daysAgo(1)
  },
  {
    id: "m-london",
    slug: "greater-london-uk",
    name: "Greater London",
    countryCode: "GB",
    region: "Europe",
    center: { lng: -0.1276, lat: 51.5072 },
    coverageTier: "tier_b_market_depth",
    freshness: "daily",
    confidence: "high",
    activityScore: 81,
    activeListings: 978,
    closedTransactions: 402,
    benchmarkPricePerSqm: 4200,
    benchmarkCurrency: "GBP",
    updatedAt: daysAgo(1)
  },
  {
    id: "m-singapore",
    slug: "singapore-city-sg",
    name: "Singapore",
    countryCode: "SG",
    region: "Asia-Pacific",
    center: { lng: 103.8198, lat: 1.3521 },
    coverageTier: "tier_c_parcel_depth",
    freshness: "realtime",
    confidence: "verified",
    activityScore: 79,
    activeListings: 631,
    closedTransactions: 287,
    benchmarkPricePerSqm: 6100,
    benchmarkCurrency: "SGD",
    updatedAt: daysAgo(0)
  },
  {
    id: "m-sao-paulo",
    slug: "sao-paulo-br",
    name: "Sao Paulo Metro",
    countryCode: "BR",
    region: "Latin America",
    center: { lng: -46.6333, lat: -23.5505 },
    coverageTier: "tier_a_global_visibility",
    freshness: "weekly",
    confidence: "medium",
    activityScore: 63,
    activeListings: 412,
    closedTransactions: 129,
    benchmarkPricePerSqm: 1450,
    benchmarkCurrency: "BRL",
    updatedAt: daysAgo(5)
  },
  {
    id: "m-lagos",
    slug: "lagos-ng",
    name: "Lagos",
    countryCode: "NG",
    region: "Africa",
    center: { lng: 3.3792, lat: 6.5244 },
    coverageTier: "tier_a_global_visibility",
    freshness: "weekly",
    confidence: "low",
    activityScore: 58,
    activeListings: 355,
    closedTransactions: 72,
    benchmarkPricePerSqm: 820000,
    benchmarkCurrency: "NGN",
    updatedAt: daysAgo(6)
  },
  {
    id: "m-texas-triangle",
    slug: "texas-triangle-us",
    name: "Texas Triangle",
    countryCode: "US",
    region: "North America",
    center: { lng: -97.7431, lat: 30.2672 },
    coverageTier: "tier_b_market_depth",
    freshness: "daily",
    confidence: "high",
    activityScore: 84,
    activeListings: 1234,
    closedTransactions: 510,
    benchmarkPricePerSqm: 540,
    benchmarkCurrency: "USD",
    updatedAt: daysAgo(2)
  }
];

export const parcels: ParcelDto[] = [
  {
    id: "p-dxb-001",
    canonicalParcelId: "AE-DXB-PLM-001",
    marketId: "m-dubai",
    title: "Dubai South mixed-use parcel",
    center: { lng: 55.3132, lat: 24.8887 },
    areaSqm: 12400,
    zoningCode: "MU-3",
    coverageTier: "tier_c_parcel_depth",
    legalDisplayAllowed: true,
    freshness: "daily",
    confidence: "verified",
    updatedAt: daysAgo(1)
  },
  {
    id: "p-dxb-002",
    canonicalParcelId: "AE-DXB-JVC-118",
    marketId: "m-dubai",
    title: "JVC residential plot",
    center: { lng: 55.2181, lat: 25.0592 },
    areaSqm: 3650,
    zoningCode: "R-2",
    coverageTier: "tier_c_parcel_depth",
    legalDisplayAllowed: true,
    freshness: "daily",
    confidence: "high",
    updatedAt: daysAgo(2)
  },
  {
    id: "p-ldn-001",
    canonicalParcelId: "GB-LON-E14-42",
    marketId: "m-london",
    title: "Canary Wharf infill lot",
    center: { lng: -0.0165, lat: 51.5048 },
    areaSqm: 1900,
    zoningCode: "CAZ-COM",
    coverageTier: "tier_b_market_depth",
    legalDisplayAllowed: false,
    freshness: "daily",
    confidence: "high",
    updatedAt: daysAgo(1)
  },
  {
    id: "p-sg-001",
    canonicalParcelId: "SG-09-ARC-774",
    marketId: "m-singapore",
    title: "Jurong innovation district parcel",
    center: { lng: 103.6902, lat: 1.3336 },
    areaSqm: 5100,
    zoningCode: "B2-TECH",
    coverageTier: "tier_c_parcel_depth",
    legalDisplayAllowed: true,
    freshness: "realtime",
    confidence: "verified",
    updatedAt: daysAgo(0)
  },
  {
    id: "p-tx-001",
    canonicalParcelId: "US-TX-AUS-1122",
    marketId: "m-texas-triangle",
    title: "Austin logistics-ready tract",
    center: { lng: -97.6348, lat: 30.2439 },
    areaSqm: 22800,
    zoningCode: "I-LI",
    coverageTier: "tier_b_market_depth",
    legalDisplayAllowed: true,
    freshness: "daily",
    confidence: "high",
    updatedAt: daysAgo(3)
  }
];

export const listings: ListingDto[] = [
  {
    id: "l-1001",
    reference: "DXB-ASK-1001",
    marketId: "m-dubai",
    parcelId: "p-dxb-001",
    state: "ask",
    amount: 42000000,
    currencyCode: "AED",
    observedAt: daysAgo(1),
    sourceName: "Dubai Land Department",
    brokerName: "Al Noor Land",
    freshness: "daily",
    confidence: "high"
  },
  {
    id: "l-1002",
    reference: "DXB-BV-1002",
    marketId: "m-dubai",
    parcelId: "p-dxb-002",
    state: "broker_verified",
    amount: 12400000,
    currencyCode: "AED",
    observedAt: daysAgo(2),
    sourceName: "Broker Feed",
    brokerName: "Desert Crest Realty",
    freshness: "daily",
    confidence: "verified"
  },
  {
    id: "l-1003",
    reference: "DXB-CL-1003",
    marketId: "m-dubai",
    parcelId: "p-dxb-002",
    state: "closed",
    amount: 11700000,
    currencyCode: "AED",
    observedAt: daysAgo(20),
    sourceName: "Transaction Registry",
    brokerName: null,
    freshness: "weekly",
    confidence: "high"
  },
  {
    id: "l-1004",
    reference: "DXB-EST-1004",
    marketId: "m-dubai",
    parcelId: "p-dxb-001",
    state: "estimate",
    amount: 40150000,
    currencyCode: "AED",
    observedAt: daysAgo(0),
    sourceName: "Valuation Engine",
    brokerName: null,
    freshness: "realtime",
    confidence: "medium"
  },
  {
    id: "l-2001",
    reference: "LDN-ASK-2001",
    marketId: "m-london",
    parcelId: "p-ldn-001",
    state: "ask",
    amount: 9650000,
    currencyCode: "GBP",
    observedAt: daysAgo(1),
    sourceName: "UK Land Registry + brokers",
    brokerName: "Thames Capital Land",
    freshness: "daily",
    confidence: "high"
  },
  {
    id: "l-2002",
    reference: "LDN-CL-2002",
    marketId: "m-london",
    parcelId: "p-ldn-001",
    state: "closed",
    amount: 9020000,
    currencyCode: "GBP",
    observedAt: daysAgo(12),
    sourceName: "Land Registry",
    brokerName: null,
    freshness: "daily",
    confidence: "high"
  },
  {
    id: "l-3001",
    reference: "SG-EST-3001",
    marketId: "m-singapore",
    parcelId: "p-sg-001",
    state: "estimate",
    amount: 30750000,
    currencyCode: "SGD",
    observedAt: daysAgo(0),
    sourceName: "Valuation Engine",
    brokerName: null,
    freshness: "realtime",
    confidence: "verified"
  },
  {
    id: "l-3002",
    reference: "SG-BV-3002",
    marketId: "m-singapore",
    parcelId: "p-sg-001",
    state: "broker_verified",
    amount: 31500000,
    currencyCode: "SGD",
    observedAt: daysAgo(1),
    sourceName: "Broker Exchange",
    brokerName: "Marina District Land",
    freshness: "daily",
    confidence: "verified"
  },
  {
    id: "l-6001",
    reference: "TX-ASK-6001",
    marketId: "m-texas-triangle",
    parcelId: "p-tx-001",
    state: "ask",
    amount: 8800000,
    currencyCode: "USD",
    observedAt: daysAgo(3),
    sourceName: "MLS + county sources",
    brokerName: "Lone Star Land",
    freshness: "daily",
    confidence: "high"
  },
  {
    id: "l-6002",
    reference: "TX-CL-6002",
    marketId: "m-texas-triangle",
    parcelId: "p-tx-001",
    state: "closed",
    amount: 8420000,
    currencyCode: "USD",
    observedAt: daysAgo(27),
    sourceName: "County recorder",
    brokerName: null,
    freshness: "weekly",
    confidence: "high"
  }
];

export const alerts: AlertDto[] = [
  {
    id: "a-001",
    marketId: "m-dubai",
    watchlistId: "w-global-expansion",
    title: "Dubai South ask price dropped 6.2%",
    ruleType: "price_change",
    isActive: true,
    lastTriggeredAt: daysAgo(1)
  },
  {
    id: "a-002",
    marketId: "m-singapore",
    watchlistId: "w-apac-core",
    title: "New verified listing in Jurong innovation district",
    ruleType: "new_listing",
    isActive: true,
    lastTriggeredAt: daysAgo(0)
  },
  {
    id: "a-003",
    marketId: "m-london",
    watchlistId: "w-europe-opportunistic",
    title: "Planning signal near Canary Wharf parcel",
    ruleType: "planning_signal",
    isActive: true,
    lastTriggeredAt: daysAgo(3)
  }
];

export const activityEvents: ActivityEventDto[] = [
  {
    id: "e-001",
    marketId: "m-singapore",
    summary: "Broker-verified transaction pulse increased in Jurong cluster",
    occurredAt: daysAgo(0),
    category: "verification"
  },
  {
    id: "e-002",
    marketId: "m-dubai",
    summary: "Closed deal recorded for JVC residential plot",
    occurredAt: daysAgo(1),
    category: "transaction"
  },
  {
    id: "e-003",
    marketId: "m-london",
    summary: "New planning consultation opened around E14",
    occurredAt: daysAgo(2),
    category: "planning"
  },
  {
    id: "e-004",
    marketId: "m-texas-triangle",
    summary: "Large industrial tract listed near Austin logistics corridor",
    occurredAt: daysAgo(3),
    category: "listing"
  }
];

export const sourceHealthRows: SourceHealthDto[] = [
  {
    id: "s-001",
    sourceCode: "dld-registry",
    sourceName: "Dubai Land Department Registry",
    marketId: "m-dubai",
    marketName: "Dubai",
    status: "healthy",
    freshnessLagMinutes: 145,
    successRate30d: 99.4,
    lastIngestedAt: daysAgo(0),
    licenseState: "active"
  },
  {
    id: "s-002",
    sourceCode: "uk-land-registry",
    sourceName: "HM Land Registry",
    marketId: "m-london",
    marketName: "Greater London",
    status: "healthy",
    freshnessLagMinutes: 310,
    successRate30d: 98.7,
    lastIngestedAt: daysAgo(1),
    licenseState: "active"
  },
  {
    id: "s-003",
    sourceCode: "sg-ura",
    sourceName: "Urban Redevelopment Authority",
    marketId: "m-singapore",
    marketName: "Singapore",
    status: "healthy",
    freshnessLagMinutes: 82,
    successRate30d: 99.8,
    lastIngestedAt: daysAgo(0),
    licenseState: "active"
  },
  {
    id: "s-004",
    sourceCode: "br-public-feed",
    sourceName: "Brazil Public Listings Feed",
    marketId: "m-sao-paulo",
    marketName: "Sao Paulo Metro",
    status: "degraded",
    freshnessLagMinutes: 2820,
    successRate30d: 91.3,
    lastIngestedAt: daysAgo(4),
    licenseState: "renewal_due"
  }
];

export const reviewQueue: ReviewItemDto[] = [
  {
    id: "r-001",
    marketId: "m-dubai",
    marketName: "Dubai",
    category: "dedupe",
    severity: "high",
    title: "Duplicate broker listing candidates for AE-DXB-JVC-118",
    createdAt: daysAgo(1),
    status: "pending"
  },
  {
    id: "r-002",
    marketId: "m-london",
    marketName: "Greater London",
    category: "policy",
    severity: "medium",
    title: "Ownership detail masking policy requires review",
    createdAt: daysAgo(2),
    status: "pending"
  },
  {
    id: "r-003",
    marketId: "m-singapore",
    marketName: "Singapore",
    category: "broker_verification",
    severity: "low",
    title: "Broker verification evidence waiting for approval",
    createdAt: daysAgo(3),
    status: "pending"
  }
];
