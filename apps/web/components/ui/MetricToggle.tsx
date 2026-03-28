"use client";

export type GlobeMetric = "ask" | "closed" | "activity" | "confidence";

interface MetricToggleProps {
  active: GlobeMetric;
  onChange: (metric: GlobeMetric) => void;
  className?: string;
}

const options: Array<{ id: GlobeMetric; label: string; color: string }> = [
  { id: "ask", label: "Ask Price", color: "var(--price-ask)" },
  { id: "closed", label: "Closed", color: "var(--price-closed)" },
  { id: "activity", label: "Activity", color: "var(--accent-warning)" },
  { id: "confidence", label: "Confidence", color: "var(--accent-purple)" }
];

export function MetricToggle({ active, onChange, className = "" }: MetricToggleProps) {
  return (
    <div
      role="group"
      aria-label="Select map metric"
      className={[
        "inline-flex items-center gap-1 p-1 rounded-full glass shadow-[var(--shadow-md)]",
        className
      ].join(" ")}
    >
      {options.map((opt) => {
        const isActive = active === opt.id;
        return (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            className={[
              "h-7 px-3 rounded-full text-[12px] font-medium",
              "transition-all duration-[var(--duration-moderate)]",
              "focus-visible:outline-2 focus-visible:outline-[var(--border-focus)]",
              isActive
                ? "text-white shadow-sm"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
            ].join(" ")}
            style={isActive ? { backgroundColor: opt.color } : {}}
            aria-pressed={isActive}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
