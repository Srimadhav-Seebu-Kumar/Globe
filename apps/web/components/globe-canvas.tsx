"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl, { type GeoJSONSource, type StyleSpecification } from "maplibre-gl";
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
}

interface GlobeCanvasProps {
  markets: MarketMapItem[];
  selectedMarketId: string;
  onSelectMarket: (marketId: string) => void;
}

const style: StyleSpecification = {
  version: 8,
  name: "land-intelligence-globe",
  projection: { type: "globe" },
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
const SQM_TO_SQFT = 10.7639;

const getGridCellSize = (zoom: number): number => {
  if (zoom < 2) {
    return 36;
  }

  if (zoom < 3) {
    return 20;
  }

  if (zoom < 4) {
    return 12;
  }

  if (zoom < 5) {
    return 8;
  }

  if (zoom < 6) {
    return 4;
  }

  if (zoom < 7) {
    return 2;
  }

  if (zoom < 8) {
    return 1;
  }

  if (zoom < 9) {
    return 0.5;
  }

  if (zoom < 10) {
    return 0.25;
  }

  return 0.125;
};

const clampLatitude = (latitude: number): number => Math.max(-85, Math.min(85, latitude));

const createPriceBlocks = (markets: MarketMapItem[], zoom: number): GeoJSON.FeatureCollection<GeoJSON.Polygon> => {
  const cellSize = getGridCellSize(zoom);

  const bucketMap = new Map<
    string,
    {
      lngStart: number;
      latStart: number;
      valueSum: number;
      sampleCount: number;
    }
  >();

  for (const market of markets) {
    if (market.benchmarkPricePerSqm <= 0) {
      continue;
    }

    const pricePerSqft = market.benchmarkPricePerSqm / SQM_TO_SQFT;
    const lngIndex = Math.floor((market.center.lng + 180) / cellSize);
    const latIndex = Math.floor((clampLatitude(market.center.lat) + 90) / cellSize);

    const lngStart = lngIndex * cellSize - 180;
    const latStart = latIndex * cellSize - 90;
    const key = `${lngIndex}:${latIndex}`;

    const existing = bucketMap.get(key);
    if (existing) {
      existing.valueSum += pricePerSqft;
      existing.sampleCount += 1;
      continue;
    }

    bucketMap.set(key, {
      lngStart,
      latStart,
      valueSum: pricePerSqft,
      sampleCount: 1
    });
  }

  const features: GeoJSON.Feature<GeoJSON.Polygon>[] = [];
  for (const [key, value] of bucketMap.entries()) {
    const lngEnd = Math.min(180, value.lngStart + cellSize);
    const latEnd = Math.min(85, value.latStart + cellSize);
    const avgPricePerSqft = value.valueSum / value.sampleCount;

    features.push({
      type: "Feature",
      id: key,
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [value.lngStart, value.latStart],
            [lngEnd, value.latStart],
            [lngEnd, latEnd],
            [value.lngStart, latEnd],
            [value.lngStart, value.latStart]
          ]
        ]
      },
      properties: {
        avgPricePerSqft: Number(avgPricePerSqft.toFixed(2)),
        sampleCount: value.sampleCount,
        cellSizeDegrees: Number(cellSize.toFixed(3))
      }
    });
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

