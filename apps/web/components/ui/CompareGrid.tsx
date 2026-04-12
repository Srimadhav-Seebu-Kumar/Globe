"use client";

import type { PriceState, CoverageTier, ConfidenceLabel, FreshnessTier } from "@globe/types";
import { motion, AnimatePresence } from "framer-motion";
import { PriceChip } from "./PriceChip";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { FreshnessChip } from "./FreshnessChip";
import { CoverageBadge } from "./CoverageBadge";
import { EmptyState } from "./EmptyState";
import { Button } from "./Button";

interface CompareParcel {
  parcelId: string;
  parcelTitle: string;
  marketId: string;
  marketName: string;
  areaSqm: number;
  coverageTier?: CoverageTier;
  confidence?: ConfidenceLabel;
  freshness?: FreshnessTier;
  latestListingState: PriceState | null;
  latestListingAmount: number | null;
  latestListingCurrencyCode: string | null;
  averageObservedAmount: number | null;
  observationCount: number;
  latestObservedAt: string | null;
}

interface CompareGridProps {
  parcels: CompareParcel[];
  onRemove?: (parcelId: string) => void;
  onAdd?: () => void;
  onExport?: () => void;
  maxParcels?: number;
}

const RemoveIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
    <line x1="2" y1="2" x2="10" y2="10" /><line x1="10" y1="2" x2="2" y2="10" />
  </svg>
);

const AddIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
    <line x1="7" y1="2" x2="7" y2="12" /><line x1="2" y1="7" x2="12" y2="7" />
  </svg>
);

const ExportIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
    <path d="M7 2.5v6M4.5 5.5 7 2.5l2.5 3" /><path d="M2.5 9v2.5h9V9" />
  </svg>
);

function formatCurrency(amount: number, code: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: code,
    notation: amount >= 1_000_000 ? "compact" : "standard",
    maximumFractionDigits: amount >= 1_000_000 ? 1 : 0
  }).format(amount);
}

// Highlight the best value in each row
function isBest(values: Array<number | null>, idx: number, preferHigher = false): boolean {
  const nums = values.filter((v): v is number => v !== null);
  if (nums.length < 2) return false;
  const best = preferHigher ? Math.max(...nums) : Math.min(...nums);
  return values[idx] === best;
}

const rowDefinitions = [
  { key: "market", label: "Market" },
  { key: "area", label: "Area (sqm)", numeric: true, preferHigher: true },
  { key: "price", label: "Latest Price" },
  { key: "avg", label: "Avg. Observed", numeric: true, preferHigher: false },
  { key: "observations", label: "Observations", numeric: true, preferHigher: true },
  { key: "confidence", label: "Confidence" },
  { key: "freshness", label: "Freshness" },
  { key: "coverage", label: "Coverage Tier" },
  { key: "updated", label: "Last Updated" }
] as const;

