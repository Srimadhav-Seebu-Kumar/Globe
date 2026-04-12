"use client";

import type { PriceState, CoverageTier, FreshnessTier, ConfidenceLabel } from "@globe/types";
import { motion } from "framer-motion";
import { PriceChip } from "./PriceChip";
import { FreshnessChip } from "./FreshnessChip";
import { CoverageBadge } from "./CoverageBadge";
import { Sparkline } from "./TrendChart";
import { Button } from "./Button";

interface ChangeIndicatorProps {
  changePercent: number | null;
}

function ChangeIndicator({ changePercent }: ChangeIndicatorProps) {
  if (changePercent === null) return <span className="text-[11px] text-[var(--text-tertiary)]">—</span>;

  const isUp = changePercent > 0;
  const isZero = changePercent === 0;

  if (isZero) return (
    <span className="text-[11px] text-[var(--text-tertiary)] font-mono tabular-nums">0.0%</span>
  );

  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold font-mono tabular-nums ${isUp ? "text-[var(--accent-success)]" : "text-[var(--accent-danger)]"}`}>
      <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor" aria-hidden="true"
        style={{ transform: isUp ? "none" : "rotate(180deg)" }}>
        <path d="M4 1L7.5 6.5H0.5L4 1Z" />
      </svg>
      {Math.abs(changePercent).toFixed(1)}%
    </span>
  );
}

interface AlertBadgeProps {
  hasAlert: boolean;
  triggered?: boolean | undefined;
}

function AlertBadge({ hasAlert, triggered }: AlertBadgeProps) {
  if (!hasAlert) return null;
  return (
    <span
      className={[
        "inline-flex items-center gap-1 h-5 px-1.5 text-[10px] font-semibold rounded-full border",
        triggered
          ? "bg-[rgba(239,68,68,0.12)] text-[var(--accent-danger)] border-[rgba(239,68,68,0.3)]"
          : "bg-[var(--bg-elevated)] text-[var(--text-tertiary)] border-[var(--border-subtle)]"
      ].join(" ")}
      aria-label={triggered ? "Alert triggered" : "Alert active"}
    >
      <span
        className={["w-1.5 h-1.5 rounded-full", triggered ? "bg-[var(--accent-danger)] animate-pulse" : "bg-[var(--text-tertiary)]"].join(" ")}
        aria-hidden="true"
      />
      {triggered ? "Triggered" : "Alert"}
    </span>
  );
}

export interface WatchlistCardItem {
  id: string;
  type: "market" | "parcel";
  label: string;
  marketName: string;
  coverageTier?: CoverageTier;
  freshness?: FreshnessTier;
  confidence?: ConfidenceLabel;
  currentPriceState?: PriceState;
  currentAmount?: number | null;
  currencyCode?: string;
  changePercent?: number | null;
  sparklineData?: number[];
  hasAlert: boolean;
  alertTriggered?: boolean;
  savedAt: string;
  updatedAt?: string;
}

interface WatchlistCardProps {
  item: WatchlistCardItem;
  selected?: boolean | undefined;
  onSelect?: (() => void) | undefined;
  onRemove?: ((id: string) => void) | undefined;
  onSetAlert?: ((id: string) => void) | undefined;
}

const RemoveIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
    <line x1="2" y1="2" x2="10" y2="10" /><line x1="10" y1="2" x2="2" y2="10" />
  </svg>
);

const BellIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
    <path d="M6 1.5C6 1.5 3 3 3 6.5H9C9 3 6 1.5 6 1.5Z" />
    <line x1="3" y1="6.5" x2="9" y2="6.5" />
    <path d="M4.5 9C4.5 9.9 5.17 10.5 6 10.5C6.83 10.5 7.5 9.9 7.5 9" />
  </svg>
);

const MarketIcon = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
    <circle cx="5" cy="5" r="3.5" />
    <line x1="5" y1="1.5" x2="5" y2="8.5" />
    <line x1="1.5" y1="5" x2="8.5" y2="5" />
    <ellipse cx="5" cy="5" rx="1.5" ry="3.5" />
  </svg>
);

const ParcelIcon = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
    <rect x="1.5" y="1.5" width="7" height="7" rx="0.75" />
    <line x1="1.5" y1="4.5" x2="8.5" y2="4.5" />
    <line x1="5" y1="4.5" x2="5" y2="8.5" />
  </svg>
);

function formatSavedDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(iso));
}

export function WatchlistCard({ item, selected, onSelect, onRemove, onSetAlert }: WatchlistCardProps) {
  const sparkColor = item.changePercent !== null && item.changePercent !== undefined
    ? item.changePercent >= 0 ? "#10B981" : "#EF4444"
    : "#3B82F6";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      onClick={onSelect}
      className={[
        "relative group flex flex-col gap-2 p-3 rounded-[var(--radius-lg)] border cursor-pointer",
        "transition-all duration-[var(--duration-fast)]",
        selected
          ? "bg-[var(--bg-elevated)] border-[var(--accent-blue)] ring-1 ring-[rgba(59,130,246,0.3)]"
          : "bg-[var(--bg-surface)] border-[var(--border-subtle)] hover:border-[var(--border-default)] hover:bg-[var(--bg-elevated)]"
      ].join(" ")}
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      onKeyDown={(e) => e.key === "Enter" && onSelect?.()}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={`shrink-0 text-[var(--text-tertiary)] ${selected ? "text-[var(--accent-blue)]" : ""}`}>
            {item.type === "market" ? <MarketIcon /> : <ParcelIcon />}
          </span>
          <span className="text-[12px] font-semibold text-[var(--text-primary)] truncate leading-tight">
            {item.label}
          </span>
        </div>

        {/* Action buttons (show on hover) */}
        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); onSetAlert?.(item.id); }}
            className={[
              "w-5 h-5 flex items-center justify-center rounded transition-colors",
              item.hasAlert
                ? "text-[var(--accent-warning)] hover:bg-[rgba(245,158,11,0.12)]"
                : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
            ].join(" ")}
            aria-label={item.hasAlert ? "Edit alert" : "Set alert"}
          >
            <BellIcon />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onRemove?.(item.id); }}
            className="w-5 h-5 flex items-center justify-center rounded text-[var(--text-tertiary)] hover:text-[var(--accent-danger)] hover:bg-[rgba(239,68,68,0.08)] transition-colors"
            aria-label={`Remove ${item.label} from watchlist`}
          >
            <RemoveIcon />
          </button>
        </div>
      </div>

      {/* Market label + badges */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[11px] text-[var(--text-tertiary)] truncate">{item.marketName}</span>
        {item.coverageTier && <CoverageBadge tier={item.coverageTier} size="sm" />}
        {item.freshness && <FreshnessChip freshness={item.freshness} size="sm" />}
        <AlertBadge hasAlert={item.hasAlert} triggered={item.alertTriggered} />
      </div>

      {/* Price + change + sparkline */}
      <div className="flex items-end justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          {item.currentPriceState && item.currentAmount !== undefined && item.currentAmount !== null ? (
            <PriceChip
              state={item.currentPriceState}
              amount={item.currentAmount}
              currencyCode={item.currencyCode ?? "USD"}
              size="sm"
            />
          ) : (
            <span className="text-[11px] text-[var(--text-tertiary)]">No price data</span>
          )}
          <div className="flex items-center gap-1.5">
            <ChangeIndicator changePercent={item.changePercent ?? null} />
            <span className="text-[10px] text-[var(--text-tertiary)]">since saved {formatSavedDate(item.savedAt)}</span>
          </div>
        </div>

        {item.sparklineData && item.sparklineData.length >= 2 && (
          <div className="shrink-0">
            <Sparkline data={item.sparklineData} color={sparkColor} height={28} width={64} />
          </div>
        )}
      </div>
    </motion.div>
  );
}
