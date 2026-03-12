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
        "background-color": "#020617"
      }
    }
  ]
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

const createLandMasses = (): GeoJSON.FeatureCollection<GeoJSON.Polygon> => ({
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { id: "north-america" },
      geometry: {
        type: "Polygon",
        coordinates: [[[-168, 12], [-168, 72], [-130, 78], [-95, 83], [-52, 72], [-52, 12], [-168, 12]]]
      }
    },
    {
      type: "Feature",
      properties: { id: "south-america" },
      geometry: {
        type: "Polygon",
        coordinates: [[[-82, -56], [-82, 13], [-60, 13], [-34, -4], [-34, -56], [-82, -56]]]
      }
    },
    {
      type: "Feature",
      properties: { id: "eurasia" },
      geometry: {
        type: "Polygon",
        coordinates: [[[-10, 35], [-10, 72], [40, 77], [100, 80], [180, 70], [180, 35], [-10, 35]]]
      }
    },
    {
      type: "Feature",
      properties: { id: "africa" },
      geometry: {
        type: "Polygon",
        coordinates: [[[-18, -35], [-18, 37], [52, 37], [52, -35], [-18, -35]]]
      }
    },
    {
      type: "Feature",
      properties: { id: "australia" },
      geometry: {
        type: "Polygon",
        coordinates: [[[110, -45], [110, -10], [156, -10], [156, -45], [110, -45]]]
      }
    },
    {
      type: "Feature",
      properties: { id: "antarctica" },
      geometry: {
        type: "Polygon",
        coordinates: [[[-180, -90], [-180, -60], [180, -60], [180, -90], [-180, -90]]]
      }
    }
  ]
});

export const GlobeCanvas = ({ markets, selectedMarketId, onSelectMarket }: GlobeCanvasProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const latestFeatureCollectionRef = useRef<GeoJSON.FeatureCollection<GeoJSON.Point>>({
    type: "FeatureCollection",
    features: []
  });
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
        maxZoom: 10
      });
    } catch (error) {
      setMapError(error instanceof Error ? error.message : "Map initialization failed");
      return;
    }

    mapRef.current = map;

    map.on("load", () => {
      map.addSource("landmass", {
        type: "geojson",
        data: createLandMasses()
      });

      map.addLayer({
        id: "landmass-fill",
        type: "fill",
        source: "landmass",
        paint: {
          "fill-color": "#0f172a",
          "fill-opacity": 0.9
        }
      });

      map.addLayer({
        id: "landmass-outline",
        type: "line",
        source: "landmass",
        paint: {
          "line-color": "#334155",
          "line-width": 1,
          "line-opacity": 0.75
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
          "line-color": "#1e293b",
          "line-width": 0.7,
          "line-opacity": 0.8
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

      map.on("mouseenter", "market-circles", () => {
        map.getCanvas().style.cursor = "pointer";
      });

      map.on("mouseleave", "market-circles", () => {
        map.getCanvas().style.cursor = "";
      });
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), "top-right");

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [onSelectMarket]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    if (!map.isStyleLoaded()) {
      map.once("load", () => {
        const lateSource = map.getSource("markets") as GeoJSONSource | undefined;
        lateSource?.setData(marketFeatureCollection);
      });
      return;
    }

    const source = map.getSource("markets") as GeoJSONSource | undefined;
    if (!source) {
      return;
    }

    source.setData(marketFeatureCollection);
  }, [marketFeatureCollection]);

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
