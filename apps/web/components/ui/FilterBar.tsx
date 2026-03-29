"use client";

import { useState, useCallback } from "react";
import type { CoverageTier, PriceState, ConfidenceLabel, FreshnessTier } from "@globe/types";
import { COVERAGE_TIERS, PRICE_STATES, CONFIDENCE_LABELS, FRESHNESS_TIERS } from "@globe/types";

// ── Types ────────────────────────────────────────────────────────

export interface FilterState {
  coverageTiers: CoverageTier[];
  priceStates: PriceState[];
  minConfidence: ConfidenceLabel;
  freshnessFilter: FreshnessTier[];
  legalDisplayOnly: boolean;
  windowDays: number;
  minAreaSqm: number | null;
  maxAreaSqm: number | null;
}

export const DEFAULT_FILTERS: FilterState = {
  coverageTiers: [...COVERAGE_TIERS] as CoverageTier[],
  priceStates: [...PRICE_STATES] as PriceState[],
  minConfidence: "low",
  freshnessFilter: [...FRESHNESS_TIERS] as FreshnessTier[],
  legalDisplayOnly: true,
  windowDays: 90,
  minAreaSqm: null,
  maxAreaSqm: null
};

interface FilterBarProps {
  value: FilterState;
  onChange: (next: FilterState) => void;
  loading?: boolean | undefined;
  resultCount?: number | undefined;
  className?: string | undefined;
}

// ── Constants ────────────────────────────────────────────────────

const COVERAGE_LABELS: Record<CoverageTier, string> = {
  tier_a_global_visibility: "Tier A",
  tier_b_market_depth: "Tier B",
  tier_c_parcel_depth: "Tier C"
};

const PRICE_STATE_LABELS: Record<PriceState, string> = {
  ask: "Ask",
  closed: "Closed",
  estimate: "Estimate",
  broker_verified: "Verified"
};

const PRICE_STATE_COLORS: Record<PriceState, string> = {
  ask: "var(--price-ask)",
  closed: "var(--price-closed)",
  estimate: "var(--price-estimate)",
  broker_verified: "var(--price-broker-verified)"
};

const CONFIDENCE_ORDER: ConfidenceLabel[] = ["low", "medium", "high", "verified"];
const CONFIDENCE_COLORS: Record<ConfidenceLabel, string> = {
  low: "#EF4444",
  medium: "#F59E0B",
  high: "#3B82F6",
  verified: "#10B981"
};

const FRESHNESS_LABELS: Record<FreshnessTier, string> = {
  realtime: "Live",
  daily: "Daily",
  weekly: "Weekly",
  stale: "Stale"
};

const WINDOW_PRESETS = [
  { label: "7d", value: 7 },
  { label: "30d", value: 30 },
  { label: "90d", value: 90 },
  { label: "1y", value: 365 }
];

// ── Small toggle chip ────────────────────────────────────────────

function Chip({
  label,
  active,
  color,
  onClick
}: {
  label: string;
  active: boolean;
  color?: string | undefined;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "h-6 px-2 rounded-full text-[11px] font-medium border transition-all duration-[var(--duration-fast)]",
        "focus-visible:outline-2 focus-visible:outline-[var(--border-focus)]",
        active
          ? "text-white border-transparent"
          : "bg-transparent text-[var(--text-tertiary)] border-[var(--border-subtle)] hover:border-[var(--border-default)] hover:text-[var(--text-secondary)]"
      ].join(" ")}
      style={active ? { backgroundColor: color ?? "var(--accent-blue)" } : {}}
      aria-pressed={active}
    >
      {label}
    </button>
  );
}

// ── Range input with label ───────────────────────────────────────

