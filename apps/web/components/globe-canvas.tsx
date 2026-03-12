"use client";

import { useEffect, useRef } from "react";
import maplibregl, { type StyleSpecification } from "maplibre-gl";

const style: StyleSpecification = {
  version: 8,
  name: "globe-scaffold-style",
  projection: { type: "globe" },
  sources: {},
  layers: [
    {
      id: "background",
      type: "background",
      paint: {
        "background-color": "#020817"
      }
    }
  ]
};

export const GlobeCanvas = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return;
    }

    mapRef.current = new maplibregl.Map({
      container: containerRef.current,
      style,
      center: [13, 28],
      zoom: 1.4,
      minZoom: 1,
      maxZoom: 14
    });

    mapRef.current.addControl(new maplibregl.NavigationControl({ showCompass: true }), "top-right");

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div ref={containerRef} style={{ height: "100%", width: "100%" }} />
      <div
        style={{
          position: "absolute",
          left: 16,
          bottom: 16,
          border: "1px solid #334155",
          borderRadius: 8,
          padding: "6px 10px",
          background: "rgba(2, 6, 23, 0.9)",
          color: "#94a3b8",
          fontSize: 12
        }}
      >
        MapLibre globe scaffold
      </div>
    </div>
  );
};
