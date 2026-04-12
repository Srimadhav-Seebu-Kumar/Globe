"use client";

import { useEffect, useRef, useState } from "react";

/** Default ease-out cubic. Pulled out so the effect can reference a stable identity. */
const DEFAULT_EASING = (t: number): number => 1 - Math.pow(1 - t, 3);

interface CountUpProps {
  to: number;
  from?: number;
  duration?: number;
  decimals?: number;
  className?: string;
  formatter?: (value: number) => string;
  /** Optional easing function — receives progress in [0,1], returns eased value. */
  easing?: (t: number) => number;
}

function formatValue(
  value: number,
  decimals: number,
  formatter: ((value: number) => string) | undefined
): string {
  if (formatter) return formatter(value);
  return value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

export function CountUp({
  to,
  from = 0,
  duration = 1.2,
  decimals = 0,
  className,
  formatter,
  easing = DEFAULT_EASING
}: CountUpProps) {
  // Seed with the formatted `from` value so we never flash a raw "0" on first paint
  // when from !== 0 (L15).
  const [display, setDisplay] = useState<string>(() => formatValue(from, decimals, formatter));
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    startTimeRef.current = null;

    const step = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }
      const elapsed = (timestamp - startTimeRef.current) / (duration * 1000);
      const progress = Math.min(elapsed, 1);
      const eased = easing(progress);
      const next = from + (to - from) * eased;
      setDisplay(formatValue(next, decimals, formatter));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        setDisplay(formatValue(to, decimals, formatter));
      }
    };

    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
    // M4: decimals is captured via formatValue; easing (L9) also captured.
  }, [to, from, duration, decimals, formatter, easing]);

  return <span className={className}>{display}</span>;
}
