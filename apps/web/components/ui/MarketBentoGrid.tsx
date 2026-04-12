"use client";

import React, { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion";
import { Sparkline } from "./TrendChart";
import { GradientText } from "./bits/GradientText";
import { SpotlightCard } from "./bits/SpotlightCard";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BentoMarket {
  id: string;
  name: string;
  region: string;
  countryCode: string;
  askPricePerSqm: number | null;
  currencyCode: string;
  changePercent: number | null;
  activityScore: number;
  confidence: number;
  activeListings: number;
  sparkline: number[];
  priceChangeYoy?: number | null;
}

export interface BentoEvent {
  id: string;
  marketName: string;
  summary: string;
  type: "listing" | "transaction" | "planning" | "verification";
  occurredAt: string;
}

interface MarketBentoGridProps {
  markets: BentoMarket[];
  events?: BentoEvent[];
  onSelectMarket?: (id: string) => void;
  loading?: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatPrice(amount: number, currency: string): string {
  if (amount >= 1_000_000) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency, notation: "compact", maximumFractionDigits: 1 }).format(amount);
  }
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

function formatRelative(iso: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

const eventColor: Record<BentoEvent["type"], string> = {
  listing:      "var(--price-ask)",
  transaction:  "var(--price-closed)",
  planning:     "var(--accent-warning)",
  verification: "var(--accent-purple)"
};

const eventGlow: Record<BentoEvent["type"], string> = {
  listing:      "rgba(59,130,246,0.5)",
  transaction:  "rgba(34,197,94,0.5)",
  planning:     "rgba(245,158,11,0.5)",
  verification: "rgba(139,92,246,0.5)"
};

const eventLabel: Record<BentoEvent["type"], string> = {
  listing:      "LISTING",
  transaction:  "SOLD",
  planning:     "PLANNING",
  verification: "VERIFIED"
};

// ── Bento card base ───────────────────────────────────────────────────────────

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } }
};

const itemVariants: Variants = {
  hidden:  { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 280, damping: 26 } }
};

function BentoCard({
  children,
  className = "",
  onClick,
  glow,
  gridColumn
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  glow?: string;
  gridColumn?: string;
}) {
  return (
    <div style={gridColumn ? { gridColumn } : undefined}>
      <motion.div
        variants={itemVariants}
        {...(onClick ? { whileHover: { y: -3, boxShadow: glow ?? "0 8px 40px rgba(0,0,0,0.4)" } } : {})}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        onClick={onClick}
        className={[
          "glass-surface rounded-[var(--radius-xl)] overflow-hidden h-full",
          onClick ? "cursor-pointer" : "",
          className
        ].join(" ")}
      >
        {children}
      </motion.div>
    </div>
  );
}

// ── Sub-panels ────────────────────────────────────────────────────────────────

function TopMarketsLeaderboard({ markets, onSelect }: { markets: BentoMarket[]; onSelect?: ((id: string) => void) | undefined }) {
  // Memoize the sort so hover/spotlight repaints don't re-sort the full market list each time.
  const sorted = useMemo(
    () => [...markets].sort((a, b) => (b.askPricePerSqm ?? 0) - (a.askPricePerSqm ?? 0)).slice(0, 8),
    [markets]
  );

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
        <h3 className="text-[10px] font-bold uppercase tracking-[0.1em]">
          <GradientText colors={["#60a5fa", "#a78bfa", "#38bdf8"]} animationSpeed={8}>
            Top Markets by Ask Price
          </GradientText>
        </h3>
      </div>
      <div className="flex-1 overflow-y-auto divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
        {sorted.map((m, i) => (
          <SpotlightCard key={m.id} spotlightColor="rgba(99,102,241,0.12)">
            <motion.button
              whileHover={{ backgroundColor: "rgba(255,255,255,0.02)" }}
              onClick={() => onSelect?.(m.id)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
            >
              <span className="w-5 shrink-0 text-[11px] font-bold numeric" style={{ color: i < 3 ? "var(--accent-primary)" : "var(--text-tertiary)" }}>
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-[var(--text-primary)] truncate">{m.name}</p>
                <p className="text-[10px] text-[var(--text-tertiary)] truncate">{m.region}</p>
              </div>
              <div className="shrink-0 flex items-center gap-2">
                {m.sparkline.length > 0 && (
                  <Sparkline data={m.sparkline} width={40} height={18} color={m.changePercent !== null && m.changePercent >= 0 ? "var(--accent-success)" : "var(--accent-danger)"} />
                )}
                {m.priceChangeYoy != null && (
                  <span className="text-[10px] font-semibold numeric w-12 text-right shrink-0" style={{ color: m.priceChangeYoy >= 0 ? "var(--accent-success)" : "var(--accent-danger)" }}>
                    {m.priceChangeYoy >= 0 ? "▲" : "▼"}{Math.abs(m.priceChangeYoy).toFixed(1)}%
                  </span>
                )}
                <div className="text-right">
                  <p className="text-[11px] font-semibold text-[var(--text-primary)] numeric">
                    {m.askPricePerSqm !== null ? formatPrice(m.askPricePerSqm, m.currencyCode) : "—"}
                  </p>
                  {m.changePercent !== null && (
                    <p className="text-[10px] numeric" style={{ color: m.changePercent >= 0 ? "var(--accent-success)" : "var(--accent-danger)" }}>
                      {m.changePercent >= 0 ? "+" : ""}{m.changePercent.toFixed(1)}%
                    </p>
                  )}
                </div>
              </div>
            </motion.button>
          </SpotlightCard>
        ))}
      </div>
    </div>
  );
}

