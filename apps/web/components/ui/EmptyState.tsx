"use client";

import type { ReactNode } from "react";
import { Button } from "./Button";

interface EmptyStateProps {
  icon?: ReactNode | undefined;
  title: string;
  description?: string | undefined;
  action?: { label: string; onClick: () => void } | undefined;
  className?: string | undefined;
}

const DefaultGlobeIcon = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
    <circle cx="24" cy="24" r="20" stroke="var(--border-default)" strokeWidth="1.5" />
    <ellipse cx="24" cy="24" rx="10" ry="20" stroke="var(--border-default)" strokeWidth="1.5" />
    <line x1="4" y1="24" x2="44" y2="24" stroke="var(--border-default)" strokeWidth="1.5" />
    <line x1="24" y1="4" x2="24" y2="44" stroke="var(--border-subtle)" strokeWidth="1" strokeDasharray="2 3" />
    <circle cx="24" cy="24" r="3" fill="var(--accent-primary)" opacity="0.6" />
  </svg>
);

export function EmptyState({ icon, title, description, action, className = "" }: EmptyStateProps) {
  return (
    <div
      className={[
        "flex flex-col items-center justify-center text-center gap-4 py-12 px-6",
        className
      ].join(" ")}
      role="status"
    >
      <div className="text-[var(--text-tertiary)]">
        {icon ?? <DefaultGlobeIcon />}
      </div>
      <div className="flex flex-col gap-1.5 max-w-[280px]">
        <h3 className="text-[var(--text-h4)] font-semibold text-[var(--text-primary)]">
          {title}
        </h3>
        {description && (
          <p className="text-[var(--text-body-sm)] text-[var(--text-secondary)] leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {action && (
        <Button variant="primary" size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
