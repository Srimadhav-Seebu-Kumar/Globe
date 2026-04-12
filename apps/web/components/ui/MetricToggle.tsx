"use client";

import { motion, AnimatePresence } from "framer-motion";

export type GlobeMetric = "ask" | "closed" | "activity" | "confidence";

interface MetricToggleProps {
  active: GlobeMetric;
  onChange: (metric: GlobeMetric) => void;
  className?: string;
}

const options: Array<{ id: GlobeMetric; label: string; color: string; glow: string }> = [
  { id: "ask",        label: "Ask Price",   color: "var(--price-ask)",      glow: "rgba(59,130,246,0.4)"  },
  { id: "closed",     label: "Closed",      color: "var(--price-closed)",   glow: "rgba(34,197,94,0.4)"   },
  { id: "activity",   label: "Activity",    color: "var(--accent-warning)", glow: "rgba(245,158,11,0.4)"  },
  { id: "confidence", label: "Confidence",  color: "var(--accent-purple)",  glow: "rgba(139,92,246,0.4)"  }
];

export function MetricToggle({ active, onChange, className = "" }: MetricToggleProps) {
  const activeOpt = options.find(o => o.id === active);

  return (
    <motion.div
      role="group"
      aria-label="Select map metric"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 28, delay: 0.1 }}
      className={[
        "inline-flex items-center gap-0.5 p-1 rounded-full glass-heavy",
        className
      ].join(" ")}
      style={{
        boxShadow: activeOpt
          ? `0 0 24px ${activeOpt.glow}, inset 0 1px 0 rgba(255,255,255,0.08)`
          : "inset 0 1px 0 rgba(255,255,255,0.08)"
      }}
    >
      {options.map((opt) => {
        const isActive = active === opt.id;
        return (
          <motion.button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            whileHover={!isActive ? { scale: 1.02 } : {}}
            whileTap={{ scale: 0.96 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className={[
              "relative h-7 px-3 rounded-full text-[12px] font-medium z-10",
              "transition-colors duration-[var(--duration-fast)]",
              "focus-visible:outline-2 focus-visible:outline-[var(--border-focus)]",
              isActive
                ? ""
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            ].join(" ")}
            aria-pressed={isActive}
          >
            {/* Sliding background pill */}
            {isActive && (
              <motion.span
                layoutId="metric-active"
                className="absolute inset-0 rounded-full"
                style={{ background: "linear-gradient(135deg, #c9a96e, #e8c98a)" }}
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
                aria-hidden="true"
              />
            )}
            <span className="relative z-10" style={isActive ? { color: "#09090c" } : {}}>{opt.label}</span>
          </motion.button>
        );
      })}
    </motion.div>
  );
}
