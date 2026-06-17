"use client";

import { forwardRef, useImperativeHandle, useState } from "react";
import type { GlobeMetric } from "./MetricToggle";

export interface FloatingLegendHandle {
  setRange: (min: number, max: number) => void;
}

interface FloatingLegendProps {
  metric: GlobeMetric;
  minValue?: number;
  maxValue?: number;
  minLabel?: string;
  maxLabel?: string;
  className?: string;
}

const metricConfig: Record<GlobeMetric, {
  label: string;
  gradient: string;
  lowLabel: string;
  highLabel: string;
}> = {
  ask: {
    label: "Asking Price / sqm",
    gradient: "linear-gradient(90deg, rgba(59,130,246,0.3) 0%, rgba(59,130,246,1) 100%)",
    lowLabel: "Low",
    highLabel: "High"
  },
  closed: {
    label: "Closed Sale / sqm",
    gradient: "linear-gradient(90deg, rgba(16,185,129,0.3) 0%, rgba(16,185,129,1) 100%)",
    lowLabel: "Low",
    highLabel: "High"
  },
  activity: {
    label: "Market Activity Score",
    gradient: "linear-gradient(90deg, rgba(245,158,11,0.2) 0%, rgba(245,158,11,0.6) 50%, rgba(239,68,68,1) 100%)",
    lowLabel: "Quiet",
    highLabel: "Active"
  },
  confidence: {
    label: "Data Confidence",
    gradient: "linear-gradient(90deg, rgba(239,68,68,0.6) 0%, rgba(245,158,11,0.8) 50%, rgba(16,185,129,1) 100%)",
    lowLabel: "Low",
    highLabel: "Verified"
  }
};

function formatValue(value: number, metric: GlobeMetric): string {
  if (metric === "activity") {
    if (value >= 100) return `${Math.round(value)} obs`;
    return `${Math.round(value)}`;
  }
  if (metric === "confidence") {
    return value >= 0.75 ? "High" : value >= 0.45 ? "Mid" : "Low";
  }
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K/sqft`;
  return `$${Math.round(value)}/sqft`;
}

export const FloatingLegend = forwardRef<FloatingLegendHandle, FloatingLegendProps>(function FloatingLegend(
  { metric, minValue: minValueProp, maxValue: maxValueProp, className = "" },
  ref
) {
  const [localRange, setLocalRange] = useState<{ min?: number; max?: number }>({});

  useImperativeHandle(
    ref,
    () => ({
      setRange: (min: number, max: number) => {
        setLocalRange((previous) =>
          previous.min === min && previous.max === max ? previous : { min, max }
        );
      }
    }),
    []
  );

  const config = metricConfig[metric];
  const showNumericRange = metric === "ask" || metric === "closed";
  const minValue = minValueProp ?? localRange.min;
  const maxValue = maxValueProp ?? localRange.max;

  return (
    <div
      className={[
        "flex flex-col gap-2 p-3 rounded-[var(--radius-lg)] glass shadow-[var(--shadow-md)]",
        "min-w-[160px]",
        className
      ].join(" ")}
      aria-label={`Legend: ${config.label}`}
    >
      <span className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-widest">
        {config.label}
      </span>
      <div
        className="h-2.5 rounded-full"
        style={{ background: config.gradient }}
        aria-hidden="true"
      />
      <div className="flex justify-between items-center">
        <span className="text-[10px] text-[var(--text-tertiary)]">
          {minValue !== undefined && showNumericRange ? formatValue(minValue, metric) : config.lowLabel}
        </span>
        <span className="text-[10px] text-[var(--text-tertiary)]">
          {maxValue !== undefined && showNumericRange ? formatValue(maxValue, metric) : config.highLabel}
        </span>
      </div>
    </div>
  );
});
