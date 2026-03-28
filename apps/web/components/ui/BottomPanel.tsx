"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface BottomPanelProps {
  sidebarWidth?: string;
  ticker?: ReactNode;
  legend?: ReactNode;
  filters?: ReactNode;
  className?: string;
}

const ChevronIcon = ({ up }: { up: boolean }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    style={{ transform: up ? "rotate(180deg)" : "none", transition: "transform 200ms" }}
    aria-hidden="true"
  >
    <polyline points="2,5 7,9 12,5" />
  </svg>
);

export function BottomPanel({ sidebarWidth = "var(--sidebar-width-collapsed)", ticker, legend, filters, className = "" }: BottomPanelProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      style={{
        left: sidebarWidth,
        zIndex: "var(--z-bottom-panel)",
        bottom: 0
      }}
      className={[
        "fixed right-0 flex flex-col",
        "bg-[var(--bg-surface)] border-t border-[var(--border-subtle)]",
        "transition-[left] duration-[300ms] ease-[var(--ease-in-out)]",
        className
      ].join(" ")}
    >
      {/* Expand panel content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            key="panel-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="overflow-hidden"
          >
            <div className="flex gap-4 p-3 border-b border-[var(--border-subtle)]">
              {legend && (
                <div className="flex-1">
                  <p className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-widest mb-2">Legend</p>
                  {legend}
                </div>
              )}
              {filters && (
                <div className="flex-1">
                  <p className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-widest mb-2">Quick Filters</p>
                  {filters}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ticker bar */}
      <div className="h-[var(--bottom-panel-height-collapsed)] flex items-center gap-3 px-4">
        {/* Expand toggle */}
        {(legend || filters) && (
          <button
            className={[
              "shrink-0 flex items-center gap-1.5 h-6 px-2.5 rounded-full",
              "border border-[var(--border-default)] text-[var(--text-tertiary)]",
              "hover:text-[var(--text-primary)] hover:border-[var(--border-strong)]",
              "transition-all duration-[var(--duration-fast)] text-[11px] font-medium"
            ].join(" ")}
            onClick={() => setExpanded(!expanded)}
            aria-expanded={expanded}
            aria-label={expanded ? "Collapse panel" : "Expand panel"}
          >
            <ChevronIcon up={expanded} />
            {expanded ? "Collapse" : "Legend & Filters"}
          </button>
        )}

        {/* Ticker */}
        <div className="flex-1 overflow-hidden relative">
          <div
            className="absolute inset-y-0 left-0 w-6 pointer-events-none"
            style={{ background: "linear-gradient(to right, var(--bg-surface), transparent)" }}
            aria-hidden="true"
          />
          {ticker}
          <div
            className="absolute inset-y-0 right-0 w-6 pointer-events-none"
            style={{ background: "linear-gradient(to left, var(--bg-surface), transparent)" }}
            aria-hidden="true"
          />
        </div>

        {/* Live indicator */}
        <span className="shrink-0 flex items-center gap-1.5 text-[11px] text-[var(--accent-success)] font-medium">
          <span
            className="w-1.5 h-1.5 rounded-full bg-[var(--accent-success)] animate-[pulse-glow_1.5s_ease-in-out_infinite]"
            aria-hidden="true"
          />
          Live
        </span>
      </div>
    </div>
  );
}
