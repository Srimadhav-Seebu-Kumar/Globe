"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import type { CoverageTier, ConfidenceLabel, FreshnessTier, PriceState } from "@globe/types";
import { motion, AnimatePresence } from "framer-motion";
import { StatCard } from "./StatCard";
import { PriceChip } from "./PriceChip";
import { FreshnessChip } from "./FreshnessChip";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { CoverageBadge } from "./CoverageBadge";
import { TrendChart } from "./TrendChart";
import { Skeleton, SkeletonText } from "./Skeleton";
import { Button } from "./Button";

// ── Types ────────────────────────────────────────────────────────

interface MarketStats {
  id: string;
  name: string;
  region: string;
  countryCode: string;
  timezone: string;
  coverageTier: CoverageTier;
  confidence: ConfidenceLabel;
  freshness: FreshnessTier;
  activityScore: number;
  activeListings: number;
  closedTransactions: number;
  benchmarkPricePerSqm: number;
  benchmarkCurrency: string;
  updatedAt: string;
}

interface MarketListing {
  id: string;
  reference: string;
  state: PriceState;
  amount: number;
  currencyCode: string;
  observedAt: string;
  sourceName: string;
  brokerName: string | null;
  freshness: FreshnessTier;
  confidence: ConfidenceLabel;
}

interface MarketAlert {
  id: string;
  title: string;
  ruleType: "new_listing" | "price_change" | "planning_signal";
  isActive: boolean;
  lastTriggeredAt: string | null;
}

interface TrendPoint {
  date: string;
  ask?: number;
  closed?: number;
  estimate?: number;
}

interface MarketPanelProps {
  market: MarketStats | null;
  listings?: MarketListing[];
  alerts?: MarketAlert[];
  trendData?: TrendPoint[];
  loading?: boolean | undefined;
  onCreateAlert?: (() => void) | undefined;
  onExport?: (() => void) | undefined;
  onParcelClick?: ((parcelId: string) => void) | undefined;
}

type TabId = "overview" | "listings" | "trends" | "alerts";

// ── Helpers ──────────────────────────────────────────────────────

function formatCurrency(amount: number, code: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: code,
    notation: amount >= 1_000_000 ? "compact" : "standard",
    maximumFractionDigits: amount >= 1_000_000 ? 1 : 0
  }).format(amount);
}

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit"
  }).format(new Date(iso));
}

const alertRuleLabels: Record<MarketAlert["ruleType"], string> = {
  new_listing: "New listing",
  price_change: "Price change",
  planning_signal: "Planning signal"
};

// ── Sub-components ───────────────────────────────────────────────

function Tab({ id, label, active, badge, onClick }: {
  id: TabId; label: string; active: boolean; badge?: number | undefined; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "relative flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium transition-colors",
        "border-b-2 -mb-px",
        active
          ? "text-[var(--text-primary)] border-[var(--accent-blue)]"
          : "text-[var(--text-tertiary)] border-transparent hover:text-[var(--text-secondary)] hover:border-[var(--border-default)]"
      ].join(" ")}
      aria-selected={active}
      role="tab"
    >
      {label}
      {badge !== undefined && badge > 0 && (
        <span className={[
          "h-4 min-w-[16px] px-1 rounded-full text-[10px] font-semibold tabular-nums flex items-center justify-center",
          active ? "bg-[rgba(59,130,246,0.2)] text-[var(--accent-blue)]" : "bg-[var(--bg-elevated)] text-[var(--text-tertiary)]"
        ].join(" ")}>
          {badge}
        </span>
      )}
    </button>
  );
}

function SectionEmpty({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center py-12 text-[13px] text-[var(--text-tertiary)]">
      {message}
    </div>
  );
}

