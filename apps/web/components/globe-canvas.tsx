"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl, {
  type GeoJSONSource,
  type MapLayerMouseEvent,
  type MapMouseEvent,
  type MapTouchEvent,
  type StyleSpecification
} from "maplibre-gl";
import type { CoverageTier } from "@globe/types";

interface MarketMapItem {
  id: string;
  name: string;
  center: {
    lng: number;
    lat: number;
  };
  coverageTier: CoverageTier;
  activityScore: number;
  benchmarkPricePerSqm: number;
  benchmarkCurrency: string;
}

interface GlobeCanvasProps {
  markets: MarketMapItem[];
  pricePoints: MapPricePoint[];
  selectedMarketId: string;
  onSelectMarket: (marketId: string) => void;
}

export interface MapPricePoint {
  id: string;
  label: string;
  source: "listing_observation" | "market_benchmark";
  lng: number;
  lat: number;
  pricePerSqftUsd: number;
  confidenceWeight: number;
}

interface LandPolygon {
  outer: [number, number][];
  holes: [number, number][][];
  minLng: number;
  maxLng: number;
  minLat: number;
  maxLat: number;
}

interface MajorCity {
  name: string;
  country: string;
  lng: number;
  lat: number;
}

interface MarketPoint {
  id: string;
  label: string;
  source: "listing_observation" | "market_benchmark";
  lng: number;
  lat: number;
  pricePerSqftUsd: number;
  confidenceWeight: number;
}

type RateConfidenceBand = "local" | "regional" | "inferred";

interface GridViewportHint {
  centerLng: number;
  centerLat: number;
  lngSpan: number;
  latSpan: number;
}

interface GridCellMeta {
  id: string;
  centerLng: number;
  centerLat: number;
  baseHeightMeters: number;
  avgPricePerSqft: number;
  contributorCount: number;
  stepDegrees: number;
  approxCellAreaSqft: number;
  nearestDistanceKm: number;
  nearestPointLabel: string;
  nearestPointSource: "listing_observation" | "market_benchmark";
  rateConfidence: RateConfidenceBand;
}

interface HoverLiftTarget {
  lng: number;
  lat: number;
  zoom: number;
  centerGridId?: string;
  pointerX?: number;
  pointerY?: number;
}

interface HoverPointerState {
  x: number;
  y: number;
  lng: number;
  lat: number;
}

interface DotParticle {
  id: string;
  homeLng: number;
  homeLat: number;
  lng: number;
  lat: number;
  priceScore: number;
  phase: number;
  speed: number;
  idleLngDeg: number;
  idleLatDeg: number;
  velocityLngDeg: number;
  velocityLatDeg: number;
  maxOffsetKm: number;
}

interface LandSpatialIndex {
  buckets: Map<string, LandPolygon[]>;
}

interface GridRenderSnapshot {
  centerLng: number;
  centerLat: number;
  zoom: number;
  stepDegrees: number;
  marketVersion: number;
  viewportVersion: number;
}

const HOVER_EXTRUSION_LAYERS = [
  { id: "land-grid-extrusion-25", level: 0.25, color: "#0284c7" },
  { id: "land-grid-extrusion-50", level: 0.5, color: "#0ea5e9" },
  { id: "land-grid-extrusion-75", level: 0.75, color: "#7dd3fc" },
  { id: "land-grid-extrusion-100", level: 1, color: "#e0f2fe" }
] as const;

const HOVER_EXTRUSION_LAYER_IDS = HOVER_EXTRUSION_LAYERS.map((layer) => layer.id);
const EMPTY_GRID_FILTER: any = ["==", ["get", "gridId"], ""];

const style: StyleSpecification = {
  version: 8,
  name: "land-intelligence-globe",
  projection: { type: "globe" },
  glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
  sources: {},
  layers: [
    {
      id: "background",
      type: "background",
      paint: {
        "background-color": "#031327"
      }
    }
  ]
};

const LANDMASS_GEOJSON_URL = "/data/ne_110m_land.geojson";
const MAJOR_CITIES_GEOJSON_URL = "/data/ne_110m_populated_places_simple.json";
const PLACE_LABELS_GEOJSON_URL = "/data/ne_10m_populated_places_simple.geojson";
const SATELLITE_TILE_URL = "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const SATELLITE_ATTRIBUTION = "Imagery © Esri, Maxar, Earthstar Geographics, and the GIS User Community";
const SATELLITE_LAYER_ID = "satellite-imagery";
const SATELLITE_LABELS_TILE_URL =
  "https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}";
const SATELLITE_ROADS_TILE_URL =
  "https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}";
const SATELLITE_REFERENCE_ATTRIBUTION = "Reference (c) Esri";
const SATELLITE_LABELS_LAYER_ID = "satellite-reference-labels";
const SATELLITE_ROADS_LAYER_ID = "satellite-reference-roads";
const SATELLITE_REFERENCE_LAYER_IDS = [SATELLITE_ROADS_LAYER_ID, SATELLITE_LABELS_LAYER_ID] as const;
const DARK_BASE_LAYER_IDS = ["landmass-fill", "landmass-outline", "graticule-lines", "ocean-mask-fill"] as const;
const SQM_TO_SQFT = 10.7639;
const EARTH_RADIUS_KM = 6371;
const GRID_MAX_FEATURES = 12000;
const MIN_RENDER_LAT = -82;
const MAX_RENDER_LAT = 84;
const MAX_MERCATOR_LAT = 85.05112878;
const GRID_INDEX_BUCKET_DEGREES = 0.02;
const GRID_LNG_BUCKET_COUNT = Math.ceil(360 / GRID_INDEX_BUCKET_DEGREES);
const GRID_LAT_BUCKET_COUNT = Math.ceil(180 / GRID_INDEX_BUCKET_DEGREES);
const LAND_INDEX_BUCKET_DEGREES = 1;
const LAND_INDEX_LNG_BUCKET_COUNT = Math.ceil(360 / LAND_INDEX_BUCKET_DEGREES);
const LAND_INDEX_LAT_BUCKET_COUNT = Math.ceil(180 / LAND_INDEX_BUCKET_DEGREES);
const GRID_UPDATE_MIN_INTERVAL_MS = 90;
const INTERPOLATION_NEIGHBOR_COUNT = 4;
const INTERPOLATION_DISTANCE_OFFSET_KM = 24;
const INTERPOLATION_DISTANCE_POWER = 1.35;
const HOVER_SPREAD_MULTIPLIER = 1.5;
const HOVER_VIEWPORT_HEIGHT_RATIO_CAP = 0.2;
const MAX_HOVER_INFLUENCE_CELLS = 320;
const DOT_PARTICLE_MAX_VISIBLE = 9000;
const DOT_PARTICLE_IDLE_FRACTION_MIN = 0.012;
const DOT_PARTICLE_IDLE_FRACTION_MAX = 0.038;
const DOT_PARTICLE_SPRING_STIFFNESS = 5.2;
const DOT_PARTICLE_DAMPING = 0.9;
const DOT_PARTICLE_PULL_STRENGTH = 0.82;
const DOT_PARTICLE_SWIRL_STRENGTH = 0.28;
const DOT_PARTICLE_MAX_SPEED_DEG_PER_SEC = 1.7;
const DOT_PARTICLE_MAX_INTERACTION_RADIUS_KM = 880;
const DOT_PARTICLE_BASE_ALPHA = 0.26;
const DOT_PARTICLE_HOVER_ALPHA_BOOST = 0.18;
const sqftNumberFormatter = new Intl.NumberFormat("en-US");
const dotColorCache = new Map<string, string>();
const FX_TO_USD: Record<string, number> = {
  USD: 1,
  AED: 0.2723,
  GBP: 1.28,
  SGD: 0.74,
  BRL: 0.2,
  NGN: 0.00063
};
const popupFormatterCache = new Map<string, Intl.NumberFormat>();

const toUsd = (value: number, currencyCode: string): number => {
  const fx = FX_TO_USD[currencyCode.toUpperCase()] ?? 1;
  return value * fx;
};

const fromUsd = (value: number, currencyCode: string): number => {
  const fx = FX_TO_USD[currencyCode.toUpperCase()] ?? 1;
  return fx > 0 ? value / fx : value;
};

const formatPopupCurrency = (value: number, currencyCode: string): string => {
  const code = currencyCode.toUpperCase();
  let formatter = popupFormatterCache.get(code);
  if (!formatter) {
    try {
      formatter = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: code,
        maximumFractionDigits: 2
      });
      popupFormatterCache.set(code, formatter);
    } catch {
      return `${code} ${value.toFixed(2)}`;
    }
  }

  return formatter.format(value);
};

const emptyPolygonCollection: GeoJSON.FeatureCollection<GeoJSON.Polygon> = {
  type: "FeatureCollection",
  features: []
};

const emptyOceanMaskCollection: GeoJSON.FeatureCollection<GeoJSON.Polygon> = {
  type: "FeatureCollection",
  features: []
};

const getGridStepDegrees = (zoom: number): number => {
  const normalizedZoom = Math.max(1, Math.min(zoom, 16));
  const computedStep = 3 / Math.pow(2, Math.max(0, normalizedZoom - 2));
  return Math.max(0.00008, Number(computedStep.toFixed(6)));
};

const getBlendRadiusKm = (zoom: number): number => {
  if (zoom < 2) {
    return 2200;
  }
  if (zoom < 4) {
    return 1600;
  }
  if (zoom < 6) {
    return 900;
  }
  if (zoom < 8) {
    return 520;
  }
  if (zoom < 10) {
    return 300;
  }
  return 160;
};

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

const normalizeLongitude = (lng: number): number => {
  const normalized = ((((lng + 180) % 360) + 360) % 360) - 180;
  return normalized === -180 ? 180 : normalized;
};

const haversineKm = (lngA: number, latA: number, lngB: number, latB: number): number => {
  const latDiff = toRadians(latB - latA);
  const lngDiff = toRadians(lngB - lngA);
  const originLat = toRadians(latA);
  const targetLat = toRadians(latB);

  const a =
    Math.sin(latDiff / 2) * Math.sin(latDiff / 2) +
    Math.sin(lngDiff / 2) * Math.sin(lngDiff / 2) * Math.cos(originLat) * Math.cos(targetLat);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
};

