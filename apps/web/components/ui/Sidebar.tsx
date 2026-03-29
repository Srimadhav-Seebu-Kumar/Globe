"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { Tooltip } from "./Tooltip";

interface NavItem {
  id: string;
  label: string;
  icon: ReactNode;
  badge?: number;
  href?: string;
  onClick?: () => void;
}

interface SidebarProps {
  items: NavItem[];
  activeId?: string;
  onNavigate?: (id: string) => void;
  bottomItems?: NavItem[];
  className?: string;
}

const GlobeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
    <circle cx="9" cy="9" r="7.5" />
    <ellipse cx="9" cy="9" rx="3.5" ry="7.5" />
    <line x1="1.5" y1="9" x2="16.5" y2="9" />
  </svg>
);

export function Sidebar({ items, activeId, onNavigate, bottomItems = [], className = "" }: SidebarProps) {
  const [expanded, setExpanded] = useState(false);

  const width = expanded ? "var(--sidebar-width-expanded)" : "var(--sidebar-width-collapsed)";

  return (
    <aside
      style={{ width, zIndex: "var(--z-sidebar)" }}
      className={[
        "fixed left-0 top-0 h-full flex flex-col",
        "bg-[var(--bg-surface)] border-r border-[var(--border-subtle)]",
        "transition-[width] duration-[300ms] ease-[var(--ease-in-out)]",
        "overflow-hidden shrink-0",
        className
      ].join(" ")}
      aria-label="Main navigation"
    >
      {/* Logo */}
      <div className="h-[var(--top-bar-height)] flex items-center gap-3 px-4 border-b border-[var(--border-subtle)] shrink-0">
        <button
          className="w-8 h-8 flex items-center justify-center rounded-[var(--radius-md)] text-[var(--accent-primary)] hover:bg-[var(--bg-elevated)] transition-colors shrink-0"
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
          aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
        >
          <GlobeIcon />
        </button>
        {expanded && (
          <span className="font-bold text-[13px] text-[var(--text-primary)] tracking-tight whitespace-nowrap overflow-hidden">
            Globe Intelligence
          </span>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 flex flex-col gap-1 py-3 px-2 overflow-y-auto overflow-x-hidden">
        {items.map((item) => {
          const isActive = item.id === activeId;
          const button = (
            <button
              key={item.id}
              onClick={() => {
                item.onClick?.();
                onNavigate?.(item.id);
              }}
              className={[
                "w-full flex items-center gap-3 rounded-[var(--radius-md)] px-2 py-2",
                "text-[13px] font-medium transition-all duration-[var(--duration-fast)]",
                "focus-visible:outline-2 focus-visible:outline-[var(--border-focus)]",
                "relative",
                isActive
                  ? "bg-[rgba(59,130,246,0.12)] text-[var(--accent-primary)] border border-[rgba(59,130,246,0.2)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] border border-transparent"
              ].join(" ")}
              aria-current={isActive ? "page" : undefined}
              aria-label={!expanded ? item.label : undefined}
            >
              <span className="shrink-0 w-5 h-5 flex items-center justify-center" aria-hidden="true">
                {item.icon}
              </span>
              {expanded && (
                <span className="flex-1 text-left truncate">{item.label}</span>
              )}
              {expanded && item.badge !== undefined && item.badge > 0 && (
                <span className="shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--accent-primary)] text-white text-[10px] font-bold flex items-center justify-center">
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              )}
            </button>
          );

          return expanded ? button : (
            <Tooltip key={item.id} content={item.label} side="right" delayMs={200}>
              {button}
            </Tooltip>
          );
        })}
      </nav>

      {/* Bottom items */}
      {bottomItems.length > 0 && (
        <div className="flex flex-col gap-1 py-3 px-2 border-t border-[var(--border-subtle)]">
          {bottomItems.map((item) => {
            const button = (
              <button
                key={item.id}
                onClick={() => {
                  item.onClick?.();
                  onNavigate?.(item.id);
                }}
                className="w-full flex items-center gap-3 rounded-[var(--radius-md)] px-2 py-2 text-[13px] font-medium text-[var(--text-tertiary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] transition-all duration-[var(--duration-fast)]"
                aria-label={!expanded ? item.label : undefined}
              >
                <span className="shrink-0 w-5 h-5 flex items-center justify-center" aria-hidden="true">{item.icon}</span>
                {expanded && <span className="flex-1 text-left truncate">{item.label}</span>}
              </button>
            );

            return expanded ? button : (
              <Tooltip key={item.id} content={item.label} side="right" delayMs={200}>
                {button}
              </Tooltip>
            );
          })}
        </div>
      )}
    </aside>
  );
}