function ListingRow({ listing }: { listing: MarketListing }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2.5 border-b border-[var(--border-subtle)] last:border-0">
      <div className="flex flex-col gap-0.5 min-w-0">
        <div className="flex items-center gap-2">
          <PriceChip state={listing.state} amount={listing.amount} currencyCode={listing.currencyCode} size="sm" />
          <span className="text-[11px] text-[var(--text-tertiary)] font-mono truncate">{listing.reference}</span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
          <span className="text-[11px] text-[var(--text-secondary)] truncate">{listing.sourceName}</span>
          {listing.brokerName && (
            <span className="text-[11px] text-[var(--text-tertiary)]">· {listing.brokerName}</span>
          )}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <FreshnessChip freshness={listing.freshness} size="sm" />
        <time className="text-[10px] text-[var(--text-tertiary)]">{formatDateTime(listing.observedAt)}</time>
      </div>
    </div>
  );
}

function AlertRow({ alert }: { alert: MarketAlert }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-[var(--border-subtle)] last:border-0">
      <span
        className={[
          "w-2 h-2 rounded-full shrink-0",
          alert.isActive ? "bg-[var(--accent-success)]" : "bg-[var(--text-tertiary)]"
        ].join(" ")}
        aria-hidden="true"
      />
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-medium text-[var(--text-primary)] truncate">{alert.title}</p>
        <p className="text-[11px] text-[var(--text-tertiary)]">{alertRuleLabels[alert.ruleType]}</p>
      </div>
      {alert.lastTriggeredAt && (
        <time className="text-[10px] text-[var(--text-tertiary)] shrink-0">
          {formatDateTime(alert.lastTriggeredAt)}
        </time>
      )}
    </div>
  );
}

const BellPlusIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
    <path d="M6.5 1.5C6.5 1.5 3.5 3 3.5 7H9.5C9.5 3 6.5 1.5 6.5 1.5Z" />
    <line x1="3.5" y1="7" x2="9.5" y2="7" />
    <path d="M5 10C5 10.8 5.67 11.5 6.5 11.5C7.33 11.5 8 10.8 8 10" />
    <line x1="10.5" y1="2" x2="10.5" y2="5" />
    <line x1="9" y1="3.5" x2="12" y2="3.5" />
  </svg>
);

const ExportIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
    <path d="M6.5 2v6M4 5 6.5 2 9 5" />
    <path d="M2 9v2.5h9V9" />
  </svg>
);

// ── Main component ───────────────────────────────────────────────

