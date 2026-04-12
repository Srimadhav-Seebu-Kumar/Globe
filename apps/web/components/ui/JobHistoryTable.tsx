"use client";

import { useState } from "react";
import { motion } from "framer-motion";

export type JobStatus = "success" | "failed" | "running" | "queued" | "cancelled";

export interface JobRun {
  id: string;
  sourceId: string;
  sourceName: string;
  status: JobStatus;
  startedAt: string;
  completedAt: string | null;
  durationMs: number | null;
  rowsProcessed: number | null;
  rowsInserted: number | null;
  rowsUpdated: number | null;
  rowsRejected: number | null;
  errorMessage: string | null;
}

interface JobHistoryTableProps {
  jobs: JobRun[];
  loading?: boolean;
  sourceFilter?: string | null;
}

const statusConfig: Record<JobStatus, { label: string; color: string; bg: string; border: string }> = {
  success: { label: "Success", color: "#10B981", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.25)" },
  failed: { label: "Failed", color: "#EF4444", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.25)" },
  running: { label: "Running", color: "#3B82F6", bg: "rgba(59,130,246,0.1)", border: "rgba(59,130,246,0.25)" },
  queued: { label: "Queued", color: "#9CA3AF", bg: "rgba(156,163,175,0.1)", border: "rgba(156,163,175,0.25)" },
  cancelled: { label: "Cancelled", color: "#6B7280", bg: "rgba(107,114,128,0.1)", border: "rgba(107,114,128,0.25)" }
};

type SortKey = "startedAt" | "durationMs" | "rowsProcessed" | "status";
type SortDir = "asc" | "desc";

