"use client";

import { useState, type MouseEvent, type ReactNode, type CSSProperties } from "react";

interface SpotlightCardProps {
  children: ReactNode;
  className?: string;
  spotlightColor?: string;
}

interface SpotState {
  x: number;
  y: number;
  visible: boolean;
}

export function SpotlightCard({
  children,
  className = "",
  spotlightColor = "rgba(99,102,241,0.15)"
}: SpotlightCardProps) {
  // React-controlled state keeps the overlay in sync even if the parent
  // re-renders mid-interaction (prior DOM-mutation approach could desync).
  const [spot, setSpot] = useState<SpotState>({ x: 0, y: 0, visible: false });

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setSpot({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      visible: true
    });
  };

  const handleMouseLeave = () => {
    setSpot((prev) => ({ ...prev, visible: false }));
  };

  const containerStyle: CSSProperties = {
    position: "relative",
    overflow: "hidden"
  };

  const overlayStyle: CSSProperties = {
    position: "absolute",
    inset: 0,
    opacity: spot.visible ? 1 : 0,
    transition: "opacity 0.2s ease",
    pointerEvents: "none",
    zIndex: 0,
    background: `radial-gradient(300px circle at ${spot.x}px ${spot.y}px, ${spotlightColor}, transparent 70%)`
  };

  return (
    <div
      style={containerStyle}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div style={overlayStyle} aria-hidden="true" />
      <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
    </div>
  );
}
