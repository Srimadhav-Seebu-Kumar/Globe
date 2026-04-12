"use client";

import { useEffect, useRef, useState } from "react";
import type { PriceState } from "@globe/types";
import { motion } from "framer-motion";

interface TimelineEvent {
  id: string;
  date: string;
  state: PriceState;
  amount: number;
  currencyCode: string;
  sourceName: string;
  description?: string | undefined;
}

interface PriceTimelineProps {
  events: TimelineEvent[];
  className?: string;
}

const stateColors: Record<PriceState, string> = {
  ask: "var(--price-ask)",
  closed: "var(--price-closed)",
  estimate: "var(--price-estimate)",
  broker_verified: "var(--price-broker-verified)"
};

const stateLabels: Record<PriceState, string> = {
  ask: "Ask",
  closed: "Closed",
  estimate: "Estimate",
  broker_verified: "Broker Verified"
};

function formatCurrency(amount: number, code: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: code,
    notation: amount >= 1_000_000 ? "compact" : "standard",
    maximumFractionDigits: amount >= 1_000_000 ? 1 : 0
  }).format(amount);
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(iso));
}

export function PriceTimeline({ events, className = "" }: PriceTimelineProps) {
  const sorted = [...events].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (sorted.length === 0) {
    return (
      <div className="text-center py-8 text-[var(--text-tertiary)] text-[13px]">
        No price history available
      </div>
    );
  }

  return (
    <div className={`relative flex flex-col gap-0 ${className}`} aria-label="Price history timeline">
      {/* Vertical line */}
      <div
        className="absolute left-[11px] top-4 bottom-4 w-px bg-[var(--border-subtle)]"
        aria-hidden="true"
      />

      {sorted.map((event, idx) => (
        <motion.div
          key={event.id}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.06, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative flex gap-3 pb-4 last:pb-0"
        >
          {/* Node */}
          <div className="relative z-10 mt-1.5 shrink-0">
            <span
              className="block w-[10px] h-[10px] rounded-full border-2 border-[var(--bg-surface)]"
              style={{ backgroundColor: stateColors[event.state] }}
              aria-hidden="true"
            />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 pt-0.5">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <span
                  className="text-[11px] font-semibold uppercase tracking-wider"
                  style={{ color: stateColors[event.state] }}
                >
                  {stateLabels[event.state]}
                </span>
                <p className="text-[16px] font-semibold text-[var(--text-primary)] font-mono tabular-nums leading-tight mt-0.5">
                  {formatCurrency(event.amount, event.currencyCode)}
                </p>
              </div>
              <time
                dateTime={event.date}
                className="text-[11px] text-[var(--text-tertiary)] shrink-0"
              >
                {formatDate(event.date)}
              </time>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span
                className="text-[11px] px-1.5 py-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-tertiary)]"
              >
                {event.sourceName}
              </span>
              {event.description && (
                <span className="text-[11px] text-[var(--text-tertiary)]">{event.description}</span>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