export function MarketPanel({
  market,
  listings = [],
  alerts = [],
  trendData = [],
  loading = false,
  onCreateAlert,
  onExport
}: MarketPanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  if (loading) {
    return (
      <div className="flex flex-col gap-4 p-4 h-full">
        <SkeletonText lines={2} />
        <div className="flex gap-2">
          <Skeleton height={20} width={80} />
          <Skeleton height={20} width={60} />
          <Skeleton height={20} width={70} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={80} />)}
        </div>
        <Skeleton height={120} />
        <SkeletonText lines={4} />
      </div>
    );
  }

  if (!market) {
    return (
      <div className="flex items-center justify-center h-full px-6">
        <div className="text-center">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="mx-auto mb-3 text-[var(--text-tertiary)]" aria-hidden="true">
            <circle cx="20" cy="20" r="17" stroke="currentColor" strokeWidth="1.5" />
            <ellipse cx="20" cy="20" rx="7" ry="17" stroke="currentColor" strokeWidth="1.5" />
            <line x1="3" y1="20" x2="37" y2="20" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          <p className="text-[13px] font-medium text-[var(--text-secondary)]">Select a market</p>
          <p className="text-[12px] text-[var(--text-tertiary)] mt-1">Click a region on the globe to view market details</p>
        </div>
      </div>
    );
  }

  const usdBenchmark = market.benchmarkPricePerSqm;
  const activeCount = alerts.filter((a) => a.isActive).length;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-0 shrink-0">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0">
            <h2 className="text-[15px] font-semibold text-[var(--text-primary)] leading-tight truncate">
              {market.name}
            </h2>
            <p className="text-[12px] text-[var(--text-tertiary)] mt-0.5">
              {market.region} · {market.timezone}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {onCreateAlert && (
              <Button variant="ghost" size="xs" icon={<BellPlusIcon />} onClick={onCreateAlert} aria-label="Create alert" />
            )}
            {onExport && (
              <Button variant="ghost" size="xs" icon={<ExportIcon />} onClick={onExport} aria-label="Export market data" />
            )}
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <CoverageBadge tier={market.coverageTier} />
          <FreshnessChip freshness={market.freshness} updatedAt={market.updatedAt} />
          <ConfidenceBadge confidence={market.confidence} />
        </div>

        {/* Tabs */}
        <div
          className="flex gap-0 border-b border-[var(--border-subtle)]"
          role="tablist"
          aria-label="Market detail sections"
        >
          <Tab id="overview" label="Overview" active={activeTab === "overview"} onClick={() => setActiveTab("overview")} />
          <Tab id="listings" label="Listings" active={activeTab === "listings"} badge={listings.length} onClick={() => setActiveTab("listings")} />
          <Tab id="trends" label="Trends" active={activeTab === "trends"} onClick={() => setActiveTab("trends")} />
          <Tab id="alerts" label="Alerts" active={activeTab === "alerts"} badge={activeCount} onClick={() => setActiveTab("alerts")} />
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="p-4 flex flex-col gap-4"
            >
              {/* Stat grid */}
              <div className="grid grid-cols-2 gap-3">
                <StatCard
                  label="Activity Score"
                  value={market.activityScore}
                />
                <StatCard
                  label="Active Listings"
                  value={market.activeListings.toLocaleString()}
                />
                <StatCard
                  label="Closed Deals"
                  value={market.closedTransactions.toLocaleString()}
                />
                <StatCard
                  label="Benchmark /sqm"
                  value={formatCurrency(usdBenchmark, market.benchmarkCurrency)}
                />
              </div>

              {/* Benchmark detail */}
              <div className="p-3 rounded-[var(--radius-md)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
                <p className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-widest mb-2">
                  Benchmark Pricing
                </p>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-[var(--text-secondary)]">Local /sqm</span>
                    <span className="text-[12px] font-semibold text-[var(--text-primary)] font-mono tabular-nums">
                      {formatCurrency(market.benchmarkPricePerSqm, market.benchmarkCurrency)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-[var(--text-secondary)]">Local /sqft</span>
                    <span className="text-[12px] font-semibold text-[var(--text-primary)] font-mono tabular-nums">
                      {formatCurrency(market.benchmarkPricePerSqm / 10.764, market.benchmarkCurrency)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Mini trend preview */}
              {trendData.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-widest mb-2">
                    Ask Price Trend
                  </p>
                  <TrendChart data={trendData} metric="ask" height={80} currencyCode={market.benchmarkCurrency} />
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "listings" && (
            <motion.div
              key="listings"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="px-4 py-2"
            >
              {listings.length === 0 ? (
                <SectionEmpty message="No listings in the current observation window" />
              ) : (
                listings.map((listing) => <ListingRow key={listing.id} listing={listing} />)
              )}
            </motion.div>
          )}

          {activeTab === "trends" && (
            <motion.div
              key="trends"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="p-4 flex flex-col gap-5"
            >
              {trendData.length === 0 ? (
                <SectionEmpty message="No trend data available" />
              ) : (
                <>
                  <div>
                    <p className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-widest mb-2">Ask Price</p>
                    <TrendChart data={trendData} metric="ask" height={100} currencyCode={market.benchmarkCurrency} />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-widest mb-2">Closed Sales</p>
                    <TrendChart data={trendData} metric="closed" height={100} currencyCode={market.benchmarkCurrency} />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-widest mb-2">Estimates</p>
                    <TrendChart data={trendData} metric="estimate" height={100} currencyCode={market.benchmarkCurrency} />
                  </div>
                </>
              )}
            </motion.div>
          )}

          {activeTab === "alerts" && (
            <motion.div
              key="alerts"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="px-4 py-2"
            >
              {alerts.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-12">
                  <p className="text-[13px] text-[var(--text-tertiary)]">No alerts configured for this market</p>
                  {onCreateAlert && (
                    <Button variant="secondary" size="sm" icon={<BellPlusIcon />} onClick={onCreateAlert}>
                      Create Alert
                    </Button>
                  )}
                </div>
              ) : (
                alerts.map((alert) => <AlertRow key={alert.id} alert={alert} />)
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