function LiveActivityFeed({ events }: { events: BentoEvent[] }) {
  const recent = events.slice(0, 12);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b flex items-center gap-2" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
        <h3 className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">Live Activity</h3>
        <motion.span
          className="w-1.5 h-1.5 rounded-full ml-auto"
          style={{ background: "var(--accent-success)", boxShadow: "0 0 6px rgba(34,197,94,0.6)" }}
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden="true"
        />
      </div>
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence initial={false}>
          {recent.map((e) => (
            <motion.div
              key={e.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="flex items-start gap-2.5 px-4 py-2.5 border-b"
              style={{ borderColor: "rgba(255,255,255,0.03)" }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full mt-[5px] shrink-0"
                style={{
                  background: eventColor[e.type],
                  boxShadow: `0 0 5px ${eventGlow[e.type]}`
                }}
                aria-hidden="true"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-bold" style={{ color: eventColor[e.type], letterSpacing: "0.08em" }}>
                    {eventLabel[e.type]}
                  </span>
                  <span className="text-[10px] font-semibold text-[var(--text-secondary)] truncate">{e.marketName}</span>
                </div>
                <p className="text-[11px] text-[var(--text-tertiary)] truncate">{e.summary}</p>
              </div>
              <span className="text-[9px] text-[var(--text-tertiary)] shrink-0 mt-px numeric">{formatRelative(e.occurredAt)}</span>
            </motion.div>
          ))}
        </AnimatePresence>
        {recent.length === 0 && (
          <div className="flex items-center justify-center h-32 text-[12px] text-[var(--text-tertiary)]">No recent activity</div>
        )}
      </div>
    </div>
  );
}

function ConfidenceDistribution({ markets }: { markets: BentoMarket[] }) {
  const avg = markets.length > 0 ? markets.reduce((s, m) => s + m.confidence, 0) / markets.length : 0;
  const buckets = [
    { label: "0–25%",   count: markets.filter(m => m.confidence < 25).length,              color: "var(--accent-danger)"  },
    { label: "25–50%",  count: markets.filter(m => m.confidence >= 25 && m.confidence < 50).length, color: "var(--accent-warning)" },
    { label: "50–75%",  count: markets.filter(m => m.confidence >= 50 && m.confidence < 75).length, color: "var(--accent-primary)" },
    { label: "75–100%", count: markets.filter(m => m.confidence >= 75).length,              color: "var(--accent-success)" },
  ];
  const max = Math.max(...buckets.map(b => b.count), 1);

  return (
    <div className="flex flex-col gap-3 p-4 h-full">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">Confidence Distribution</h3>
        <span className="text-[11px] font-semibold numeric" style={{ color: "var(--accent-primary)" }}>{avg.toFixed(0)}% avg</span>
      </div>
      <div className="flex flex-col gap-2 flex-1 justify-center">
        {buckets.map((b) => (
          <div key={b.label} className="flex items-center gap-2">
            <span className="text-[10px] text-[var(--text-tertiary)] w-14 shrink-0 numeric">{b.label}</span>
            <div className="flex-1 h-2 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }}>
              <motion.div
                className="h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(b.count / max) * 100}%` }}
                transition={{ type: "spring", stiffness: 80, damping: 20, delay: 0.2 }}
                style={{ background: b.color }}
              />
            </div>
            <span className="text-[10px] font-semibold text-[var(--text-secondary)] w-5 text-right shrink-0 numeric">{b.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActivityHeatmap({ markets }: { markets: BentoMarket[] }) {
  // Memoize the sort + max so hover animations don't rerun the O(n log n) work every frame.
  const top = useMemo(
    () => [...markets].sort((a, b) => b.activityScore - a.activityScore).slice(0, 15),
    [markets]
  );
  const maxScore = useMemo(() => Math.max(...top.map((m) => m.activityScore), 1), [top]);

  return (
    <div className="flex flex-col gap-3 p-4 h-full">
      <h3 className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">Activity Heatmap</h3>
      <div className="grid gap-1 flex-1" style={{ gridTemplateColumns: "repeat(5, 1fr)", gridTemplateRows: "repeat(3, 1fr)" }}>
        {top.slice(0, 15).map((m) => {
          const intensity = m.activityScore / maxScore;
          return (
            <motion.div
              key={m.id}
              whileHover={{ scale: 1.08, zIndex: 10 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="rounded-[var(--radius-sm)] flex items-end p-1.5 relative overflow-hidden cursor-pointer"
              style={{
                background: `rgba(245,158,11,${intensity * 0.6 + 0.05})`,
                boxShadow: intensity > 0.7 ? `0 0 12px rgba(245,158,11,${intensity * 0.4})` : "none"
              }}
              title={`${m.name}: ${m.activityScore} activity`}
            >
              <span className="text-[8px] font-semibold truncate w-full leading-tight" style={{ color: intensity > 0.5 ? "rgba(255,255,255,0.9)" : "var(--text-tertiary)" }}>
                {m.name.split(",")[0]}
              </span>
            </motion.div>
          );
        })}
      </div>
      <p className="text-[9px] text-[var(--text-tertiary)]">Top {top.length} markets by activity score</p>
    </div>
  );
}

function TrendSparklineRow({ markets, onSelect }: { markets: BentoMarket[]; onSelect?: ((id: string) => void) | undefined }) {
  const withSparklines = markets.filter(m => m.sparkline.length > 0).slice(0, 12);

  return (
    <div className="flex flex-col gap-3 p-4 h-full">
      <h3 className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">30-Day Price Trends</h3>
      <div className="flex gap-3 overflow-x-auto pb-1 flex-1 items-center">
        {withSparklines.map((m) => {
          const isUp = m.changePercent !== null && m.changePercent >= 0;
          const sparkColor = m.changePercent !== null
            ? isUp ? "var(--accent-success)" : "var(--accent-danger)"
            : "var(--accent-primary)";

          return (
            <motion.button
              key={m.id}
              whileHover={{ y: -2 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              onClick={() => onSelect?.(m.id)}
              className="shrink-0 flex flex-col gap-1 p-2 rounded-[var(--radius-md)] text-left"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.06)",
                minWidth: 80
              }}
            >
              <span className="text-[10px] font-semibold text-[var(--text-secondary)] truncate w-full">{m.name.split(",")[0]}</span>
              <Sparkline data={m.sparkline} width={64} height={24} color={sparkColor} />
              {m.changePercent !== null && (
                <span className="text-[9px] font-bold numeric" style={{ color: sparkColor }}>
                  {m.changePercent >= 0 ? "+" : ""}{m.changePercent.toFixed(1)}%
                </span>
              )}
            </motion.button>
          );
        })}
        {withSparklines.length === 0 && (
          <span className="text-[12px] text-[var(--text-tertiary)]">No trend data available</span>
        )}
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export function MarketBentoGrid({ markets, events = [], onSelectMarket, loading }: MarketBentoGridProps) {
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <span className="text-[13px] text-[var(--text-tertiary)]">Loading market data…</span>
      </div>
    );
  }

  if (markets.length === 0) {
    return (
      <div className="h-full flex items-center justify-center flex-col gap-3">
        <span className="text-[20px] text-[var(--text-tertiary)]">No markets available</span>
        <span className="text-[13px] text-[var(--text-tertiary)]">Connect the API to load live market data.</span>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="h-full overflow-auto p-4"
      style={{ background: "var(--bg-base)" }}
    >
      {/* 12-column bento grid */}
      <div
        className="grid gap-3"
        style={{
          gridTemplateColumns: "repeat(12, 1fr)",
          gridTemplateRows: "minmax(280px, auto) minmax(160px, auto) minmax(120px, auto)",
          minHeight: "100%"
        }}
      >
        {/* Top Markets Leaderboard — spans 8 cols */}
        <BentoCard className="flex flex-col" gridColumn="span 8">
          <TopMarketsLeaderboard markets={markets} onSelect={onSelectMarket} />
        </BentoCard>

        {/* Live Activity Feed — spans 4 cols */}
        <BentoCard className="flex flex-col" gridColumn="span 4">
          <LiveActivityFeed events={events} />
        </BentoCard>

        {/* Activity Heatmap — spans 5 cols */}
        <BentoCard gridColumn="span 5">
          <ActivityHeatmap markets={markets} />
        </BentoCard>

        {/* Confidence Distribution — spans 4 cols */}
        <BentoCard gridColumn="span 4">
          <ConfidenceDistribution markets={markets} />
        </BentoCard>

        {/* Summary stats — spans 3 cols */}
        <BentoCard className="flex flex-col gap-0 divide-y" gridColumn="span 3">
          {[
            { label: "Total Markets",   value: markets.length.toString()                                                       },
            { label: "Active Listings", value: markets.reduce((s, m) => s + m.activeListings, 0).toLocaleString()             },
            { label: "Avg Confidence",  value: `${(markets.reduce((s, m) => s + m.confidence, 0) / markets.length).toFixed(0)}%` }
          ].map(stat => (
            <div key={stat.label} className="flex items-center justify-between px-4 py-3" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
              <span className="text-[11px] text-[var(--text-tertiary)]">{stat.label}</span>
              <span className="text-[13px] font-bold numeric text-[var(--text-primary)]">{stat.value}</span>
            </div>
          ))}
        </BentoCard>

        {/* Trend Sparkline Row — full width */}
        <BentoCard gridColumn="span 12">
          <TrendSparklineRow markets={markets} onSelect={onSelectMarket} />
        </BentoCard>
      </div>
    </motion.div>
  );
}
