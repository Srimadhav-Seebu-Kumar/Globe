"use client";

import type { PriceState } from "@globe/types";

interface PriceChipProps {
  state: PriceState;
  amount?: number | undefined;
  currencyCode?: string | undefined;
  size?: "sm" | "md" | undefined;
  showLabel?: boolean | undefined;
  className?: string | undefined;
}

const stateConfig: Record<PriceState, { label: string; cssClass: string; shortLabel: string }> = {
  ask: {
    label: "Asking Price",
    shortLabel: "Ask",
    cssClass: "chip-ask"
  },
  closed: {
    label: "Closed Sale",
    shortLabel: "Closed",
    cssClass: "chip-closed"
  },
  estimate: {
    label: "Model Estimate",
    shortLabel: "Est.",
    cssClass: "chip-estimate"
  },
  broker_verified: {
    label: "Broker Verified",
    shortLabel: "Verified",
    cssClass: "chip-broker_verified"
  }
};

const formatPrice = (amount: number, currencyCode: string): string => {
  if (amount >= 1_000_000) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
      notation: "compact",
      maximumFractionDigits: 1
    }).format(amount);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 0
  }).format(amount);
};

const sizeClasses = {
  sm: "h-5 px-2 text-[10px] gap-1 rounded-full",
  md: "h-6 px-2.5 text-[11px] gap-1.5 rounded-full"
};

export function PriceChip({ state, amount, currencyCode = "USD", size = "md", showLabel = false, className = "" }: PriceChipProps) {
  const config = stateConfig[state];

  return (
    <span
      className={[
        "inline-flex items-center font-medium border",
        config.cssClass,
        sizeClasses[size],
        "font-[var(--font-mono)]",
        className
      ].join(" ")}
      title={config.label}
    >
      <span>{showLabel ? config.label : config.shortLabel}</span>
      {amount !== undefined && (
        <span className="tabular-nums">{formatPrice(amount, currencyCode)}</span>
      )}
    </span>
  );
}

interface PriceChipRowProps {
  prices: Array<{ state: PriceState; amount: number; currencyCode: string }>;
  size?: "sm" | "md";
}

export function PriceChipRow({ prices, size = "md" }: PriceChipRowProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {prices.map(({ state, amount, currencyCode }) => (
        <PriceChip
          key={state}
          state={state}
          amount={amount}
          currencyCode={currencyCode}
          size={size}
        />
      ))}
    </div>
  );
}
