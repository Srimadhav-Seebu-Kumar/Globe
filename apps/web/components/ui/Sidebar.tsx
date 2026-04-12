"use client";

import type { ReactNode } from "react";

interface NavItem {
  id: string;
  label: string;
  icon: ReactNode;
  badge?: number;
  onClick?: () => void;
}

interface SidebarProps {
  items: NavItem[];
  activeId?: string;
  onNavigate?: (id: string) => void;
  bottomItems?: NavItem[];
  className?: string;
}

export function Sidebar({ items, activeId, onNavigate, bottomItems = [], className = "" }: SidebarProps) {
  return (
    <aside
      style={{
        width: "var(--sidebar-width-expanded)",
        zIndex: "var(--z-sidebar)",
        background: "rgba(13, 14, 19, 0.97)",
        borderRight: "1px solid rgba(255,255,255,0.055)",
        backdropFilter: "blur(20px)"
      }}
      className={[
        "fixed left-0 top-0 h-full flex flex-col",
        "overflow-hidden shrink-0",
        className
      ].join(" ")}
      aria-label="Main navigation"
    >
      {/* Logo */}
      <div
        className="flex items-center gap-3 px-5 shrink-0"
        style={{ height: "var(--top-bar-height)", borderBottom: "1px solid rgba(255,255,255,0.055)" }}
      >
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: "linear-gradient(135deg, #c9a96e 0%, #e8c98a 100%)", boxShadow: "0 0 16px rgba(201,169,110,0.35)" }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="rgba(13,14,19,0.9)" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
            <circle cx="7" cy="7" r="5.5" />
            <ellipse cx="7" cy="7" rx="2.5" ry="5.5" />
            <line x1="1.5" y1="7" x2="12.5" y2="7" />
          </svg>
        </div>
        <div>
          <div className="text-[13px] font-semibold tracking-tight" style={{ color: "#eef0f6", lineHeight: 1.2 }}>Globe</div>
          <div className="text-[10px] tracking-widest uppercase" style={{ color: "#48516a", lineHeight: 1.2 }}>Intelligence</div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 flex flex-col py-4 px-3 overflow-y-auto overflow-x-hidden" style={{ gap: 2 }}>
        <div className="px-2 mb-2">
          <span className="text-[9px] font-semibold uppercase tracking-widest" style={{ color: "#48516a" }}>Workspace</span>
        </div>
        {items.map((item) => {
          const isActive = item.id === activeId;
          return (
            <button
              key={item.id}
              onClick={() => {
                item.onClick?.();
                onNavigate?.(item.id);
              }}
              className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-150 relative"
              style={{
                color: isActive ? "#c9a96e" : "#7a869e",
                background: isActive ? "rgba(201,169,110,0.08)" : "transparent",
                border: `1px solid ${isActive ? "rgba(201,169,110,0.15)" : "transparent"}`,
              }}
              aria-current={isActive ? "page" : undefined}
            >
              {isActive && (
                <span
                  className="absolute left-0 top-[20%] bottom-[20%] w-[2px] rounded-r-full"
                  style={{ background: "linear-gradient(to bottom, #c9a96e, #e8c98a)" }}
                  aria-hidden="true"
                />
              )}
              <span className="shrink-0 w-4 h-4 flex items-center justify-center" aria-hidden="true">
                {item.icon}
              </span>
              <span className="text-[13px] font-medium flex-1 truncate">{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className="shrink-0 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center"
                  style={{ background: "rgba(201,169,110,0.2)", color: "#c9a96e" }}
                >
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom items */}
      {bottomItems.length > 0 && (
        <div className="flex flex-col gap-0.5 py-3 px-3" style={{ borderTop: "1px solid rgba(255,255,255,0.055)" }}>
          {bottomItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                item.onClick?.();
                onNavigate?.(item.id);
              }}
              className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors duration-150"
              style={{ color: "#48516a" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#7a869e"; (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#48516a"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              <span className="shrink-0 w-4 h-4 flex items-center justify-center" aria-hidden="true">{item.icon}</span>
              <span className="text-[12px] flex-1 truncate">{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </aside>
  );
}
