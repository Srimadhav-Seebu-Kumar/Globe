"use client";

import type { CoverageTier } from "@globe/types";

interface CoverageBadgeProps {
  tier: CoverageTier;
  size?: "sm" | "md";
  showFull?: boolean;
  className?: string;
}

const tierConfig: Record<CoverageTier, { short: string; label: string; color: string; bgColor: string; borderColor: string }> = {
  tier_a_global_visibility: {
    short: "Tier A",
    label: "Global Visibility",
    color: "var(--tier-a)",
    bgColor: "rgba(100,116,139,0.12)",
    borderColor: "rgba(100,116,139,0.3)"
  },
  tier_b_market_depth: {
    short: "Tier B",
    label: "Market Depth",
    color: "var(--tier-b)",
    bgColor: "rgba(59,130,246,0.12)",
    borderColor: "rgba(59,130,246,0.3)"
  },
  tier_c_parcel_depth: {
    short: "Tier C",
    label: "Parcel Depth",
    color: "var(--tier-c)",
    bgColor: "rgba(139,92,246,0.12)",
    borderColor: "rgba(139,92,246,0.3)"
  }
};

export function CoverageBadge({ tier, size = "md", showFull = false, className = "" }: CoverageBadgeProps) {
  const config = tierConfig[tier];

  return (
    <span
      className={[
        "inline-flex items-center font-medium rounded-full border",
        size === "sm" ? "h-4 px-1.5 text-[10px]" : "h-5 px-2 text-[11px]",
        className
      ].join(" ")}
      style={{
        color: config.color,
        backgroundColor: config.bgColor,
        borderColor: config.borderColor
      }}
      title={`${config.short}: ${config.label}`}
    >
      {showFull ? `${config.short} · ${config.label}` : config.short}
    </span>
  );
}
