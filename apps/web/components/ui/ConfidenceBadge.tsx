"use client";

import type { ConfidenceLabel } from "@globe/types";

interface ConfidenceBadgeProps {
  confidence: ConfidenceLabel;
  showBar?: boolean;
  showLabel?: boolean;
  size?: "sm" | "md";
  className?: string;
}

const confidenceConfig: Record<ConfidenceLabel, { label: string; color: string; fill: number }> = {
  verified: { label: "Verified", color: "var(--confidence-verified)", fill: 100 },
  high: { label: "High", color: "var(--confidence-high)", fill: 75 },
  medium: { label: "Medium", color: "var(--confidence-medium)", fill: 50 },
  low: { label: "Low", color: "var(--confidence-low)", fill: 25 }
};

export function ConfidenceBadge({ confidence, showBar = false, showLabel = true, size = "md", className = "" }: ConfidenceBadgeProps) {
  const config = confidenceConfig[confidence];

  return (
    <span
      className={[
        "inline-flex items-center gap-2",
        size === "sm" ? "text-[10px]" : "text-[11px]",
        "font-medium",
        className
      ].join(" ")}
    >
      {showLabel && (
        <span style={{ color: config.color }}>{config.label}</span>
      )}
      {showBar && (
        <span
          className="flex items-center"
          style={{ width: 40, height: 4, background: "var(--bg-elevated)", borderRadius: 2, overflow: "hidden" }}
          role="meter"
          aria-valuenow={config.fill}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Confidence: ${config.label}`}
        >
          <span
            style={{
              width: `${config.fill}%`,
              height: "100%",
              background: config.color,
              borderRadius: 2,
              transition: "width 400ms ease-out"
            }}
          />
        </span>
      )}
    </span>
  );
}
