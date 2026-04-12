"use client";

import type { PriceState } from "@globe/types";

interface TickerItem {
  id: string;
  marketName: string;
  summary: string;
  category: "listing" | "transaction" | "planning" | "verification";
  occurredAt: string;
  priceState?: PriceState;
  amount?: number;
  currencyCode?: string;
}

interface TickerTapeProps {
  items: TickerItem[];
  onItemClick?: (item: TickerItem) => void;
}

const categoryDot: Record<TickerItem["category"], string> = {
  listing: "var(--price-ask)",
  transaction: "var(--price-closed)",
  planning: "var(--accent-warning)",
  verification: "var(--accent-purple)"
};

const categoryLabel: Record<TickerItem["category"], string> = {
  listing: "NEW LISTING",
  transaction: "TRANSACTION",
  planning: "PLANNING",
  verification: "VERIFIED"
};

function formatRelative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diffMs / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

export function TickerTape({ items, onItemClick }: TickerTapeProps) {
  if (items.length === 0) return null;

  // Duplicate for seamless loop
  const doubled = [...items, ...items];

  return (
    <div className="flex overflow-hidden" aria-live="polite" aria-label="Market activity feed">
      <div className="ticker-track gap-0">
        {doubled.map((item, idx) => (
          <button
            key={`${item.id}-${idx}`}
            onClick={() => onItemClick?.(item)}
            className={[
              "shrink-0 flex items-center gap-2.5 px-4 h-full",
              "text-left cursor-pointer",
              "hover:bg-[var(--bg-elevated)] transition-colors duration-[var(--duration-fast)]",
              "border-r border-[var(--border-subtle)] last:border-r-0"
            ].join(" ")}
            tabIndex={idx >= items.length ? -1 : 0}
            aria-hidden={idx >= items.length}
          >
            {/* Category indicator */}
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ backgroundColor: categoryDot[item.category] }}
              aria-hidden="true"
            />
            {/* Category label */}
            <span
              className="text-[10px] font-bold tracking-widest shrink-0"
              style={{ color: categoryDot[item.category] }}
            >
              {categoryLabel[item.category]}
            </span>
            {/* Market */}
            <span className="text-[12px] font-semibold text-[var(--text-primary)] shrink-0">
              {item.marketName}
            </span>
            {/* Summary */}
            <span className="text-[12px] text-[var(--text-secondary)] max-w-[200px] truncate">
              {item.summary}
            </span>
            {/* Time */}
            <span className="text-[11px] text-[var(--text-tertiary)] shrink-0">
              {formatRelative(item.occurredAt)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