const pointInRing = (lng: number, lat: number, ring: [number, number][]): boolean => {
  let inside = false;

  for (let index = 0, prevIndex = ring.length - 1; index < ring.length; prevIndex = index, index += 1) {
    const current = ring[index];
    const previous = ring[prevIndex];
    if (!current || !previous) {
      continue;
    }

    const [lngA, latA] = current;
    const [lngB, latB] = previous;
    const intersects =
      latA > lat !== latB > lat &&
      lng < ((lngB - lngA) * (lat - latA)) / (latB - latA + Number.EPSILON) + lngA;

    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
};

const pointInPolygon = (lng: number, lat: number, polygon: LandPolygon): boolean => {
  if (lng < polygon.minLng || lng > polygon.maxLng || lat < polygon.minLat || lat > polygon.maxLat) {
    return false;
  }

  if (!pointInRing(lng, lat, polygon.outer)) {
    return false;
  }

  for (const hole of polygon.holes) {
    if (pointInRing(lng, lat, hole)) {
      return false;
    }
  }

  return true;
};

const parseRing = (coordinates: number[][]): [number, number][] =>
  coordinates
    .filter((coordinate) => coordinate.length >= 2)
    .map((coordinate) => [Number(coordinate[0]), Number(coordinate[1])]);

const buildLandPolygon = (coordinates: number[][][]): LandPolygon | null => {
  if (coordinates.length === 0) {
    return null;
  }

  const [outerRing, ...holeRings] = coordinates;
  if (!outerRing) {
    return null;
  }

  const outer = parseRing(outerRing);
  if (outer.length < 4) {
    return null;
  }

  const holes = holeRings.map(parseRing).filter((ring) => ring.length >= 4);

  let minLng = Number.POSITIVE_INFINITY;
  let maxLng = Number.NEGATIVE_INFINITY;
  let minLat = Number.POSITIVE_INFINITY;
  let maxLat = Number.NEGATIVE_INFINITY;

  for (const [lng, lat] of outer) {
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
  }

  return {
    outer,
    holes,
    minLng,
    maxLng,
    minLat,
    maxLat
  };
};

const toLandLngBucket = (lng: number): number => {
  const normalized = normalizeLongitude(lng);
  const bucket = Math.floor((normalized + 180) / LAND_INDEX_BUCKET_DEGREES);
  return Math.max(0, Math.min(LAND_INDEX_LNG_BUCKET_COUNT - 1, bucket));
};

const toLandLatBucket = (lat: number): number => {
  const clamped = Math.max(-90, Math.min(90, lat));
  const bucket = Math.floor((clamped + 90) / LAND_INDEX_BUCKET_DEGREES);
  return Math.max(0, Math.min(LAND_INDEX_LAT_BUCKET_COUNT - 1, bucket));
};

const wrapLandLngBucket = (bucket: number): number => ((bucket % LAND_INDEX_LNG_BUCKET_COUNT) + LAND_INDEX_LNG_BUCKET_COUNT) % LAND_INDEX_LNG_BUCKET_COUNT;

const getLandBucketKey = (lngBucket: number, latBucket: number): string => `${lngBucket}:${latBucket}`;

const buildLandSpatialIndex = (polygons: LandPolygon[]): LandSpatialIndex => {
  const buckets = new Map<string, LandPolygon[]>();

  for (const polygon of polygons) {
    const minLatBucket = toLandLatBucket(polygon.minLat);
    const maxLatBucket = toLandLatBucket(polygon.maxLat);
    const lngSpan = polygon.maxLng - polygon.minLng;

    const addPolygonToBucket = (lngBucket: number, latBucket: number) => {
      const key = getLandBucketKey(lngBucket, latBucket);
      const bucketPolygons = buckets.get(key);
      if (bucketPolygons) {
        bucketPolygons.push(polygon);
      } else {
        buckets.set(key, [polygon]);
      }
    };

    for (let latBucket = minLatBucket; latBucket <= maxLatBucket; latBucket += 1) {
      if (lngSpan >= 359.5) {
        for (let lngBucket = 0; lngBucket < LAND_INDEX_LNG_BUCKET_COUNT; lngBucket += 1) {
          addPolygonToBucket(lngBucket, latBucket);
        }
        continue;
      }

      const minLngBucket = toLandLngBucket(polygon.minLng);
      const maxLngBucket = toLandLngBucket(polygon.maxLng);
      if (minLngBucket <= maxLngBucket) {
        for (let lngBucket = minLngBucket; lngBucket <= maxLngBucket; lngBucket += 1) {
          addPolygonToBucket(lngBucket, latBucket);
        }
        continue;
      }

      for (let lngBucket = minLngBucket; lngBucket < LAND_INDEX_LNG_BUCKET_COUNT; lngBucket += 1) {
        addPolygonToBucket(lngBucket, latBucket);
      }
      for (let lngBucket = 0; lngBucket <= maxLngBucket; lngBucket += 1) {
        addPolygonToBucket(lngBucket, latBucket);
      }
    }
  }

  return { buckets };
};

const getLandPolygonCandidates = (lng: number, lat: number, index: LandSpatialIndex): LandPolygon[] => {
  const lngBucket = wrapLandLngBucket(toLandLngBucket(lng));
  const latBucket = toLandLatBucket(lat);
  return index.buckets.get(getLandBucketKey(lngBucket, latBucket)) ?? [];
};

const ensureClosedRing = (ring: [number, number][]): [number, number][] => {
  if (ring.length === 0) {
    return ring;
  }

  const first = ring[0];
  const last = ring[ring.length - 1];
  if (!first || !last) {
    return ring;
  }

  if (Math.abs(last[0] - first[0]) < 1e-9 && Math.abs(last[1] - first[1]) < 1e-9) {
    return ring;
  }

  return [...ring, first];
};

const extractLandPolygons = (featureCollection: GeoJSON.FeatureCollection<GeoJSON.Geometry>): LandPolygon[] => {
  const polygons: LandPolygon[] = [];

  for (const feature of featureCollection.features) {
    const { geometry } = feature;
    if (!geometry) {
      continue;
    }

    if (geometry.type === "Polygon") {
      const polygon = buildLandPolygon(geometry.coordinates as number[][][]);
      if (polygon) {
        polygons.push(polygon);
      }
      continue;
    }

    if (geometry.type === "MultiPolygon") {
      for (const polygonCoordinates of geometry.coordinates as number[][][][]) {
        const polygon = buildLandPolygon(polygonCoordinates);
        if (polygon) {
          polygons.push(polygon);
        }
      }
    }
  }

  return polygons;
};

const createOceanMaskFeatureCollection = (polygons: LandPolygon[]): GeoJSON.FeatureCollection<GeoJSON.Polygon> => {
  if (polygons.length === 0) {
    return emptyOceanMaskCollection;
  }

  const worldRing: [number, number][] = [
    [-180, -90],
    [180, -90],
    [180, 90],
    [-180, 90],
    [-180, -90]
  ];

  const landOuterRings = polygons.map((polygon) => ensureClosedRing(polygon.outer)).filter((ring) => ring.length >= 4);

  const features: GeoJSON.Feature<GeoJSON.Polygon>[] = [
    {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [worldRing, ...landOuterRings]
      },
      properties: {
        mask: "ocean"
      }
    }
  ];

  for (const polygon of polygons) {
    for (const hole of polygon.holes) {
      const lakeRing = ensureClosedRing(hole);
      if (lakeRing.length < 4) {
        continue;
      }

      features.push({
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [lakeRing]
        },
        properties: {
          mask: "lake"
        }
      });
    }
  }

  return {
    type: "FeatureCollection",
    features
  };
};

const extractMajorCities = (featureCollection: GeoJSON.FeatureCollection<GeoJSON.Geometry>): MajorCity[] => {
  const cities: MajorCity[] = [];

  for (const feature of featureCollection.features) {
    const { geometry, properties } = feature;
    if (!geometry || geometry.type !== "Point") {
      continue;
    }

    const coordinates = geometry.coordinates as number[];
    if (!Array.isArray(coordinates) || coordinates.length < 2) {
      continue;
    }

    const worldcity = Number(properties?.worldcity ?? 0);
    const megacity = Number(properties?.megacity ?? 0);
    const scalerank = Number(properties?.scalerank ?? 10);
    if (!(worldcity === 1 || megacity === 1 || scalerank <= 4)) {
      continue;
    }

    cities.push({
      name: String(properties?.nameascii ?? properties?.name ?? "Unknown city"),
      country: String(properties?.adm0name ?? properties?.sov0name ?? ""),
      lng: Number(coordinates[0]),
      lat: Number(coordinates[1])
    });
  }

  return cities;
};

const findNearestMajorCity = (lng: number, lat: number, cities: MajorCity[]): (MajorCity & { distanceKm: number }) | null => {
  if (cities.length === 0) {
    return null;
  }

  let nearest: (MajorCity & { distanceKm: number }) | null = null;

  for (const city of cities) {
    const distanceKm = haversineKm(lng, lat, city.lng, city.lat);
    if (!nearest || distanceKm < nearest.distanceKm) {
      nearest = {
        ...city,
        distanceKm
      };
    }
  }

  return nearest;
};

const isLandCoordinate = (lng: number, lat: number, polygons: LandPolygon[], landIndex?: LandSpatialIndex): boolean => {
  const candidatePolygons = landIndex ? getLandPolygonCandidates(lng, lat, landIndex) : polygons;
  if (candidatePolygons.length === 0) {
    return false;
  }

  for (const polygon of candidatePolygons) {
    if (pointInPolygon(lng, lat, polygon)) {
      return true;
    }
  }

  return false;
};

const isLandCell = (
  west: number,
  east: number,
  south: number,
  north: number,
  polygons: LandPolygon[],
  landIndex?: LandSpatialIndex
): boolean => {
  const cellWidth = east - west;
  const cellHeight = north - south;
  const samplePoints: [number, number][] = [
    [0.5, 0.5],
    [0.18, 0.18],
    [0.82, 0.18],
    [0.18, 0.82],
    [0.82, 0.82],
    [0.5, 0.18],
    [0.5, 0.82],
    [0.18, 0.5],
    [0.82, 0.5]
  ];

  for (const [xRatio, yRatio] of samplePoints) {
    const sampleLng = normalizeLongitude(west + cellWidth * xRatio);
    const sampleLat = south + cellHeight * yRatio;
    if (isLandCoordinate(sampleLng, sampleLat, polygons, landIndex)) {
      return true;
    }
  }

  return false;
};

const getLongitudeRanges = (bounds: maplibregl.LngLatBounds): [number, number][] => {
  const westRaw = bounds.getWest();
  const eastRaw = bounds.getEast();

  if (eastRaw - westRaw >= 350) {
    return [[-180, 180]];
  }

  const west = normalizeLongitude(westRaw);
  const east = normalizeLongitude(eastRaw);

  if (west <= east) {
    return [[west, east]];
  }

  return [
    [west, 180],
    [-180, east]
  ];
};

const getLongitudeRangesFromCenter = (centerLng: number, lngSpan: number): [number, number][] => {
  if (lngSpan >= 359.5) {
    return [[-180, 180]];
  }

  const halfSpan = Math.max(0.01, Math.min(179.75, lngSpan / 2));
  const west = normalizeLongitude(centerLng - halfSpan);
  const east = normalizeLongitude(centerLng + halfSpan);

  if (west <= east) {
    return [[west, east]];
  }

  return [
    [west, 180],
    [-180, east]
  ];
};