export function CompareGrid({ parcels, onRemove, onAdd, onExport, maxParcels = 4 }: CompareGridProps) {
  if (parcels.length === 0) {
    return (
      <EmptyState
        title="No parcels to compare"
        description="Add 2–4 parcels from the map or parcel dossier to compare them side by side."
        action={onAdd ? { label: "Add a parcel", onClick: onAdd } : undefined}
      />
    );
  }

  const areaValues = parcels.map((p) => p.areaSqm);
  const priceValues = parcels.map((p) => p.latestListingAmount);
  const avgValues = parcels.map((p) => p.averageObservedAmount);
  const obsValues = parcels.map((p) => p.observationCount);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)] shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-[var(--text-primary)]">
            Comparing {parcels.length} parcel{parcels.length !== 1 ? "s" : ""}
          </span>
          {parcels.length < maxParcels && onAdd && (
            <Button variant="ghost" size="xs" icon={<AddIcon />} onClick={onAdd}>
              Add
            </Button>
          )}
        </div>
        {onExport && (
          <Button variant="outline" size="sm" icon={<ExportIcon />} onClick={onExport}>
            Export
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse" role="grid" aria-label="Parcel comparison">
          <thead className="sticky top-0 bg-[var(--bg-surface)] z-10">
            <tr>
              {/* Row label column */}
              <th className="sticky left-0 bg-[var(--bg-surface)] w-28 min-w-[112px] text-left p-3 text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-widest border-b border-r border-[var(--border-subtle)]">
                Attribute
              </th>
              {/* Parcel columns */}
              <AnimatePresence>
                {parcels.map((parcel, idx) => (
                  <motion.th
                    key={parcel.parcelId}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: idx * 0.05 }}
                    className="p-3 text-left border-b border-r border-[var(--border-subtle)] last:border-r-0 min-w-[160px]"
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-semibold text-[var(--text-primary)] truncate leading-tight">
                          {parcel.parcelTitle}
                        </p>
                        <p className="text-[11px] text-[var(--text-tertiary)] truncate mt-0.5">
                          {parcel.marketName}
                        </p>
                      </div>
                      {onRemove && (
                        <button
                          onClick={() => onRemove(parcel.parcelId)}
                          className="shrink-0 w-5 h-5 flex items-center justify-center rounded text-[var(--text-tertiary)] hover:text-[var(--accent-danger)] hover:bg-[rgba(239,68,68,0.08)] transition-colors"
                          aria-label={`Remove ${parcel.parcelTitle} from comparison`}
                        >
                          <RemoveIcon />
                        </button>
                      )}
                    </div>
                  </motion.th>
                ))}
              </AnimatePresence>
            </tr>
          </thead>
          <tbody>
            {rowDefinitions.map((row, rowIdx) => (
              <tr
                key={row.key}
                className={rowIdx % 2 === 0 ? "bg-transparent" : "bg-[var(--bg-surface)]"}
              >
                <td className="sticky left-0 bg-inherit p-3 text-[12px] font-medium text-[var(--text-secondary)] border-r border-[var(--border-subtle)] whitespace-nowrap">
                  {row.label}
                </td>
                {parcels.map((parcel, idx) => {
                  let content: React.ReactNode;
                  let highlight = false;

                  switch (row.key) {
                    case "market":
                      content = <span className="text-[12px] text-[var(--text-primary)]">{parcel.marketName}</span>;
                      break;
                    case "area":
                      highlight = isBest(areaValues, idx, true);
                      content = <span className="font-mono tabular-nums text-[12px]">{parcel.areaSqm.toLocaleString()}</span>;
                      break;
                    case "price":
                      content = parcel.latestListingState ? (
                        <PriceChip
                          state={parcel.latestListingState}
                          amount={parcel.latestListingAmount ?? undefined}
                          currencyCode={parcel.latestListingCurrencyCode ?? "USD"}
                          size="sm"
                        />
                      ) : <span className="text-[var(--text-tertiary)] text-[11px]">—</span>;
                      break;
                    case "avg":
                      highlight = parcel.averageObservedAmount !== null && isBest(avgValues, idx, false);
                      content = parcel.averageObservedAmount !== null ? (
                        <span className="font-mono tabular-nums text-[12px]">
                          {formatCurrency(parcel.averageObservedAmount, parcel.latestListingCurrencyCode ?? "USD")}
                        </span>
                      ) : <span className="text-[var(--text-tertiary)] text-[11px]">—</span>;
                      break;
                    case "observations":
                      highlight = isBest(obsValues, idx, true);
                      content = <span className="font-mono tabular-nums text-[12px]">{parcel.observationCount}</span>;
                      break;
                    case "confidence":
                      content = parcel.confidence ? <ConfidenceBadge confidence={parcel.confidence} showBar /> : <span className="text-[var(--text-tertiary)] text-[11px]">—</span>;
                      break;
                    case "freshness":
                      content = parcel.freshness ? <FreshnessChip freshness={parcel.freshness} size="sm" /> : <span className="text-[var(--text-tertiary)] text-[11px]">—</span>;
                      break;
                    case "coverage":
                      content = parcel.coverageTier ? <CoverageBadge tier={parcel.coverageTier} size="sm" /> : <span className="text-[var(--text-tertiary)] text-[11px]">—</span>;
                      break;
                    case "updated":
                      content = parcel.latestObservedAt ? (
                        <span className="text-[11px] text-[var(--text-tertiary)]">
                          {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(parcel.latestObservedAt))}
                        </span>
                      ) : <span className="text-[var(--text-tertiary)] text-[11px]">—</span>;
                      break;
                  }

                  return (
                    <td
                      key={parcel.parcelId}
                      className={[
                        "p-3 border-r border-[var(--border-subtle)] last:border-r-0",
                        highlight ? "bg-[rgba(16,185,129,0.06)] border-l-2 border-l-[var(--accent-success)]" : ""
                      ].join(" ")}
                    >
                      {content}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