function RangeInput({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-[var(--text-tertiary)]">{label}</span>
        <span className="text-[11px] font-semibold text-[var(--text-primary)] tabular-nums font-mono">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(90deg, var(--accent-blue) 0%, var(--accent-blue) ${((value - min) / (max - min)) * 100}%, var(--border-default) ${((value - min) / (max - min)) * 100}%, var(--border-default) 100%)`
        }}
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
      />
    </div>
  );
}

// ── Confidence threshold slider ──────────────────────────────────

function ConfidenceSlider({
  value,
  onChange
}: {
  value: ConfidenceLabel;
  onChange: (v: ConfidenceLabel) => void;
}) {
  const idx = CONFIDENCE_ORDER.indexOf(value);
  const color = CONFIDENCE_COLORS[value];

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-[var(--text-tertiary)]">Min confidence</span>
        <span className="text-[11px] font-semibold tabular-nums capitalize" style={{ color }}>{value}</span>
      </div>
      <input
        type="range"
        min={0}
        max={CONFIDENCE_ORDER.length - 1}
        step={1}
        value={idx}
        onChange={(e) => onChange(CONFIDENCE_ORDER[Number(e.target.value)] ?? "low")}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(90deg, ${color} 0%, ${color} ${(idx / (CONFIDENCE_ORDER.length - 1)) * 100}%, var(--border-default) ${(idx / (CONFIDENCE_ORDER.length - 1)) * 100}%, var(--border-default) 100%)`
        }}
        aria-label="Minimum confidence level"
        aria-valuenow={idx}
        aria-valuemin={0}
        aria-valuemax={CONFIDENCE_ORDER.length - 1}
      />
      <div className="flex justify-between">
        {CONFIDENCE_ORDER.map((c) => (
          <span
            key={c}
            className="text-[9px] capitalize"
            style={{ color: c === value ? color : "var(--text-tertiary)" }}
          >
            {c}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Section wrapper ──────────────────────────────────────────────

function FilterSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-widest">{label}</span>
      {children}
    </div>
  );
}

const ResetIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
    <path d="M2 6a4 4 0 1 0 .9-2.5" />
    <polyline points="2,2 2,5.5 5.5,5.5" />
  </svg>
);

// ── Main FilterBar ───────────────────────────────────────────────

