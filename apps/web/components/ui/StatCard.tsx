"use client";

import type { ReactNode } from "react";
import { Skeleton } from "./Skeleton";

interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  trend?: number;
  icon?: ReactNode;
  color?: string;
  loading?: boolean;
  className?: string;
  sparkline?: ReactNode;
}

function TrendIndicator({ value }: { value: number }) {
  const isPositive = value >= 0;
  const arrow = isPositive ? "↑" : "↓";
  const color = isPositive ? "var(--accent-success)" : "var(--accent-danger)";

  return (
    <span
      className="inline-flex items-center gap-0.5 text-[11px] font-medium"
      style={{ color }}
    >
      <span aria-hidden="true">{arrow}</span>
      {Math.abs(value).toFixed(1)}%
    </span>
  );
}

export function StatCard({ label, value, subValue, trend, icon, color, loading = false, className = "", sparkline }: StatCardProps) {
  return (
    <div
      className={[
        "flex flex-col gap-2 p-3 rounded-[var(--radius-lg)]",
        "bg-[var(--bg-surface)] border border-[var(--border-subtle)]",
        "transition-all duration-[var(--duration-normal)]",
        "hover:border-[var(--border-default)] hover:bg-[var(--bg-elevated)]",
        className
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-medium text-[var(--text-secondary)] tracking-wide uppercase">
          {label}
        </span>
        {icon && (
          <span
            className="w-6 h-6 flex items-center justify-center rounded-[var(--radius-sm)] text-[14px]"
            style={{ color: color ?? "var(--text-tertiary)", background: color ? `color-mix(in srgb, ${color} 12%, transparent)` : "var(--bg-elevated)" }}
            aria-hidden="true"
          >
            {icon}
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col gap-1.5">
          <Skeleton height={20} width="60%" />
          <Skeleton height={10} width="40%" />
        </div>
      ) : (
        <div className="flex flex-col gap-0.5">
          <span
            className="text-[var(--text-h3)] font-semibold text-[var(--text-primary)] font-[var(--font-mono)] tabular-nums leading-tight"
            style={{ fontSize: "clamp(14px, 2.5vw, 18px)", color: color }}
          >
            {value}
          </span>
          <div className="flex items-center gap-2">
            {subValue && (
              <span className="text-[11px] text-[var(--text-tertiary)]">{subValue}</span>
            )}
            {trend !== undefined && <TrendIndicator value={trend} />}
          </div>
        </div>
      )}

      {sparkline && <div className="mt-1">{sparkline}</div>}
    </div>
  );
}