function formatDuration(ms: number | null): string {
  if (ms === null) return "—";
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60_000)}m ${Math.floor((ms % 60_000) / 1000)}s`;
}

function formatRows(n: number | null): string {
  if (n === null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
}

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit"
  }).format(new Date(iso));
}

function StatusBadge({ status }: { status: JobStatus }) {
  const cfg = statusConfig[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 h-5 px-2 text-[10px] font-semibold rounded-full border"
      style={{ color: cfg.color, backgroundColor: cfg.bg, borderColor: cfg.border }}
    >
      {status === "running" && (
        <span
          className="w-1.5 h-1.5 rounded-full animate-pulse"
          style={{ backgroundColor: cfg.color }}
          aria-hidden="true"
        />
      )}
      {cfg.label}
    </span>
  );
}

const ChevronIcon = ({ dir }: { dir: "up" | "down" | "none" }) => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" aria-hidden="true"
    style={{ opacity: dir === "none" ? 0.3 : 1 }}>
    {dir === "up"
      ? <path d="M5 2L9 7H1L5 2Z" />
      : <path d="M5 8L1 3H9L5 8Z" />}
  </svg>
);

function SortHeader({
  label,
  sortKey,
  current,
  direction,
  onSort
}: {
  label: string;
  sortKey: SortKey;
  current: SortKey;
  direction: SortDir;
  onSort: (k: SortKey) => void;
}) {
  const isActive = current === sortKey;
  return (
    <th
      className="px-3 py-2 text-left cursor-pointer select-none group"
      onClick={() => onSort(sortKey)}
      aria-sort={isActive ? (direction === "asc" ? "ascending" : "descending") : "none"}
    >
      <div className="flex items-center gap-1 text-[10px] font-semibold text-gray-500 dark:text-[var(--text-tertiary)] uppercase tracking-widest group-hover:text-gray-700 dark:group-hover:text-[var(--text-secondary)] transition-colors">
        {label}
        <ChevronIcon dir={isActive ? (direction === "asc" ? "up" : "down") : "none"} />
      </div>
    </th>
  );
}

function ExpandedRow({ job }: { job: JobRun }) {
  return (
    <tr>
      <td colSpan={8} className="px-4 py-3 bg-gray-50 dark:bg-[var(--bg-elevated)] border-b border-gray-100 dark:border-[var(--border-subtle)]">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <span className="text-[10px] text-gray-500 dark:text-[var(--text-tertiary)] uppercase tracking-wider block mb-1">Rows Processed</span>
            <span className="text-[12px] font-mono font-medium text-gray-800 dark:text-[var(--text-primary)]">{formatRows(job.rowsProcessed)}</span>
          </div>
          <div>
            <span className="text-[10px] text-gray-500 dark:text-[var(--text-tertiary)] uppercase tracking-wider block mb-1">Inserted</span>
            <span className="text-[12px] font-mono font-medium text-[#10B981]">{formatRows(job.rowsInserted)}</span>
          </div>
          <div>
            <span className="text-[10px] text-gray-500 dark:text-[var(--text-tertiary)] uppercase tracking-wider block mb-1">Updated</span>
            <span className="text-[12px] font-mono font-medium text-[#3B82F6]">{formatRows(job.rowsUpdated)}</span>
          </div>
          <div>
            <span className="text-[10px] text-gray-500 dark:text-[var(--text-tertiary)] uppercase tracking-wider block mb-1">Rejected</span>
            <span className="text-[12px] font-mono font-medium text-[#EF4444]">{formatRows(job.rowsRejected)}</span>
          </div>
        </div>
        {job.errorMessage && (
          <div className="mt-3 p-2 rounded bg-[rgba(239,68,68,0.06)] border border-[rgba(239,68,68,0.15)]">
            <p className="text-[11px] text-[#EF4444] font-mono whitespace-pre-wrap break-all">{job.errorMessage}</p>
          </div>
        )}
      </td>
    </tr>
  );
}

export function JobHistoryTable({ jobs, loading = false, sourceFilter }: JobHistoryTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("startedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = sourceFilter ? jobs.filter((j) => j.sourceId === sourceFilter) : jobs;

  const sorted = [...filtered].sort((a, b) => {
    let av: number, bv: number;
    if (sortKey === "startedAt") {
      av = new Date(a.startedAt).getTime();
      bv = new Date(b.startedAt).getTime();
    } else if (sortKey === "durationMs") {
      av = a.durationMs ?? -1;
      bv = b.durationMs ?? -1;
    } else if (sortKey === "rowsProcessed") {
      av = a.rowsProcessed ?? -1;
      bv = b.rowsProcessed ?? -1;
    } else {
      av = a.status.charCodeAt(0);
      bv = b.status.charCodeAt(0);
    }
    return sortDir === "asc" ? av - bv : bv - av;
  });

  function handleSort(key: SortKey) {
    if (key === sortKey) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-2 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-10 rounded skeleton" />
        ))}
      </div>
    );
  }

  if (sorted.length === 0) {
    return (
      <div className="py-12 text-center text-[13px] text-gray-500 dark:text-[var(--text-tertiary)]">
        No job history available
      </div>
    );
  }

  return (
    <div className="overflow-auto">
      <table className="w-full border-collapse text-sm" role="grid" aria-label="Ingestion job history">
        <thead className="sticky top-0 bg-white dark:bg-[var(--bg-surface)] z-10">
          <tr className="border-b border-gray-200 dark:border-[var(--border-subtle)]">
            <th className="px-3 py-2 text-left w-8" aria-label="Expand row" />
            <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 dark:text-[var(--text-tertiary)] uppercase tracking-widest">Source</th>
            <SortHeader label="Started" sortKey="startedAt" current={sortKey} direction={sortDir} onSort={handleSort} />
            <SortHeader label="Status" sortKey="status" current={sortKey} direction={sortDir} onSort={handleSort} />
            <SortHeader label="Duration" sortKey="durationMs" current={sortKey} direction={sortDir} onSort={handleSort} />
            <SortHeader label="Rows" sortKey="rowsProcessed" current={sortKey} direction={sortDir} onSort={handleSort} />
            <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 dark:text-[var(--text-tertiary)] uppercase tracking-widest">Inserted</th>
            <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 dark:text-[var(--text-tertiary)] uppercase tracking-widest">Rejected</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((job, idx) => {
            const isExpanded = job.id === expandedId;
            return (
              <>
                <motion.tr
                  key={job.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.03 }}
                  className={[
                    "border-b border-gray-100 dark:border-[var(--border-subtle)] transition-colors cursor-pointer",
                    isExpanded
                      ? "bg-gray-50 dark:bg-[var(--bg-elevated)]"
                      : "hover:bg-gray-50 dark:hover:bg-[var(--bg-elevated)]"
                  ].join(" ")}
                  onClick={() => setExpandedId(isExpanded ? null : job.id)}
                  aria-expanded={isExpanded}
                >
                  <td className="px-3 py-2.5">
                    <svg
                      width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor"
                      strokeWidth="1.5" strokeLinecap="round"
                      className="text-gray-400 dark:text-[var(--text-tertiary)] transition-transform duration-150"
                      style={{ transform: isExpanded ? "rotate(90deg)" : "none" }}
                      aria-hidden="true"
                    >
                      <polyline points="3,2 7,5 3,8" />
                    </svg>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="text-[12px] font-medium text-gray-800 dark:text-[var(--text-primary)]">{job.sourceName}</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="text-[12px] text-gray-600 dark:text-[var(--text-secondary)] tabular-nums whitespace-nowrap">
                      {formatDateTime(job.startedAt)}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <StatusBadge status={job.status} />
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="text-[12px] font-mono text-gray-600 dark:text-[var(--text-secondary)] tabular-nums">
                      {formatDuration(job.durationMs)}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="text-[12px] font-mono text-gray-700 dark:text-[var(--text-primary)] tabular-nums">
                      {formatRows(job.rowsProcessed)}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="text-[12px] font-mono text-[#10B981] tabular-nums">
                      {formatRows(job.rowsInserted)}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={["text-[12px] font-mono tabular-nums", (job.rowsRejected ?? 0) > 0 ? "text-[#EF4444]" : "text-gray-400 dark:text-[var(--text-tertiary)]"].join(" ")}>
                      {formatRows(job.rowsRejected)}
                    </span>
                  </td>
                </motion.tr>
                {isExpanded && <ExpandedRow key={`${job.id}-expanded`} job={job} />}
              </>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
