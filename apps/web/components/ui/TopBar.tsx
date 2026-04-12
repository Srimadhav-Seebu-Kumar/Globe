"use client";

import { useState, useRef, useEffect } from "react";
import type { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

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

function UserAvatar({ name, email }: { name?: string | undefined; email?: string | undefined }) {
  const initials = name
    ? name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : (email?.[0] ?? "?").toUpperCase();

  return (
    <span
      className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0 select-none"
      style={{ background: "var(--gradient-accent)", boxShadow: "0 0 0 2px rgba(59,130,246,0.3)" }}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}

export function TopBar({
  sidebarWidth = "var(--sidebar-width-collapsed)",
  onSearch: _onSearch,
  searchPlaceholder = "Search any market, city, or parcel…",
  onCommandPalette,
  userEmail,
  userName,
  onLogout,
  actions,
  className = ""
}: TopBarProps) {
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
        zIndex: "var(--z-top-bar)",
        background: "rgba(13, 14, 19, 0.97)",
        borderBottom: "1px solid rgba(255,255,255,0.055)",
        boxShadow: "0 1px 0 rgba(255,255,255,0.03), 0 4px 32px rgba(0,0,0,0.5)"
      }}
      className={[
        "fixed top-0 right-0 h-[var(--top-bar-height)]",
        "flex items-center gap-4 px-5",
        "transition-[left] duration-[300ms] ease-[var(--ease-in-out)]",
        className
      ].join(" ")}
    >
      {/* Search */}
      <motion.button
        whileHover={{ boxShadow: "0 0 0 1.5px rgba(201,169,110,0.35), 0 0 16px rgba(201,169,110,0.08)" }}
        transition={{ duration: 0.15 }}
        className="flex-1 max-w-[600px] flex items-center gap-2.5 h-9 px-3.5 rounded-lg text-left text-[13px] cursor-text transition-all duration-150"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          color: "#48516a"
        }}
        onClick={onCommandPalette}
        aria-label="Open search or command palette"
      >
        <SearchIcon />
        <span className="flex-1 truncate">{searchPlaceholder}</span>
        <KbdIcon />
      </motion.button>

      {/* Right area */}
      <div className="flex items-center gap-3 ml-auto">
        {/* Live status chip */}
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium"
          style={{ background: "rgba(201,169,110,0.08)", border: "1px solid rgba(201,169,110,0.18)", color: "#c9a96e" }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#c9a96e] animate-pulse" />
          LIVE
        </div>

        {actions}

        {/* User menu */}
        {userEmail && (
          <div className="relative" ref={menuRef}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="flex items-center gap-2 h-8 px-2.5 rounded-lg text-[12px] transition-all duration-150"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#7a869e" }}
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              aria-expanded={userMenuOpen}
              aria-haspopup="menu"
            >
              <UserAvatar name={userName} email={userEmail} />
              <span className="truncate max-w-[100px] hidden sm:inline">{userName ?? userEmail}</span>
            </motion.button>
            <AnimatePresence>
              {userMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className="absolute right-0 top-full mt-1.5 w-52 py-1.5 rounded-xl z-[var(--z-modal)]"
                  style={{ background: "rgba(19, 21, 32, 0.98)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 8px 40px rgba(0,0,0,0.6)" }}
                  role="menu"
                >
                  <div className="px-3 py-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <p className="text-[12px] font-medium truncate" style={{ color: "#eef0f6" }}>{userName}</p>
                    <p className="text-[11px] truncate" style={{ color: "#48516a" }}>{userEmail}</p>
                  </div>
                  {onLogout && (
                    <button
                      className="w-full text-left px-3 py-2 text-[12px] transition-colors"
                      style={{ color: "#e05252" }}
                      onClick={() => { setUserMenuOpen(false); onLogout(); }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(224,82,82,0.08)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                      role="menuitem"
                    >
                      Sign out
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {!userEmail && (
          <button
            className="h-8 px-4 rounded-lg text-[12px] font-semibold transition-all duration-150"
            style={{
              background: "linear-gradient(135deg, #c9a96e, #e8c98a)",
              color: "#09090c",
              boxShadow: "0 2px 12px rgba(201,169,110,0.3)"
            }}
            onClick={onCommandPalette}
          >
            Sign in
          </button>
        )}
      </div>
    </header>
  );
}
