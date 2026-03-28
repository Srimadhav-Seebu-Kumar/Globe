"use client";

import { useState, useCallback } from "react";
import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { BottomPanel } from "./BottomPanel";
import { RightDrawer } from "./RightDrawer";

// ── Nav icons ─────────────────────────────────────────────────
const GlobeNavIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
    <circle cx="8" cy="8" r="6.5" />
    <ellipse cx="8" cy="8" rx="3" ry="6.5" />
    <line x1="1.5" y1="8" x2="14.5" y2="8" />
  </svg>
);

const MarketsNavIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
    <rect x="1.5" y="8.5" width="3" height="6" rx="0.5" />
    <rect x="6.5" y="5.5" width="3" height="9" rx="0.5" />
    <rect x="11.5" y="2.5" width="3" height="12" rx="0.5" />
  </svg>
);

const WatchlistNavIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
    <path d="M8 13.5L2.5 8.5a3 3 0 0 1 4.2-4.28L8 5.5l1.3-1.28A3 3 0 0 1 13.5 8.5L8 13.5z" />
  </svg>
);

const CompareNavIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
    <rect x="1.5" y="3.5" width="5" height="9" rx="1" />
    <rect x="9.5" y="3.5" width="5" height="9" rx="1" />
    <line x1="7.5" y1="8" x2="8.5" y2="8" />
  </svg>
);

const AlertsNavIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
    <path d="M8 2.5C8 2.5 4 5 4 9.5H12C12 5 8 2.5 8 2.5Z" />
    <line x1="4" y1="9.5" x2="12" y2="9.5" />
    <line x1="8" y1="12" x2="8" y2="13.5" />
  </svg>
);

const SettingsNavIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
    <circle cx="8" cy="8" r="2.5" />
    <path d="M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.2 3.2l1.1 1.1M11.7 11.7l1.1 1.1M3.2 12.8l1.1-1.1M11.7 4.3l1.1-1.1" />
  </svg>
);

const HelpNavIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
    <circle cx="8" cy="8" r="6.5" />
    <path d="M6 6a2 2 0 1 1 2.5 1.9C8 8.4 8 9 8 9.5" />
    <circle cx="8" cy="12" r="0.5" fill="currentColor" />
  </svg>
);

// ── Types ───────────────────────────────────────────────────────
export type ActiveView = "globe" | "markets" | "watchlist" | "compare" | "alerts" | "settings";

interface DrawerState {
  open: boolean;
  title?: string | undefined;
  subtitle?: string | undefined;
  content?: ReactNode | undefined;
  actions?: ReactNode | undefined;
}

interface AppShellProps {
  children: ReactNode;
  activeView?: ActiveView | undefined;
  onViewChange?: ((view: ActiveView) => void) | undefined;
  ticker?: ReactNode | undefined;
  legend?: ReactNode | undefined;
  onSearch?: ((q: string) => void) | undefined;
  onCommandPalette?: (() => void) | undefined;
  userEmail?: string | undefined;
  userName?: string | undefined;
  onLogout?: (() => void) | undefined;
  drawerState?: DrawerState | undefined;
  onCloseDrawer?: (() => void) | undefined;
}

export function AppShell({
  children,
  activeView = "globe",
  onViewChange,
  ticker,
  legend,
  onSearch,
  onCommandPalette,
  userEmail,
  userName,
  onLogout,
  drawerState,
  onCloseDrawer
}: AppShellProps) {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const sidebarWidth = sidebarExpanded ? "var(--sidebar-width-expanded)" : "var(--sidebar-width-collapsed)";

  const navItems = [
    { id: "globe" as ActiveView, label: "Globe", icon: <GlobeNavIcon /> },
    { id: "markets" as ActiveView, label: "Markets", icon: <MarketsNavIcon /> },
    { id: "watchlist" as ActiveView, label: "Watchlist", icon: <WatchlistNavIcon /> },
    { id: "compare" as ActiveView, label: "Compare", icon: <CompareNavIcon /> },
    { id: "alerts" as ActiveView, label: "Alerts", icon: <AlertsNavIcon /> }
  ];

  const bottomItems = [
    { id: "settings" as ActiveView, label: "Settings", icon: <SettingsNavIcon /> },
    { id: "help" as const, label: "Help", icon: <HelpNavIcon /> }
  ];

  return (
    <div className="full-bleed" style={{ fontFamily: "var(--font-sans)" }}>
      {/* Sidebar */}
      <Sidebar
        items={navItems}
        bottomItems={bottomItems as never}
        activeId={activeView}
        onNavigate={(id) => onViewChange?.(id as ActiveView)}
      />

      {/* Top bar */}
      <TopBar
        sidebarWidth={sidebarWidth}
        onSearch={onSearch}
        onCommandPalette={onCommandPalette}
        userEmail={userEmail}
        userName={userName}
        onLogout={onLogout}
      />

      {/* Main content area */}
      <main
        style={{
          marginLeft: sidebarWidth,
          marginTop: "var(--top-bar-height)",
          marginBottom: "var(--bottom-panel-height-collapsed)",
          transition: "margin-left 300ms var(--ease-in-out)"
        }}
        className="h-[calc(100vh-var(--top-bar-height)-var(--bottom-panel-height-collapsed))] overflow-hidden relative"
      >
        {children}
      </main>

      {/* Bottom panel */}
      <BottomPanel
        sidebarWidth={sidebarWidth}
        ticker={ticker}
        legend={legend}
      />

      {/* Right drawer */}
      {drawerState && (
        <RightDrawer
          open={drawerState.open}
          onClose={onCloseDrawer ?? (() => {})}
          title={drawerState.title}
          subtitle={drawerState.subtitle}
          actions={drawerState.actions}
        >
          {drawerState.content}
        </RightDrawer>
      )}
    </div>
  );
}
