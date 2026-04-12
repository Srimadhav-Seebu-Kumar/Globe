"use client";

import { useState, useCallback, useEffect } from "react";
import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { BottomPanel } from "./BottomPanel";
import { RightDrawer } from "./RightDrawer";
import { AnimatePresence, motion } from "framer-motion";

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

const MobileMenuIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
    <line x1="2" y1="5" x2="16" y2="5" />
    <line x1="2" y1="9" x2="16" y2="9" />
    <line x1="2" y1="13" x2="16" y2="13" />
  </svg>
);

const MobileCloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
    <line x1="4" y1="4" x2="14" y2="14" />
    <line x1="14" y1="4" x2="4" y2="14" />
  </svg>
);

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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    setIsMobile(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Close mobile nav when view changes
  useEffect(() => {
    if (mobileNavOpen) setMobileNavOpen(false);
  }, [activeView]); // eslint-disable-line react-hooks/exhaustive-deps

  const sidebarWidth = isMobile ? "0px" : "var(--sidebar-width-expanded)";

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
      {/* Desktop sidebar (hidden on mobile) */}
      {!isMobile && (
        <Sidebar
          items={navItems}
          bottomItems={bottomItems as never}
          activeId={activeView}
          onNavigate={(id) => onViewChange?.(id as ActiveView)}
        />
      )}

      {/* Top bar */}
      <TopBar
        sidebarWidth={sidebarWidth}
        onSearch={onSearch}
        onCommandPalette={onCommandPalette}
        userEmail={userEmail}
        userName={userName}
        onLogout={onLogout}
        actions={isMobile ? (
          <button
            onClick={() => setMobileNavOpen((v) => !v)}
            className="w-8 h-8 flex items-center justify-center rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
            aria-label={mobileNavOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={mobileNavOpen}
          >
            {mobileNavOpen ? <MobileCloseIcon /> : <MobileMenuIcon />}
          </button>
        ) : undefined}
      />

      {/* Mobile nav overlay */}
      <AnimatePresence>
        {isMobile && mobileNavOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[var(--z-drawer)]"
              onClick={() => setMobileNavOpen(false)}
              aria-hidden="true"
            />
            {/* Slide-in nav panel */}
            <motion.nav
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 350, damping: 35 }}
              className="fixed top-0 left-0 bottom-0 w-64 bg-[var(--bg-surface)] border-r border-[var(--border-subtle)] z-[calc(var(--z-drawer)+1)] flex flex-col"
              aria-label="Mobile navigation"
            >
              {/* Nav header */}
              <div className="flex items-center justify-between px-4 h-[var(--top-bar-height)] border-b border-[var(--border-subtle)] shrink-0">
                <span className="text-[13px] font-semibold text-[var(--text-primary)]">Globe</span>
                <button
                  onClick={() => setMobileNavOpen(false)}
                  className="w-7 h-7 flex items-center justify-center rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
                  aria-label="Close navigation"
                >
                  <MobileCloseIcon />
                </button>
              </div>

              {/* Nav items */}
              <div className="flex-1 overflow-y-auto py-3 px-2 flex flex-col gap-0.5">
                {navItems.map((item) => {
                  const isActive = item.id === activeView;
                  return (
                    <button
                      key={item.id}
                      onClick={() => { onViewChange?.(item.id); setMobileNavOpen(false); }}
                      className={[
                        "flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-left w-full transition-colors",
                        isActive
                          ? "bg-[rgba(59,130,246,0.12)] text-[var(--accent-blue)]"
                          : "text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
                      ].join(" ")}
                      aria-current={isActive ? "page" : undefined}
                    >
                      <span className="shrink-0">{item.icon}</span>
                      <span className="text-[13px] font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* User info at bottom */}
              {(userEmail ?? userName) && (
                <div className="px-4 py-3 border-t border-[var(--border-subtle)] shrink-0">
                  <p className="text-[12px] font-medium text-[var(--text-primary)] truncate">{userName ?? userEmail}</p>
                  {userName && userEmail && <p className="text-[11px] text-[var(--text-tertiary)] truncate">{userEmail}</p>}
                  {onLogout && (
                    <button
                      onClick={() => { onLogout?.(); setMobileNavOpen(false); }}
                      className="mt-2 text-[12px] text-[var(--accent-danger)] hover:underline"
                    >
                      Sign out
                    </button>
                  )}
                </div>
              )}
            </motion.nav>
          </>
        )}
      </AnimatePresence>

      {/* Main content area */}
      <main
        style={{
          marginLeft: sidebarWidth,
          marginTop: "var(--top-bar-height)",
          marginBottom: isMobile ? "56px" : "var(--bottom-panel-height-collapsed)",
          transition: "margin-left 300ms var(--ease-in-out)",
          height: isMobile
            ? "calc(100vh - var(--top-bar-height) - 56px)"
            : "calc(100vh - var(--top-bar-height) - var(--bottom-panel-height-collapsed))"
        }}
        className="overflow-hidden relative"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="h-full w-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile bottom tab bar */}
      {isMobile ? (
        <nav
          className="fixed bottom-0 left-0 right-0 h-14 bg-[var(--bg-surface)] border-t border-[var(--border-subtle)] z-[var(--z-header)] flex items-stretch"
          aria-label="Bottom navigation"
        >
          {navItems.slice(0, 5).map((item) => {
            const isActive = item.id === activeView;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange?.(item.id)}
                className={[
                  "flex-1 flex flex-col items-center justify-center gap-1 transition-colors",
                  isActive ? "text-[var(--accent-blue)]" : "text-[var(--text-tertiary)]"
                ].join(" ")}
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
              >
                {item.icon}
                <span className="text-[9px] font-medium leading-none">{item.label}</span>
              </button>
            );
          })}
        </nav>
      ) : (
        /* Desktop bottom panel */
        <BottomPanel
          sidebarWidth={sidebarWidth}
          ticker={ticker}
          legend={legend}
        />
      )}

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
