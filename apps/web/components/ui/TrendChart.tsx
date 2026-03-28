"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer
} from "recharts";
import type { PriceState } from "@globe/types";
import { Skeleton } from "./Skeleton";

interface TrendDataPoint {
  date: string;
  ask?: number;
  closed?: number;
  estimate?: number;
}

interface TrendChartProps {
  data: TrendDataPoint[];
  metric: PriceState | "activity";
  height?: number | undefined;
  loading?: boolean | undefined;
  currencyCode?: string | undefined;
  className?: string | undefined;
}

const metricColor: Record<string, string> = {
  ask: "#3B82F6",
  closed: "#10B981",
  estimate: "#F59E0B",
  broker_verified: "#8B5CF6",
  activity: "#F59E0B"
};

const metricKey: Record<string, string> = {
  ask: "ask",
  closed: "closed",
  estimate: "estimate",
  broker_verified: "closed",
  activity: "ask"
};

function formatCurrency(value: number, currency = "USD"): string {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(0)}K`;
  }
  return `$${value}`;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; name: string }>;
  label?: string;
  currencyCode?: string;
}

function CustomTooltip({ active, payload, label, currencyCode }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-[var(--radius-md)] px-3 py-2 shadow-[var(--shadow-md)]">
      <p className="text-[11px] text-[var(--text-tertiary)] mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="text-[12px] font-medium text-[var(--text-primary)] font-mono">
          {formatCurrency(p.value, currencyCode)}
        </p>
      ))}
    </div>
  );
}

export function TrendChart({ data, metric, height = 120, loading = false, currencyCode = "USD", className = "" }: TrendChartProps) {
  if (loading) {
    return <Skeleton height={height} className={className} />;
  }

  const color = metricColor[metric] ?? "#3B82F6";
  const key = metricKey[metric] ?? "ask";

  return (
    <div className={className} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`grad-${metric}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.25} />
              <stop offset="95%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="2 4"
            stroke="var(--border-subtle)"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}
            axisLine={false}
            tickLine={false}
            tickMargin={6}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 10, fill: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => formatCurrency(v, currencyCode)}
            width={52}
          />
          <RechartsTooltip
            content={<CustomTooltip currencyCode={currencyCode} />}
            cursor={{ stroke: "var(--border-default)", strokeWidth: 1, strokeDasharray: "3 3" }}
          />
          <Area
            type="monotone"
            dataKey={key}
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#grad-${metric})`}
            dot={false}
            activeDot={{ r: 3, fill: color, stroke: "var(--bg-surface)", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// Sparkline — inline tiny chart, no axes
interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
  width?: number;
}

export function Sparkline({ data, color = "#3B82F6", height = 32, width = 80 }: SparklineProps) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = width / (data.length - 1);

  const points = data.map((v, i) => {
    const x = i * step;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(" L ")}`;
  const areaD = `M ${points[0]} L ${points.join(" L ")} L ${width},${height} L 0,${height} Z`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" overflow="visible">
      <defs>
        <linearGradient id={`spark-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor={color} stopOpacity={0.2} />
          <stop offset="1" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#spark-${color.replace("#", "")})`} />
      <path d={pathD} stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
