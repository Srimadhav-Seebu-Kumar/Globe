"use client";

import type { ReactNode } from "react";
import type { CoverageTier, ConfidenceLabel, FreshnessTier, PriceState } from "@globe/types";
import { motion } from "framer-motion";
import { PriceChipRow } from "./PriceChip";
import { FreshnessChip } from "./FreshnessChip";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { CoverageBadge } from "./CoverageBadge";
import { PriceTimeline } from "./PriceTimeline";
import { TrendChart } from "./TrendChart";
import { Button } from "./Button";
import { Skeleton, SkeletonText } from "./Skeleton";

interface DossierParcel {
  id: string;
  title: string;
  canonicalParcelId: string;
  marketName: string;
  areaSqm: number;
  zoningCode: string;
  coverageTier: CoverageTier;
  confidence: ConfidenceLabel;
  freshness: FreshnessTier;
  legalDisplayAllowed: boolean;
  updatedAt: string;
}

interface DossierListing {
  id: string;
  state: PriceState;
  amount: number;
  currencyCode: string;
  observedAt: string;
  sourceName: string;
  brokerName: string | null;
}

interface DossierTrendPoint {
  date: string;
  ask?: number;
  closed?: number;
  estimate?: number;
}

interface ParcelDossierProps {
  parcel?: DossierParcel;
  listings?: DossierListing[];
  trendData?: DossierTrendPoint[];
  loading?: boolean;
  isWatchlisted?: boolean;
  isComparing?: boolean;
  onWatchlist?: () => void;
  onCompare?: () => void;
  onExport?: () => void;
  onAlert?: () => void;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="border-b border-[var(--border-subtle)] last:border-0">
      <div className="px-4 py-3">
        <h3 className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-widest mb-3">
          {title}
        </h3>
        {children}
      </div>
    </div>
  );
}

function DataRow({ label, value, mono = false }: { label: string; value: ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2 py-1">
      <span className="text-[12px] text-[var(--text-secondary)] shrink-0">{label}</span>
      <span className={`text-[12px] font-medium text-[var(--text-primary)] text-right ${mono ? "font-mono tabular-nums" : ""}`}>
        {value}
      </span>
    </div>
  );
}

const BookmarkIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
    <path d="M2.5 2.5h9v11L7 10 2.5 13.5V2.5z" />
  </svg>
);

const CompareIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
    <rect x="1.5" y="3" width="4" height="8" rx="0.5" />
    <rect x="8.5" y="3" width="4" height="8" rx="0.5" />
    <line x1="6.5" y1="7" x2="7.5" y2="7" />
  </svg>
);

const BellIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
    <path d="M7 1.5C7 1.5 3.5 3.5 3.5 7.5H10.5C10.5 3.5 7 1.5 7 1.5Z" />
    <line x1="3.5" y1="7.5" x2="10.5" y2="7.5" />
    <path d="M5.5 10.5C5.5 11.6 6.17 12.5 7 12.5C7.83 12.5 8.5 11.6 8.5 10.5" />
  </svg>
);

const ExportIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
    <path d="M7 2.5v6M4.5 5.5 7 2.5l2.5 3" />
    <path d="M2.5 9v2.5h9V9" />
  </svg>
);

export function ParcelDossier({ parcel, listings = [], trendData = [], loading = false, isWatchlisted, isComparing, onWatchlist, onCompare, onExport, onAlert }: ParcelDossierProps) {
  if (loading) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <SkeletonText lines={2} />
        <div className="flex gap-2">
          <Skeleton height={20} width={80} />
          <Skeleton height={20} width={60} />
          <Skeleton height={20} width={70} />
        </div>
        <Skeleton height={100} />
        <SkeletonText lines={4} />
      </div>
    );
  }

  if (!parcel) return null;

  const prices = listings.map((l) => ({
    state: l.state,
    amount: l.amount,
    currencyCode: l.currencyCode
  }));

  const timelineEvents = listings.map((l) => ({
    id: l.id,
    date: l.observedAt,
    state: l.state,
    amount: l.amount,
    currencyCode: l.currencyCode,
    sourceName: l.sourceName,
    description: l.brokerName ?? undefined
  }));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col"
    >
      {/* Header */}
      <Section title="Parcel Overview">
        <div className="flex flex-wrap gap-1.5 mb-3">
          <CoverageBadge tier={parcel.coverageTier} />
          <FreshnessChip freshness={parcel.freshness} updatedAt={parcel.updatedAt} />
          <ConfidenceBadge confidence={parcel.confidence} showBar />
          {!parcel.legalDisplayAllowed && (
            <span className="inline-flex items-center h-5 px-2 text-[10px] font-medium rounded-full bg-[rgba(239,68,68,0.12)] text-[var(--accent-danger)] border border-[rgba(239,68,68,0.3)]">
              Restricted
            </span>
          )}
        </div>

        <div className="flex flex-col gap-0.5 divide-y divide-[var(--border-subtle)]">
          {parcel.legalDisplayAllowed && (
            <DataRow label="Parcel ID" value={parcel.canonicalParcelId} mono />
          )}
          <DataRow label="Market" value={parcel.marketName} />
          <DataRow label="Area" value={`${parcel.areaSqm.toLocaleString()} sqm`} mono />
          {parcel.legalDisplayAllowed && <DataRow label="Zoning" value={parcel.zoningCode} mono />}
        </div>
      </Section>

      {/* Price chips */}
      {prices.length > 0 && (
        <Section title="Current Pricing">
          <PriceChipRow prices={prices} />
        </Section>
      )}

      {/* Trend chart */}
      {trendData.length > 0 && (
        <Section title="Price Trend">
          <TrendChart data={trendData} metric="ask" height={100} currencyCode={listings[0]?.currencyCode} />
        </Section>
      )}

      {/* Price timeline */}
      {timelineEvents.length > 0 && (
        <Section title="Price History">
          <PriceTimeline events={timelineEvents} />
        </Section>
      )}

      {/* Action bar (sticky) */}
      <div className="sticky bottom-0 flex items-center gap-2 p-3 bg-[var(--bg-surface)] border-t border-[var(--border-subtle)]">
        <Button
          variant={isWatchlisted ? "primary" : "secondary"}
          size="sm"
          icon={<BookmarkIcon />}
          onClick={onWatchlist}
          className="flex-1"
          aria-pressed={isWatchlisted}
        >
          {isWatchlisted ? "Watching" : "Watch"}
        </Button>
        <Button
          variant={isComparing ? "primary" : "secondary"}
          size="sm"
          icon={<CompareIcon />}
          onClick={onCompare}
          className="flex-1"
          aria-pressed={isComparing}
        >
          Compare
        </Button>
        <Button variant="ghost" size="sm" icon={<BellIcon />} onClick={onAlert} aria-label="Set alert" />
        <Button variant="ghost" size="sm" icon={<ExportIcon />} onClick={onExport} aria-label="Export memo" />
      </div>
    </motion.div>
  );
}
