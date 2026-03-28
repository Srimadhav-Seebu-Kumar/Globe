"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface RightDrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string | undefined;
  subtitle?: string | undefined;
  width?: string | undefined;
  children: ReactNode;
  actions?: ReactNode | undefined;
  className?: string | undefined;
}

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
    <line x1="3" y1="3" x2="13" y2="13" />
    <line x1="13" y1="3" x2="3" y2="13" />
  </svg>
);

export function RightDrawer({ open, onClose, title, subtitle, width = "400px", children, actions, className = "" }: RightDrawerProps) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/20"
            style={{ zIndex: "var(--z-drawer)" }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer panel */}
          <motion.aside
            key="drawer-panel"
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: 320,
              damping: 35,
              mass: 0.8
            }}
            style={{
              width,
              zIndex: "var(--z-drawer)" + 1,
              top: "var(--top-bar-height)"
            }}
            className={[
              "fixed right-0 bottom-0",
              "bg-[var(--bg-surface)] border-l border-[var(--border-subtle)]",
              "flex flex-col overflow-hidden shadow-[var(--shadow-xl)]",
              className
            ].join(" ")}
            role="complementary"
            aria-label={title ?? "Detail panel"}
          >
            {/* Header */}
            {(title || subtitle) && (
              <div className="flex items-start gap-3 p-4 border-b border-[var(--border-subtle)] shrink-0">
                <div className="flex-1 min-w-0">
                  {title && (
                    <h2 className="text-[var(--text-h4)] font-semibold text-[var(--text-primary)] truncate leading-snug">
                      {title}
                    </h2>
                  )}
                  {subtitle && (
                    <p className="text-[12px] text-[var(--text-secondary)] mt-0.5 truncate">
                      {subtitle}
                    </p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className={[
                    "shrink-0 w-7 h-7 flex items-center justify-center rounded-[var(--radius-md)]",
                    "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]",
                    "hover:bg-[var(--bg-elevated)] transition-colors duration-[var(--duration-fast)]",
                    "focus-visible:outline-2 focus-visible:outline-[var(--border-focus)]"
                  ].join(" ")}
                  aria-label="Close panel"
                >
                  <CloseIcon />
                </button>
              </div>
            )}

            {/* Body */}
            <div className="flex-1 overflow-y-auto">
              {children}
            </div>

            {/* Footer actions */}
            {actions && (
              <div className="flex items-center gap-2 p-3 border-t border-[var(--border-subtle)] shrink-0 bg-[var(--bg-surface)]">
                {actions}
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
