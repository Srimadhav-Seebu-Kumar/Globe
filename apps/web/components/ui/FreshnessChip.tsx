"use client";

import type { FreshnessTier } from "@globe/types";

interface FreshnessChipProps {
  freshness: FreshnessTier;
  updatedAt?: string;
  size?: "sm" | "md";
  className?: string;
}

const freshnessConfig: Record<FreshnessTier, { label: string; color: string; dotColor: string }> = {
  realtime: { label: "Live", color: "var(--freshness-live)", dotColor: "var(--freshness-live)" },
  daily: { label: "Daily", color: "var(--freshness-daily)", dotColor: "var(--freshness-daily)" },
  weekly: { label: "Weekly", color: "var(--freshness-weekly)", dotColor: "var(--freshness-weekly)" },
  stale: { label: "Stale", color: "var(--freshness-stale)", dotColor: "var(--freshness-stale)" }
};

function formatRelativeTime(isoString: string): string {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diffMs = now - then;
  const minute = 60_000;
  const hour = minute * 60;
  const day = hour * 24;

  if (diffMs < hour) return `${Math.round(diffMs / minute)}m ago`;
  if (diffMs < day) return `${Math.round(diffMs / hour)}h ago`;
  return `${Math.round(diffMs / day)}d ago`;
}

export function FreshnessChip({ freshness, updatedAt, size = "md", className = "" }: FreshnessChipProps) {
  const config = freshnessConfig[freshness];
  const relative = updatedAt ? formatRelativeTime(updatedAt) : null;

  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 font-medium",
        size === "sm" ? "h-4 px-1.5 text-[10px] rounded-full" : "h-5 px-2 text-[11px] rounded-full",
        "border",
        className
      ].join(" ")}
      style={{
        color: config.color,
        backgroundColor: `color-mix(in srgb, ${config.color} 12%, transparent)`,
        borderColor: `color-mix(in srgb, ${config.color} 30%, transparent)`
      }}
      title={relative ? `Updated ${relative}` : config.label}
    >
      <span
        className={freshness === "realtime" ? "animate-[pulse-glow_1.5s_ease-in-out_infinite]" : ""}
        style={{ width: 5, height: 5, borderRadius: "50%", backgroundColor: config.dotColor, flexShrink: 0 }}
        aria-hidden="true"
      />
      {relative ?? config.label}
    </span>
  );
}
