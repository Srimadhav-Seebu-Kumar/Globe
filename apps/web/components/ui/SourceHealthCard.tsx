"use client";

import { motion } from "framer-motion";

export type SourceStatus = "active" | "stale" | "blocked" | "degraded";

export interface SourceHealthData {
  id: string;
  name: string;
  description?: string;
  lastSuccessAt: string | null;
  lastRunAt: string | null;
  rowDelta: number | null;
  totalRows: number | null;
  qualityScore: number | null; // 0–100
  status: SourceStatus;
  errorSummary?: string | null;
  freshnessSlaBreach?: boolean;
}

interface SourceHealthCardProps {
  source: SourceHealthData;
  onClick?: (source: SourceHealthData) => void;
}

const statusConfig: Record<SourceStatus, { label: string; dot: string; text: string; bg: string; border: string }> = {
  active: {
    label: "Active",
    dot: "#10B981",
    text: "text-[#10B981]",
    bg: "bg-[rgba(16,185,129,0.1)]",
    border: "border-[rgba(16,185,129,0.25)]"
  },
  degraded: {
    label: "Degraded",
    dot: "#F59E0B",
    text: "text-[#F59E0B]",
    bg: "bg-[rgba(245,158,11,0.1)]",
    border: "border-[rgba(245,158,11,0.25)]"
  },
  stale: {
    label: "Stale",
    dot: "#6B7280",
    text: "text-[#9CA3AF]",
    bg: "bg-[rgba(107,114,128,0.1)]",
    border: "border-[rgba(107,114,128,0.25)]"
  },
  blocked: {
    label: "Blocked",
    dot: "#EF4444",
    text: "text-[#EF4444]",
    bg: "bg-[rgba(239,68,68,0.1)]",
    border: "border-[rgba(239,68,68,0.25)]"
  }
};

function QualityScoreBar({ score }: { score: number }) {
  const color = score >= 80 ? "#10B981" : score >= 50 ? "#F59E0B" : "#EF4444";
  return (
    <div className="flex items-center gap-2">
      <div
        className="flex-1 h-1.5 rounded-full overflow-hidden bg-gray-200 dark:bg-[var(--border-subtle)]"
        role="meter"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Quality score: ${score}%`}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-[11px] font-semibold tabular-nums" style={{ color }}>{score}%</span>
    </div>
  );
}

function formatRelativeTime(iso: string | null): string {
  if (!iso) return "Never";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function formatRowDelta(delta: number | null): string {
  if (delta === null) return "—";
  const sign = delta > 0 ? "+" : "";
  if (Math.abs(delta) >= 1_000_000) return `${sign}${(delta / 1_000_000).toFixed(1)}M`;
  if (Math.abs(delta) >= 1_000) return `${sign}${(delta / 1_000).toFixed(1)}K`;
  return `${sign}${delta}`;
}

export function SourceHealthCard({ source, onClick }: SourceHealthCardProps) {
  const cfg = statusConfig[source.status];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      onClick={() => onClick?.(source)}
      className={[
        "group relative flex flex-col gap-3 p-4 rounded-lg border bg-white dark:bg-[var(--bg-surface)]",
        "transition-all duration-150 cursor-pointer",
        source.freshnessSlaBreach
          ? "border-[rgba(239,68,68,0.4)] shadow-[0_0_0_1px_rgba(239,68,68,0.2)]"
          : "border-gray-200 dark:border-[var(--border-subtle)] hover:border-gray-300 dark:hover:border-[var(--border-default)]",
        onClick ? "hover:shadow-md" : ""
      ].join(" ")}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === "Enter" && onClick(source) : undefined}
      aria-label={`${source.name} — ${cfg.label}`}
    >
      {/* SLA breach banner */}
      {source.freshnessSlaBreach && (
        <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-lg bg-[#EF4444]" />
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-gray-900 dark:text-[var(--text-primary)] truncate">{source.name}</p>
          {source.description && (
            <p className="text-[11px] text-gray-500 dark:text-[var(--text-tertiary)] truncate mt-0.5">{source.description}</p>
          )}
        </div>

        {/* Status badge */}
        <span className={`inline-flex items-center gap-1.5 h-5 px-2 text-[10px] font-semibold rounded-full border shrink-0 ${cfg.bg} ${cfg.border} ${cfg.text}`}>
          <span
            className={["w-1.5 h-1.5 rounded-full", source.status === "active" ? "animate-pulse" : ""].join(" ")}
            style={{ backgroundColor: cfg.dot }}
            aria-hidden="true"
          />
          {cfg.label}
        </span>
      </div>

      {/* Quality score */}
      {source.qualityScore !== null && (
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-medium text-gray-500 dark:text-[var(--text-tertiary)] uppercase tracking-wider">Quality Score</span>
          <QualityScoreBar score={source.qualityScore} />
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 pt-1 border-t border-gray-100 dark:border-[var(--border-subtle)]">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-gray-500 dark:text-[var(--text-tertiary)]">Last Run</span>
          <span className="text-[11px] font-medium text-gray-800 dark:text-[var(--text-secondary)] tabular-nums">
            {formatRelativeTime(source.lastRunAt)}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-gray-500 dark:text-[var(--text-tertiary)]">Last Success</span>
          <span className="text-[11px] font-medium text-gray-800 dark:text-[var(--text-secondary)] tabular-nums">
            {formatRelativeTime(source.lastSuccessAt)}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-gray-500 dark:text-[var(--text-tertiary)]">Row Delta</span>
          <span className={[
            "text-[11px] font-semibold tabular-nums font-mono",
            source.rowDelta !== null && source.rowDelta > 0
              ? "text-[#10B981]"
              : source.rowDelta !== null && source.rowDelta < 0
                ? "text-[#EF4444]"
                : "text-gray-500 dark:text-[var(--text-tertiary)]"
          ].join(" ")}>
            {formatRowDelta(source.rowDelta)}
          </span>
        </div>
      </div>

      {/* Error summary */}
      {source.errorSummary && (
        <div className="flex items-start gap-1.5 p-2 rounded bg-[rgba(239,68,68,0.06)] border border-[rgba(239,68,68,0.15)]">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" className="shrink-0 mt-0.5" aria-hidden="true">
            <circle cx="6" cy="6" r="4.5" />
            <line x1="6" y1="3.5" x2="6" y2="6.5" />
            <circle cx="6" cy="8.5" r="0.5" fill="#EF4444" stroke="none" />
          </svg>
          <p className="text-[11px] text-[#EF4444] line-clamp-2">{source.errorSummary}</p>
        </div>
      )}
    </motion.div>
  );
}