export function FilterBar({ value, onChange, loading = false, resultCount, className = "" }: FilterBarProps) {
  const isDirty = JSON.stringify(value) !== JSON.stringify(DEFAULT_FILTERS);

  const update = useCallback(
    <K extends keyof FilterState>(key: K, val: FilterState[K]) =>
      onChange({ ...value, [key]: val }),
    [value, onChange]
  );

  function toggleArrayItem<T>(arr: T[], item: T): T[] {
    return arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item];
  }

  return (
    <aside
      className={[
        "flex flex-col gap-5 p-4 overflow-y-auto",
        "bg-[var(--bg-surface)] border-r border-[var(--border-subtle)]",
        className
      ].join(" ")}
      aria-label="Data filters"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <span className="text-[12px] font-semibold text-[var(--text-primary)]">Filters</span>
          {resultCount !== undefined && (
            <span className="text-[11px] text-[var(--text-tertiary)] tabular-nums">
              {loading ? "Loading…" : `${resultCount.toLocaleString()} results`}
            </span>
          )}
        </div>
        {isDirty && (
          <button
            type="button"
            onClick={() => onChange(DEFAULT_FILTERS)}
            className="flex items-center gap-1 text-[11px] text-[var(--accent-blue)] hover:text-[var(--accent-primary)] transition-colors"
            aria-label="Reset all filters"
          >
            <ResetIcon />
            Reset
          </button>
        )}
      </div>

      {/* Observation window */}
      <FilterSection label="Observation window">
        <div className="flex gap-1.5 flex-wrap">
          {WINDOW_PRESETS.map((p) => (
            <Chip
              key={p.value}
              label={p.label}
              active={value.windowDays === p.value}
              onClick={() => update("windowDays", p.value)}
            />
          ))}
        </div>
        <RangeInput
          label="Custom"
          value={value.windowDays}
          min={7}
          max={365}
          step={1}
          format={(v) => `${v}d`}
          onChange={(v) => update("windowDays", v)}
        />
      </FilterSection>

      {/* Coverage tiers */}
      <FilterSection label="Coverage tier">
        <div className="flex flex-wrap gap-1.5">
          {COVERAGE_TIERS.map((tier) => (
            <Chip
              key={tier}
              label={COVERAGE_LABELS[tier]}
              active={value.coverageTiers.includes(tier)}
              color={tier === "tier_a_global_visibility" ? "#3B82F6" : tier === "tier_b_market_depth" ? "#6366F1" : "#8B5CF6"}
              onClick={() => update("coverageTiers", toggleArrayItem(value.coverageTiers, tier))}
            />
          ))}
        </div>
      </FilterSection>

      {/* Price states */}
      <FilterSection label="Pricing type">
        <div className="flex flex-wrap gap-1.5">
          {PRICE_STATES.map((state) => (
            <Chip
              key={state}
              label={PRICE_STATE_LABELS[state]}
              active={value.priceStates.includes(state)}
              color={PRICE_STATE_COLORS[state]}
              onClick={() => update("priceStates", toggleArrayItem(value.priceStates, state))}
            />
          ))}
        </div>
      </FilterSection>

      {/* Confidence */}
      <FilterSection label="Confidence">
        <ConfidenceSlider value={value.minConfidence} onChange={(v) => update("minConfidence", v)} />
      </FilterSection>

      {/* Freshness */}
      <FilterSection label="Freshness">
        <div className="flex flex-wrap gap-1.5">
          {FRESHNESS_TIERS.map((tier) => (
            <Chip
              key={tier}
              label={FRESHNESS_LABELS[tier]}
              active={value.freshnessFilter.includes(tier)}
              color={tier === "realtime" ? "#10B981" : tier === "daily" ? "#3B82F6" : tier === "weekly" ? "#F59E0B" : "#6B7280"}
              onClick={() => update("freshnessFilter", toggleArrayItem(value.freshnessFilter, tier))}
            />
          ))}
        </div>
      </FilterSection>

      {/* Area */}
      <FilterSection label="Area (sqm)">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-[var(--text-tertiary)] block mb-1" htmlFor="filter-min-area">Min</label>
            <input
              id="filter-min-area"
              type="number"
              min={0}
              placeholder="Any"
              value={value.minAreaSqm ?? ""}
              onChange={(e) => update("minAreaSqm", e.target.value ? Number(e.target.value) : null)}
              className="w-full h-7 px-2 rounded-[var(--radius-sm)] bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[11px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-blue)] transition-colors"
              aria-label="Minimum area in square meters"
            />
          </div>
          <div>
            <label className="text-[10px] text-[var(--text-tertiary)] block mb-1" htmlFor="filter-max-area">Max</label>
            <input
              id="filter-max-area"
              type="number"
              min={0}
              placeholder="Any"
              value={value.maxAreaSqm ?? ""}
              onChange={(e) => update("maxAreaSqm", e.target.value ? Number(e.target.value) : null)}
              className="w-full h-7 px-2 rounded-[var(--radius-sm)] bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[11px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-blue)] transition-colors"
              aria-label="Maximum area in square meters"
            />
          </div>
        </div>
      </FilterSection>

      {/* Legal display */}
      <FilterSection label="Display policy">
        <label className="flex items-center gap-2.5 cursor-pointer group">
          <div
            className={[
              "relative w-8 h-4 rounded-full transition-colors duration-[var(--duration-fast)]",
              value.legalDisplayOnly ? "bg-[var(--accent-blue)]" : "bg-[var(--border-default)]"
            ].join(" ")}
            onClick={() => update("legalDisplayOnly", !value.legalDisplayOnly)}
            role="switch"
            aria-checked={value.legalDisplayOnly}
            tabIndex={0}
            onKeyDown={(e) => e.key === " " && update("legalDisplayOnly", !value.legalDisplayOnly)}
            aria-label="Legal display only"
          >
            <span
              className="absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform duration-[var(--duration-fast)] shadow"
              style={{ transform: value.legalDisplayOnly ? "translateX(16px)" : "none" }}
              aria-hidden="true"
            />
          </div>
          <span className="text-[12px] text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
            Legal display only
          </span>
        </label>
        <p className="text-[10px] text-[var(--text-tertiary)] leading-relaxed">
          Hides parcels where legal display is restricted by policy.
        </p>
      </FilterSection>
    </aside>
  );
}
