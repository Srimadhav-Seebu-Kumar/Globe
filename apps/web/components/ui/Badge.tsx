"use client";

import type { ReactNode } from "react";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "purple" | "subtle";
type BadgeSize = "sm" | "md";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border-default)]",
  success: "bg-[rgba(16,185,129,0.12)] text-[var(--accent-success)] border-[rgba(16,185,129,0.3)]",
  warning: "bg-[rgba(245,158,11,0.12)] text-[var(--accent-warning)] border-[rgba(245,158,11,0.3)]",
  danger: "bg-[rgba(239,68,68,0.12)] text-[var(--accent-danger)] border-[rgba(239,68,68,0.3)]",
  info: "bg-[rgba(59,130,246,0.12)] text-[var(--accent-primary)] border-[rgba(59,130,246,0.3)]",
  purple: "bg-[rgba(139,92,246,0.12)] text-[var(--accent-purple)] border-[rgba(139,92,246,0.3)]",
  subtle: "bg-transparent text-[var(--text-tertiary)] border-[var(--border-subtle)]"
};

const dotColors: Record<BadgeVariant, string> = {
  default: "bg-[var(--text-tertiary)]",
  success: "bg-[var(--accent-success)]",
  warning: "bg-[var(--accent-warning)]",
  danger: "bg-[var(--accent-danger)]",
  info: "bg-[var(--accent-primary)]",
  purple: "bg-[var(--accent-purple)]",
  subtle: "bg-[var(--text-tertiary)]"
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: "h-4 px-1.5 text-[10px] gap-1",
  md: "h-5 px-2 text-[11px] gap-1.5"
};

export function Badge({ children, variant = "default", size = "md", dot = false, className = "" }: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center justify-center rounded-full border font-medium tracking-wide whitespace-nowrap",
        variantStyles[variant],
        sizeStyles[size],
        className
      ].join(" ")}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors[variant]}`} aria-hidden="true" />
      )}
      {children}
    </span>
  );
}
