"use client";

import { useEffect, useState, useCallback } from "react";
import { Command } from "cmdk";
import type { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon?: ReactNode;
  group: string;
  onSelect: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  items: CommandItem[];
  onSearch?: (query: string) => void;
  placeholder?: string;
}

export function CommandPalette({ open, onClose, items, onSearch, placeholder = "Search markets, parcels, actions…" }: CommandPaletteProps) {
  const [query, setQuery] = useState("");

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Open on Cmd+K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (!open) onClose(); // trigger parent to open
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Group items
  const groups = Array.from(new Set(items.map((i) => i.group)));

  const handleSearch = useCallback((val: string) => {
    setQuery(val);
    onSearch?.(val);
  }, [onSearch]);

  const handleClose = useCallback(() => {
    setQuery("");
    onClose();
  }, [onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="cmd-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/50"
            style={{ zIndex: "var(--z-command-palette)" }}
            onClick={handleClose}
            aria-hidden="true"
          />

          {/* Palette panel */}
          <motion.div
            key="cmd-panel"
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: "spring", stiffness: 400, damping: 35, mass: 0.6 }}
            className="fixed left-1/2 top-[20vh] -translate-x-1/2 w-full max-w-[560px] px-4"
            style={{ zIndex: "var(--z-command-palette)" + 1 }}
          >
            <Command
              className={[
                "bg-[var(--bg-elevated)] border border-[var(--border-default)]",
                "rounded-[var(--radius-xl)] shadow-[var(--shadow-xl)]",
                "overflow-hidden"
              ].join(" ")}
              label="Command palette"
              shouldFilter={true}
            >
              {/* Search input */}
              <div className="flex items-center gap-3 px-4 border-b border-[var(--border-subtle)]">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
                  <circle cx="6.5" cy="6.5" r="4.5" />
                  <line x1="10" y1="10" x2="14" y2="14" />
                </svg>
                <Command.Input
                  value={query}
                  onValueChange={handleSearch}
                  placeholder={placeholder}
                  className={[
                    "flex-1 h-12 bg-transparent text-[var(--text-primary)] text-[14px]",
                    "placeholder:text-[var(--text-tertiary)]",
                    "border-none outline-none"
                  ].join(" ")}
                  autoFocus
                />
                <kbd className="shrink-0 px-1.5 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-default)] text-[10px] text-[var(--text-tertiary)] font-mono">
                  ESC
                </kbd>
              </div>

              {/* Results */}
              <Command.List className="max-h-[400px] overflow-y-auto py-2">
                <Command.Empty className="flex flex-col items-center justify-center py-12 gap-2 text-[var(--text-tertiary)]">
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
                    <circle cx="14" cy="14" r="10" />
                    <line x1="22" y1="22" x2="29" y2="29" />
                    <line x1="11" y1="14" x2="17" y2="14" />
                  </svg>
                  <span className="text-[13px]">No results for &ldquo;{query}&rdquo;</span>
                </Command.Empty>

                {groups.map((group) => {
                  const groupItems = items.filter((i) => i.group === group);
                  return (
                    <Command.Group key={group} heading={group} className="px-2">
                      <div className="px-2 pt-3 pb-1">
                        <span className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-widest">
                          {group}
                        </span>
                      </div>
                      {groupItems.map((item) => (
                        <Command.Item
                          key={item.id}
                          value={`${item.label} ${item.description ?? ""}`}
                          onSelect={() => {
                            item.onSelect();
                            handleClose();
                          }}
                          className={[
                            "flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)]",
                            "text-[var(--text-primary)] cursor-pointer",
                            "data-[selected=true]:bg-[rgba(59,130,246,0.12)] data-[selected=true]:text-[var(--accent-primary)]",
                            "transition-colors duration-[var(--duration-fast)]"
                          ].join(" ")}
                        >
                          {item.icon && (
                            <span className="w-5 h-5 flex items-center justify-center text-[var(--text-tertiary)] shrink-0" aria-hidden="true">
                              {item.icon}
                            </span>
                          )}
                          <div className="flex-1 min-w-0">
                            <span className="block text-[13px] font-medium truncate">{item.label}</span>
                            {item.description && (
                              <span className="block text-[11px] text-[var(--text-tertiary)] truncate">{item.description}</span>
                            )}
                          </div>
                          <kbd className="shrink-0 hidden group-data-[selected=true]:flex items-center px-1.5 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-default)] text-[10px] text-[var(--text-tertiary)] font-mono">
                            ↵
                          </kbd>
                        </Command.Item>
                      ))}
                    </Command.Group>
                  );
                })}
              </Command.List>

              {/* Footer */}
              <div className="flex items-center gap-4 px-4 py-2 border-t border-[var(--border-subtle)]">
                <span className="flex items-center gap-1 text-[10px] text-[var(--text-tertiary)]">
                  <kbd className="px-1 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-default)] font-mono text-[9px]">↑↓</kbd>
                  Navigate
                </span>
                <span className="flex items-center gap-1 text-[10px] text-[var(--text-tertiary)]">
                  <kbd className="px-1 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-default)] font-mono text-[9px]">↵</kbd>
                  Select
                </span>
                <span className="flex items-center gap-1 text-[10px] text-[var(--text-tertiary)]">
                  <kbd className="px-1 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-default)] font-mono text-[9px]">ESC</kbd>
                  Close
                </span>
              </div>
            </Command>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
