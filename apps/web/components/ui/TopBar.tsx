"use client";

import { useState, useRef, useEffect } from "react";
import type { ReactNode } from "react";
import { Button } from "./Button";

interface TopBarProps {
  sidebarWidth?: string | undefined;
  title?: string | undefined;
  onSearch?: ((query: string) => void) | undefined;
  searchPlaceholder?: string | undefined;
  onCommandPalette?: (() => void) | undefined;
  userEmail?: string | undefined;
  userName?: string | undefined;
  onLogout?: (() => void) | undefined;
  actions?: ReactNode | undefined;
  className?: string | undefined;
}

const SearchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
    <circle cx="6" cy="6" r="4.5" />
    <line x1="9.5" y1="9.5" x2="12.5" y2="12.5" />
  </svg>
);

const KbdIcon = () => (
  <span className="inline-flex items-center gap-0.5 text-[10px] text-[var(--text-tertiary)]">
    <kbd className="px-1 py-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-default)] font-mono text-[9px]">⌘</kbd>
    <kbd className="px-1 py-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-default)] font-mono text-[9px]">K</kbd>
  </span>
);

const UserIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
    <circle cx="7" cy="5" r="3" />
    <path d="M1.5 12.5c0-2.485 2.462-4.5 5.5-4.5s5.5 2.015 5.5 4.5" />
  </svg>
);

export function TopBar({
  sidebarWidth = "var(--sidebar-width-collapsed)",
  onSearch,
  searchPlaceholder = "Search any market, city, or parcel…",
  onCommandPalette,
  userEmail,
  userName,
  onLogout,
  actions,
  className = ""
}: TopBarProps) {
  const [searchValue, setSearchValue] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header
      style={{
        left: sidebarWidth,
        zIndex: "var(--z-top-bar)"
      }}
      className={[
        "fixed top-0 right-0 h-[var(--top-bar-height)]",
        "flex items-center gap-3 px-4",
        "bg-[var(--bg-surface)] border-b border-[var(--border-subtle)]",
        "transition-[left] duration-[300ms] ease-[var(--ease-in-out)]",
        className
      ].join(" ")}
    >
      {/* Search bar */}
      <button
        className={[
          "flex-1 max-w-[480px] flex items-center gap-2 h-8 px-3",
          "rounded-[var(--radius-md)] border border-[var(--border-default)]",
          "bg-[var(--bg-input)] text-[var(--text-tertiary)]",
          "hover:border-[var(--border-strong)] transition-colors duration-[var(--duration-fast)]",
          "cursor-text text-left text-[13px]"
        ].join(" ")}
        onClick={onCommandPalette}
        aria-label="Open search or command palette"
      >
        <SearchIcon />
        <span className="flex-1 truncate">{searchPlaceholder}</span>
        <KbdIcon />
      </button>

      {/* Right actions */}
      <div className="flex items-center gap-2 ml-auto">
        {actions}

        {/* User menu */}
        {userEmail && (
          <div className="relative" ref={menuRef}>
            <button
              className={[
                "flex items-center gap-2 h-8 px-2.5 rounded-[var(--radius-md)]",
                "border border-[var(--border-default)] text-[var(--text-secondary)]",
                "hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]",
                "transition-all duration-[var(--duration-fast)] text-[12px]"
              ].join(" ")}
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              aria-expanded={userMenuOpen}
              aria-haspopup="menu"
            >
              <UserIcon />
              <span className="truncate max-w-[120px]">{userName ?? userEmail}</span>
            </button>

            {userMenuOpen && (
              <div
                className={[
                  "absolute right-0 top-full mt-1.5 w-52",
                  "bg-[var(--bg-elevated)] border border-[var(--border-default)]",
                  "rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)]",
                  "py-1.5 z-[var(--z-modal)]",
                  "animate-fade-in"
                ].join(" ")}
                role="menu"
              >
                <div className="px-3 py-2 border-b border-[var(--border-subtle)]">
                  <p className="text-[12px] font-medium text-[var(--text-primary)] truncate">{userName}</p>
                  <p className="text-[11px] text-[var(--text-tertiary)] truncate">{userEmail}</p>
                </div>
                {onLogout && (
                  <button
                    className="w-full text-left px-3 py-2 text-[12px] text-[var(--accent-danger)] hover:bg-[rgba(239,68,68,0.08)] transition-colors"
                    onClick={() => { setUserMenuOpen(false); onLogout(); }}
                    role="menuitem"
                  >
                    Sign out
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {!userEmail && (
          <Button variant="primary" size="sm" onClick={onCommandPalette}>
            Sign in
          </Button>
        )}
      </div>
    </header>
  );
}