const latToWorldY = (lat: number, worldSize: number): number => {
  const clampedLat = Math.max(-MAX_MERCATOR_LAT, Math.min(MAX_MERCATOR_LAT, lat));
  const sinLat = Math.sin(toRadians(clampedLat));
  return (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * worldSize;
};

const worldYToLat = (y: number, worldSize: number): number => {
  const mercatorY = Math.PI * (1 - (2 * y) / worldSize);
  return (Math.atan(Math.sinh(mercatorY)) * 180) / Math.PI;
};

const buildGridViewportHint = (map: maplibregl.Map, zoom: number): GridViewportHint => {
  const center = map.getCenter();
  const canvas = map.getCanvas();
  const width = Math.max(1, canvas.clientWidth || canvas.width || 1);
  const height = Math.max(1, canvas.clientHeight || canvas.height || 1);
  const worldSize = 256 * Math.pow(2, zoom);

  const lngSpan = Math.min(360, ((360 * width) / worldSize) * 1.2);
  const centerY = latToWorldY(center.lat, worldSize);
  const halfHeight = (height * 1.2) / 2;
  const northLat = worldYToLat(Math.max(0, centerY - halfHeight), worldSize);
  const southLat = worldYToLat(Math.min(worldSize, centerY + halfHeight), worldSize);

  return {
    centerLng: normalizeLongitude(center.lng),
    centerLat: Math.max(MIN_RENDER_LAT, Math.min(MAX_RENDER_LAT, center.lat)),
    lngSpan,
    latSpan: Math.max(0.01, Math.abs(northLat - southLat))
  };
};

const shortestLongitudeDelta = (lngA: number, lngB: number): number => {
  const rawDelta = Math.abs(normalizeLongitude(lngA) - normalizeLongitude(lngB));
  return rawDelta > 180 ? 360 - rawDelta : rawDelta;
};

const shortestLongitudeDeltaSigned = (fromLng: number, toLng: number): number => {
  let delta = normalizeLongitude(toLng) - normalizeLongitude(fromLng);
  if (delta > 180) {
    delta -= 360;
  } else if (delta < -180) {
    delta += 360;
  }
  return delta;
};

const planarDistanceKm = (lngA: number, latA: number, lngB: number, latB: number): number => {
  const meanLatRadians = toRadians((latA + latB) / 2);
  const deltaLng = shortestLongitudeDelta(lngA, lngB);
  const deltaLat = Math.abs(latA - latB);
  const dx = deltaLng * 111.32 * Math.max(0.2, Math.cos(meanLatRadians));
  const dy = deltaLat * 111.32;
  return Math.sqrt(dx * dx + dy * dy);
};

const seededNoise = (seed: number): number => {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
};

const getDotColor = (priceScore: number, alpha: number): string => {
  const normalizedScore = Math.max(0, Math.min(1, priceScore));
  const normalizedAlpha = Math.max(0.05, Math.min(0.9, alpha));
  const scoreKey = Math.round(normalizedScore * 20);
  const alphaKey = Math.round(normalizedAlpha * 100);
  const cacheKey = `${scoreKey}:${alphaKey}`;
  const cached = dotColorCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const red = Math.round(96 + normalizedScore * 76);
  const green = Math.round(154 + normalizedScore * 40);
  const blue = Math.round(208 - normalizedScore * 52);
  const color = `rgba(${red}, ${green}, ${blue}, ${normalizedAlpha.toFixed(2)})`;
  dotColorCache.set(cacheKey, color);
  return color;
};

const getDotBudgetForZoom = (zoom: number): number => {
  if (zoom < 3) {
    return 2800;
  }
  if (zoom < 6) {
    return 4500;
  }
  if (zoom < 9) {
    return 6400;
  }
  if (zoom < 12) {
    return 7800;
  }
  return DOT_PARTICLE_MAX_VISIBLE;
};

const createDotParticlesFromGridCells = (cells: GridCellMeta[], zoom: number): DotParticle[] => {
  if (cells.length === 0) {
    const fallbackCount = Math.min(getDotBudgetForZoom(zoom), 1800);
    const fallback: DotParticle[] = [];
    for (let index = 0; index < fallbackCount; index += 1) {
      const lng = normalizeLongitude(-180 + seededNoise(index * 17 + 1) * 360);
      const lat = Math.max(MIN_RENDER_LAT, Math.min(MAX_RENDER_LAT, -68 + seededNoise(index * 23 + 3) * 136));
      fallback.push({
        id: `fallback:${index}`,
        homeLng: lng,
        homeLat: lat,
        lng,
        lat,
        priceScore: 0.35,
        phase: seededNoise(index * 29 + 5) * Math.PI * 2,
        speed: 0.45 + seededNoise(index * 31 + 7) * 0.7,
        idleLngDeg: 0.03,
        idleLatDeg: 0.024,
        velocityLngDeg: 0,
        velocityLatDeg: 0,
        maxOffsetKm: 16
      });
    }
    return fallback;
  }

  const targetBudget = getDotBudgetForZoom(zoom);
  const priceValues = cells.map((cell) => cell.avgPricePerSqft).filter((value) => Number.isFinite(value) && value > 0);
  const minPrice = priceValues.length > 0 ? Math.min(...priceValues) : 0;
  const maxPrice = priceValues.length > 0 ? Math.max(...priceValues) : minPrice;
  const priceRange = Math.max(0.0001, maxPrice - minPrice);
  const particles: DotParticle[] = [];

  const desiredCounts = cells.map((cell) => {
    const normalizedPrice = Math.max(0, Math.min(1, (cell.avgPricePerSqft - minPrice) / priceRange));
    const zoomBoost = zoom >= 9 ? 1 : zoom >= 6 ? 0.5 : 0;
    const rawCount = 1 + normalizedPrice * 1.6 + zoomBoost;
    return Math.max(1, Math.min(4, Math.round(rawCount)));
  });
  const maxDesired = desiredCounts.reduce((max, count) => Math.max(max, count), 0);

  let particleSeed = 1;
  for (let pass = 0; pass < maxDesired; pass += 1) {
    for (let index = 0; index < cells.length; index += 1) {
      if (particles.length >= targetBudget) {
        return particles;
      }

      const desiredCount = desiredCounts[index] ?? 0;
      const cell = cells[index];
      if (!cell || pass >= desiredCount) {
        continue;
      }

      const normalizedPrice = Math.max(0, Math.min(1, (cell.avgPricePerSqft - minPrice) / priceRange));
      const latStretch = Math.max(0.18, Math.cos(toRadians(cell.centerLat)));
      const spanLng = cell.stepDegrees * latStretch;
      const spanLat = cell.stepDegrees;
      const jitterLng = (seededNoise(particleSeed * 29 + pass * 11 + 1) - 0.5) * spanLng * 0.58;
      const jitterLat = (seededNoise(particleSeed * 31 + pass * 17 + 2) - 0.5) * spanLat * 0.58;
      const initialLng = normalizeLongitude(cell.centerLng + jitterLng);
      const initialLat = Math.max(MIN_RENDER_LAT, Math.min(MAX_RENDER_LAT, cell.centerLat + jitterLat));
      const idleFraction =
        DOT_PARTICLE_IDLE_FRACTION_MIN +
        seededNoise(particleSeed * 13 + 7) * (DOT_PARTICLE_IDLE_FRACTION_MAX - DOT_PARTICLE_IDLE_FRACTION_MIN);
      const areaSqm = Math.max(1, cell.approxCellAreaSqft / SQM_TO_SQFT);
      const cellAreaKm2 = areaSqm / 1_000_000;
      const cellLinearKm = Math.sqrt(Math.max(1e-6, cellAreaKm2));
      const maxOffsetKm = Math.max(5, Math.min(24, cellLinearKm * 0.14 + 6 + normalizedPrice * 4));

      particles.push({
        id: `${cell.id}:${pass}`,
        homeLng: initialLng,
        homeLat: initialLat,
        lng: initialLng,
        lat: initialLat,
        priceScore: normalizedPrice,
        phase: seededNoise(particleSeed * 19 + 3) * Math.PI * 2,
        speed: 0.45 + seededNoise(particleSeed * 23 + 5) * 0.7,
        idleLngDeg: Math.max(0.000002, spanLng * idleFraction),
        idleLatDeg: Math.max(0.000002, spanLat * idleFraction),
        velocityLngDeg: 0,
        velocityLatDeg: 0,
        maxOffsetKm
      });

      particleSeed += 1;
    }
  }

  return particles;
};

const getHoverLiftMeters = (zoom: number): number => {
  if (zoom < 3) {
    return 220;
  }
  if (zoom < 5) {
    return 320;
  }
  if (zoom < 7) {
    return 480;
  }
  if (zoom < 9) {
    return 680;
  }
  if (zoom < 11) {
    return 900;
  }
  return 1200;
};

const getHoverLiftScale = (zoom: number): number => {
  if (zoom < 3) {
    return 0.35;
  }
  if (zoom < 6) {
    return 0.45;
  }
  if (zoom < 9) {
    return 0.55;
  }
  if (zoom < 12) {
    return 0.68;
  }
  return 0.78;
};

const getMetersPerPixelAtLatitude = (lat: number, zoom: number): number => {
  const clampedLat = Math.max(-MAX_MERCATOR_LAT, Math.min(MAX_MERCATOR_LAT, lat));
  return (156543.03392 * Math.max(0.15, Math.cos(toRadians(clampedLat)))) / Math.pow(2, zoom);
};

const getViewportLiftCapMeters = (map: maplibregl.Map, lat: number, zoom: number): number => {
  const canvas = map.getCanvas();
  const viewportHeightPx = Math.max(1, canvas.clientHeight || canvas.height || 1);
  const maxHeightPx = viewportHeightPx * HOVER_VIEWPORT_HEIGHT_RATIO_CAP;
  const metersPerPixel = getMetersPerPixelAtLatitude(lat, zoom);
  const pitchRadians = toRadians(Math.max(0, Math.min(78, map.getPitch())));
  const pitchCompression = Math.max(0.42, Math.cos(pitchRadians));
  return Math.max(120, metersPerPixel * maxHeightPx * pitchCompression);
};

const getHoverPointerRadiusKm = (zoom: number, stepKm: number): number => {
  if (zoom < 3) {
    return Math.max(stepKm * 3.2, 22);
  }
  if (zoom < 6) {
    return Math.max(stepKm * 2.45, 9);
  }
  if (zoom < 9) {
    return Math.max(stepKm * 1.95, 3);
  }
  if (zoom < 12) {
    return Math.max(stepKm * 1.5, 0.9);
  }
  return Math.max(stepKm * 1.2, 0.35);
};

const getHoverInfluenceRadiusKm = (zoom: number, pointerRadiusKm: number, stepKm: number): number => {
  if (zoom < 4) {
    return Math.max(pointerRadiusKm * 1.65, stepKm * 4.8);
  }
  if (zoom < 8) {
    return Math.max(pointerRadiusKm * 1.5, stepKm * 3.8);
  }
  if (zoom < 12) {
    return Math.max(pointerRadiusKm * 1.35, stepKm * 3.1);
  }
  return Math.max(pointerRadiusKm * 1.25, stepKm * 2.4);
};

const getDotHoverRadiusPx = (zoom: number, viewportMin: number): number => {
  if (zoom < 3) {
    return Math.max(56, viewportMin * 0.06);
  }
  if (zoom < 6) {
    return Math.max(64, viewportMin * 0.07);
  }
  if (zoom < 9) {
    return Math.max(72, viewportMin * 0.075);
  }
  if (zoom < 12) {
    return Math.max(80, viewportMin * 0.08);
  }
  return Math.max(92, viewportMin * 0.085);
};

const getHoverLevel = (stepDistance: number): number => {
  if (stepDistance <= 4.6) {
    return 0.75;
  }
  if (stepDistance <= 8.6) {
    return 0.5;
  }
  if (stepDistance <= 12.6) {
    return 0.25;
  }
  return 0;
};

const buildHoverHeightExpression = (entries: Array<{ id: string; height: number }>): any => {
  if (entries.length === 0) {
    return 0;
  }

  const expression: any[] = ["match", ["get", "gridId"]];
  for (const entry of entries) {
    expression.push(entry.id, Number(entry.height.toFixed(2)));
  }
  expression.push(0);
  return expression;
};

const HOVER_RATE_COLOR_EXPRESSION: any = [
  "interpolate",
  ["linear"],
  ["coalesce", ["get", "colorScore"], 0.5],
  0,
  "#15803d",
  0.25,
  "#16a34a",
  0.5,
  "#eab308",
  0.75,
  "#f97316",
  1,
  "#dc2626"
];

const getGridStepDistance = (centerCell: GridCellMeta, cell: GridCellMeta): number => {
  const stepDegrees = Math.max(0.00008, centerCell.stepDegrees || cell.stepDegrees || 0.00008);
  const lngSteps = shortestLongitudeDelta(centerCell.centerLng, cell.centerLng) / stepDegrees;
  const latSteps = Math.abs(centerCell.centerLat - cell.centerLat) / stepDegrees;
  return Math.max(lngSteps, latSteps);
};

const computeBaseHeightMeters = (avgPricePerSqft: number, contributorCount: number): number => {
  const normalizedPrice = Math.max(0, Math.min(1.7, avgPricePerSqft / 95));
  const contributorBoost = Math.max(0, Math.min(1, contributorCount / 4));
  const base = 16 + normalizedPrice * 185 + contributorBoost * 26;
  return Number(base.toFixed(2));
};

const computeQuantile = (sortedValues: number[], quantile: number): number => {
  if (sortedValues.length === 0) {
    return 0;
  }

  const safeQuantile = Math.max(0, Math.min(1, quantile));
  const position = (sortedValues.length - 1) * safeQuantile;
  const lowerIndex = Math.floor(position);
  const upperIndex = Math.ceil(position);
  const lowerValue = sortedValues[lowerIndex] ?? sortedValues[sortedValues.length - 1] ?? 0;
  const upperValue = sortedValues[upperIndex] ?? lowerValue;
  const fraction = position - lowerIndex;

  return lowerValue + (upperValue - lowerValue) * fraction;
};

const toGridLngBucket = (lng: number): number => {
  const normalized = normalizeLongitude(lng);
  const bucket = Math.floor((normalized + 180) / GRID_INDEX_BUCKET_DEGREES);
  return Math.max(0, Math.min(GRID_LNG_BUCKET_COUNT - 1, bucket));
};

const toGridLatBucket = (lat: number): number => {
  const clamped = Math.max(-90, Math.min(90, lat));
  const bucket = Math.floor((clamped + 90) / GRID_INDEX_BUCKET_DEGREES);
  return Math.max(0, Math.min(GRID_LAT_BUCKET_COUNT - 1, bucket));
};

const wrapLngBucket = (bucket: number): number => ((bucket % GRID_LNG_BUCKET_COUNT) + GRID_LNG_BUCKET_COUNT) % GRID_LNG_BUCKET_COUNT;

const getGridBucketKey = (lngBucket: number, latBucket: number): string => `${lngBucket}:${latBucket}`;

const buildGridSpatialIndex = (cells: GridCellMeta[]): Map<string, GridCellMeta[]> => {
  const index = new Map<string, GridCellMeta[]>();

  for (const cell of cells) {
    const lngBucket = toGridLngBucket(cell.centerLng);
    const latBucket = toGridLatBucket(cell.centerLat);
    const key = getGridBucketKey(lngBucket, latBucket);
    const bucketCells = index.get(key);
    if (bucketCells) {
      bucketCells.push(cell);
    } else {
      index.set(key, [cell]);
    }
  }

  return index;
};

const queryNearbyGridCells = (
  index: Map<string, GridCellMeta[]>,
  allCells: GridCellMeta[],
  lng: number,
  lat: number,
  radiusKm: number
): GridCellMeta[] => {
  if (allCells.length === 0) {
    return [];
  }

  if (radiusKm > 350 || allCells.length < 1500) {
    return allCells;
  }

  const latRadiusDeg = radiusKm / 111.32;
  const lngRadiusDeg = radiusKm / (111.32 * Math.max(0.2, Math.cos(toRadians(lat))));
  const latBucketRadius = Math.ceil(latRadiusDeg / GRID_INDEX_BUCKET_DEGREES);
  const lngBucketRadius = Math.ceil(lngRadiusDeg / GRID_INDEX_BUCKET_DEGREES);

  if (latBucketRadius > 400 || lngBucketRadius > 400) {
    return allCells;
  }

  const centerLngBucket = toGridLngBucket(lng);
  const centerLatBucket = toGridLatBucket(lat);
  const nearbyCells: GridCellMeta[] = [];

  for (let latOffset = -latBucketRadius; latOffset <= latBucketRadius; latOffset += 1) {
    const latBucket = centerLatBucket + latOffset;
    if (latBucket < 0 || latBucket >= GRID_LAT_BUCKET_COUNT) {
      continue;
    }

    for (let lngOffset = -lngBucketRadius; lngOffset <= lngBucketRadius; lngOffset += 1) {
      const lngBucket = wrapLngBucket(centerLngBucket + lngOffset);
      const key = getGridBucketKey(lngBucket, latBucket);
      const bucketCells = index.get(key);
      if (bucketCells) {
        nearbyCells.push(...bucketCells);
      }
    }
  }

  return nearbyCells.length > 0 ? nearbyCells : allCells;
};

const getGridPointerHitRadiusKm = (zoom: number, stepDegrees: number): number => {
  const step = Math.max(0.00008, stepDegrees);
  const stepKm = step * 111.32;

  if (zoom < 3) {
    return Math.max(stepKm * 1.55, 320);
  }
  if (zoom < 6) {
    return Math.max(stepKm * 1.35, 120);
  }
  if (zoom < 9) {
    return Math.max(stepKm * 1.2, 18);
  }
  if (zoom < 12) {
    return Math.max(stepKm * 1.15, 4.2);
  }
  return Math.max(stepKm * 1.1, 2);
};

const findNearestGridCell = (
  lng: number,
  lat: number,
  zoom: number,
  stepDegrees: number,
  allCells: GridCellMeta[],
  index: Map<string, GridCellMeta[]>
): GridCellMeta | null => {
  if (allCells.length === 0) {
    return null;
  }

  const hitRadiusKm = getGridPointerHitRadiusKm(zoom, stepDegrees);
  const candidates = queryNearbyGridCells(index, allCells, lng, lat, hitRadiusKm * 1.4);

  let nearest: GridCellMeta | null = null;
  let nearestDistanceKm = Number.POSITIVE_INFINITY;

  for (const cell of candidates) {
    const distanceKm = planarDistanceKm(lng, lat, cell.centerLng, cell.centerLat);
    if (distanceKm < nearestDistanceKm) {
      nearestDistanceKm = distanceKm;
      nearest = cell;
    }
  }

  if (!nearest || nearestDistanceKm > hitRadiusKm) {
    return null;
  }

  return nearest;
};

const extractGridCellsFromCollection = (collection: GeoJSON.FeatureCollection<GeoJSON.Polygon>): GridCellMeta[] =>
  collection.features
    .map((feature) => {
      const properties = feature.properties as Record<string, unknown> | null | undefined;
      const gridId = String(properties?.gridId ?? "");

      if (!gridId) {
        return null;
      }

      return {
        id: gridId,
        centerLng: Number(properties?.centerLng ?? 0),
        centerLat: Number(properties?.centerLat ?? 0),
        baseHeightMeters: Number(properties?.baseHeightMeters ?? 0),
        avgPricePerSqft: Number(properties?.avgPricePerSqft ?? 0),
        contributorCount: Number(properties?.contributorCount ?? 0),
        stepDegrees: Number(properties?.stepDegrees ?? 0),
        approxCellAreaSqft: Number(properties?.approxCellAreaSqft ?? 0),
        nearestDistanceKm: Number(properties?.nearestDistanceKm ?? 0),
        nearestPointLabel: String(properties?.nearestPointLabel ?? ""),
        nearestPointSource:
          properties?.nearestPointSource === "listing_observation" || properties?.nearestPointSource === "market_benchmark"
            ? properties.nearestPointSource
            : "market_benchmark",
        rateConfidence:
          properties?.rateConfidence === "local" ||
          properties?.rateConfidence === "regional" ||
          properties?.rateConfidence === "inferred"
            ? properties.rateConfidence
            : "inferred"
      };
    })
    .filter((cell): cell is GridCellMeta => Boolean(cell));

const computeWeightedRate = (
  lng: number,
  lat: number,
  markets: MarketPoint[],
  blendRadiusKm: number
): {
  avgPricePerSqft: number;
  contributorCount: number;
  nearestDistanceKm: number;
  nearestPointLabel: string;
  nearestPointSource: "listing_observation" | "market_benchmark";
  rateConfidence: RateConfidenceBand;
} => {
  if (markets.length === 0) {
    return {
      avgPricePerSqft: 0,
      contributorCount: 0,
      nearestDistanceKm: Number.POSITIVE_INFINITY,
      nearestPointLabel: "",
      nearestPointSource: "market_benchmark",
      rateConfidence: "inferred"
    };
  }

  const candidates = markets
    .map((market) => {
      const distanceKm = haversineKm(lng, lat, market.lng, market.lat);
      const localWeight = Math.exp(-(distanceKm * distanceKm) / (2 * blendRadiusKm * blendRadiusKm));
      return {
        market,
        distanceKm,
        localWeight
      };
    })
    .filter((candidate) => Number.isFinite(candidate.distanceKm))
    .sort((left, right) => left.distanceKm - right.distanceKm);

  const nearest = candidates[0];
  if (!nearest) {
    return {
      avgPricePerSqft: 0,
      contributorCount: 0,
      nearestDistanceKm: Number.POSITIVE_INFINITY,
      nearestPointLabel: "",
      nearestPointSource: "market_benchmark",
      rateConfidence: "inferred"
    };
  }

  let localWeightedValueSum = 0;
  let localWeightSum = 0;
  let localContributorCount = 0;
  for (const candidate of candidates) {
    if (candidate.localWeight < 0.0015) {
      continue;
    }
    const confidenceWeight = Math.max(0.15, candidate.market.confidenceWeight);
    const finalWeight = candidate.localWeight * confidenceWeight;
    localWeightedValueSum += candidate.market.pricePerSqftUsd * finalWeight;
    localWeightSum += finalWeight;
    if (candidate.localWeight > 0.1) {
      localContributorCount += 1;
    }
  }

  if (localWeightSum > 0.0001) {
    const nearestDistanceKm = nearest.distanceKm;
    const rateConfidence =
      nearestDistanceKm <= blendRadiusKm * 0.65
        ? "local"
        : nearestDistanceKm <= blendRadiusKm * 1.8
          ? "regional"
          : "inferred";
    return {
      avgPricePerSqft: Number((localWeightedValueSum / localWeightSum).toFixed(2)),
      contributorCount: Math.max(localContributorCount, 1),
      nearestDistanceKm: Number(nearestDistanceKm.toFixed(1)),
      nearestPointLabel: nearest.market.label,
      nearestPointSource: nearest.market.source,
      rateConfidence
    };
  }

  const nearestCandidates = candidates.slice(0, Math.max(1, Math.min(INTERPOLATION_NEIGHBOR_COUNT, candidates.length)));
  let idwValueSum = 0;
  let idwWeightSum = 0;
  for (const candidate of nearestCandidates) {
    const confidenceWeight = Math.max(0.15, candidate.market.confidenceWeight);
    const weight =
      confidenceWeight / Math.pow(candidate.distanceKm + INTERPOLATION_DISTANCE_OFFSET_KM, INTERPOLATION_DISTANCE_POWER);
    if (!Number.isFinite(weight) || weight <= 0) {
      continue;
    }
    idwValueSum += candidate.market.pricePerSqftUsd * weight;
    idwWeightSum += weight;
  }

  if (idwWeightSum <= 0) {
    return {
      avgPricePerSqft: Number(nearest.market.pricePerSqftUsd.toFixed(2)),
      contributorCount: 1,
      nearestDistanceKm: Number(nearest.distanceKm.toFixed(1)),
      nearestPointLabel: nearest.market.label,
      nearestPointSource: nearest.market.source,
      rateConfidence: nearest.distanceKm <= 450 && nearest.market.source === "listing_observation" ? "regional" : "inferred"
    };
  }

  const nearestSource = nearest.market.source;
  return {
    avgPricePerSqft: Number((idwValueSum / idwWeightSum).toFixed(2)),
    contributorCount: nearestCandidates.length,
    nearestDistanceKm: Number(nearest.distanceKm.toFixed(1)),
    nearestPointLabel: nearest.market.label,
    nearestPointSource: nearestSource,
    rateConfidence: nearest.distanceKm <= 450 && nearestSource === "listing_observation" ? "regional" : "inferred"
  };
};

const approximateCellAreaSqft = (centerLat: number, stepDegrees: number): number => {
  const latKm = stepDegrees * 111.32;
  const lngKm = stepDegrees * 111.32 * Math.max(0.2, Math.cos(toRadians(centerLat)));
  const areaSqKm = latKm * lngKm;
  return areaSqKm * 1_000_000 * SQM_TO_SQFT;
};

const createAdaptiveGridFeatureCollection = (
  bounds: maplibregl.LngLatBounds,
  zoom: number,
  polygons: LandPolygon[],
  landIndex: LandSpatialIndex,
  marketRows: MarketMapItem[],
  mapPricePoints: MapPricePoint[],
  viewportHint?: GridViewportHint
): GeoJSON.FeatureCollection<GeoJSON.Polygon> => {
  let south = Math.max(MIN_RENDER_LAT, bounds.getSouth());
  let north = Math.min(MAX_RENDER_LAT, bounds.getNorth());
  if (viewportHint) {
    const hintedSouth = Math.max(MIN_RENDER_LAT, viewportHint.centerLat - viewportHint.latSpan / 2);
    const hintedNorth = Math.min(MAX_RENDER_LAT, viewportHint.centerLat + viewportHint.latSpan / 2);
    south = Math.max(south, hintedSouth);
    north = Math.min(north, hintedNorth);
  }

  if (south >= north) {
    return emptyPolygonCollection;
  }

  const ranges = viewportHint ? getLongitudeRangesFromCenter(viewportHint.centerLng, viewportHint.lngSpan) : getLongitudeRanges(bounds);
  const marketBenchmarks = marketRows
    .filter((market) => market.benchmarkPricePerSqm > 0)
    .map<MarketPoint>((market) => ({
      id: market.id,
      label: `${market.name} benchmark`,
      source: "market_benchmark",
      lng: market.center.lng,
      lat: market.center.lat,
      pricePerSqftUsd: toUsd(market.benchmarkPricePerSqm, market.benchmarkCurrency) / SQM_TO_SQFT,
      confidenceWeight: 0.55
    }));
  const observationPoints = mapPricePoints
    .filter((point) => Number.isFinite(point.pricePerSqftUsd) && point.pricePerSqftUsd > 0)
    .map<MarketPoint>((point) => ({
      id: point.id,
      label: point.label,
      source: point.source,
      lng: point.lng,
      lat: point.lat,
      pricePerSqftUsd: point.pricePerSqftUsd,
      confidenceWeight: Math.max(0.2, point.confidenceWeight)
    }));
  const markets = observationPoints.length > 0 ? [...observationPoints, ...marketBenchmarks] : marketBenchmarks;
  const marketPrices = markets.map((market) => market.pricePerSqftUsd);
  const marketMinPrice = marketPrices.length > 0 ? Math.min(...marketPrices) : 0;
  const marketMaxPrice = marketPrices.length > 0 ? Math.max(...marketPrices) : marketMinPrice;
  let stepDegrees = getGridStepDegrees(zoom);
  const latSpan = north - south;
  let lngSpan = 0;
  for (const [west, east] of ranges) {
    lngSpan += Math.max(0, east - west);
  }

  let estimatedCellCount = Math.ceil(latSpan / stepDegrees) * Math.ceil(lngSpan / stepDegrees);
  while (estimatedCellCount > GRID_MAX_FEATURES && stepDegrees < 30) {
    stepDegrees *= 2;
    estimatedCellCount = Math.ceil(latSpan / stepDegrees) * Math.ceil(lngSpan / stepDegrees);
  }

  const blendRadiusKm = getBlendRadiusKm(zoom);
  const features: GeoJSON.Feature<GeoJSON.Polygon>[] = [];

  const latStart = Math.floor(south / stepDegrees) * stepDegrees;
  const latEndLimit = Math.ceil(north / stepDegrees) * stepDegrees;

  for (let currentLatStart = latStart; currentLatStart < latEndLimit; currentLatStart += stepDegrees) {
    const currentLatEnd = Math.min(currentLatStart + stepDegrees, north);
    if (currentLatEnd <= south) {
      continue;
    }

    const centerLat = currentLatStart + stepDegrees / 2;
    if (centerLat < MIN_RENDER_LAT || centerLat > MAX_RENDER_LAT) {
      continue;
    }

    for (const [west, east] of ranges) {
      const lngStart = Math.floor(west / stepDegrees) * stepDegrees;
      const lngEndLimit = Math.ceil(east / stepDegrees) * stepDegrees;

      for (let currentLngStart = lngStart; currentLngStart < lngEndLimit; currentLngStart += stepDegrees) {
        const currentLngEnd = Math.min(currentLngStart + stepDegrees, east);
        if (currentLngEnd <= west) {
          continue;
        }

        const centerLng = normalizeLongitude(currentLngStart + stepDegrees / 2);
        if (!isLandCell(currentLngStart, currentLngEnd, currentLatStart, currentLatEnd, polygons, landIndex)) {
          continue;
        }

        const gridId = `${currentLngStart.toFixed(5)}:${currentLatStart.toFixed(5)}:${stepDegrees.toFixed(5)}`;
        const featureId = features.length + 1;
        const stats = computeWeightedRate(centerLng, centerLat, markets, blendRadiusKm);
        const cellAreaSqft = approximateCellAreaSqft(centerLat, stepDegrees);
        const baseHeightMeters = computeBaseHeightMeters(stats.avgPricePerSqft, stats.contributorCount);

        features.push({
          type: "Feature",
          id: featureId,
          geometry: {
            type: "Polygon",
            coordinates: [
              [
                [currentLngStart, currentLatStart],
                [currentLngEnd, currentLatStart],
                [currentLngEnd, currentLatEnd],
                [currentLngStart, currentLatEnd],
                [currentLngStart, currentLatStart]
              ]
            ]
          },
          properties: {
            gridId,
            centerLng: Number(centerLng.toFixed(6)),
            centerLat: Number(centerLat.toFixed(6)),
            avgPricePerSqft: stats.avgPricePerSqft,
            contributorCount: stats.contributorCount,
            baseHeightMeters,
            stepDegrees: Number(stepDegrees.toFixed(6)),
            approxCellAreaSqft: Number(cellAreaSqft.toFixed(0)),
            nearestDistanceKm: stats.nearestDistanceKm,
            nearestPointLabel: stats.nearestPointLabel,
            nearestPointSource: stats.nearestPointSource,
            rateConfidence: stats.rateConfidence
          }
        });
      }
    }
  }

  if (features.length > 0) {
    const priceValues = features
      .map((feature) => Number((feature.properties as Record<string, unknown> | null | undefined)?.avgPricePerSqft ?? 0))
      .sort((left, right) => left - right);

    const lowerBound = computeQuantile(priceValues, 0.1);
    const upperBound = computeQuantile(priceValues, 0.9);
    const fallbackMin = priceValues[0] ?? 0;
    const fallbackMax = priceValues[priceValues.length - 1] ?? fallbackMin;
    const domainMin = Number.isFinite(lowerBound) ? lowerBound : fallbackMin;
    const domainMax = Number.isFinite(upperBound) ? upperBound : fallbackMax;
    let effectiveMin = domainMin;
    let effectiveMax = domainMax;
    if (effectiveMax - effectiveMin < 8) {
      effectiveMin = Math.min(fallbackMin, marketMinPrice);
      effectiveMax = Math.max(fallbackMax, marketMaxPrice);
    }

    const domainRange = effectiveMax - effectiveMin;

    for (const feature of features) {
      const properties = feature.properties as Record<string, unknown>;
      const avgPricePerSqft = Number(properties.avgPricePerSqft ?? 0);
      const contributorCount = Number(properties.contributorCount ?? 0);

      const clampedPrice =
        domainRange > 0.0001 ? Math.max(effectiveMin, Math.min(effectiveMax, avgPricePerSqft)) : avgPricePerSqft;
      const normalizedPrice = domainRange > 0.0001 ? (clampedPrice - effectiveMin) / domainRange : 0.5;

      properties.colorScore = Number(Math.max(0, Math.min(1, normalizedPrice)).toFixed(4));
      properties.baseHeightMeters = Number((26 + normalizedPrice * 170 + Math.min(1, contributorCount / 4) * 24).toFixed(2));
    }
  }

  return {
    type: "FeatureCollection",
    features
  };
};

const createGraticule = (): GeoJSON.FeatureCollection<GeoJSON.LineString> => {
  const features: GeoJSON.Feature<GeoJSON.LineString>[] = [];

  for (let lng = -180; lng <= 180; lng += 30) {
    const coordinates: [number, number][] = [];
    for (let lat = -80; lat <= 80; lat += 2) {
      coordinates.push([lng, lat]);
    }
    features.push({
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates
      },
      properties: {}
    });
  }

  for (let lat = -60; lat <= 60; lat += 20) {
    const coordinates: [number, number][] = [];
    for (let lng = -180; lng <= 180; lng += 2) {
      coordinates.push([lng, lat]);
    }
    features.push({
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates
      },
      properties: {}
    });
  }

  return {
    type: "FeatureCollection",
    features
  };
};