export const GlobeCanvas = ({ markets, selectedMarketId, onSelectMarket }: GlobeCanvasProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const latestFeatureCollectionRef = useRef<GeoJSON.FeatureCollection<GeoJSON.Point>>({
    type: "FeatureCollection",
    features: []
  });
  const latestMarketsRef = useRef<MarketMapItem[]>([]);
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
          coverageTier: market.coverageTier,
          activityScore: market.activityScore,
          benchmarkPricePerSqft: Number((market.benchmarkPricePerSqm / SQM_TO_SQFT).toFixed(2)),
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
  }, [markets]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return;
    }

    let map: maplibregl.Map;
    try {
      map = new maplibregl.Map({
        container: containerRef.current,
        style,
        center: [10, 25],
        zoom: 1.4,
        minZoom: 1,
        maxZoom: 12,
        renderWorldCopies: false
      });
    } catch (error) {
      setMapError(error instanceof Error ? error.message : "Map initialization failed");
      return;
    }

    mapRef.current = map;
    popupRef.current = new maplibregl.Popup({ closeButton: false, closeOnClick: false, className: "price-hover-popup" });

    const updatePriceGridSource = () => {
      const priceSource = map.getSource("price-grid") as GeoJSONSource | undefined;
      if (!priceSource) {
        return;
      }

      priceSource.setData(createPriceBlocks(latestMarketsRef.current, map.getZoom()));
    };

    map.on("load", () => {
      map.addSource("landmass", {
        type: "geojson",
        data: LANDMASS_GEOJSON_URL
      });

      map.addLayer({
        id: "landmass-fill",
        type: "fill",
        source: "landmass",
        paint: {
          "fill-color": "#1e3a5f",
          "fill-opacity": 0.88
        }
      });

      map.addLayer({
        id: "landmass-outline",
        type: "line",
        source: "landmass",
        paint: {
          "line-color": "#67a1cf",
          "line-width": 0.8,
          "line-opacity": 0.65
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
          "line-color": "#3f5e84",
          "line-width": 0.6,
          "line-opacity": 0.45
        }
      });

      map.addSource("price-grid", {
        type: "geojson",
        data: createPriceBlocks(latestMarketsRef.current, map.getZoom())
      });

      map.addLayer({
        id: "price-grid-fill",
        type: "fill",
        source: "price-grid",
        paint: {
          "fill-color": [
            "interpolate",
            ["linear"],
            ["get", "avgPricePerSqft"],
            0,
            "#9ca3af",
            12,
            "#22c55e",
            30,
            "#facc15",
            55,
            "#ef4444",
            90,
            "#a855f7"
          ],
          "fill-opacity": ["interpolate", ["linear"], ["zoom"], 1, 0.32, 6, 0.42, 11, 0.5]
        }
      });

      map.addLayer({
        id: "price-grid-outline",
        type: "line",
        source: "price-grid",
        paint: {
          "line-color": "rgba(148, 163, 184, 0.55)",
          "line-width": ["interpolate", ["linear"], ["zoom"], 1, 0.2, 8, 0.6, 12, 1],
          "line-opacity": ["interpolate", ["linear"], ["zoom"], 1, 0.2, 12, 0.45]
        }
      });

      map.addSource("markets", {
        type: "geojson",
        data: latestFeatureCollectionRef.current
      });

      map.addLayer({
        id: "market-heat",
        type: "heatmap",
        source: "markets",
        maxzoom: 4,
        paint: {
          "heatmap-weight": ["interpolate", ["linear"], ["get", "activityScore"], 50, 0.1, 95, 1],
          "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 1, 20, 4, 55],
          "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 1, 0.9, 4, 1.6],
          "heatmap-color": [
            "interpolate",
            ["linear"],
            ["heatmap-density"],
            0,
            "rgba(59,130,246,0)",
            0.2,
            "#60a5fa",
            0.45,
            "#22d3ee",
            0.65,
            "#4ade80",
            0.85,
            "#f59e0b",
            1,
            "#ef4444"
          ],
          "heatmap-opacity": 0.72
        }
      });

      map.addLayer({
        id: "market-circles",
        type: "circle",
        source: "markets",
        minzoom: 2,
        paint: {
          "circle-color": [
            "match",
            ["get", "coverageTier"],
            "tier_c_parcel_depth",
            "#22c55e",
            "tier_b_market_depth",
            "#f59e0b",
            "#3b82f6"
          ],
          "circle-radius": ["interpolate", ["linear"], ["get", "activityScore"], 50, 6, 95, 18],
          "circle-opacity": 0.85,
          "circle-stroke-color": ["case", ["get", "selected"], "#f8fafc", "#0f172a"],
          "circle-stroke-width": ["case", ["get", "selected"], 3, 1.2]
        }
      });

      map.addLayer({
        id: "market-labels",
        type: "symbol",
        source: "markets",
        minzoom: 3,
        layout: {
          "text-field": ["get", "name"],
          "text-size": 12,
          "text-offset": [0, 1.3]
        },
        paint: {
          "text-color": "#cbd5e1",
          "text-halo-color": "#020617",
          "text-halo-width": 1
        }
      });

      map.on("click", "market-circles", (event) => {
        const feature = event.features?.[0];
        if (!feature) {
          return;
        }

        const marketId = String(feature.properties?.id ?? "");
        if (marketId) {
          onSelectMarket(marketId);
        }
      });

      map.on("mousemove", "price-grid-fill", (event) => {
        const feature = event.features?.[0];
        const popup = popupRef.current;
        if (!feature || !popup || !event.lngLat) {
          return;
        }

        const avgPrice = Number(feature.properties?.avgPricePerSqft ?? 0);
        const sampleCount = Number(feature.properties?.sampleCount ?? 0);
        const cellSize = Number(feature.properties?.cellSizeDegrees ?? 0);

        popup
          .setLngLat(event.lngLat)
          .setHTML(
            `<div style="font: 12px 'Space Grotesk', sans-serif; color: #e2e8f0;">` +
              `<strong style="display:block; margin-bottom:4px;">Avg land rate: $${avgPrice.toFixed(2)}/sqft</strong>` +
              `<span style="color:#cbd5e1;">Samples in block: ${sampleCount}</span><br/>` +
              `<span style="color:#94a3b8;">Block size: ${cellSize.toFixed(3)}°</span>` +
              `</div>`
          )
          .addTo(map);
      });

      map.on("mouseleave", "price-grid-fill", () => {
        popupRef.current?.remove();
      });

      map.on("mouseenter", "market-circles", () => {
        map.getCanvas().style.cursor = "pointer";
      });

      map.on("mouseleave", "market-circles", () => {
        map.getCanvas().style.cursor = "";
      });

      map.on("zoomend", updatePriceGridSource);
    });

    map.on("error", (event) => {
      const message = event.error instanceof Error ? event.error.message : "Map rendering error";
      setMapError(message);
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), "top-right");
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");

    const handleResize = () => {
      map.resize();
    };
    globalThis.addEventListener("resize", handleResize);

    return () => {
      globalThis.removeEventListener("resize", handleResize);
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

    const applyUpdates = () => {
      const source = map.getSource("markets") as GeoJSONSource | undefined;
      source?.setData(marketFeatureCollection);

      const priceSource = map.getSource("price-grid") as GeoJSONSource | undefined;
      priceSource?.setData(createPriceBlocks(markets, map.getZoom()));
    };

    if (!map.isStyleLoaded()) {
      map.once("load", applyUpdates);
      return;
    }

    applyUpdates();
  }, [marketFeatureCollection, markets]);

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
      zoom: Math.max(mapRef.current.getZoom(), 3),
      speed: 0.6
    });
  }, [markets, selectedMarketId]);

  return (
    <div style={{ height: "100%", width: "100%", position: "relative" }}>
      <div ref={containerRef} style={{ height: "100%", width: "100%" }} />
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
