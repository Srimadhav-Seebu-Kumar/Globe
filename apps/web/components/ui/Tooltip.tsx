"use client";

import { useState, useRef } from "react";
import type { ReactNode } from "react";

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  delayMs?: number;
  className?: string;
}

const sideClasses = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  left: "right-full top-1/2 -translate-y-1/2 mr-2",
  right: "left-full top-1/2 -translate-y-1/2 ml-2"
};

export function Tooltip({ content, children, side = "top", delayMs = 400, className = "" }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = () => {
    timerRef.current = setTimeout(() => setVisible(true), delayMs);
  };

  const hide = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(false);
  };

  return (
    <span
      className="relative inline-flex items-center"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {visible && (
        <span
          role="tooltip"
          className={[
            "absolute z-[var(--z-tooltip)] px-2.5 py-1.5 rounded-[var(--radius-md)]",
            "bg-[var(--bg-elevated)] border border-[var(--border-default)] shadow-[var(--shadow-md)]",
            "text-[12px] text-[var(--text-primary)] whitespace-nowrap pointer-events-none",
            "animate-fade-in",
            sideClasses[side],
            className
          ].join(" ")}
        >
          {content}
        </span>
      )}
    </span>
  );
}