const setBasemapMode = (map: maplibregl.Map, satelliteEnabled: boolean) => {
  if (map.getLayer(SATELLITE_LAYER_ID)) {
    map.setLayoutProperty(SATELLITE_LAYER_ID, "visibility", satelliteEnabled ? "visible" : "none");
  }

  for (const layerId of SATELLITE_REFERENCE_LAYER_IDS) {
    if (!map.getLayer(layerId)) {
      continue;
    }
    map.setLayoutProperty(layerId, "visibility", satelliteEnabled ? "visible" : "none");
  }

  for (const layerId of DARK_BASE_LAYER_IDS) {
    if (!map.getLayer(layerId)) {
      continue;
    }
    map.setLayoutProperty(layerId, "visibility", satelliteEnabled ? "none" : "visible");
  }
};

export const GlobeCanvas = ({ markets, pricePoints, selectedMarketId, onSelectMarket }: GlobeCanvasProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dotCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const latestFeatureCollectionRef = useRef<GeoJSON.FeatureCollection<GeoJSON.Point>>({
    type: "FeatureCollection",
    features: []
  });
  const latestMarketsRef = useRef<MarketMapItem[]>([]);
  const latestPricePointsRef = useRef<MapPricePoint[]>([]);
  const landPolygonsRef = useRef<LandPolygon[]>([]);
  const landSpatialIndexRef = useRef<LandSpatialIndex>({ buckets: new Map() });
  const majorCitiesRef = useRef<MajorCity[]>([]);
  const latestGridCellsRef = useRef<GridCellMeta[]>([]);
  const gridCellByIdRef = useRef<Map<string, GridCellMeta>>(new Map());
  const gridSpatialIndexRef = useRef<Map<string, GridCellMeta[]>>(new Map());
  const gridStepDegreesRef = useRef<number>(0);
  const hoverGridIdRef = useRef<string | null>(null);
  const gridFrameRef = useRef<number | null>(null);
  const gridTimeoutRef = useRef<ReturnType<typeof globalThis.setTimeout> | null>(null);
  const lastGridUpdateAtRef = useRef<number>(0);
  const lastGridRenderSnapshotRef = useRef<GridRenderSnapshot | null>(null);
  const marketVersionRef = useRef<number>(0);
  const viewportVersionRef = useRef<number>(0);
  const selectedMarketCurrencyRef = useRef<string>("USD");
  const hoverLiftTargetRef = useRef<HoverLiftTarget | null>(null);
  const lastHoverLiftSignatureRef = useRef<string>("none");
  const dotParticlesRef = useRef<DotParticle[]>([]);
  const dotFrameRef = useRef<number | null>(null);
  const hoverPointerLiveRef = useRef<HoverPointerState | null>(null);
  const pendingHoverPointerRef = useRef<HoverPointerState | null>(null);
  const hoverFrameRef = useRef<number | null>(null);
  const lastPopupHtmlRef = useRef<string>("");
  const [satelliteMode, setSatelliteMode] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  const marketFeatureCollection = useMemo<GeoJSON.FeatureCollection<GeoJSON.Point>>(
    () => ({
      type: "FeatureCollection",
      features: markets.map((market) => ({
        type: "Feature",
        id: market.id,
        geometry: {
          type: "Point",
          coordinates: [market.center.lng, market.center.lat]
        },
        properties: {
          id: market.id,
          name: market.name,
          selected: market.id === selectedMarketId
        }
      }))
    }),
    [markets, selectedMarketId]
  );

  useEffect(() => {
    latestFeatureCollectionRef.current = marketFeatureCollection;
  }, [marketFeatureCollection]);

  useEffect(() => {
    latestMarketsRef.current = markets;
    latestPricePointsRef.current = pricePoints;
    marketVersionRef.current += 1;
    lastGridRenderSnapshotRef.current = null;
  }, [markets, pricePoints]);

  useEffect(() => {
    const selectedMarket = markets.find((market) => market.id === selectedMarketId);
    selectedMarketCurrencyRef.current = selectedMarket?.benchmarkCurrency ?? "USD";
  }, [markets, selectedMarketId]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return;
    }

    let map: maplibregl.Map;
    let handleCanvasLeave: (() => void) | null = null;

    try {
      map = new maplibregl.Map({
        container: containerRef.current,
        style,
        center: [0, 16],
        zoom: 0.95,
        pitch: 10,
        minZoom: 0.8,
        maxZoom: 16,
        renderWorldCopies: false,
        attributionControl: false
      });
    } catch (error) {
      setMapError(error instanceof Error ? error.message : "Map initialization failed");
      return;
    }

    mapRef.current = map;
    map.once("load", () => {
      try {
        // Force spherical rendering when supported so the map does not fall back to a flat plane.
        (map as maplibregl.Map & { setProjection?: (projection: { type: "globe" | "mercator" }) => void }).setProjection?.({
          type: "globe"
        });
      } catch {
        // Keep running with style projection if runtime projection switching is unavailable.
      }
    });
    popupRef.current = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: false,
      className: "price-hover-popup",
      offset: [0, -86]
    });

    const setHoverGridId = (gridId: string | null) => {
      if (hoverGridIdRef.current === gridId) {
        return;
      }

      hoverGridIdRef.current = gridId;
      if (!map.getLayer("land-grid-hover")) {
        return;
      }

      map.setFilter("land-grid-hover", gridId ? ["==", ["get", "gridId"], gridId] : ["==", ["get", "gridId"], ""]);
    };

    const resizeDotCanvas = () => {
      const dotCanvas = dotCanvasRef.current;
      const container = containerRef.current;
      if (!dotCanvas || !container) {
        return;
      }

      const width = Math.max(1, Math.round(container.clientWidth));
      const height = Math.max(1, Math.round(container.clientHeight));
      const dpr = Math.max(1, Math.min(2, globalThis.devicePixelRatio || 1));
      const nextWidth = Math.round(width * dpr);
      const nextHeight = Math.round(height * dpr);
      if (dotCanvas.width !== nextWidth || dotCanvas.height !== nextHeight) {
        dotCanvas.width = nextWidth;
        dotCanvas.height = nextHeight;
      }
      dotCanvas.style.width = `${width}px`;
      dotCanvas.style.height = `${height}px`;
      const context = dotCanvas.getContext("2d");
      if (context) {
        context.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
    };

    let lastDotFrameTimeMs = globalThis.performance.now();
    const renderDotField = () => {
      dotFrameRef.current = globalThis.requestAnimationFrame(renderDotField);

      const dotCanvas = dotCanvasRef.current;
      if (!dotCanvas) {
        return;
      }
      const context = dotCanvas.getContext("2d");
      if (!context) {
        return;
      }

      const width = Math.max(1, dotCanvas.clientWidth || Math.round(dotCanvas.width / Math.max(1, globalThis.devicePixelRatio || 1)));
      const height = Math.max(1, dotCanvas.clientHeight || Math.round(dotCanvas.height / Math.max(1, globalThis.devicePixelRatio || 1)));
      context.clearRect(0, 0, width, height);

      if (!map.isStyleLoaded()) {
        return;
      }

      const zoom = map.getZoom();
      let particles = dotParticlesRef.current;
      if (particles.length === 0) {
        dotParticlesRef.current = createDotParticlesFromGridCells([], zoom);
        particles = dotParticlesRef.current;
        if (particles.length === 0) {
          return;
        }
      }

      const nowMs = globalThis.performance.now();
      const dtSeconds = Math.max(0.008, Math.min(0.05, (nowMs - lastDotFrameTimeMs) / 1000 || 0.016));
      lastDotFrameTimeMs = nowMs;
      const timeSeconds = nowMs / 1000;
      const hoverPointer = hoverPointerLiveRef.current;
      const viewportMin = Math.max(1, Math.min(width, height));
      const hoverRadiusPx = getDotHoverRadiusPx(zoom, viewportMin);
      const referenceLat = hoverPointer?.lat ?? map.getCenter().lat;
      const kmPerPixel = ((156543.03392 * Math.max(0.2, Math.cos(toRadians(referenceLat)))) / Math.pow(2, zoom)) / 1000;
      const hoverInfluenceRadiusKm = Math.max(
        45,
        Math.min(DOT_PARTICLE_MAX_INTERACTION_RADIUS_KM, hoverRadiusPx * Math.max(0.01, kmPerPixel))
      );
      const damping = Math.pow(DOT_PARTICLE_DAMPING, dtSeconds * 60);

      for (const particle of particles) {
        const idleLngDelta = Math.cos(timeSeconds * particle.speed + particle.phase) * particle.idleLngDeg;
        const idleLatDelta = Math.sin(timeSeconds * (particle.speed * 1.07) + particle.phase * 0.91) * particle.idleLatDeg;
        const targetLng = normalizeLongitude(particle.homeLng + idleLngDelta);
        const targetLat = Math.max(MIN_RENDER_LAT, Math.min(MAX_RENDER_LAT, particle.homeLat + idleLatDelta));

        let accelerationLng = shortestLongitudeDeltaSigned(particle.lng, targetLng) * DOT_PARTICLE_SPRING_STIFFNESS;
        let accelerationLat = (targetLat - particle.lat) * DOT_PARTICLE_SPRING_STIFFNESS;
        let hoverInfluence = 0;

        if (hoverPointer) {
          const pointerDeltaLng = shortestLongitudeDeltaSigned(particle.lng, hoverPointer.lng);
          const pointerDeltaLat = hoverPointer.lat - particle.lat;
          const pointerDistanceKm = planarDistanceKm(particle.lng, particle.lat, hoverPointer.lng, hoverPointer.lat);
          if (pointerDistanceKm <= hoverInfluenceRadiusKm) {
            const radialStrength = 1 - pointerDistanceKm / Math.max(0.01, hoverInfluenceRadiusKm);
            hoverInfluence = radialStrength * radialStrength;
            const pointerMagnitude = Math.hypot(pointerDeltaLng, pointerDeltaLat);
            if (pointerMagnitude > 1e-6) {
              const pointerDirectionLng = pointerDeltaLng / pointerMagnitude;
              const pointerDirectionLat = pointerDeltaLat / pointerMagnitude;
              const pullStrength = DOT_PARTICLE_PULL_STRENGTH * hoverInfluence;
              accelerationLng += pointerDirectionLng * pullStrength;
              accelerationLat += pointerDirectionLat * pullStrength;

              const swirlDirectionLng = -pointerDirectionLat;
              const swirlDirectionLat = pointerDirectionLng;
              const swirlStrength =
                DOT_PARTICLE_SWIRL_STRENGTH * hoverInfluence * Math.sin(timeSeconds * (1.15 + particle.speed * 0.2) + particle.phase);
              accelerationLng += swirlDirectionLng * swirlStrength;
              accelerationLat += swirlDirectionLat * swirlStrength;
            }
          }
        }

        particle.velocityLngDeg = (particle.velocityLngDeg + accelerationLng * dtSeconds) * damping;
        particle.velocityLatDeg = (particle.velocityLatDeg + accelerationLat * dtSeconds) * damping;

        const velocityMagnitude = Math.hypot(particle.velocityLngDeg, particle.velocityLatDeg);
        if (velocityMagnitude > DOT_PARTICLE_MAX_SPEED_DEG_PER_SEC) {
          const velocityScale = DOT_PARTICLE_MAX_SPEED_DEG_PER_SEC / velocityMagnitude;
          particle.velocityLngDeg *= velocityScale;
          particle.velocityLatDeg *= velocityScale;
        }

        particle.lng = normalizeLongitude(particle.lng + particle.velocityLngDeg * dtSeconds);
        particle.lat = Math.max(MIN_RENDER_LAT, Math.min(MAX_RENDER_LAT, particle.lat + particle.velocityLatDeg * dtSeconds));

        const homeDistanceKm = planarDistanceKm(particle.lng, particle.lat, particle.homeLng, particle.homeLat);
        if (homeDistanceKm > particle.maxOffsetKm) {
          const homeToCurrentLng = shortestLongitudeDeltaSigned(particle.homeLng, particle.lng);
          const homeToCurrentLat = particle.lat - particle.homeLat;
          const clampRatio = particle.maxOffsetKm / Math.max(0.001, homeDistanceKm);
          particle.lng = normalizeLongitude(particle.homeLng + homeToCurrentLng * clampRatio);
          particle.lat = Math.max(MIN_RENDER_LAT, Math.min(MAX_RENDER_LAT, particle.homeLat + homeToCurrentLat * clampRatio));
          particle.velocityLngDeg *= 0.75;
          particle.velocityLatDeg *= 0.75;
        }

        const projected = map.project([particle.lng, particle.lat]);
        if (!Number.isFinite(projected.x) || !Number.isFinite(projected.y)) {
          continue;
        }
        if (projected.x < -10 || projected.x > width + 10 || projected.y < -10 || projected.y > height + 10) {
          continue;
        }

        const radius = 0.9 + particle.priceScore * 0.55 + hoverInfluence * 0.65;
        const alpha = DOT_PARTICLE_BASE_ALPHA + particle.priceScore * 0.18 + hoverInfluence * DOT_PARTICLE_HOVER_ALPHA_BOOST;
        context.fillStyle = getDotColor(particle.priceScore, alpha);
        context.beginPath();
        context.arc(projected.x, projected.y, radius, 0, Math.PI * 2);
        context.fill();
      }
    };

    const startDotAnimation = () => {
      resizeDotCanvas();
      if (dotFrameRef.current !== null) {
        return;
      }
      lastDotFrameTimeMs = globalThis.performance.now();
      dotFrameRef.current = globalThis.requestAnimationFrame(renderDotField);
    };

    const clearHoverLiftState = () => {
      if (!map.getSource("land-grid")) {
        return;
      }

      for (const layerId of HOVER_EXTRUSION_LAYER_IDS) {
        if (!map.getLayer(layerId)) {
          continue;
        }
        map.setFilter(layerId, EMPTY_GRID_FILTER);
        map.setPaintProperty(layerId, "fill-extrusion-height", 0);
      }
      lastHoverLiftSignatureRef.current = "none";
    };

    const applyHoverLiftState = () => {
      if (!map.isStyleLoaded() || !map.getSource("land-grid")) {
        return;
      }

      const target = hoverLiftTargetRef.current;
      if (!target?.centerGridId) {
        clearHoverLiftState();
        return;
      }

      const centerCell = gridCellByIdRef.current.get(target.centerGridId);
      if (!centerCell) {
        clearHoverLiftState();
        return;
      }

      const configuredLiftMeters = getHoverLiftMeters(target.zoom) * getHoverLiftScale(target.zoom);
      const viewportLiftCapMeters = getViewportLiftCapMeters(map, centerCell.centerLat, target.zoom);
      const maxLiftMeters = Math.min(configuredLiftMeters, viewportLiftCapMeters);
      const stepKm = Math.max(0.08, centerCell.stepDegrees * 111.32);
      const pointerRadiusKm = getHoverPointerRadiusKm(target.zoom, stepKm) * HOVER_SPREAD_MULTIPLIER;
      const influenceRadiusKm = getHoverInfluenceRadiusKm(target.zoom, pointerRadiusKm, stepKm) * HOVER_SPREAD_MULTIPLIER;
      const nearbyCandidates = queryNearbyGridCells(
        gridSpatialIndexRef.current,
        latestGridCellsRef.current,
        target.lng,
        target.lat,
        influenceRadiusKm
      );
      const nearbyCells = nearbyCandidates
        .map((cell) => ({
          cell,
          pointerDistanceKm: planarDistanceKm(target.lng, target.lat, cell.centerLng, cell.centerLat)
        }))
        .filter((entry) => entry.pointerDistanceKm <= influenceRadiusKm * 1.08)
        .sort((left, right) => left.pointerDistanceKm - right.pointerDistanceKm)
        .slice(0, MAX_HOVER_INFLUENCE_CELLS);
      if (nearbyCells.length === 0) {
        clearHoverLiftState();
        return;
      }

      const localRates = nearbyCells
        .map((entry) => entry.cell.avgPricePerSqft)
        .filter((value) => Number.isFinite(value) && value > 0);
      const localRateMin = localRates.length > 0 ? Math.min(...localRates) : 0;
      const localRateMax = localRates.length > 0 ? Math.max(...localRates) : localRateMin;
      const localRateRange = Math.max(0.0001, localRateMax - localRateMin);

      const getRateFactor = (cell: GridCellMeta): number => {
        if (!Number.isFinite(cell.avgPricePerSqft) || cell.avgPricePerSqft <= 0 || localRates.length === 0) {
          return 0.6;
        }
        const normalizedRate = Math.max(0, Math.min(1, (cell.avgPricePerSqft - localRateMin) / localRateRange));
        return 0.55 + normalizedRate * 1.15;
      };

      const tierIds = {
        tier25: [] as string[],
        tier50: [] as string[],
        tier75: [] as string[],
        tier100: [] as string[]
      };
      const tierHeights = {
        tier25: [] as Array<{ id: string; height: number }>,
        tier50: [] as Array<{ id: string; height: number }>,
        tier75: [] as Array<{ id: string; height: number }>,
        tier100: [] as Array<{ id: string; height: number }>
      };

      for (const entry of nearbyCells) {
        const cell = entry.cell;
        const hoverLevel =
          target.centerGridId === cell.id
            ? 1
            : (() => {
                const cellStepLevel = getHoverLevel(getGridStepDistance(centerCell, cell));
                if (cellStepLevel <= 0) {
                  return 0;
                }
                const pointerRatio = entry.pointerDistanceKm / Math.max(0.001, pointerRadiusKm);
                const pointerLevel =
                  pointerRatio <= 0.38
                    ? 1
                    : pointerRatio <= 0.72
                      ? 0.75
                      : pointerRatio <= 1.06
                        ? 0.5
                        : pointerRatio <= 1.42
                          ? 0.25
                          : 0;
                return Math.min(cellStepLevel, pointerLevel);
              })();
        if (hoverLevel <= 0) {
          continue;
        }

        const cellHeight = maxLiftMeters * hoverLevel * getRateFactor(cell);
        if (hoverLevel >= 1) {
          tierIds.tier100.push(cell.id);
          tierHeights.tier100.push({ id: cell.id, height: cellHeight });
        } else if (hoverLevel >= 0.75) {
          tierIds.tier75.push(cell.id);
          tierHeights.tier75.push({ id: cell.id, height: cellHeight });
        } else if (hoverLevel >= 0.5) {
          tierIds.tier50.push(cell.id);
          tierHeights.tier50.push({ id: cell.id, height: cellHeight });
        } else {
          tierIds.tier25.push(cell.id);
          tierHeights.tier25.push({ id: cell.id, height: cellHeight });
        }
      }

      for (const layer of HOVER_EXTRUSION_LAYERS) {
        if (!map.getLayer(layer.id)) {
          continue;
        }

        const layerIds =
          layer.level === 1
            ? tierIds.tier100
            : layer.level === 0.75
              ? tierIds.tier75
              : layer.level === 0.5
                ? tierIds.tier50
                : tierIds.tier25;
        const layerHeights =
          layer.level === 1
            ? tierHeights.tier100
            : layer.level === 0.75
              ? tierHeights.tier75
              : layer.level === 0.5
                ? tierHeights.tier50
                : tierHeights.tier25;
        const nextFilter = layerIds.length > 0 ? (["in", ["get", "gridId"], ["literal", layerIds]] as any) : EMPTY_GRID_FILTER;
        const layerHeightExpression = buildHoverHeightExpression(layerHeights);

        map.setFilter(layer.id, nextFilter);
        map.setPaintProperty(layer.id, "fill-extrusion-height", layerHeightExpression);
      }
    };

    const getHoverLiftSignature = (target: HoverLiftTarget | null): string => {
      if (!target?.centerGridId) {
        return "none";
      }
      if (Number.isFinite(target.pointerX) && Number.isFinite(target.pointerY)) {
        const snappedX = Math.round((target.pointerX ?? 0) * 0.85);
        const snappedY = Math.round((target.pointerY ?? 0) * 0.85);
        return `${target.centerGridId}:${target.zoom.toFixed(2)}:${snappedX}:${snappedY}`;
      }
      const snappedLng = Math.round(target.lng * 700) / 700;
      const snappedLat = Math.round(target.lat * 700) / 700;
      return `${target.centerGridId}:${target.zoom.toFixed(2)}:${snappedLng.toFixed(4)}:${snappedLat.toFixed(4)}`;
    };

    const scheduleHoverLiftUpdate = (target: HoverLiftTarget | null) => {
      const signature = getHoverLiftSignature(target);
      if (signature === lastHoverLiftSignatureRef.current) {
        hoverLiftTargetRef.current = target;
        return;
      }
      hoverLiftTargetRef.current = target;
      applyHoverLiftState();
      lastHoverLiftSignatureRef.current = signature;
    };

    const shouldSkipGridRegeneration = (zoom: number, centerLng: number, centerLat: number, stepDegrees: number): boolean => {
      const snapshot = lastGridRenderSnapshotRef.current;
      if (!snapshot) {
        return false;
      }
      if (snapshot.marketVersion !== marketVersionRef.current || snapshot.viewportVersion !== viewportVersionRef.current) {
        return false;
      }
      if (Math.abs(snapshot.zoom - zoom) > 0.08) {
        return false;
      }

      const movementThreshold = Math.max(stepDegrees * 0.45, 0.02);
      const lngDelta = shortestLongitudeDelta(snapshot.centerLng, centerLng);
      const latDelta = Math.abs(snapshot.centerLat - centerLat);
      return lngDelta < movementThreshold && latDelta < movementThreshold && Math.abs(snapshot.stepDegrees - stepDegrees) < 0.000001;
    };

    const updateGridSource = () => {
      if (!map.isStyleLoaded() || landPolygonsRef.current.length === 0) {
        return;
      }

      const gridSource = map.getSource("land-grid") as GeoJSONSource | undefined;
      if (!gridSource) {
        return;
      }

      const zoom = map.getZoom();
      const center = map.getCenter();
      const stepDegrees = getGridStepDegrees(zoom);
      if (shouldSkipGridRegeneration(zoom, center.lng, center.lat, stepDegrees)) {
        return;
      }
      const viewportHint = buildGridViewportHint(map, zoom);
      const collection = createAdaptiveGridFeatureCollection(
        map.getBounds(),
        zoom,
        landPolygonsRef.current,
        landSpatialIndexRef.current,
        latestMarketsRef.current,
        latestPricePointsRef.current,
        viewportHint
      );

      clearHoverLiftState();
      lastHoverLiftSignatureRef.current = "";
      const gridCells = extractGridCellsFromCollection(collection);
      latestGridCellsRef.current = gridCells;
      gridCellByIdRef.current = new Map(gridCells.map((cell) => [cell.id, cell]));
      gridSpatialIndexRef.current = buildGridSpatialIndex(gridCells);
      gridStepDegreesRef.current = gridCells[0]?.stepDegrees ?? 0;
      dotParticlesRef.current = createDotParticlesFromGridCells(gridCells, zoom);

      gridSource.setData(collection);

      if (hoverLiftTargetRef.current) {
        scheduleHoverLiftUpdate({
          ...hoverLiftTargetRef.current,
          zoom
        });
      }

      lastGridRenderSnapshotRef.current = {
        centerLng: center.lng,
        centerLat: center.lat,
        zoom,
        stepDegrees,
        marketVersion: marketVersionRef.current,
        viewportVersion: viewportVersionRef.current
      };
    };

    const queueGridFrame = () => {
      if (gridFrameRef.current !== null) {
        return;
      }

      gridFrameRef.current = globalThis.requestAnimationFrame(() => {
        gridFrameRef.current = null;
        lastGridUpdateAtRef.current = globalThis.performance.now();
        updateGridSource();
      });
    };

    const scheduleGridUpdate = () => {
      const now = globalThis.performance.now();
      const elapsed = now - lastGridUpdateAtRef.current;

      if (elapsed >= GRID_UPDATE_MIN_INTERVAL_MS) {
        if (gridTimeoutRef.current !== null) {
          globalThis.clearTimeout(gridTimeoutRef.current);
          gridTimeoutRef.current = null;
        }
        queueGridFrame();
        return;
      }

      if (gridTimeoutRef.current !== null) {
        return;
      }

      const delay = Math.max(0, GRID_UPDATE_MIN_INTERVAL_MS - elapsed);
      gridTimeoutRef.current = globalThis.setTimeout(() => {
        gridTimeoutRef.current = null;
        queueGridFrame();
      }, delay);
    };

    const flushGridUpdate = () => {
      if (gridTimeoutRef.current !== null) {
        globalThis.clearTimeout(gridTimeoutRef.current);
        gridTimeoutRef.current = null;
      }
      if (gridFrameRef.current !== null) {
        globalThis.cancelAnimationFrame(gridFrameRef.current);
        gridFrameRef.current = null;
      }
      lastGridUpdateAtRef.current = globalThis.performance.now();
      updateGridSource();
    };

    startDotAnimation();

    const initializeData = async () => {
      try {
        const [landResponse, cityResponse] = await Promise.all([
          fetch(LANDMASS_GEOJSON_URL, { cache: "force-cache" }),
          fetch(MAJOR_CITIES_GEOJSON_URL, { cache: "force-cache" })
        ]);

        if (!landResponse.ok) {
          throw new Error(`Unable to load land geometry (${landResponse.status})`);
        }

        if (!cityResponse.ok) {
          throw new Error(`Unable to load city labels (${cityResponse.status})`);
        }

        const landPayload = (await landResponse.json()) as GeoJSON.FeatureCollection<GeoJSON.Geometry>;
        const cityPayload = (await cityResponse.json()) as GeoJSON.FeatureCollection<GeoJSON.Geometry>;

        landPolygonsRef.current = extractLandPolygons(landPayload);
        landSpatialIndexRef.current = buildLandSpatialIndex(landPolygonsRef.current);
        majorCitiesRef.current = extractMajorCities(cityPayload);
        const oceanMaskSource = map.getSource("ocean-mask") as GeoJSONSource | undefined;
        if (oceanMaskSource) {
          oceanMaskSource.setData(createOceanMaskFeatureCollection(landPolygonsRef.current));
        }
        flushGridUpdate();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to initialize grid data";
        setMapError(message);
      }
    };

    map.on("load", () => {
      map.addSource("landmass", {
        type: "geojson",
        data: LANDMASS_GEOJSON_URL
      });

      map.addSource("satellite-imagery", {
        type: "raster",
        tiles: [SATELLITE_TILE_URL],
        tileSize: 256,
        attribution: SATELLITE_ATTRIBUTION
      });

      map.addSource("satellite-reference-labels", {
        type: "raster",
        tiles: [SATELLITE_LABELS_TILE_URL],
        tileSize: 256,
        attribution: SATELLITE_REFERENCE_ATTRIBUTION
      });

      map.addSource("satellite-reference-roads", {
        type: "raster",
        tiles: [SATELLITE_ROADS_TILE_URL],
        tileSize: 256
      });

      map.addLayer({
        id: SATELLITE_LAYER_ID,
        type: "raster",
        source: "satellite-imagery",
        layout: {
          visibility: "none"
        },
        paint: {
          "raster-opacity": 1,
          "raster-saturation": 0.12,
          "raster-contrast": 0.08,
          "raster-resampling": "linear"
        }
      });

      map.addLayer({
        id: SATELLITE_ROADS_LAYER_ID,
        type: "raster",
        source: "satellite-reference-roads",
        layout: {
          visibility: "none"
        },
        paint: {
          "raster-opacity": 0.9,
          "raster-contrast": 0.15,
          "raster-resampling": "linear"
        }
      });

      map.addLayer({
        id: SATELLITE_LABELS_LAYER_ID,
        type: "raster",
        source: "satellite-reference-labels",
        layout: {
          visibility: "none"
        },
        paint: {
          "raster-opacity": 1,
          "raster-resampling": "linear"
        }
      });

      map.addLayer({
        id: "landmass-fill",
        type: "fill",
        source: "landmass",
        paint: {
          "fill-color": "#1f2937",
          "fill-opacity": 0.9
        }
      });

      map.addLayer({
        id: "landmass-outline",
        type: "line",
        source: "landmass",
        paint: {
          "line-color": "#94a3b8",
          "line-width": 0.8,
          "line-opacity": 0.62
        }
      });

      map.addSource("graticule", {
        type: "geojson",
        data: createGraticule()
      });

      map.addLayer({
        id: "graticule-lines",
        type: "line",
        source: "graticule",
        paint: {
          "line-color": "#334155",
          "line-width": 0.55,
          "line-opacity": 0.32
        }
      });

      map.addSource("place-labels", {
        type: "geojson",
        data: PLACE_LABELS_GEOJSON_URL
      });

      map.addSource("land-grid", {
        type: "geojson",
        data: emptyPolygonCollection
      });

      map.addSource("ocean-mask", {
        type: "geojson",
        data: emptyOceanMaskCollection
      });

      for (const layer of HOVER_EXTRUSION_LAYERS) {
        map.addLayer({
          id: layer.id,
          type: "fill-extrusion",
          source: "land-grid",
          filter: EMPTY_GRID_FILTER,
          paint: {
            "fill-extrusion-color": HOVER_RATE_COLOR_EXPRESSION,
            "fill-extrusion-base": 0,
            "fill-extrusion-height": 0,
            "fill-extrusion-opacity": 0.16,
            "fill-extrusion-base-transition": {
              duration: 36,
              delay: 0
            },
            "fill-extrusion-height-transition": {
              duration: 36,
              delay: 0
            }
          }
        });
      }

      map.addLayer({
        id: "land-grid-line",
        type: "line",
        source: "land-grid",
        paint: {
          "line-color": "rgba(3, 19, 39, 0.85)",
          "line-width": ["interpolate", ["linear"], ["zoom"], 1, 0.12, 7, 0.35, 12, 0.72, 16, 1.05],
          "line-opacity": 0
        }
      });

      map.addLayer({
        id: "land-grid-hover",
        type: "line",
        source: "land-grid",
        filter: ["==", ["get", "gridId"], ""],
        paint: {
          "line-color": "#f8fafc",
          "line-width": ["interpolate", ["linear"], ["zoom"], 1, 0.7, 8, 1.3, 12, 2],
          "line-opacity": 0.95
        }
      });

      map.addLayer({
        id: "ocean-mask-fill",
        type: "fill",
        source: "ocean-mask",
        paint: {
          "fill-color": "#031327",
          "fill-opacity": 1
        }
      });

      map.addLayer({
        id: "place-labels-major",
        type: "symbol",
        source: "place-labels",
        minzoom: 1.2,
        filter: ["<=", ["coalesce", ["get", "min_zoom"], 7], 3.7],
        layout: {
          "text-field": ["coalesce", ["get", "nameascii"], ["get", "name"]],
          "text-font": ["Noto Sans Regular"],
          "text-size": ["interpolate", ["linear"], ["zoom"], 1, 10, 4, 12.5, 7, 15],
          "text-variable-anchor": ["top", "bottom", "left", "right"],
          "text-radial-offset": 0.62,
          "text-allow-overlap": false,
          "text-ignore-placement": false,
          "symbol-sort-key": ["*", -1, ["coalesce", ["get", "pop_max"], 0]],
          "text-pitch-alignment": "viewport",
          "text-rotation-alignment": "viewport"
        },
        paint: {
          "text-color": "#e2e8f0",
          "text-halo-color": "#020617",
          "text-halo-width": 1.2
        }
      });

      map.addLayer({
        id: "place-labels-regional",
        type: "symbol",
        source: "place-labels",
        minzoom: 3.7,
        filter: [
          "all",
          [">", ["coalesce", ["get", "min_zoom"], 7], 3.7],
          ["<=", ["coalesce", ["get", "min_zoom"], 7], 5.6]
        ],
        layout: {
          "text-field": ["coalesce", ["get", "nameascii"], ["get", "name"]],
          "text-font": ["Noto Sans Regular"],
          "text-size": ["interpolate", ["linear"], ["zoom"], 3.7, 9, 7, 11.5, 11, 13.5],
          "text-variable-anchor": ["top", "bottom", "left", "right"],
          "text-radial-offset": 0.58,
          "text-allow-overlap": false,
          "text-ignore-placement": false,
          "symbol-sort-key": ["*", -1, ["coalesce", ["get", "pop_max"], 0]],
          "text-pitch-alignment": "viewport",
          "text-rotation-alignment": "viewport"
        },
        paint: {
          "text-color": "#cbd5e1",
          "text-halo-color": "#020617",
          "text-halo-width": 1.1
        }
      });

      map.addLayer({
        id: "place-labels-local",
        type: "symbol",
        source: "place-labels",
        minzoom: 5.6,
        filter: [">", ["coalesce", ["get", "min_zoom"], 7], 5.6],
        layout: {
          "text-field": ["coalesce", ["get", "nameascii"], ["get", "name"]],
          "text-font": ["Noto Sans Regular"],
          "text-size": ["interpolate", ["linear"], ["zoom"], 5.6, 8, 9, 10.5, 13, 12],
          "text-variable-anchor": ["top", "bottom", "left", "right"],
          "text-radial-offset": 0.52,
          "text-allow-overlap": true,
          "text-ignore-placement": false,
          "symbol-sort-key": ["*", -1, ["coalesce", ["get", "pop_max"], 0]],
          "text-pitch-alignment": "viewport",
          "text-rotation-alignment": "viewport"
        },
        paint: {
          "text-color": "#bfdbfe",
          "text-halo-color": "#020617",
          "text-halo-width": 1
        }
      });

      map.addSource("markets", {
        type: "geojson",
        data: latestFeatureCollectionRef.current
      });

      map.addLayer({
        id: "market-hit-area",
        type: "circle",
        source: "markets",
        minzoom: 1,
        paint: {
          "circle-color": "#ffffff",
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 1, 10, 12, 16],
          "circle-opacity": 0,
          "circle-stroke-opacity": 0
        }
      });

      map.addLayer({
        id: "market-labels",
        type: "symbol",
        source: "markets",
        minzoom: 2.2,
        layout: {
          "text-field": ["get", "name"],
          "text-font": ["Noto Sans Regular"],
          "text-size": ["case", ["get", "selected"], 13, 11],
          "text-allow-overlap": false,
          "text-ignore-placement": false,
          "text-variable-anchor": ["top", "bottom", "left", "right"],
          "text-radial-offset": 0.75
        },
        paint: {
          "text-color": ["case", ["get", "selected"], "#f8fafc", "#cbd5e1"],
          "text-halo-color": "#020617",
          "text-halo-width": 1.2
        }
      });

      const selectMarket = (event: MapLayerMouseEvent) => {
        const feature = event.features?.[0];
        if (!feature) {
          return;
        }

        const marketId = String(feature.properties?.id ?? "");
        if (marketId) {
          onSelectMarket(marketId);
        }
      };

      map.on("click", "market-hit-area", selectMarket);
      map.on("click", "market-labels", selectMarket);

      const processHoverFrame = () => {
        hoverFrameRef.current = null;
        const popup = popupRef.current;
        const pointer = pendingHoverPointerRef.current;
        if (!popup || !pointer) {
          return;
        }

        const zoom = map.getZoom();
        const activeCell = findNearestGridCell(
          pointer.lng,
          pointer.lat,
          zoom,
          gridStepDegreesRef.current,
          latestGridCellsRef.current,
          gridSpatialIndexRef.current
        );

        const hasGridCell = Boolean(activeCell);
        const activeGridId = activeCell?.id ?? null;

        setHoverGridId(activeGridId);
        hoverPointerLiveRef.current = {
          x: pointer.x,
          y: pointer.y,
          lng: pointer.lng,
          lat: pointer.lat
        };
        scheduleHoverLiftUpdate(null);
        map.getCanvas().style.cursor = hasGridCell ? "crosshair" : "";

        const nearestCity = findNearestMajorCity(pointer.lng, pointer.lat, majorCitiesRef.current);
        const nearestCityLabel = nearestCity
          ? `${nearestCity.name}${nearestCity.country ? `, ${nearestCity.country}` : ""} (${nearestCity.distanceKm.toFixed(0)} km)`
          : "Unknown";

        let popupHtml = "";
        if (!hasGridCell) {
          popupHtml =
            `<div style="font: 12px 'Space Grotesk', sans-serif; color: #e2e8f0;">` +
              `<strong style="display:block; margin-bottom:4px;">Nearest city: ${nearestCityLabel}</strong>` +
              `<span style="color:#94a3b8;">No land grid cell under cursor at this location.</span>` +
              `</div>`;
        } else {
          const avgPriceUsdPerSqft = Number(activeCell?.avgPricePerSqft ?? 0);
          const contributorCount = Number(activeCell?.contributorCount ?? 0);
          const stepDegrees = Number(activeCell?.stepDegrees ?? 0);
          const areaSqft = Number(activeCell?.approxCellAreaSqft ?? 0);
          const nearestPointLabel = String(activeCell?.nearestPointLabel ?? "");
          const nearestPointSource = activeCell?.nearestPointSource ?? "market_benchmark";
          const nearestMarketDistanceKm = Number(activeCell?.nearestDistanceKm ?? 0);
          const rateConfidence = activeCell?.rateConfidence ?? "inferred";
          const selectedCurrency = selectedMarketCurrencyRef.current;
          const avgPriceLocalPerSqft = fromUsd(avgPriceUsdPerSqft, selectedCurrency);
          const sourceLabel = nearestPointSource === "listing_observation" ? "Nearest observed parcel" : "Nearest market benchmark";
          const basisLabel =
            rateConfidence === "local"
              ? "Local observations"
              : rateConfidence === "regional"
                ? "Regional interpolation"
                : "Long-range interpolation";
          popupHtml =
            `<div style="font: 12px 'Space Grotesk', sans-serif; color: #e2e8f0;">` +
              `<strong style="display:block; margin-bottom:4px;">Nearest city: ${nearestCityLabel}</strong>` +
              `<span style="color:#cbd5e1;">Blended land rate: ${formatPopupCurrency(avgPriceLocalPerSqft, selectedCurrency)}/sqft</span><br/>` +
              `<span style="color:#94a3b8;">USD-equivalent: ${formatPopupCurrency(avgPriceUsdPerSqft, "USD")}/sqft</span><br/>` +
              `<span style="color:#94a3b8;">Basis: ${basisLabel}</span><br/>` +
              `<span style="color:#94a3b8;">${sourceLabel}: ${nearestPointLabel || "Unknown"} (${nearestMarketDistanceKm.toFixed(0)} km)</span><br/>` +
              `<span style="color:#cbd5e1;">Contributors: ${contributorCount}</span><br/>` +
              `<span style="color:#94a3b8;">Grid step: ${stepDegrees.toFixed(5)} deg</span><br/>` +
              `<span style="color:#94a3b8;">Approx cell area: ${sqftNumberFormatter.format(areaSqft)} sqft</span>` +
              `</div>`;
        }

        popup.setLngLat([pointer.lng, pointer.lat]);
        if (popupHtml !== lastPopupHtmlRef.current) {
          popup.setHTML(popupHtml);
          lastPopupHtmlRef.current = popupHtml;
        }
        if (!popup.isOpen()) {
          popup.addTo(map);
        }
      };

      const enqueueHoverPointer = (event: MapMouseEvent | MapTouchEvent) => {
        if (!event.lngLat) {
          return;
        }
        pendingHoverPointerRef.current = {
          x: Number(event.point.x),
          y: Number(event.point.y),
          lng: event.lngLat.lng,
          lat: event.lngLat.lat
        };
        if (hoverFrameRef.current !== null) {
          return;
        }
        hoverFrameRef.current = globalThis.requestAnimationFrame(processHoverFrame);
      };

      const handleMapHover = (event: MapMouseEvent) => {
        enqueueHoverPointer(event);
      };

      const handleMapTap = (event: MapMouseEvent | MapTouchEvent) => {
        enqueueHoverPointer(event);
      };

      map.on("mousemove", handleMapHover);
      map.on("touchmove", handleMapTap);
      map.on("touchstart", handleMapTap);
      map.on("click", handleMapTap);

      map.on("mouseenter", "market-hit-area", () => {
        map.getCanvas().style.cursor = "pointer";
      });

      map.on("mouseenter", "market-labels", () => {
        map.getCanvas().style.cursor = "pointer";
      });

      map.on("mouseleave", "market-hit-area", () => {
        map.getCanvas().style.cursor = "";
      });

      map.on("mouseleave", "market-labels", () => {
        map.getCanvas().style.cursor = "";
      });

      map.on("move", scheduleGridUpdate);
      map.on("zoom", scheduleGridUpdate);
      map.on("moveend", flushGridUpdate);
      map.on("zoomend", flushGridUpdate);

      handleCanvasLeave = () => {
        popupRef.current?.remove();
        lastPopupHtmlRef.current = "";
        pendingHoverPointerRef.current = null;
        if (hoverFrameRef.current !== null) {
          globalThis.cancelAnimationFrame(hoverFrameRef.current);
          hoverFrameRef.current = null;
        }
        setHoverGridId(null);
        hoverPointerLiveRef.current = null;
        scheduleHoverLiftUpdate(null);
        map.getCanvas().style.cursor = "";
      };
      map.getCanvas().addEventListener("mouseleave", handleCanvasLeave);

      void initializeData();
    });

    map.on("error", (event) => {
      const message = event.error instanceof Error ? event.error.message : "Map rendering error";
      setMapError(message);
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), "top-right");
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");

    const handleResize = () => {
      map.resize();
      resizeDotCanvas();
      viewportVersionRef.current += 1;
      lastGridRenderSnapshotRef.current = null;
      scheduleGridUpdate();
    };
    globalThis.addEventListener("resize", handleResize);

    return () => {
      globalThis.removeEventListener("resize", handleResize);
      if (handleCanvasLeave) {
        map.getCanvas().removeEventListener("mouseleave", handleCanvasLeave);
      }
      if (gridFrameRef.current !== null) {
        globalThis.cancelAnimationFrame(gridFrameRef.current);
        gridFrameRef.current = null;
      }
      if (gridTimeoutRef.current !== null) {
        globalThis.clearTimeout(gridTimeoutRef.current);
        gridTimeoutRef.current = null;
      }
      if (hoverFrameRef.current !== null) {
        globalThis.cancelAnimationFrame(hoverFrameRef.current);
        hoverFrameRef.current = null;
      }
      if (dotFrameRef.current !== null) {
        globalThis.cancelAnimationFrame(dotFrameRef.current);
        dotFrameRef.current = null;
      }
      pendingHoverPointerRef.current = null;
      hoverPointerLiveRef.current = null;
      lastPopupHtmlRef.current = "";
      lastGridRenderSnapshotRef.current = null;
      hoverLiftTargetRef.current = null;
      latestGridCellsRef.current = [];
      dotParticlesRef.current = [];
      gridCellByIdRef.current.clear();
      gridSpatialIndexRef.current.clear();
      gridStepDegreesRef.current = 0;
      landSpatialIndexRef.current = { buckets: new Map() };
      clearHoverLiftState();
      popupRef.current?.remove();
      popupRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, [onSelectMarket]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    const applyMode = () => {
      setBasemapMode(map, satelliteMode);
    };

    if (!map.isStyleLoaded()) {
      map.once("load", applyMode);
      return;
    }

    applyMode();
  }, [satelliteMode]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    const applyUpdates = () => {
      const marketSource = map.getSource("markets") as GeoJSONSource | undefined;
      marketSource?.setData(marketFeatureCollection);

      const gridSource = map.getSource("land-grid") as GeoJSONSource | undefined;
      if (gridSource && landPolygonsRef.current.length > 0) {
        const zoom = map.getZoom();
        const viewportHint = buildGridViewportHint(map, zoom);
        const collection = createAdaptiveGridFeatureCollection(
          map.getBounds(),
          zoom,
          landPolygonsRef.current,
          landSpatialIndexRef.current,
          markets,
          pricePoints,
          viewportHint
        );
        const gridCells = extractGridCellsFromCollection(collection);
        latestGridCellsRef.current = gridCells;
        gridCellByIdRef.current = new Map(gridCells.map((cell) => [cell.id, cell]));
        gridSpatialIndexRef.current = buildGridSpatialIndex(gridCells);
        gridStepDegreesRef.current = gridCells[0]?.stepDegrees ?? 0;
        dotParticlesRef.current = createDotParticlesFromGridCells(gridCells, zoom);

        hoverLiftTargetRef.current = null;
        for (const layerId of HOVER_EXTRUSION_LAYER_IDS) {
          if (!map.getLayer(layerId)) {
            continue;
          }
          map.setFilter(layerId, EMPTY_GRID_FILTER);
          map.setPaintProperty(layerId, "fill-extrusion-height", 0);
        }
        lastHoverLiftSignatureRef.current = "none";
        gridSource.setData(collection);
        const center = map.getCenter();
        lastGridRenderSnapshotRef.current = {
          centerLng: center.lng,
          centerLat: center.lat,
          zoom,
          stepDegrees: getGridStepDegrees(zoom),
          marketVersion: marketVersionRef.current,
          viewportVersion: viewportVersionRef.current
        };
      }
    };

    if (!map.isStyleLoaded()) {
      map.once("load", applyUpdates);
      return;
    }

    applyUpdates();
  }, [marketFeatureCollection, markets, pricePoints]);

  useEffect(() => {
    if (!selectedMarketId) {
      return;
    }

    const selected = markets.find((item) => item.id === selectedMarketId);
    if (!selected || !mapRef.current) {
      return;
    }

    mapRef.current.flyTo({
      center: [selected.center.lng, selected.center.lat],
      zoom: Math.max(mapRef.current.getZoom(), 2.2),
      pitch: Math.max(mapRef.current.getPitch(), 18),
      offset: [0, -12],
      speed: 0.6
    });
  }, [markets, selectedMarketId]);

  return (
    <div style={{ height: "100%", width: "100%", position: "relative" }}>
      <div
        ref={containerRef}
        style={{ height: "100%", width: "100%" }}
        role="application"
        aria-label="Interactive land intelligence globe map. Use mouse or touch to pan and zoom. Click a market region to view details."
        tabIndex={0}
      />
      <canvas
        ref={dotCanvasRef}
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 2
        }}
      />
      <button
        type="button"
        onClick={() => setSatelliteMode((current) => !current)}
        style={{
          position: "absolute",
          top: 12,
          left: 12,
          zIndex: 4,
          border: "1px solid rgba(148, 163, 184, 0.55)",
          borderRadius: 10,
          padding: "7px 12px",
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: "0.01em",
          color: "#f8fafc",
          background: satelliteMode ? "rgba(15, 23, 42, 0.9)" : "rgba(2, 6, 23, 0.84)",
          backdropFilter: "blur(6px)",
          cursor: "pointer",
          boxShadow: "0 8px 18px rgba(2, 6, 23, 0.35)"
        }}
      >
        {satelliteMode ? "Map Mode" : "Satellite Mode"}
      </button>
      {mapError ? (
        <div
          style={{
            position: "absolute",
            inset: "auto 12px 12px 12px",
            border: "1px solid #7f1d1d",
            borderRadius: 8,
            padding: "8px 10px",
            background: "rgba(30, 8, 8, 0.88)",
            color: "#fca5a5",
            fontSize: 12
          }}
        >
          Map rendering degraded: {mapError}
        </div>
      ) : null}
    </div>
  );
};
